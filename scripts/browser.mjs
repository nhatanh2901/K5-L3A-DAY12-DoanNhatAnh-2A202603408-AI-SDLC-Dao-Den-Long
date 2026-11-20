import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'vite';

const args=process.argv.slice(2),arg=(n,f)=>args.includes(n)?args[args.indexOf(n)+1]:f;
const mode=arg('--mode','bench'),out=arg('--out',mode==='bench'?'bench.json':`${mode}.json`);
const duration=Number(arg('--duration',30)),seed=Number(arg('--seed',42));
if(!['bench','check','demo'].includes(mode)||!Number.isFinite(duration)||duration<=0||!Number.isInteger(seed)||seed<0){console.error('Invalid browser runner arguments');process.exit(2);}
const candidates=[process.env.BROWSER_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/chromium','/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const browser=candidates.find(p=>fs.existsSync(p));
if(!browser){console.error('Chrome/Edge not found. Set BROWSER_PATH to your Chromium executable.');process.exit(2);}
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'lantern-browser-'));
const server=await createServer({server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});
let child,socket,id=0;const pending=new Map(),errors=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
try {
  await server.listen();const port=server.httpServer.address().port;
  child=spawn(browser,['--headless=new','--no-first-run','--no-default-browser-check','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--window-size=1280,720','about:blank'],{windowsHide:true,stdio:'ignore'});
  let launchError;child.on('error',e=>launchError=e);
  const active=path.join(profile,'DevToolsActivePort');
  for(let i=0;!fs.existsSync(active)&&i<100;i++){if(launchError)throw launchError;if(child.exitCode!==null)throw new Error(`Browser exited ${child.exitCode}`);await delay(100);}
  if(!fs.existsSync(active))throw new Error('Browser debugging endpoint did not start');
  const browserPort=fs.readFileSync(active,'utf8').split('\n')[0];
  const pages=await (await fetch(`http://127.0.0.1:${browserPort}/json/list`)).json();
  socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p?.reject(new Error(m.error.message));else p?.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});
  const call=(method,params={})=>new Promise((resolve,reject)=>{const next=++id;pending.set(next,{resolve,reject});socket.send(JSON.stringify({id:next,method,params}));});
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  await call('Runtime.enable');await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:`http://127.0.0.1:${port}/${mode==='check'?'':'bench.html'}`});
  for(let i=0;i<100;i++){if(await evaluate('document.readyState === "complete"'))break;await delay(100);}
  let result;
  if(mode==='bench')result=await evaluate(`import('/src/bench-client.js').then(m=>m.benchmark(${JSON.stringify({seed,duration})}))`);
  else if(mode==='check')result=await evaluate(`import('/src/browser-check.js').then(m=>m.check())`);
  else {
    let timeout;
    const progress=setInterval(()=>{evaluate('window.__demoProgress').then(p=>{if(p)console.log(`Demo ${p.phase}: ${Number(p.seconds).toFixed(1)}s (${p.mime})`);}).catch(()=>{});},10000);
    let recording;
    try{recording=await Promise.race([evaluate(`import('/src/demo-client.js').then(m=>m.recordDemo()).then(r=>{window.__demoResult=r;const {base64,...metadata}=r;return {...metadata,base64_length:base64.length};})`),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Demo timed out after 90 seconds')),90000);})]);}
    finally{clearInterval(progress);clearTimeout(timeout);}
    const {base64_length,...metadata}=recording;
    const video=path.join(path.dirname(out),`demo.${metadata.extension}`);
    fs.mkdirSync(path.dirname(video),{recursive:true});fs.writeFileSync(video,Buffer.alloc(0));
    // Transfer bounded CDP messages; a whole base64 video can exceed WebSocket limits.
    for(let offset=0;offset<base64_length;offset+=262144){const part=await evaluate(`window.__demoResult.base64.slice(${offset},${offset+262144})`);fs.appendFileSync(video,Buffer.from(part,'base64'));}
    result={...metadata,video};
    if(metadata.extension==='webm'){
      const executable=process.env.FFMPEG_PATH||(fs.existsSync('artifacts/tools/ffmpeg.exe')?path.resolve('artifacts/tools/ffmpeg.exe'):'ffmpeg');
      const mp4=path.join(path.dirname(out),'demo.mp4');
      const conversion=spawnSync(executable,['-y','-i',video,'-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',mp4],{encoding:'utf8',timeout:120000,windowsHide:true});
      if(conversion.status!==0)throw new Error('MP4 conversion failed. Install FFmpeg or set FFMPEG_PATH. WebM capture remains saved.');
      result.mp4={video:mp4,bytes:fs.statSync(mp4).size,conversion:'FFmpeg libx264, yuv420p, faststart',source:video};
    }
  }
  if(errors.length)throw new Error(errors.join('\n'));
  if(mode==='check'){
    const shot=await call('Page.captureScreenshot',{format:'png'});const image=path.join(path.dirname(out),'gameplay.png');fs.mkdirSync(path.dirname(image),{recursive:true});fs.writeFileSync(image,Buffer.from(shot.data,'base64'));result.screenshot=image;
  }
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({...result,environment:{browser,host:`${os.platform()} ${os.release()}`,cpu:os.cpus()[0]?.model,node:process.version},captured_at:new Date().toISOString()},null,2));
  console.log(`${mode}: saved ${out}`);
} catch(e){console.error(e.stack);process.exitCode=1;}
finally {
  socket?.close();child?.kill();await server.close();
  // Delete only the unique profile created by this process inside the OS temp directory.
  if(path.dirname(path.resolve(profile))===path.resolve(os.tmpdir())&&path.basename(profile).startsWith('lantern-browser-')){
    for(let i=0;i<10;i++){try{fs.rmSync(profile,{recursive:true,force:true});break;}catch{await delay(100);}}
  }
}
