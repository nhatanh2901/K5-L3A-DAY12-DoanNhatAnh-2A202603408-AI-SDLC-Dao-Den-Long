import {qa} from './main.js';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
export async function check(){
  const checks=[];
  const assert=(condition,label)=>{if(!condition)throw new Error(label);checks.push(label);};
  assert(document.querySelector('#menu')&&!document.querySelector('#menu').hidden,'Start menu visible');
  document.querySelector('#name').value='<bad>';
  document.querySelector('#start').click();
  assert(!qa.read().running,'Invalid name blocks start');
  document.querySelector('#name').value='Tester';document.querySelector('#start').click();await wait(300);
  assert(qa.read().running&&document.querySelector('#menu').hidden,'Start enters playable Night 1');
  assert(qa.read().meshes>20,'WebGL renders motes, lanterns and terrain');
  const key=(type,key)=>dispatchEvent(new KeyboardEvent(type,{key,bubbles:true}));
  key('keydown','p');await wait(100);const paused=qa.read();await wait(200);
  assert(paused.paused&&qa.read().sim_tick===paused.sim_tick,'Pause freezes simulation ticks');
  document.querySelector('#resume').click();await wait(100);assert(!qa.read().paused,'Resume unpauses');
  const x=qa.read().player.pos[0];key('keydown','d');key('keydown','Shift');await wait(250);key('keyup','d');key('keyup','Shift');
  assert(qa.read().player.pos[0]>x+1.2&&qa.read().player.dash_cd_s>0,'Keyboard movement and dash reach engine');
  const y=qa.read().player.pos[1];key('keydown','j');await wait(100);key('keyup','j');assert(qa.read().player.pos[1]>y,'Jump is independent from forward movement');
  for(let night=1;night<=3;night++){
    const data=qa.read();
    qa.scenario({time_left_s:.05,random_shades:false,random_motes:false,shades:[],player:{pos:[0,0,0],vel:[0,0,0]},lanterns:data.lanterns.map(l=>({id:l.id,lit:true,fuel:100}))});
    await wait(150);
    assert(qa.read().state==='won'&&qa.read().nightsWon===night,`Dawn win and campaign count Night ${night}`);
    if(night<3){document.querySelector('#start').click();await wait(100);assert(qa.read().night===night+1,`Continue creates Night ${night+1}`);}
  }
  assert(JSON.parse(localStorage.getItem('lantern-board')).some(e=>e.name==='Tester'&&e.nights_won===3),'Campaign result persists in local leaderboard');
  document.querySelector('#start').click();await wait(100);
  qa.scenario({player:{flames:0}});await wait(100);
  assert(qa.read().state==='lost'&&!qa.read().running,'Loss stops play and offers restart');
  document.querySelector('#start').click();await wait(100);
  assert(qa.read().night===1&&qa.read().player.flames===3,'Restart resets campaign');
  document.querySelector('#motion').checked=true;
  return {passed:checks.length,checks,scope:'Real UI in headless Chromium; accelerated dawn uses explicit scenario fixtures, not a normal-length playthrough'};
}
