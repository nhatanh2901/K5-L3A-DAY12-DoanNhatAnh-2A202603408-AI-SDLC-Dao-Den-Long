import fs from 'node:fs';
import os from 'node:os';
import {createGame,stepGame} from './game-core.js';
const args=process.argv.slice(2),arg=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const out=arg('--out','soak.json'),seed=Number(arg('--seed',7)),nights=Number(arg('--nights',10));
if(!Number.isInteger(seed)||seed<0||!Number.isInteger(nights)||nights<1){console.error('Invalid seed/nights');process.exit(2);}
const start=performance.now(),memStart=process.memoryUsage().rss/1048576;
let peak=memStart,crashes=0;const results=[],runs=[];
for(let i=0;i<nights;i++) {
  let game;
  try {
    game=createGame({seed:seed+i,night:i%3+1});
    // Normal engine, no scenario overrides. Continuous movement exercises spawns, falls,
    // collision, fuel, and cleanup. A loss is a legitimate outcome, not a crash.
    for(let k=0;k<game.duration*60+1&&game.state==='playing';k++) {
      const phase=Math.floor(k/240)%4;
      stepGame(game,{move:[[1,0],[0,1],[-1,0],[0,-1]][phase],interact:k%30===0,pulse:k%180===0,dash:k%120===0,jump:k%90===0});
      if(k%600===0)peak=Math.max(peak,process.memoryUsage().rss/1048576);
      if(!game.player.pos.every(Number.isFinite)||!Number.isFinite(game.score)||game.motes.length>200)throw new Error('Invalid or unbounded engine state');
    }
    if(game.state==='playing')throw new Error('Night failed to terminate');
    results.push(game.state);runs.push({seed:seed+i,night:game.night,ticks:game.sim_tick,result:game.state});
  }catch(e){crashes++;results.push('crash');runs.push({seed:seed+i,error:e.message});}
}
const memEnd=process.memoryUsage().rss/1048576;peak=Math.max(peak,memEnd);
const result={nights,crashes,results,runs,mem_start_mb:memStart,mem_end_mb:memEnd,peak_mem_mb:peak,duration_s:(performance.now()-start)/1000,environment:{node:process.version,os:`${os.platform()} ${os.release()}`,cpu:os.cpus()[0]?.model},scope:'Node engine soak; not a GPU or browser memory measurement'};
fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(`Soak: ${nights} nights, ${crashes} crashes`);if(crashes)process.exitCode=1;
