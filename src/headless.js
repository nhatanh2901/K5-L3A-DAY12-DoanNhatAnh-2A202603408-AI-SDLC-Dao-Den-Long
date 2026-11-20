import fs from 'node:fs';
import {createGame,applyScenario,stepGame,snapshot} from './game-core.js';
import {loadLeaderboard} from './leaderboard.js';

try {
  const allowed=new Set(['--seed','--night','--ticks','--out','--scenario','--inputs','--snapshot-every','--export-leaderboard','--leaderboard']);
  const args=process.argv.slice(2),opts={};
  for(let i=0;i<args.length;i+=2){if(!allowed.has(args[i])||args[i+1]===undefined||args[i+1].startsWith('--'))throw new Error(`Invalid argument ${args[i]}`);opts[args[i]]=args[i+1];}
  const integer=(name,fallback,min)=>{const value=Number(opts[name]??fallback);if(!Number.isSafeInteger(value)||value<min)throw new Error(`Invalid ${name}`);return value;};
  const seed=integer('--seed',1,0),night=integer('--night',1,1),ticks=integer('--ticks',600,0),every=integer('--snapshot-every',10,1);
  if(night>3)throw new Error('Invalid night');
  if(opts['--export-leaderboard']) {
    if(!opts['--leaderboard'])throw new Error('--leaderboard source file is required');
    fs.writeFileSync(opts['--export-leaderboard'],JSON.stringify({entries:loadLeaderboard(opts['--leaderboard'])},null,2));
  } else {
    const game=createGame({seed,night});
    if(opts['--scenario'])applyScenario(game,JSON.parse(fs.readFileSync(opts['--scenario'],'utf8')));
    const data=opts['--inputs']?JSON.parse(fs.readFileSync(opts['--inputs'],'utf8')):{frames:[]};
    if(!Array.isArray(data.frames))throw new Error('inputs.frames must be an array');
    let last=-1;
    for(const f of data.frames){
      if(!Number.isInteger(f.tick)||f.tick<last||f.tick<0)throw new Error('Input ticks must be nonnegative and ordered');last=f.tick;
      if(f.move&&(!Array.isArray(f.move)||f.move.length!==2||!f.move.every(Number.isFinite)))throw new Error('Invalid move');
      if(f.cam_yaw_deg!==undefined&&!Number.isFinite(f.cam_yaw_deg))throw new Error('Invalid yaw');
      for(const key of ['interact','pulse','jump','dash','pause'])if(f[key]!==undefined&&typeof f[key]!=='boolean')throw new Error(`Invalid ${key}`);
    }
    const lines=[JSON.stringify(snapshot(game))];let index=0,current={move:[0,0],cam_yaw_deg:0};
    for(let tick=0;tick<ticks&&game.state==='playing';tick++) {
      const actions={};
      while(index<data.frames.length&&data.frames[index].tick===tick) {
        const f=data.frames[index++];if(f.move)current.move=f.move;if(f.cam_yaw_deg!==undefined)current.cam_yaw_deg=f.cam_yaw_deg;
        for(const key of ['interact','pulse','jump','dash','pause'])if(f[key]!==undefined)actions[key]=f[key];
      }
      const before=game.sim_tick;
      for(const e of stepGame(game,{...current,...actions}))lines.push(JSON.stringify(e));
      if(game.sim_tick!==before&&game.sim_tick%every===0)lines.push(JSON.stringify(snapshot(game)));
    }
    lines.push(JSON.stringify({type:'end',ticks:game.sim_tick,state:game.state,score:game.score}));
    const text=lines.join('\n')+'\n';if(opts['--out'])fs.writeFileSync(opts['--out'],text);else process.stdout.write(text);
  }
} catch(error) {console.error(error.message);process.exitCode=2;}
