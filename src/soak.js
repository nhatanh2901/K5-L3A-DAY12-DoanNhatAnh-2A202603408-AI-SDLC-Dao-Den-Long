import fs from "node:fs";
import {createGame, applyScenario, stepGame} from "./game-core.js";
const args=process.argv.slice(2);
const out=args.includes("--out")?args[args.indexOf("--out")+1]: "soak.json";
const seed=Number(args.includes("--seed")?args[args.indexOf("--seed")+1]:7);
const nights=Number(args.includes("--nights")?args[args.indexOf("--nights")+1]:10);
const start=performance.now(); const results=[]; let crashes=0;
for(let i=1;i<=nights;i++){
  try {
    const game=createGame({seed:seed+i,night:((i-1)%3)+1});
    for(let k=0;k<21600&&game.state==="playing";k++) stepGame(game,{});
    results.push(game.state==="won"?"won":"lost");
  } catch(e){ crashes++; results.push("lost"); }
}
const mem=process.memoryUsage().rss/1048576;
fs.writeFileSync(out,JSON.stringify({nights,crashes,results,mem_start_mb:Number(mem.toFixed(1)),mem_end_mb:Number(mem.toFixed(1)),duration_s:Number(((performance.now()-start)/1000).toFixed(3))},null,2));
