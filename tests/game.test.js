import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {createGame,applyScenario,stepGame,snapshot} from "../src/game-core.js";

test("contract v1.3 exists and matches standard tuning",()=>{
  const contract=JSON.parse(fs.readFileSync("game.contract.json","utf8"));
  assert.equal(contract.contract_version,"1.3");
  assert.equal(contract.tuning.player_speed,6);
  assert.equal(contract.tuning.carry_capacity,10);
  assert.equal(contract.tuning.lantern_count_night1,5);
});

test("scenario replaces motes and lantern positions deterministically",()=>{
  const a=createGame({seed:42,night:1}); applyScenario(a,{motes:[[0,0,5]],random_motes:false,lanterns:[{id:"L1",pos:[1,0,1],lit:true,fuel:80}],time_left_s:300});
  const b=createGame({seed:42,night:1}); applyScenario(b,{motes:[[0,0,5]],random_motes:false,lanterns:[{id:"L1",pos:[1,0,1],lit:true,fuel:80}],time_left_s:300});
  assert.deepEqual(snapshot(a),snapshot(b));
  assert.equal(a.motes.length,1); assert.equal(a.lanterns[0].pos[0],1);
});

test("interaction deposits mote and lantern lights at 10",()=>{
  const game=createGame({seed:1,night:1}); applyScenario(game,{random_motes:false,random_shades:false,motes:[],lanterns:[{id:"L1",pos:[0,0,1],lit:false}]});
  game.player.carried=10;
  const events=stepGame(game,{interact:true});
  assert.equal(game.lanterns[0].lit,true);
  assert.ok(events.some(e=>e.name==="lantern_lit"));
});

test("mote pickup follows 1m radius and carry capacity",()=>{
  const game=createGame({seed:1,night:1}); applyScenario(game,{random_motes:false,random_shades:false,motes:[[0,0,.5]],lanterns:[{id:"L1",pos:[30,0,30]}]});
  stepGame(game,{});
  assert.equal(game.player.carried,1);
  stepGame(game,{});
  assert.equal(game.player.carried,1);
});

test("low-fuel lantern goes out and emits lantern_out",()=>{
  const game=createGame({seed:1,night:1}); applyScenario(game,{lanterns:[{id:"L1",lit:true,fuel:1}],random_motes:false,random_shades:false});
  const events=stepGame(game,{});
  assert.equal(game.lanterns[0].lit,false);
  assert.ok(events.some(e=>e.name==="lantern_out"));
});
