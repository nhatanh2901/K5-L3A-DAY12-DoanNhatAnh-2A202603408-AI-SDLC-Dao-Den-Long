import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import fs from "node:fs";

test("two identical headless runs are byte-identical",()=>{
  fs.rmSync("tmp-a.jsonl",{force:true}); fs.rmSync("tmp-b.jsonl",{force:true});
  const run=(name)=>spawnSync(process.execPath,["src/headless.js","--seed","42","--night","1","--ticks","600","--out",name],{encoding:"utf8"});
  assert.equal(run("tmp-a.jsonl").status,0);
  assert.equal(run("tmp-b.jsonl").status,0);
  assert.equal(fs.readFileSync("tmp-a.jsonl","utf8"),fs.readFileSync("tmp-b.jsonl","utf8"));
  fs.rmSync("tmp-a.jsonl",{force:true}); fs.rmSync("tmp-b.jsonl",{force:true});
});

test("invalid scenario exits with code 2",()=>{
  fs.writeFileSync("tmp-invalid.json","{");
  const r=spawnSync(process.execPath,["src/headless.js","--seed","1","--night","1","--ticks","10","--scenario","tmp-invalid.json","--out","tmp-out.jsonl"],{encoding:"utf8"});
  assert.equal(r.status,2);
  fs.rmSync("tmp-invalid.json",{force:true}); fs.rmSync("tmp-out.jsonl",{force:true});
});
