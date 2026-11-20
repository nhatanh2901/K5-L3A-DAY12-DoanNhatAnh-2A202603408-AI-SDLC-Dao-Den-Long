import * as THREE from "three";
import "./style.css";
import {createGame, applyScenario, stepGame, snapshot} from "./game-core.js";

document.querySelector("#app").innerHTML = `
  <canvas id="game"></canvas>
  <div id="hud">
    <div id="flames">Ngọn lửa: 3</div><div id="time">05:00</div><div id="lanterns">Đèn: 0/5</div>
  </div>
  <div id="menu">
    <h1>Đảo Đèn Lồng</h1>
    <p>Thu thập đom đóm, thắp đèn và né Bóng Mực.</p>
    <button id="start">Bắt đầu Đêm 1</button>
  </div>`;

const canvas=document.querySelector("#game");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setClearColor(0x0e1430);
const scene=new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffe9b0,0x1b2350,1.3));
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,500);
camera.position.set(0,10,18);
const island=new THREE.Mesh(new THREE.CylinderGeometry(40,40,2,64),new THREE.MeshStandardMaterial({color:0x2f5d50}));
island.position.y=-1; scene.add(island);
const player=new THREE.Mesh(new THREE.CapsuleGeometry(.7,1.4,6,12),new THREE.MeshStandardMaterial({color:0xe8e2d0}));
scene.add(player);

let game=createGame({seed:42,night:1});
const lanternMeshes=[];
for(const lantern of game.lanterns){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.8,1.1,2.5,16),new THREE.MeshStandardMaterial({color:0x5b5f6e}));
  mesh.position.set(...lantern.pos); scene.add(mesh); lanternMeshes.push({mesh,lantern});
}
const shadeMeshes=[];
for(let i=0;i<4;i++){
  const shade=new THREE.Mesh(new THREE.SphereGeometry(.8,16,12),new THREE.MeshStandardMaterial({color:0x120a1a}));
  shade.position.set(25*Math.cos(i*Math.PI/2),.8,25*Math.sin(i*Math.PI/2)); scene.add(shade); shadeMeshes.push(shade);
}

const keys={};
addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(e.key==="Escape")togglePause();});
addEventListener("keyup",e=>{keys[e.key.toLowerCase()]=false});
let paused=false, running=false, previousPulse=false, previousInteract=false, previousJump=false;
function togglePause(){paused=!paused;document.querySelector("#menu").style.display=paused?"grid":"none";}
document.querySelector("#start").addEventListener("click",()=>{running=true;document.querySelector("#menu").style.display="none";});

function animate(){
  requestAnimationFrame(animate);
  if(running&&!paused){
    let mx=(keys.d?1:0)-(keys.a?1:0), mz=(keys.w?1:0)-(keys.s?1:0);
    const interact=!!keys.e&&!previousInteract, pulse=!!keys[" "]&&!previousPulse, jump=!!keys.w&&!previousJump;
    const events=stepGame(game,{move:[mx,mz],cam_yaw_deg:0,interact,pulse,jump});
    previousInteract=!!keys.e;previousPulse=!!keys[" "];previousJump=!!keys.w;
    player.position.set(...game.player.pos);
    camera.position.set(game.player.pos[0],10,game.player.pos[2]+18); camera.lookAt(...game.player.pos);
    lanternMeshes.forEach(({mesh,lantern})=>{
      mesh.material.color.set(lantern.lit?(lantern.fuel<30?"#ff5a5f":"#ffb347"):"#5b5f6e");
    });
    shadeMeshes.forEach((mesh,i)=>{
      const shade=game.shades[i]; if(shade) mesh.position.set(...shade.pos);
    });
    const total=game.lanterns.length, lit=game.lanterns.filter(l=>l.lit).length;
    document.querySelector("#flames").textContent=`Ngọn lửa: ${game.player.flames}`;
    document.querySelector("#lanterns").textContent=`Đèn: ${lit}/${total}`;
    const s=Math.max(0,Math.ceil(game.time_left_s));document.querySelector("#time").textContent=`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  }
  renderer.render(scene,camera);
}
animate();
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
