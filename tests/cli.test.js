import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const run=args=>spawnSync(process.execPath,['src/headless.js',...args],{encoding:'utf8'});
test('headless rejects invalid counts, nights, flags and scenarios',()=>{
  for(const args of [['--night','4'],['--ticks','NaN'],['--snapshot-every','0'],['--seed','-1'],['--unknown','1']])assert.equal(run(args).status,2);
});
test('headless dawn scenario emits one terminal event at the requested time',()=>{
  const r=run(['--scenario','scenarios/dawn-win.json','--ticks','100']);assert.equal(r.status,0,r.stderr);
  const lines=r.stdout.trim().split('\n').map(JSON.parse);assert.equal(lines.at(-1).state,'won');assert.equal(lines.at(-1).ticks,60);assert.equal(lines.filter(e=>e.name==='game_over').length,1);
});
test('headless exports actual ranked entries from source file',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lantern-test-'));
  const input=path.join(dir,'board.json'),out=path.join(dir,'export.json');
  const entry={name:'May',score:10,nights_won:1,seed:42,achieved_at:'2026-11-20T00:00:00Z'};
  try{fs.writeFileSync(input,JSON.stringify({entries:[entry]}));const r=run(['--leaderboard',input,'--export-leaderboard',out]);assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(fs.readFileSync(out,'utf8')).entries,[entry]);}
  finally{fs.rmSync(input,{force:true});fs.rmSync(out,{force:true});fs.rmdirSync(dir);}
});
