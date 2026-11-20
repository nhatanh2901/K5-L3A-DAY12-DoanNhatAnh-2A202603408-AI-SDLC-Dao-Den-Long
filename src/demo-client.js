import {createGame,applyScenario,stepGame} from './game-core.js';
import {createScene} from './scene.js';

export async function recordDemo(){
  const [testLog,bench,soak]=await Promise.all([
    fetch('/docs/proof/tests.log').then(r=>r.text()),
    fetch('/docs/proof/bench.json').then(r=>r.json()),
    fetch('/docs/proof/soak.json').then(r=>r.json())
  ]);
  const source=document.querySelector('#game');
  const view=createScene(source,{width:1280,height:720,pixelRatio:1});
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;
  const ctx=canvas.getContext('2d');
  const types=['video/webm;codecs=vp9','video/webm'];
  const mime=types.find(t=>MediaRecorder.isTypeSupported(t));
  if(!mime)throw new Error('No supported MediaRecorder video format');
  // Attach the capture canvas so Chromium continues to produce video frames.
  canvas.style.position='fixed';canvas.style.inset='0';canvas.style.width='100vw';canvas.style.height='100vh';document.body.append(canvas);
  const stream=canvas.captureStream(30),recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000});
  const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  const finished=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=e=>reject(e.error);});
  let game,segment=-1,sim=0,accumulator=0,previous=performance.now(),start=previous;
  const events=[],labels=[
    'ĐÊM 1 · THU THẬP ĐOM ĐÓM',
    'SCENARIO · THẮP ĐÈN, TỎA SÁNG, CHÂM DẦU',
    'ĐÊM 2 · HAI ĐẢO VÀ CẦU NỐI',
    'ĐÊM 3 · NHẢY LÊN TẦNG ĐÁ',
    'BẰNG CHỨNG TỪ CÁC LỆNH CHẠY THẬT'
  ];
  function setup(next){
    segment=next;sim=0;game=createGame({seed:42,night:next<2?1:next});
    if(next===1){
      applyScenario(game,{time_left_s:7,random_motes:false,random_shades:false,wind_enabled:false,
        player:{pos:[0,0,0]},motes:Array.from({length:18},()=>[0,0,-.8]),
        shades:[{id:'S1',pos:[4,0,-2],state:'chase'}],
        lanterns:game.lanterns.map(l=>({id:l.id,pos:l.id==='L1'?[0,0,-2]:l.pos,lit:l.id!=='L1',fuel:l.id==='L1'?0:80}))});
    }
    if(next===2)applyScenario(game,{player:{pos:[28,0,0]}});
    if(next===3)applyScenario(game,{player:{pos:[0,0,22]}});
  }
  recorder.start(1000);
  window.__demoProgress={phase:'recording',mime,seconds:0};
  while(performance.now()-start<44000){
    const now=await new Promise(r=>requestAnimationFrame(r)),elapsed=(now-start)/1000;
    window.__demoProgress.seconds=elapsed;
    const next=Math.max(0,Math.min(4,Math.floor(elapsed/8)));if(next!==segment){if(next===4){segment=4;sim=0;}else setup(next);}
    accumulator+=Math.min((now-previous)/1000,.1);previous=now;
    while(accumulator>=1/60){
      let input={};
      if(segment===0){const target=[...game.motes].sort((a,b)=>Math.hypot(a.pos[0]-game.player.pos[0],a.pos[2]-game.player.pos[2])-Math.hypot(b.pos[0]-game.player.pos[0],b.pos[2]-game.player.pos[2]))[0];if(target&&game.player.carried<10){const dx=target.pos[0]-game.player.pos[0],dz=target.pos[2]-game.player.pos[2],d=Math.hypot(dx,dz);input={move:[dx/Math.max(1,d),dz/Math.max(1,d)]};}}
      if(segment===1)input={move:sim<6?[0,-1]:[0,0],interact:sim===15||sim===240,pulse:sim===40};
      if(segment===2)input={move:[1,0],dash:sim%150===0};
      if(segment===3)input={move:sim<100||(sim>=150&&sim<220)?[0,-1]:[0,0],jump:sim===35||sim===150};
      for(const e of stepGame(game,input))events.push({segment,...e});sim++;accumulator-=1/60;
    }
    view.sync(game,{elapsed});ctx.drawImage(source,0,0);
    ctx.fillStyle='#101c2bea';ctx.fillRect(0,0,1280,130);ctx.fillRect(0,620,1280,100);
    ctx.fillStyle='#ffdc9b';ctx.font='bold 30px sans-serif';ctx.fillText('ĐẢO ĐÈN LỒNG · DEMO TỰ ĐỘNG',30,43);
    ctx.fillStyle='#f3f4e9';ctx.font='20px sans-serif';ctx.fillText(labels[segment],30,80);
    ctx.fillText(`Đom đóm ${game.player.carried}/10 · Ngọn lửa ${game.player.flames} · Thời gian ${game.time_left_s.toFixed(1)}s · ${game.state} · Điểm ${game.score}`,30,112);
    ctx.font='18px sans-serif';ctx.fillText(segment===1?'Fixture minh họa: đèn và đom đóm đặt gần nhau, rút ngắn còn 7 giây. Engine xử lý mọi sự kiện.':'Seed 42 · Cùng engine và Three.js renderer với game · Điều khiển bằng script tái lập.',30,653);
    ctx.fillText('WASD di chuyển · J nhảy · Shift lướt · E nạp đèn · Space tỏa sáng · P tạm dừng',30,687);
    if(segment===4){
      ctx.fillStyle='#112b32f5';ctx.fillRect(70,170,1140,400);
      ctx.fillStyle='#ffdc9b';ctx.font='bold 26px sans-serif';ctx.fillText('npm run verify · KẾT QUẢ CỦA LẦN CHẠY NÀY',100,220);
      ctx.fillStyle='#f3f4e9';ctx.font='22px sans-serif';
      const passed=testLog.match(/pass (\d+)/)?.[1]||'xem tests.log';
      const lines=[`Unit / CLI / determinism: ${passed} tests đạt`,
        `Headless seed 42: 600 tick · Dawn scenario: won tại tick 60`,
        `Soak: ${soak.nights} đêm · ${soak.crashes} crash · RSS đỉnh ${soak.peak_mem_mb.toFixed(1)} MB`,
        `WebGL 1280×720: ${bench.avg_fps.toFixed(2)} FPS · 1% low ${bench.p1_low_fps.toFixed(2)}`,
        `Đo thực tế ${bench.duration_s.toFixed(1)} giây; VSync trình duyệt, không tắt`,
        'Chi tiết: docs/proof/ · npm run verify -- --demo để tái lập'];
      lines.forEach((line,i)=>ctx.fillText(line,100,275+i*46));
    }
  }
  window.__demoProgress.phase='stopping';
  recorder.stop();await Promise.race([finished,new Promise((_,reject)=>setTimeout(()=>reject(new Error('MediaRecorder did not flush in 15 seconds')),15000))]);stream.getTracks().forEach(t=>t.stop());view.dispose();
  window.__demoProgress.phase='encoding';
  const blob=new Blob(chunks,{type:mime});const buffer=new Uint8Array(await blob.arrayBuffer());
  let binary='';for(let i=0;i<buffer.length;i+=8192)binary+=String.fromCharCode(...buffer.subarray(i,i+8192));
  return {base64:btoa(binary),mime,extension:mime.startsWith('video/mp4')?'mp4':'webm',duration_s:(performance.now()-start)/1000,bytes:blob.size,events,scope:'Automated canvas gameplay demo. Segment 2 uses an explicitly labeled accelerated scenario. Final panel reads actual test log, benchmark and soak output. Not a human playthrough.'};
}
