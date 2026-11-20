import {createGame,stepGame} from './game-core.js';
import {createScene} from './scene.js';
export async function benchmark({seed=42,duration=30}={}) {
  const start=performance.now(),game=createGame({seed,night:3});
  const view=createScene(document.querySelector('canvas'),{width:1280,height:720,pixelRatio:1});
  // Measure the actual shared WebGL scene. Keep player stationary; orbit camera.
  // Spawning and physics run in the same fixed 60 Hz loop used by gameplay.
  const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
  const frames=[];let previous=await frame(),elapsed=0,accumulator=0;
  const load=performance.now()-start;
  const begin=previous;
  while(elapsed<(duration+2)*1000) {
    const now=await frame(),dt=now-previous;previous=now;elapsed=now-begin;
    accumulator+=Math.min(dt/1000,.1);
    while(accumulator>=1/60){stepGame(game,{});accumulator-=1/60;}
    view.sync(game,{orbit:true,elapsed:elapsed/1000});
    view.renderer.getContext().finish();
    if(elapsed>2000)frames.push(dt);
    document.querySelector('#status').textContent=`Benchmark WebGL thực · 1280×720\n${Math.min(duration,Math.max(0,elapsed/1000-2)).toFixed(1)} / ${duration} giây\n${frames.length} khung hình · rAF / VSync trình duyệt`;
  }
  const sorted=[...frames].sort((a,b)=>a-b),slow=[...sorted].reverse().slice(0,Math.max(1,Math.ceil(frames.length*.01)));
  const mean=a=>a.reduce((s,n)=>s+n,0)/a.length;
  const gl=view.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
  const result={contract_version:'1.3',avg_fps:1000/mean(frames),p1_low_fps:1000/mean(slow),frame_ms_p95:sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*.95)-1)],frames:frames.length,load_ms:load,peak_mem_mb:null,vsync_off:false,renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),os:navigator.platform,resolution:[1280,720],pixel_ratio:1,duration_s:frames.reduce((a,b)=>a+b,0)/1000,seed,frame_source:'performance.now intervals between requestAnimationFrame callbacks, shared Three.js renderer with gl.finish; 2s warmup',limitations:'Headless browser; VSync/browser throttling retained. GPU/CPU and display differ from grading machine. Browser RSS unavailable; peak_mem_mb is null.'};
  view.dispose();return result;
}
