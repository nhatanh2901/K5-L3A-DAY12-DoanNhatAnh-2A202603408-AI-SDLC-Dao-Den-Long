import './style.css';
import {createGame,stepGame,TUNING,applyScenario,snapshot} from './game-core.js';
import {createScene} from './scene.js';
import {rankEntries} from './ranking.js';

document.querySelector('#app').innerHTML=`
  <canvas id="game" aria-label="Đảo Đèn Lồng, trò chơi 3D"></canvas>
  <header id="hud" aria-live="off"><strong>ĐẢO ĐÈN LỒNG <span id="night"></span></strong><div id="stats"></div><button id="pause">Tạm dừng</button></header>
  <aside id="fuel" aria-label="Nhiên liệu đèn"></aside>
  <div id="hint">WASD · Di chuyển &nbsp; J · Nhảy &nbsp; Shift · Lướt &nbsp; E · Nạp đèn &nbsp; Space · Tỏa sáng &nbsp; P / Esc · Tạm dừng</div>
  <section id="menu"><div class="card"><p class="eyebrow">MỘT ĐÊM TRÊN ĐẢO</p><h1>Giữ lửa<br>đến bình minh.</h1><p id="message">Gom đom đóm vàng, đến gần đèn rồi nhấn E để thắp và châm dầu. Giữ tất cả đèn sáng khi hết giờ. Tỏa sáng đẩy lùi Bóng Mực, tốn 3 đom đóm.</p>
  <div class="settings"><label>Tên người chơi <input id="name" value="May" minlength="3" maxlength="12" pattern="[A-Za-z0-9_]{3,12}"></label><label>Seed <input id="seed" type="number" value="42" min="0" step="1"></label><label><input id="motion" type="checkbox"> Giảm chuyển động</label><label><input id="sound" type="checkbox" checked> Âm thanh</label></div>
  <button id="start" class="primary">Bắt đầu Đêm 1</button><button id="resume" hidden>Tiếp tục</button>
  <details><summary>Bảng xếp hạng trên máy này</summary><ol id="leaderboard"></ol><button id="export">Xuất JSON</button></details><p class="small">Đêm 2: hai đảo nối bằng cầu · Đêm 3: nhảy lên các tầng đá. Rơi khỏi đảo sẽ mất một ngọn lửa.</p></div></section>
  <div id="notice" role="status"></div>`;
const $=s=>document.querySelector(s);
let game=createGame({seed:42,night:1}),totalScore=0,nightsWon=0,running=false,seed=42,playerName='May';
let view;
try {view=createScene($('#game'));} catch(e) {$('#message').textContent=`Không khởi tạo được WebGL: ${e.message}`;$('#start').disabled=true;throw e;}
let board=[];try {board=rankEntries(JSON.parse(localStorage.getItem('lantern-board')||'[]'));} catch {board=[];}
function showBoard() {$('#leaderboard').replaceChildren(...board.map(e=>{const li=document.createElement('li');li.textContent=`${e.name} · ${e.score} điểm · ${e.nights_won}/3 đêm`;return li;}));}
showBoard();
let audio;
function tone(frequency) {
  if(!$('#sound').checked) return;
  try {audio ||= new AudioContext();void audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=frequency;g.gain.setValueAtTime(.04,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.16);} catch { /* audio is optional */ }
}
const keys=new Set(),pressed=new Set();
function clearKeys(){keys.clear();pressed.clear();}
function notice(text){$('#notice').textContent=text;}
function pause(){if(!running||game.state!=='playing')return;stepGame(game,{pause:true});clearKeys();$('#menu').hidden=!game.paused;$('#resume').hidden=!game.paused;$('#start').hidden=game.paused;$('#message').textContent='Đã tạm dừng. Thời gian và nhiên liệu được giữ nguyên.';}
addEventListener('keydown',e=>{
  if(e.target instanceof HTMLInputElement)return;
  const k=e.key.toLowerCase();if([' ','arrowup','arrowdown'].includes(k))e.preventDefault();
  if(!e.repeat){pressed.add(k);if(k==='escape'||k==='p')pause();}keys.add(k);
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>{if(running&&!game.paused)pause();clearKeys();});
$('#pause').onclick=pause;
$('#resume').onclick=()=>{if(game.paused)pause();};
function nextNight(){game=createGame({seed,night:nightsWon+1});running=true;$('#menu').hidden=true;$('#resume').hidden=true;$('#start').hidden=false;clearKeys();notice(`Đêm ${game.night}: giữ tất cả đèn sáng đến bình minh.`);}
$('#start').onclick=()=>{
  if(game.state==='won'&&nightsWon<3){nextNight();return;}
  playerName=$('#name').value;seed=Number($('#seed').value);
  if(!/^[A-Za-z0-9_]{3,12}$/.test(playerName)||!Number.isSafeInteger(seed)||seed<0){notice('Tên 3–12 ký tự A–Z, số hoặc _. Seed phải là số nguyên không âm.');return;}
  nightsWon=0;totalScore=0;nextNight();tone(440);
};
$('#export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({entries:board},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='leaderboard.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
function finish(){
  running=false;totalScore+=game.score;if(game.state==='won')nightsWon++;
  $('#menu').hidden=false;$('#start').hidden=false;$('#resume').hidden=true;
  $('#message').textContent=game.state==='won'?`Bình minh! Bạn đã giữ lửa qua ${nightsWon}/3 đêm. Tổng điểm: ${totalScore}.`:`Đêm ${game.night} kết thúc: ${game.endReason==='no_flames'?'hết ngọn lửa':'còn đèn tắt khi bình minh'}. Tổng điểm: ${totalScore}.`;
  $('#start').textContent=game.state==='won'&&nightsWon<3?`Sang Đêm ${nightsWon+1}`:'Chơi lại từ Đêm 1';
  if(game.state==='lost'||nightsWon===3){
    board=rankEntries([...board,{name:playerName,score:totalScore,nights_won:nightsWon,achieved_at:new Date().toISOString(),seed}]);
    try{localStorage.setItem('lantern-board',JSON.stringify(board));}catch{notice('Không lưu được bảng xếp hạng: bộ nhớ trình duyệt bị chặn.');}showBoard();
  }
}
let accumulator=0,previous=performance.now();
function animate(now){
  requestAnimationFrame(animate);
  accumulator+=Math.min((now-previous)/1000,.1);previous=now;
  while(accumulator>=1/60){
    if(running&&!game.paused){
      const events=stepGame(game,{move:[Number(keys.has('d'))-Number(keys.has('a')),Number(keys.has('s'))-Number(keys.has('w'))],jump:pressed.has('j'),dash:pressed.has('shift'),interact:pressed.has('e'),pulse:pressed.has(' ')});
      for(const e of events){if(e.name==='lantern_lit'||e.name==='refuel'){tone(660);notice('Đèn đã được nạp dầu.');}if(e.name==='player_hit'){tone(150);notice('Bạn mất một ngọn lửa!');}if(e.name==='lantern_out')notice(`${e.data.lantern_id} đã tắt!`);}
      if(game.state!=='playing')finish();
    }
    pressed.clear();accumulator-=1/60;
  }
  const seconds=Math.ceil(game.time_left_s);
  $('#night').textContent=`/ ĐÊM ${game.night}`;
  $('#stats').textContent=`${'♥'.repeat(Math.max(0,game.player.flames))} · ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} · Đom đóm ${game.player.carried}/${TUNING.carry_capacity} · Điểm ${totalScore+ (running?game.score:0)}`;
  $('#fuel').replaceChildren(...game.lanterns.map(l=>{const label=document.createElement('label');label.className=l.lit?'lit':'';label.textContent=`${l.id} ${l.lit?Math.ceil(l.fuel)+'%':l.deposited+'/'+(l.ever_lit?5:10)}`;const meter=document.createElement('meter');meter.min=0;meter.max=100;meter.value=l.fuel;label.append(meter);return label;}));
  view.sync(game,{elapsed:$('#motion').checked?0:now/1000});
}
requestAnimationFrame(animate);
addEventListener('resize',()=>view.resize(innerWidth,innerHeight));

// Browser verification uses the same running UI, guarded out of production access.
export const qa={
  read(){if(!import.meta.env.DEV)throw new Error('Development only');return {...snapshot(game),paused:game.paused,running,nightsWon,meshes:view.renderer.info.render.calls};},
  scenario(data){if(!import.meta.env.DEV)throw new Error('Development only');applyScenario(game,data);}
};
