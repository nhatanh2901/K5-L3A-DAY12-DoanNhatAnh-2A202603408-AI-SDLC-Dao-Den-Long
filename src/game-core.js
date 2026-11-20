import contract from '../game.contract.json' with {type:'json'};
export const TUNING = Object.freeze(contract.tuning);
export const LANTERN_COUNT = {1: 5, 2: 6, 3: 7};
export const DT = 1/60;

export function surfaces(night) {
  if(night===2) return [{x:0,z:0,radius:30,y:0},{x:70,z:0,radius:30,y:0},{x:35,z:0,width:30,depth:6,y:0}];
  if(night===3) return [{x:0,z:0,radius:43,y:0},{x:18,z:10,width:9,depth:9,y:3},{x:-18,z:10,width:9,depth:9,y:3},{x:0,z:6,width:8,depth:8,y:6},{x:0,z:14,width:8,depth:8,y:3}];
  return [{x:0,z:0,radius:40,y:0}];
}
export function groundAt(night,pos,ceiling=Infinity) {
  let height=-Infinity;
  for(const s of surfaces(night)) {
    const inside=s.radius ? Math.hypot(pos[0]-s.x,pos[2]-s.z)<=s.radius : Math.abs(pos[0]-s.x)<=s.width/2&&Math.abs(pos[2]-s.z)<=s.depth/2;
    if(inside&&s.y<=ceiling) height=Math.max(height,s.y);
  }
  return height;
}
function spawnMote(game) {
  const pos=rndPos(game.rng,game.night===1?34:game.night===2?25:38);
  if(game.night===2&&game.rng()>.5) pos[0]+=70;
  pos[1]=groundAt(game.night,pos);
  game.motes.push({id:`M${game.nextMoteId++}`,pos,kind:'random',ttl_s:null});
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export function rndPos(rng, radius) {
  const a = rng() * Math.PI * 2;
  const r = Math.sqrt(rng()) * radius;
  return [Number((Math.cos(a) * r).toFixed(3)), 0, Number((Math.sin(a) * r).toFixed(3))];
}

export function createGame(options = {}) {
  const seed = Number(options.seed ?? 1);
  const night = Number(options.night ?? 1);
  if(!Number.isInteger(seed)||seed<0||![1,2,3].includes(night)) throw new Error('Invalid seed/night');
  const rng = seeded(seed);
  const duration = TUNING[`night${night}_duration_s`];
  const lanternPositions = night === 1
    ? [[0,0,25],[23.8,0,7.7],[14.7,0,-20.2],[-14.7,0,-20.2],[-23.8,0,7.7]]
    : night === 2
      ? [[0,0,20],[17,0,-10],[-17,0,-10],[70,0,20],[87,0,-10],[53,0,-10]]
      : [[0,6,6],[18,3,10],[-18,3,10],[35,0,-10],[-35,0,-10],[20,0,-35],[-20,0,-35]];
  const lanterns = lanternPositions.map((pos, i) => ({
    id: `L${i + 1}`, pos, lit: false, ever_lit: false, deposited: 0, fuel: 0
  }));
  const motes = [];
  const game = {
    seed, night, rng, duration, time_left_s:duration, sim_tick:0, state:"playing",
    player:{pos:[0,0,0], carried:0, flames:TUNING.flames, invuln_ticks:0, dash_cd_ticks:0, dash_ticks:0,dash_dir:[0,-1],pulse_cd_ticks:0, charm_ticks:0, vel:[0,0,0], grounded:true},
    lanterns, motes, shades:[], drifters:[], charms:[], score:0, score_base:0,
    wind:{active:false, dir_deg:0}, random_motes:true, random_shades:true,
    nextShadeId:1, nextDrifterId:1, shadeSpawnEvery: night === 1 ? 480 : night === 2 ? 420 : 360,
    endReason:null, pauseTicks:0,paused:false,wind_enabled:night>1,nextMoteId:1
  };
  game.motes=[];game.nextMoteId=1;
  for(let i=0;i<40;i++) spawnMote(game);
  if(night>1) game.charms=[{id:'C1',pos:[8,0,0],available:true,respawn_s:0}];
  return game;
}

export function applyScenario(game, scenario) {
  if(scenario===null||scenario===undefined) return;
  if (typeof scenario!=='object'||Array.isArray(scenario)) throw new Error('Invalid scenario');
  const vector=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
  if(scenario.player?.pos&&!vector(scenario.player.pos)) throw new Error('Invalid player position');
  if(scenario.player?.vel&&!vector(scenario.player.vel)) throw new Error('Invalid velocity');
  if (scenario.player) Object.assign(game.player, structuredClone(scenario.player));
  if(scenario.time_left_s!==undefined&&(!Number.isFinite(scenario.time_left_s)||scenario.time_left_s<0)) throw new Error('Invalid time');
  if (Number.isFinite(scenario.time_left_s)) game.time_left_s = scenario.time_left_s;
  if (typeof scenario.random_motes === "boolean") game.random_motes = scenario.random_motes;
  if (typeof scenario.random_shades === "boolean") game.random_shades = scenario.random_shades;
  if (scenario.wind_enabled !== undefined) game.wind_enabled = scenario.wind_enabled;
  if (scenario.lanterns) for (const change of scenario.lanterns) {
    const lantern = game.lanterns.find(x => x.id === change.id);
    if (!lantern) throw new Error(`Unknown lantern ${change.id}`);
    if(change.pos&&!vector(change.pos)) throw new Error('Invalid lantern position');
    if(change.fuel!==undefined&&(!Number.isFinite(change.fuel)||change.fuel<0||change.fuel>100)) throw new Error('Invalid fuel');
    if (change.pos) lantern.pos = [...change.pos];
    if (typeof change.deposited === "number") lantern.deposited = change.deposited;
    if (change.lit !== undefined) { lantern.lit = change.lit; lantern.ever_lit ||= change.lit; lantern.fuel = change.fuel ?? (change.lit ? 100 : 0); }
    else if(change.fuel!==undefined) lantern.fuel=change.fuel;
    if(change.ever_lit!==undefined) lantern.ever_lit=change.ever_lit;
  }
  if (scenario.motes) game.motes = scenario.motes.map((m,i) => Array.isArray(m)
    ? {id:`M${i+1}`,pos:m,kind:"random",ttl_s:null}
    : {...m,id:m.id||`M${i+1}`,kind:m.kind||"random",ttl_s:m.ttl_s??null});
  if(game.motes.some(m=>!vector(m.pos))) throw new Error('Invalid mote position');
  if (scenario.shades) game.shades = scenario.shades.map((s,i) => ({id:s.id || `S${i+1}`, pos:s.pos || [10,0,0], state:s.state || "wander", state_ticks_left:s.state_ticks_left ?? 0}));
  if(game.shades.some(s=>!vector(s.pos))) throw new Error('Invalid shade position');
  if (scenario.drifters) game.drifters = scenario.drifters;
  if (scenario.charms) game.charms = scenario.charms;
  game.nextMoteId=Math.max(game.nextMoteId,...game.motes.map(m=>(Number(m.id.slice(1))||0)+1));
  game.nextShadeId=Math.max(game.nextShadeId,...game.shades.map(s=>(Number(s.id.slice(1))||0)+1));
}

const distXZ = (a,b) => Math.hypot(a[0]-b[0], a[2]-b[2]);
const clamp3 = n => Number(n.toFixed(3));

export function stepGame(game, input = {}) {
  if (game.state !== "playing") return [];
  if(input.pause) game.paused=!game.paused;
  if(game.paused) {game.pauseTicks++;return [];}
  const events = [];
  game.sim_tick++;

  if(game.random_motes&&game.sim_tick%30===0&&game.motes.length<100) spawnMote(game);
  game.motes=game.motes.filter(m=>m.ttl_s===null||(m.ttl_s-=DT)>0);
  for(const s of game.shades) if(s.state_ticks_left>0&&--s.state_ticks_left===0) s.state='chase';
  if(game.random_shades&&game.sim_tick%game.shadeSpawnEvery===0&&game.shades.length<8) {
    const angle=game.rng()*Math.PI*2;
    const pos=[game.player.pos[0]+Math.cos(angle)*20,0,game.player.pos[2]+Math.sin(angle)*20];
    pos[1]=Math.max(0,groundAt(game.night,pos));
    game.shades.push({id:`S${game.nextShadeId++}`,pos,state:'chase',state_ticks_left:0});
  }
  if(game.wind_enabled) {
    const active=game.sim_tick%1200>=900;
    if(active&&!game.wind.active) game.wind.dir_deg=Math.floor(game.rng()*360);
    game.wind.active=active;
    if(game.night>1&&game.random_shades&&game.sim_tick%900===0&&game.drifters.length<2)
      game.drifters.push({id:`D${game.nextDrifterId++}`,pos:[game.player.pos[0]+12,0,game.player.pos[2]+12],state:'chase',stolen:0,state_ticks_left:0});
  }

  if (game.player.invuln_ticks > 0) game.player.invuln_ticks--;
  if (game.player.dash_cd_ticks > 0) game.player.dash_cd_ticks--;
  if (game.player.pulse_cd_ticks > 0) game.player.pulse_cd_ticks--;
  if (game.player.charm_ticks > 0) game.player.charm_ticks--;

  // fuel decay and drain
  for (const lantern of game.lanterns) {
    if (!lantern.lit) continue;
    let decay = TUNING.fuel_decay_per_s;
    for (const shade of game.shades) {
      if (shade.state === "drain" && distXZ(shade.pos, lantern.pos) <= TUNING.safe_radius) decay += TUNING.fuel_drain_per_s;
    }
    lantern.fuel = Math.max(0, lantern.fuel - decay*DT);
    if(lantern.fuel<1e-9) lantern.fuel=0;
  }

  const move = Array.isArray(input.move) ? input.move : [0,0];
  let mx = Math.max(-1, Math.min(1, move[0]));
  let mz = Math.max(-1, Math.min(1, move[1]));
  const len = Math.hypot(mx,mz); if (len > 1) { mx/=len; mz/=len; }
  const yaw = ((input.cam_yaw_deg ?? 0) * Math.PI) / 180;
  let worldX = mx*Math.cos(yaw) + mz*Math.sin(yaw);
  let worldZ = -mx*Math.sin(yaw) + mz*Math.cos(yaw);
  let speed = game.player.charm_ticks > 0 ? TUNING.player_speed*1.2 : TUNING.player_speed;
  if(input.dash&&game.player.dash_cd_ticks<=0) {
    game.player.dash_ticks=Math.round(TUNING.dash_duration_s/DT);
    game.player.dash_cd_ticks=Math.round(TUNING.dash_cooldown_s/DT);
    game.player.dash_dir=len?[worldX/Math.hypot(worldX,worldZ),worldZ/Math.hypot(worldX,worldZ)]:[0,-1];
    events.push({type:'event',tick:game.sim_tick,name:'dash',data:{}});
  }
  if(game.player.dash_ticks>0) {speed=TUNING.dash_speed;[worldX,worldZ]=game.player.dash_dir;game.player.dash_ticks--;}
  const old=[...game.player.pos];
  game.player.pos[0] += worldX * speed / 60;
  game.player.pos[2] += worldZ * speed / 60;

  if(game.wind.active&&game.player.charm_ticks<=0) {
    game.player.pos[0]+=Math.cos(game.wind.dir_deg*Math.PI/180)*DT;
    game.player.pos[2]+=Math.sin(game.wind.dir_deg*Math.PI/180)*DT;
  }
  if (input.jump && game.player.grounded) { game.player.vel[1] = 12; game.player.grounded=false; }
  game.player.vel[1] = (game.player.vel?.[1] ?? 0) - (20/60);
  game.player.pos[1] += game.player.vel[1]/60;
  const ground=groundAt(game.night,game.player.pos);
  if(ground>old[1]+.3&&game.player.pos[1]<ground) {game.player.pos[0]=old[0];game.player.pos[2]=old[2];}
  const landing=groundAt(game.night,game.player.pos,Math.max(old[1],game.player.pos[1])+.01);
  game.player.grounded=game.player.vel[1]<=0&&game.player.pos[1]<=landing;
  if(game.player.grounded) {game.player.pos[1]=landing;game.player.vel[1]=0;}
  if(game.player.pos[1]<-8&&TUNING.fall_enabled) {
    game.player.flames--;game.player.pos=[0,0,0];game.player.vel=[0,0,0];game.player.grounded=true;game.player.invuln_ticks=90;
    const dropped=Math.floor(game.player.carried*TUNING.hit_drop_ratio);game.player.carried-=dropped;
    events.push({type:'event',tick:game.sim_tick,name:'player_hit',data:{by:'fall',flames:game.player.flames,dropped,lost:dropped}});
  }
  for(const c of game.charms) {
    c.respawn_s=Math.max(0,(c.respawn_s||0)-DT);
    if(!c.available&&c.respawn_s===0) c.available=true;
    if(c.available&&c.pos&&distXZ(game.player.pos,c.pos)<=1) {c.available=false;c.respawn_s=30;game.player.charm_ticks=600;}
  }

  for (let i=game.motes.length-1;i>=0;i--) {
    const mote=game.motes[i];
    if (mote.pos && distXZ(game.player.pos,mote.pos)<=TUNING.pickup_radius && Math.abs(game.player.pos[1]-mote.pos[1])<=1.5 && game.player.carried<TUNING.carry_capacity) {
      game.player.carried++; game.motes.splice(i,1);
      events.push({type:"event",tick:game.sim_tick,name:"mote_picked",data:{carried:game.player.carried}});
    }
  }

  if (input.interact) {
    const candidates = game.lanterns.filter(l => distXZ(game.player.pos,l.pos)<=TUNING.interact_radius && Math.abs(game.player.pos[1]-l.pos[1])<=2 && (!l.lit || l.fuel<TUNING.fuel_max));
    candidates.sort((a,b)=>distXZ(game.player.pos,a.pos)-distXZ(game.player.pos,b.pos)||a.id.localeCompare(b.id));
    const l=candidates[0];
    if (l) {
      if (!l.lit) {
        const cost=l.ever_lit ? 5 : TUNING.lantern_cost;
        const used=Math.min(game.player.carried,cost-l.deposited);
        l.deposited += used; game.player.carried-=used; game.score+=used*TUNING.score.per_mote;
        if (l.deposited>=cost) { l.lit=true;l.ever_lit=true;l.deposited=cost;l.fuel=TUNING.fuel_max; events.push({type:"event",tick:game.sim_tick,name:"lantern_lit",data:{lantern_id:l.id}}); }
        events.push({type:"event",tick:game.sim_tick,name:"deposit",data:{lantern_id:l.id,amount:used,deposited:l.deposited}});
      } else {
        const used=Math.min(game.player.carried,Math.ceil((TUNING.fuel_max-l.fuel)/TUNING.fuel_per_mote));
        if (used>0) { l.fuel=Math.min(TUNING.fuel_max,l.fuel+used*TUNING.fuel_per_mote); game.player.carried-=used; game.score+=used*TUNING.score.per_mote; events.push({type:"event",tick:game.sim_tick,name:"refuel",data:{lantern_id:l.id,amount:used,fuel:Number(l.fuel.toFixed(3))}}); }
      }
    }
  }

  if (input.pulse && game.player.pulse_cd_ticks<=0 && game.player.carried>=TUNING.pulse_cost) {
    game.player.carried-=TUNING.pulse_cost; game.player.pulse_cd_ticks=Math.round(TUNING.pulse_cooldown_s/DT);
    const stunned=[];
    for (const shade of [...game.shades,...game.drifters]) {
      if (distXZ(game.player.pos,shade.pos)<=TUNING.pulse_radius) {
        const draining=shade.state==='drain';shade.state="stunned";shade.state_ticks_left=Math.round(TUNING.pulse_stun_s/DT);stunned.push(shade.id);game.score+=draining?15:TUNING.score.per_stun;
        const dx=shade.pos[0]-game.player.pos[0],dz=shade.pos[2]-game.player.pos[2],d=Math.hypot(dx,dz);
        shade.pos[0]+=(d?dx/d:1)*TUNING.pulse_push_m;shade.pos[2]+=(d?dz/d:0)*TUNING.pulse_push_m;
      }
    }
    events.push({type:"event",tick:game.sim_tick,name:"pulse",data:{stunned_ids:stunned}});
  }

  for (const shade of game.shades) {
    if (shade.state==="stunned" || shade.state==="recoil") continue;
    let target=null;
    let min=Infinity;
    for (const l of game.lanterns) if (l.lit && l.fuel<TUNING.low_fuel_threshold && distXZ(shade.pos,l.pos)<min) { min=distXZ(shade.pos,l.pos);target=l; }
    if (target && min<=12) shade.state="drain";
    else if(game.lanterns.some(l=>l.lit&&distXZ(shade.pos,l.pos)<TUNING.safe_radius)) {shade.state='recoil';shade.state_ticks_left=30;}
    else shade.state="chase";
  }

  for (const shade of [...game.shades]) {
    if (shade.state==="stunned"||shade.state==='recoil') continue;
    let target=game.player.pos;
    if (shade.state==="drain") {
      target=game.lanterns.filter(l=>l.lit&&l.fuel<TUNING.low_fuel_threshold).sort((a,b)=>distXZ(shade.pos,a.pos)-distXZ(shade.pos,b.pos))[0]?.pos || target;
    }
    const dx=target[0]-shade.pos[0], dz=target[2]-shade.pos[2]; const d=Math.hypot(dx,dz);
    if (d>0.001) { const speed=TUNING.shade_speed; shade.pos[0]+=dx/d*speed/60; shade.pos[2]+=dz/d*speed/60; }
    shade.pos[1]=Math.max(0,groundAt(game.night,shade.pos));
  }

  for (const shade of game.shades) {
    if (shade.state==="stunned"||shade.state==='recoil') continue;
    if (distXZ(game.player.pos,shade.pos)<=TUNING.shade_hit_radius && Math.abs(game.player.pos[1]-shade.pos[1])<=1.5 && game.player.invuln_ticks<=0) {
      game.player.flames--; game.player.invuln_ticks=Math.round(TUNING.invuln_s/DT);
      const dropped=Math.floor(game.player.carried*TUNING.hit_drop_ratio); game.player.carried-=dropped;
      for(let i=0;i<dropped;i++) game.motes.push({id:`M${game.nextMoteId++}`,pos:[game.player.pos[0]+(game.rng()-.5)*4,game.player.pos[1],game.player.pos[2]+(game.rng()-.5)*4],kind:'dropped',ttl_s:10});
      events.push({type:"event",tick:game.sim_tick,name:"player_hit",data:{by:"shade",flames:game.player.flames,dropped, lost:dropped}});
      break;
    }
  }

  for (const lantern of game.lanterns) {
    if (lantern.lit && lantern.fuel<=0) {
      lantern.lit=false; lantern.deposited=0;
      events.push({type:"event",tick:game.sim_tick,name:"lantern_out",data:{lantern_id:lantern.id}});
    }
  }

  for(const d of game.drifters) {
    if(d.state_ticks_left>0) {d.state_ticks_left--;if(!d.state_ticks_left) d.state='chase';continue;}
    const x=game.player.pos[0]-d.pos[0],z=game.player.pos[2]-d.pos[2],dist=Math.hypot(x,z);
    if(dist>.1) {d.pos[0]+=x/dist*3*DT;d.pos[2]+=z/dist*3*DT;}
    if(dist<1&&game.player.carried>0&&game.player.charm_ticks<=0) {const stolen=Math.min(2,game.player.carried);game.player.carried-=stolen;d.stolen=(d.stolen||0)+stolen;d.state='recoil';d.state_ticks_left=180;events.push({type:'event',tick:game.sim_tick,name:'motes_stolen',data:{id:d.id,amount:stolen}});}
  }
  game.time_left_s=Math.max(0,game.time_left_s-DT);
  if(game.time_left_s<1e-8) game.time_left_s=0;
  if (game.player.flames<=0) { game.state="lost";game.endReason="no_flames";events.push({type:"event",tick:game.sim_tick,name:"game_over",data:{result:"lost",reason:"no_flames"}}); }
  else if (game.lanterns.every(l=>l.lit && l.fuel>0) && game.time_left_s===0) { game.state="won";game.endReason="dawn";game.score+=Math.floor(game.lanterns.reduce((n,l)=>n+TUNING.score.per_lantern*l.fuel/TUNING.fuel_max,0))+game.player.flames*TUNING.score.per_flame_left;events.push({type:"event",tick:game.sim_tick,name:"game_over",data:{result:"won",reason:"dawn"}}); }
  else if (game.time_left_s<=0) { game.state="lost";game.endReason="dawn";events.push({type:"event",tick:game.sim_tick,name:"game_over",data:{result:"lost",reason:"dawn"}}); }
  return events;
}

export function snapshot(game) {
  return {
    type:"snapshot",tick:game.sim_tick,sim_tick:game.sim_tick,night:game.night,
    state:game.state,time_left_s:Number(game.time_left_s.toFixed(3)),score:game.score,
    wind:{active:!!game.wind.active,dir_deg:game.wind.dir_deg},
    player:{pos:game.player.pos.map(clamp3),flames:game.player.flames,carried:game.player.carried,
      vel:game.player.vel.map(clamp3),grounded:game.player.grounded,invuln:game.player.invuln_ticks,
      dash_cd_s:Number((game.player.dash_cd_ticks/60).toFixed(3)),pulse_cd_s:Number((game.player.pulse_cd_ticks/60).toFixed(3)),charm_s:Number((game.player.charm_ticks/60).toFixed(3))},
    lanterns:game.lanterns.map(l=>({id:l.id,pos:l.pos.map(clamp3),lit:l.lit,ever_lit:l.ever_lit,fuel:Number(l.fuel.toFixed(3)),deposited:l.deposited})),
    shades:game.shades.map(s=>({id:s.id,pos:s.pos.map(clamp3),state:s.state})),
    motes:game.motes.map(m=>({id:m.id,pos:m.pos.map(clamp3),kind:m.kind,ttl_s:m.ttl_s})),
    drifters:(game.drifters||[]).map(d=>({id:d.id,pos:d.pos.map(clamp3),state:d.state,stolen:d.stolen||0})),
    charms:(game.charms||[]).map(c=>({id:c.id,available:c.available??true,respawn_s:c.respawn_s??0}))
  };
}
