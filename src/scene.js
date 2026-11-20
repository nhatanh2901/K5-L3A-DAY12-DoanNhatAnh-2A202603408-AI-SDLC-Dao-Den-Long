import * as THREE from 'three';
import {surfaces} from './game-core.js';

export function createScene(canvas,{width=innerWidth,height=innerHeight,pixelRatio=Math.min(devicePixelRatio,2),reducedMotion=false}={}) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(width,height);renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x10152f);
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x161932,.012);
  scene.add(new THREE.HemisphereLight(0xffe9c2,0x284a59,2));
  const moon=new THREE.DirectionalLight(0x99baff,2);moon.position.set(-20,35,10);scene.add(moon);
  const camera=new THREE.PerspectiveCamera(55,width/height,.1,400);
  const world=new THREE.Group();scene.add(world);
  const geometry={mote:new THREE.SphereGeometry(.22,8,6),shade:new THREE.IcosahedronGeometry(.85,1),lantern:new THREE.CylinderGeometry(.6,.85,1.8,12),charm:new THREE.OctahedronGeometry(.65),drifter:new THREE.ConeGeometry(.65,1.5,8)};
  const material={mote:new THREE.MeshBasicMaterial({color:0xffed8c}),shade:new THREE.MeshStandardMaterial({color:0x703e8b,emissive:0x241137}),lantern:new THREE.MeshStandardMaterial({color:0xffc05d}),charm:new THREE.MeshBasicMaterial({color:0x68efd4}),drifter:new THREE.MeshStandardMaterial({color:0x89c4db})};
  const player=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.45,.9,5,10),new THREE.MeshStandardMaterial({color:0xeee5ce}));body.position.y=.95;player.add(body);
  const hat=new THREE.Mesh(new THREE.ConeGeometry(.85,.6,12),new THREE.MeshStandardMaterial({color:0xcf634f}));hat.position.y=1.95;player.add(hat);
  const lamp=new THREE.PointLight(0xffd58c,12,10);lamp.position.set(.6,1,0);player.add(lamp);scene.add(player);
  let night=0;const entities=new Map();
  function reset(nextNight) {
    for(const mesh of [...world.children]) {world.remove(mesh);if(mesh.userData.surface){mesh.geometry.dispose();mesh.material.dispose();}else if(mesh.geometry===geometry.lantern)mesh.material.dispose();}
    entities.clear();night=nextNight;
    for(const s of surfaces(night)) {
      const geo=s.radius?new THREE.CylinderGeometry(s.radius,s.radius*.94,3,64):new THREE.BoxGeometry(s.width,3,s.depth);
      const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:s.y>0?0x42756e:0x315e56,roughness:.9}));
      mesh.position.set(s.x,s.y-1.5,s.z);mesh.userData.surface=true;world.add(mesh);
    }
  }
  function sync(game,{orbit=false,elapsed=0}={}) {
    if(night!==game.night) reset(game.night);
    const alive=new Set();
    function entity(kind,data) {
      const key=`${kind}:${data.id}`;alive.add(key);
      let mesh=entities.get(key);
      if(!mesh) {mesh=new THREE.Mesh(geometry[kind],kind==='lantern'?material[kind].clone():material[kind]);entities.set(key,mesh);world.add(mesh);}
      mesh.position.set(data.pos[0],data.pos[1]+(kind==='mote'?.6:kind==='lantern'?1.1:.9),data.pos[2]);
      if(!reducedMotion&&kind==='mote') mesh.position.y+=Math.sin(elapsed*2+data.pos[0])*.15;
      if(kind==='lantern') {mesh.material.color.set(data.lit?(data.fuel<30?0xff6f60:0xffcf73):0x647478);mesh.material.emissive.set(data.lit?0xb96019:0);}
      mesh.visible=kind!=='charm'||data.available;
    }
    for(const kind of ['mote','lantern','shade','drifter','charm']) for(const data of game[`${kind}s`]) entity(kind,data);
    for(const [key,mesh] of entities) if(!alive.has(key)) {world.remove(mesh);if(key.startsWith('lantern:'))mesh.material.dispose();entities.delete(key);}
    player.position.set(...game.player.pos);
    const angle=orbit?elapsed*.15:0;
    camera.position.set(game.player.pos[0]+Math.sin(angle)*20,game.player.pos[1]+19,game.player.pos[2]+Math.cos(angle)*20);
    camera.lookAt(game.player.pos[0],game.player.pos[1],game.player.pos[2]);
    renderer.render(scene,camera);
  }
  function resize(w,h) {renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
  function dispose() {for(const g of Object.values(geometry))g.dispose();for(const m of Object.values(material))m.dispose();renderer.dispose();}
  return {renderer,scene,camera,sync,resize,dispose};
}
