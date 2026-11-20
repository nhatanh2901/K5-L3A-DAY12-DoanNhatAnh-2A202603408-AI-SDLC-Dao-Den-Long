import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,applyScenario,stepGame,snapshot,TUNING,groundAt} from '../src/game-core.js';
import {rankEntries} from '../src/ranking.js';
const quiet=(night=1)=>{const g=createGame({seed:42,night});applyScenario(g,{random_motes:false,random_shades:false,wind_enabled:false,motes:[]});return g;};
const ticks=(g,n,input={})=>{const events=[];for(let i=0;i<n;i++)events.push(...stepGame(g,input));return events;};

test('fuel decays one unit in 60 ticks, not one unit per tick',()=>{
  const g=quiet();applyScenario(g,{lanterns:[{id:'L1',lit:true,fuel:100}]});ticks(g,60);assert.ok(Math.abs(g.lanterns[0].fuel-99)<1e-8);
});
test('draining shade adds five units per second to decay',()=>{
  const g=quiet();applyScenario(g,{lanterns:[{id:'L1',pos:[5,0,0],lit:true,fuel:20}],shades:[{id:'S1',pos:[5,0,0],state:'drain'}]});ticks(g,60);assert.ok(Math.abs(g.lanterns[0].fuel-14)<1e-8);
});
test('all lit before dawn does not finish; all lit at dawn wins exactly once',()=>{
  const g=quiet();applyScenario(g,{time_left_s:1,lanterns:g.lanterns.map(l=>({id:l.id,lit:true,fuel:100}))});
  ticks(g,30);assert.equal(g.state,'playing');ticks(g,30);assert.equal(g.state,'won');assert.equal(g.time_left_s,0);const score=g.score;assert.deepEqual(stepGame(g,{}),[]);assert.equal(g.score,score);
});
test('dawn with unlit lantern loses and scenario countdown is honored',()=>{
  const g=quiet();applyScenario(g,{time_left_s:1/60});stepGame(g,{});assert.equal(g.state,'lost');assert.equal(g.endReason,'dawn');
});
test('refuel consumes only needed motes; relighting costs five',()=>{
  const g=quiet();applyScenario(g,{player:{carried:10},lanterns:[{id:'L1',pos:[0,0,1],lit:true,fuel:85}]});stepGame(g,{interact:true});assert.equal(g.player.carried,8);assert.equal(g.lanterns[0].fuel,100);assert.equal(g.score,10);
  applyScenario(g,{lanterns:[{id:'L1',lit:false,fuel:0,deposited:0}]});stepGame(g,{interact:true});assert.equal(g.player.carried,3);assert.equal(g.lanterns[0].lit,true);
});
test('pickup has no deposit score; capacity and radius prevent extra pickup',()=>{
  const g=quiet();applyScenario(g,{player:{carried:9},motes:[[0,0,.5],[0,0,.6],[0,0,2]]});stepGame(g,{});assert.equal(g.player.carried,10);assert.equal(g.motes.length,2);assert.equal(g.score,0);
});
test('pause freezes time, fuel and movement until toggled again',()=>{
  const g=quiet();stepGame(g,{pause:true});const before=snapshot(g);ticks(g,60,{move:[1,0]});assert.deepEqual(snapshot(g),before);stepGame(g,{pause:true});assert.equal(g.sim_tick,1);
});
test('dash has duration and cooldown; diagonal movement is normalized',()=>{
  const g=quiet();stepGame(g,{move:[1,0],dash:true});ticks(g,11,{move:[1,0]});assert.ok(Math.abs(g.player.pos[0]-2.8)<1e-8);const cd=g.player.dash_cd_ticks;stepGame(g,{move:[1,0],dash:true});assert.equal(g.player.dash_cd_ticks,cd-1);
  const a=quiet();ticks(a,60,{move:[1,1]});assert.ok(Math.abs(Math.hypot(a.player.pos[0],a.player.pos[2])-TUNING.player_speed)<1e-8);
});
test('pulse pushes, stuns for two seconds, and gives draining-shade bonus',()=>{
  const g=quiet();applyScenario(g,{player:{carried:3},shades:[{id:'S1',pos:[2,0,0],state:'drain'}]});stepGame(g,{pulse:true});assert.equal(g.shades[0].state,'stunned');assert.equal(g.shades[0].pos[0],6);assert.equal(g.score,15);ticks(g,119);assert.equal(g.shades[0].state,'stunned');stepGame(g,{});assert.notEqual(g.shades[0].state,'stunned');
});
test('seed controls automatic mote and shade spawns on each night',()=>{
  for(const night of [1,2,3]){const a=createGame({seed:7,night}),b=createGame({seed:7,night});ticks(a,960);ticks(b,960);assert.deepEqual(snapshot(a),snapshot(b));assert.ok(a.shades.length>0);assert.ok(a.motes.length>40);}
});
test('bridge and terraces have physical surfaces; falling costs a flame',()=>{
  assert.equal(groundAt(2,[35,0,0]),0);assert.equal(groundAt(2,[35,0,10]),-Infinity);assert.equal(groundAt(3,[0,6,6]),6);
  const g=quiet();applyScenario(g,{player:{pos:[50,-9,0],carried:8}});stepGame(g,{});assert.equal(g.player.flames,2);assert.deepEqual(g.player.pos,[0,0,0]);assert.equal(g.player.carried,4);
});
test('hits honor invulnerability and drop motes with TTL',()=>{
  const g=quiet();applyScenario(g,{player:{carried:8},shades:[{id:'S1',pos:[0,0,0]}]});stepGame(g,{});assert.equal(g.player.flames,2);assert.equal(g.player.carried,4);assert.equal(g.motes.length,4);ticks(g,10);assert.equal(g.player.flames,2);
});
test('leaderboard validates, sorts ties by timestamp, and limits ten entries',()=>{
  const entries=Array.from({length:12},(_,i)=>({name:`May${i}`,score:i,nights_won:1,seed:42,achieved_at:'2026-11-20T00:00:00Z'}));assert.equal(rankEntries(entries).length,10);assert.equal(rankEntries(entries)[0].score,11);
  const a={...entries[0],score:10,achieved_at:'2026-11-20T01:00:00Z'},b={...entries[1],score:10};assert.equal(rankEntries([a,b])[0].name,b.name);assert.throws(()=>rankEntries([{...a,name:'<img>'}]));assert.throws(()=>rankEntries([{...a,score:NaN}]));
});
test('wind charm blocks displacement and drifter theft; drifters can be stunned',()=>{
  const g=quiet(2);g.wind_enabled=true;g.sim_tick=899;
  applyScenario(g,{charms:[{id:'C1',pos:[0,0,0],available:true,respawn_s:0}],player:{carried:8},drifters:[{id:'D1',pos:[0,0,0],state:'chase',stolen:0,state_ticks_left:0}]});
  stepGame(g,{});assert.equal(g.wind.active,true);assert.ok(g.player.charm_ticks>0);assert.equal(g.player.carried,8);
  const pos=[...g.player.pos];stepGame(g,{});assert.deepEqual(g.player.pos,pos);
  g.player.charm_ticks=0;stepGame(g,{});assert.equal(g.player.carried,6);assert.equal(g.drifters[0].stolen,2);
  stepGame(g,{pulse:true});assert.equal(g.player.carried,3);assert.equal(g.drifters[0].state,'stunned');
});
