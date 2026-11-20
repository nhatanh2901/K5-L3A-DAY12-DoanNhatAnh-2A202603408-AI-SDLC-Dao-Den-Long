// Explicit release command. Credentials stay in memory and are never logged or saved.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const repo='nhatanh2901/K5-L3A-DAY12-DoanNhatAnh-2A202603408-AI-SDLC-Dao-Den-Long';
function git(args,{capture=false,input}={}){
  const r=spawnSync('git',args,{encoding:'utf8',input,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'},timeout:120000});
  if(r.status!==0)throw new Error(capture?'Git credential lookup failed':(r.stderr||'Git command failed'));
  if(!capture&&r.stdout)process.stdout.write(r.stdout);return r.stdout.trim();
}
const proof=JSON.parse(fs.readFileSync('docs/proof/verification.json','utf8'));
if(!proof.browser_checks||proof.results.some(r=>r.exit_code!==0))throw new Error('Full verification must pass before publication');
for(const [file,expected]of Object.entries(proof.source_sha256)){
  const actual=createHash('sha256').update(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')).digest('hex');
  if(actual!==expected)throw new Error(`Source changed since verification: ${file}`);
}
const assets=[['artifacts/dao-den-long-v1.0.0.zip','application/zip'],['docs/demo/demo.mp4','video/mp4']];
for(const [file]of assets)if(!fs.existsSync(file))throw new Error(`Missing ${file}`);
const credential=git(['credential','fill'],{capture:true,input:'protocol=https\nhost=github.com\n\n'});
const secret=credential.split(/\r?\n/).find(l=>l.startsWith('password='))?.slice(9);
if(!secret)throw new Error('No existing GitHub credential is available; sign in to GitHub before publishing');
const headers={'Authorization':`Bearer ${secret}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'dao-den-long-release'};
async function request(url,options={}){const r=await fetch(url,{...options,headers:{...headers,...options.headers}});if(!r.ok)throw new Error(`GitHub request failed: HTTP ${r.status}`);return r.json();}
const api=`https://api.github.com/repos/${repo}`;
// Refuse replacing an existing release/tag: this script never rewrites history.
const existing=await fetch(`${api}/releases/tags/v1.0.0`,{headers});
if(existing.status!==404)throw new Error('v1.0.0 already exists or could not be checked; inspect before retry');
const remoteTags=git(['ls-remote','--tags','origin','refs/tags/v1.0.0']);if(remoteTags)throw new Error('Remote v1.0.0 tag already exists');
git(['add','--','.gitattributes','.github','.gitignore','AGENTS.md','README.md','CHANGELOG.md','CREDITS.md','package.json','vite.config.js','bench.html','src','scripts','tests','scenarios','docs']);
git(['commit','-m','Complete game mechanics and reproducible lab verification']);
const sha=git(['rev-parse','HEAD'],{capture:true});
git(['tag','v1.0.0']);git(['push','--atomic','origin','HEAD:main','refs/tags/v1.0.0']);
const release=await request(`${api}/releases`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tag_name:'v1.0.0',target_commitish:sha,name:'Đảo Đèn Lồng v1.0.0',body:fs.readFileSync('docs/release-notes.md','utf8'),draft:true,prerelease:false})});
for(const [file,type]of assets){const name=file.split('/').at(-1);await request(`${release.upload_url.split('{')[0]}?name=${encodeURIComponent(name)}`,{method:'POST',headers:{'Content-Type':type},body:fs.readFileSync(file)});}
const published=await request(`${api}/releases/${release.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:false})});
console.log(`Published ${published.html_url}`);
