export const LANTERN_COUNT = {1: 5, 2: 6, 3: 7};

function seeded(seed) {
  let s = (seed >>> 0) || 1;
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
  const rng = seeded(seed);
  const duration = night === 1 ? 300 : night === 2 ? 330 : 360;
  const lanternPositions = night === 1
    ? [[0,0,25],[23.8,0,7.7],[14.7,0,-20.2],[-14.7,0,-20.2],[-23.8,0,7.7]]
    : night === 2
      ? [[0,0,20],[17,0,-10],[-17,0,-10],[70,0,20],[87,0,-10],[53,0,-10]]
      : [[0,6,6],[18,3,10],[-18,3,10],[35,0,-10],[-35,0,-10],[20,0,-35],[-20,0,-35]];
  const lanterns = lanternPositions.map((pos, i) => ({
    id: `L${i + 1}`, pos, lit: false, ever_lit: false, deposited: 0, fuel: 0
  }));
  const motes = [];
  for (let i = 0; i < 20; i++) motes.push({id:`M${i+1}`, pos:rndPos(rng, night === 1 ? 33 : night === 2 ? 22 : 34), kind:"random", ttl_s:null});
  return {
    seed, night, rng, duration, time_left_s:duration, sim_tick:0, state:"playing",
    player:{pos:[0,0,0], carried:0, flames:3, invuln_ticks:0, dash_cd_ticks:0, pulse_cd_ticks:0, charm_ticks:0, vel:[0,0,0], grounded:true},
    lanterns, motes, shades:[], drifters:[], charms:[], score:0, score_base:0,
    wind:{active:false, dir_deg:0}, random_motes:true, random_shades:true,
    nextShadeId:1, nextDrifterId:1, shadeSpawnEvery: night === 1 ? 480 : night === 2 ? 420 : 360,
    endReason:null, pauseTicks:0
  };
}

export function applyScenario(game, scenario) {
  if (!scenario) return;
  if (scenario.player) Object.assign(game.player, scenario.player);
  if (Number.isFinite(scenario.time_left_s)) game.time_left_s = scenario.time_left_s;
  if (typeof scenario.random_motes === "boolean") game.random_motes = scenario.random_motes;
  if (typeof scenario.random_shades === "boolean") game.random_shades = scenario.random_shades;
  if (scenario.wind_enabled !== undefined) game.wind_enabled = scenario.wind_enabled;
  if (scenario.lanterns) for (const change of scenario.lanterns) {
    const lantern = game.lanterns.find(x => x.id === change.id);
    if (!lantern) continue;
    if (change.pos) lantern.pos = change.pos;
    if (typeof change.deposited === "number") lantern.deposited = change.deposited;
    if (change.lit !== undefined) { lantern.lit = change.lit; lantern.ever_lit ||= change.lit; lantern.fuel = change.fuel ?? (change.lit ? 100 : 0); }
  }
  if (scenario.motes) game.motes = scenario.motes.map((m,i) => Array.isArray(m)
    ? {id:`M${i+1}`,pos:m,kind:"random",ttl_s:null}
    : {...m,id:m.id||`M${i+1}`,kind:m.kind||"random",ttl_s:m.ttl_s??null});
  if (scenario.shades) game.shades = scenario.shades.map((s,i) => ({id:s.id || `S${i+1}`, pos:s.pos || [10,0,0], state:s.state || "wander", state_ticks_left:s.state_ticks_left ?? 0}));
  if (scenario.drifters) game.drifters = scenario.drifters;
  if (scenario.charms) game.charms = scenario.charms;
}

const distXZ = (a,b) => Math.hypot(a[0]-b[0], a[2]-b[2]);
const clamp3 = n => Number(n.toFixed(3));

export function stepGame(game, input = {}) {
  if (game.state !== "playing") return [];
  const events = [];
  game.sim_tick++;

  if (game.player.invuln_ticks > 0) game.player.invuln_ticks--;
  if (game.player.dash_cd_ticks > 0) game.player.dash_cd_ticks--;
  if (game.player.pulse_cd_ticks > 0) game.player.pulse_cd_ticks--;
  if (game.player.charm_ticks > 0) game.player.charm_ticks--;

  // fuel decay and drain
  for (const lantern of game.lanterns) {
    if (!lantern.lit) continue;
    let decay = 1;
    for (const shade of game.shades) {
      if (shade.state === "drain" && distXZ(shade.pos, lantern.pos) <= 6) decay += 5;
    }
    lantern.fuel = Math.max(0, lantern.fuel - decay);
  }

  const move = Array.isArray(input.move) ? input.move : [0,0];
  let mx = Math.max(-1, Math.min(1, move[0]));
  let mz = Math.max(-1, Math.min(1, move[1]));
  const len = Math.hypot(mx,mz); if (len > 1) { mx/=len; mz/=len; }
  const yaw = ((input.cam_yaw_deg ?? 0) * Math.PI) / 180;
  const worldX = mx*Math.cos(yaw) + mz*Math.sin(yaw);
  const worldZ = -mx*Math.sin(yaw) + mz*Math.cos(yaw);
  const speed = game.player.charm_ticks > 0 ? 7.2 : 6;
  game.player.pos[0] += worldX * speed / 60;
  game.player.pos[2] += worldZ * speed / 60;

  if (input.jump && game.player.grounded) { game.player.vel[1] = 7; game.player.grounded=false; }
  game.player.vel[1] = (game.player.vel?.[1] ?? 0) - (20/60);
  game.player.pos[1] += game.player.vel[1]/60;
  if (game.player.pos[1] <= 0) { game.player.pos[1]=0; game.player.vel[1]=0; game.player.grounded=true; }

  for (let i=game.motes.length-1;i>=0;i--) {
    const mote=game.motes[i];
    if (mote.pos && distXZ(game.player.pos,mote.pos)<=1 && Math.abs(game.player.pos[1]-mote.pos[1])<=1.5 && game.player.carried<10) {
      game.player.carried++; game.motes.splice(i,1);
      game.score += 10;
      events.push({type:"event",tick:game.sim_tick,name:"mote_picked",data:{carried:game.player.carried}});
    }
  }

  if (input.interact) {
    const candidates = game.lanterns.filter(l => distXZ(game.player.pos,l.pos)<=2 && (!l.lit || l.fuel<100));
    candidates.sort((a,b)=>distXZ(game.player.pos,a.pos)-distXZ(game.player.pos,b.pos)||a.id.localeCompare(b.id));
    const l=candidates[0];
    if (l) {
      if (!l.lit) {
        const cost=l.ever_lit ? 5 : 10;
        const used=Math.min(game.player.carried,cost-l.deposited);
        l.deposited += used; game.player.carried-=used; game.score+=used*5;
        if (l.deposited>=cost) { l.lit=true;l.ever_lit=true;l.deposited=cost;l.fuel=100; events.push({type:"event",tick:game.sim_tick,name:"lantern_lit",data:{lantern_id:l.id}}); }
        events.push({type:"event",tick:game.sim_tick,name:"deposit",data:{lantern_id:l.id,amount:used,deposited:l.deposited}});
      } else {
        const used=Math.min(game.player.carried,Math.ceil((100-l.fuel)/10));
        if (used>0) { l.fuel=Math.min(100,l.fuel+used*10); game.player.carried-=used; game.score+=used*5; events.push({type:"event",tick:game.sim_tick,name:"refuel",data:{lantern_id:l.id,amount:used,fuel:Number(l.fuel.toFixed(3))}}); }
      }
    }
  }

  if (input.pulse && game.player.pulse_cd_ticks<=0 && game.player.carried>=3) {
    game.player.carried-=3; game.player.pulse_cd_ticks=180;
    const stunned=[];
    for (const shade of game.shades) {
      if (distXZ(game.player.pos,shade.pos)<=5) { shade.state="stunned"; shade.state_ticks_left=120; stunned.push(shade.id); game.score+= shade.state==="drain"?15:5; }
    }
    events.push({type:"event",tick:game.sim_tick,name:"pulse",data:{stunned_ids:stunned}});
  }

  for (const shade of game.shades) {
    if (shade.state==="stunned" || shade.state==="recoil") continue;
    let target=null;
    let min=Infinity;
    for (const l of game.lanterns) if (l.lit && l.fuel<30 && distXZ(shade.pos,l.pos)<min) { min=distXZ(shade.pos,l.pos);target=l; }
    if (target && min<=12) shade.state="drain";
    else shade.state="chase";
  }

  for (const shade of [...game.shades]) {
    if (shade.state==="stunned") continue;
    let target=game.player.pos;
    if (shade.state==="drain") {
      target=game.lanterns.filter(l=>l.lit&&l.fuel<30).sort((a,b)=>distXZ(shade.pos,a.pos)-distXZ(shade.pos,b.pos))[0]?.pos || target;
    }
    const dx=target[0]-shade.pos[0], dz=target[2]-shade.pos[2]; const d=Math.hypot(dx,dz);
    if (d>0.001) { const speed=shade.state==="drain"?3.5:game.night===3?4.5:4; shade.pos[0]+=dx/d*speed/60; shade.pos[2]+=dz/d*speed/60; }
  }

  for (const shade of game.shades) {
    if (shade.state==="stunned") continue;
    if (distXZ(game.player.pos,shade.pos)<=1 && Math.abs(game.player.pos[1]-shade.pos[1])<=1.5 && game.player.invuln_ticks<=0) {
      game.player.flames--; game.player.invuln_ticks=90;
      const dropped=Math.floor(game.player.carried/2); game.player.carried-=dropped;
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

  game.time_left_s=Math.max(0,game.duration-game.sim_tick/60);
  if (game.player.flames<=0) { game.state="lost";game.endReason="no_flames";events.push({type:"event",tick:game.sim_tick,name:"game_over",data:{result:"lost",reason:"no_flames"}}); }
  else if (game.lanterns.every(l=>l.lit && l.fuel>0) && game.time_left_s>=0) { game.state="won";game.endReason="all_lit";events.push({type:"event",tick:game.sim_tick,name:"game_over",data:{result:"won",reason:"all_lit"}}); }
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
