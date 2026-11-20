import fs from "node:fs";
import {createGame, applyScenario, stepGame, snapshot} from "./game-core.js";

const args = process.argv.slice(2);
function arg(name, fallback) { const i=args.indexOf(name); return i>=0 ? args[i+1] : fallback; }
const seed=Number(arg("--seed","1")), night=Number(arg("--night","1")), ticks=Number(arg("--ticks","600"));
const out=arg("--out",null), scenarioPath=arg("--scenario",null), inputPath=arg("--inputs",null);
const exportLeaderboard=arg("--export-leaderboard",null);
if (exportLeaderboard) {
  fs.writeFileSync(exportLeaderboard,JSON.stringify({entries:[]},null,2));
  process.exit(0);
}
let scenario=null, inputData={frames:[]};
try {
  if (scenarioPath) scenario=JSON.parse(fs.readFileSync(scenarioPath,"utf8"));
  if (inputPath) inputData=JSON.parse(fs.readFileSync(inputPath,"utf8"));
} catch (e) { console.error(e.message); process.exit(2); }
const game=createGame({seed,night});
applyScenario(game,scenario);
const lines=[];
const snapshotEvery=Number(arg("--snapshot-every","10"));
if (!snapshotEvery || snapshotEvery<1) { console.error("snapshot-every must be positive"); process.exit(2); }
lines.push(JSON.stringify(snapshot(game)));
let current={move:[0,0],cam_yaw_deg:0,interact:false,pulse:false,jump:false,dash:false,pause:false};
let frameIndex=0;
for (let k=0;k<ticks && game.state==="playing";k++) {
  while (frameIndex<inputData.frames?.length && inputData.frames[frameIndex].tick<=k) {
    Object.assign(current,inputData.frames[frameIndex]); frameIndex++;
  }
  const events=stepGame(game,{...current});
  for (const event of events) lines.push(JSON.stringify(event));
  if (game.sim_tick%snapshotEvery===0) lines.push(JSON.stringify(snapshot(game)));
}
lines.push(JSON.stringify({type:"end",ticks:game.sim_tick,state:game.state,score:game.score}));
const text=lines.join("\n")+"\n";
if (out) fs.writeFileSync(out,text);
else process.stdout.write(text);
