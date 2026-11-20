import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const browser=!process.argv.includes('--skip-browser');
fs.mkdirSync('docs/proof',{recursive:true});
const results=[];
function run(label,args,check){
  console.log(`Checking ${label}...`);
  const start=performance.now(),r=spawnSync(process.execPath,args,{encoding:'utf8',timeout:180000});
  const log=(r.stdout||'')+(r.stderr||'')+(r.error?String(r.error):'');
  fs.writeFileSync(`docs/proof/${label}.log`,log);
  const result={command:[process.execPath,...args],exit_code:r.status,duration_ms:performance.now()-start};results.push({label,...result});
  if(r.status!==0)throw new Error(`${label} failed:\n${log}`);
  check?.();
}
try{
  run('tests',['--test','tests/game.test.js','tests/determinism.test.js','tests/regression.test.js','tests/cli.test.js']);
  run('build',['node_modules/vite/bin/vite.js','build']);
  run('headless',['src/headless.js','--seed','42','--night','1','--ticks','600','--out','docs/proof/headless.jsonl']);
  run('dawn-win',['src/headless.js','--seed','42','--night','1','--ticks','60','--scenario','scenarios/dawn-win.json','--out','docs/proof/dawn-win.jsonl'],()=>{
    const lines=fs.readFileSync('docs/proof/dawn-win.jsonl','utf8').trim().split('\n').map(JSON.parse);if(lines.at(-1).state!=='won'||lines.at(-1).ticks!==60)throw new Error('Dawn scenario failed');
  });
  run('refuel',['src/headless.js','--seed','42','--ticks','60','--scenario','scenarios/refuel.json','--inputs','scenarios/refuel-inputs.json','--out','docs/proof/refuel.jsonl'],()=>{
    const lines=fs.readFileSync('docs/proof/refuel.jsonl','utf8').trim().split('\n').map(JSON.parse);if(!lines.some(e=>e.name==='refuel'&&e.data.amount===5))throw new Error('Refuel scenario failed');
  });
  run('soak',['src/soak.js','--seed','7','--nights','10','--out','docs/proof/soak.json']);
  if(browser){run('browser',['scripts/browser.mjs','--mode','check','--out','docs/proof/browser.json']);run('bench',['src/bench.js','--seed','42','--duration','30','--out','docs/proof/bench.json']);}
  if(process.argv.includes('--demo'))run('demo',['scripts/browser.mjs','--mode','demo','--out','docs/demo/recording.json']);
  const files=['package.json','package-lock.json','game.contract.json','vite.config.js','index.html','bench.html',...['src','scripts','tests','scenarios'].flatMap(dir=>fs.readdirSync(dir).map(f=>path.posix.join(dir,f)))];
  const hashes=Object.fromEntries(files.map(file=>[file,createHash('sha256').update(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')).digest('hex')]));
  fs.writeFileSync('docs/proof/verification.json',JSON.stringify({captured_at:new Date().toISOString(),environment:{node:process.version,os:`${os.platform()} ${os.release()}`,cpu:os.cpus()[0]?.model},source_hash_format:'UTF-8; CRLF normalized to LF for cross-platform checkouts',browser_checks:browser,results,source_sha256:hashes},null,2));
  console.log(`Verified ${results.length} commands; evidence in docs/proof/verification.json`);
}catch(e){console.error(e.message);process.exitCode=1;}
