import {buildEnvironment,portalTexture} from './lab-environment.js';
export function entity(tag,attributes,parent){const el=document.createElement(tag);for(const [key,value] of Object.entries(attributes))el.setAttribute(key,value);parent.append(el);return el;}
export const stationX=n=>n*10;
export class Laboratory {
  constructor(scene,dispatch,config){this.scene=scene;this.config=config;this.dispatch=dispatch;this.build();}
  build(){
    const s=this.scene;
    buildEnvironment(s);
    for(let n=0;n<3;n++){
      const x=stationX(n);
      entity('a-cylinder',{position:`${x} .035 4`,radius:1,height:.05,color:'#193a4a',segments:32},s);
      const pad=entity('a-ring',{position:`${x} .07 4`,rotation:'-90 0 0','radius-inner':.8,'radius-outer':.86,color:'#45dcc7',material:'shader: flat',class:'interactive'},s);
      pad.addEventListener('click',()=>this.dispatch('station:'+n));
      const beacon=entity('a-entity',{position:`${x} 5 -7.8`},s);
      this.label(beacon,`0${n+1}`,1.1,.5,'#69d9d0');
      entity('a-box',{position:`${x} .12 -2`,width:7.2,height:.22,depth:.7,color:'#142b3a'},s);
      entity('a-box',{position:`${x} .24 -1.8`,width:6.7,height:.02,depth:.025,color:'#4bd7ca',material:'shader: flat'},s);
    }
    this.laserWorld=entity('a-entity',{position:'4.5 .75 -3.5'},s);
    entity('a-box',{width:3.35,height:.22,depth:3.35,color:'#243c50'},this.laserWorld);
    entity('a-box',{position:'0 -.15 0',width:3.1,height:.13,depth:3.1,color:'#0d1b2b'},this.laserWorld);
    for(const x of [-1.2,1.2])for(const z of [-1.2,1.2])entity('a-box',{position:`${x} -.44 ${z}`,width:.16,height:.65,depth:.16,color:'#304b5e'},this.laserWorld);
    for(const z of [-1.62,1.62])entity('a-box',{position:`0 .04 ${z}`,width:3.15,height:.035,depth:.025,color:'#60dcca',material:'shader: flat'},this.laserWorld);
    this.beams=[];
    for(let y=0;y<5;y++)for(let x=0;x<5;x++){
      entity('a-box',{position:`${(x-2)*.56} .13 ${(y-2)*.56}`,width:.51,height:.04,depth:.51,color:x===4&&y===0?'#237f6c':'#25435a'},this.laserWorld);
    }
    this.config.laser.obstacles.forEach(([x,y])=>entity('a-box',{position:`${(x-2)*.56} .38 ${(y-2)*.56}`,width:.48,height:.5,depth:.48,color:'#53627c'},this.laserWorld));
    this.config.laser.lasers.forEach(([x,y])=>{
      entity('a-cylinder',{position:`${(x-2)*.56} .2 ${(y-2)*.56}`,radius:.11,height:.1,color:'#61384b','segments-radial':12},this.laserWorld);
      this.beams.push(entity('a-cylinder',{position:`${(x-2)*.56} .58 ${(y-2)*.56}`,radius:.025,height:.72,color:'#ff4266',material:'shader: flat'},this.laserWorld));
    });
    this.robot=this.makeRobot(this.laserWorld);this.moveRobot({x:0,y:4,dir:0},false);
    entity('a-box',{position:'14.5 2 -5',width:4.7,height:4,depth:.4,color:'#20364e'},s);
    for(const x of [13.12,15.88]){
      entity('a-box',{position:`${x} 2 -4.65`,width:.2,height:4.25,depth:.45,color:'#496173'},s);
      entity('a-box',{position:`${x} 2.1 -4.4`,width:.035,height:3.3,depth:.025,color:'#7bbff3',material:'shader: flat'},s);
    }
    entity('a-box',{position:'14.5 4.17 -4.65',width:3,height:.25,depth:.55,color:'#3a5266'},s);
    this.door=entity('a-entity',{position:'14.5 1.7 -4.7'},s);this.doorLeaves=[];
    for(const side of [-1,1]){
      const leaf=entity('a-box',{position:`${side*.575} 0 0`,width:1.14,height:3.2,depth:.2,color:'#2c596f',material:'metalness: .25; roughness: .5'},this.door);this.doorLeaves.push(leaf);
      entity('a-box',{position:`${-side*.52} 0 -.01`,width:.025,height:2.8,depth:.24,color:'#7cdfe3',material:'shader: flat'},leaf);
      entity('a-box',{position:'0 0 .12',width:.52,height:.12,depth:.06,color:'#61788d'},leaf);
      entity('a-box',{position:`${14.5+side*1.82} 1.8 -4.43`,width:1.05,height:3.6,depth:.28,color:'#304658'},s);
    }
    this.portalRoot=entity('a-entity',{position:'24.5 2.6 -4'},s);
    entity('a-cylinder',{position:'0 -2.4 0',radius:2.2,height:.3,color:'#293d53','segments-radial':48},this.portalRoot);
    entity('a-cylinder',{position:'0 -2.21 0',radius:1.9,height:.08,color:'#17283c','segments-radial':48},this.portalRoot);
    entity('a-torus',{position:'0 -2.2 0',rotation:'90 0 0',radius:2,'radius-tubular':.025,color:'#84e9dc',material:'shader: flat','segments-radial':4,'segments-tubular':48},this.portalRoot);
    entity('a-torus',{radius:2,'radius-tubular':.18,color:'#435872','segments-radial':8,'segments-tubular':64},this.portalRoot);
    entity('a-torus',{radius:2.12,'radius-tubular':.045,color:'#233c50','segments-radial':4,'segments-tubular':64},this.portalRoot);
    const T=AFRAME.THREE,clamps=new T.InstancedMesh(new T.BoxGeometry(.2,.36,.42),new T.MeshStandardMaterial({color:'#68778f',metalness:.3,roughness:.45}),12),dummy=new T.Object3D();
    for(let j=0;j<12;j++){const angle=j*Math.PI/6;dummy.position.set(Math.cos(angle)*2.04,Math.sin(angle)*2.04,.06);dummy.rotation.z=angle-Math.PI/2;dummy.updateMatrix();clamps.setMatrixAt(j,dummy.matrix);}
    this.portalRoot.setObject3D('clamps',clamps);
    this.portalRings=[];
    for(let n=0;n<3;n++)this.portalRings.push(entity('a-torus',{radius:1.7+n*.1,'radius-tubular':.025,color:n%2?'#a57eff':'#4ce4d3',material:'shader: flat',rotation:`0 0 ${n*30}`},this.portalRoot));
    this.portalSurface=entity('a-circle',{radius:1.67,color:'#6b6b9a',material:'shader: flat; transparent: true; opacity: 0.12; side: double',animation__vortex:'property: rotation; to: 0 0 360; dur: 90000; loop: true; easing: linear'},this.portalRoot);
    const vortex=portalTexture();vortex.id='portal-vortex-texture';vortex.hidden=true;document.body.append(vortex);
    this.portalSurface.setAttribute('material','src','#portal-vortex-texture');
    this.hologram=entity('a-entity',{position:'-4.6 .3 -2.6',animation:'property: position; to: -4.6 .42 -2.6; dir: alternate; dur: 2400; loop: true; easing: easeInOutSine'},s);
    entity('a-cylinder',{radius:.72,height:.2,color:'#2b4358','segments-radial':32},this.hologram);
    entity('a-torus',{position:'0 .12 0',rotation:'90 0 0',radius:.58,'radius-tubular':.025,color:'#63f5d9',material:'shader: flat','segments-radial':4},this.hologram);
    entity('a-cone',{position:'0 .7 0','radius-bottom':.47,'radius-top':.16,height:1.1,color:'#3be8e1',material:'shader: flat; transparent: true; opacity: .045; depthWrite: false'},this.hologram);
    entity('a-sphere',{position:'0 2.1 0',radius:.27,color:'#63f5e9',material:'shader: flat; transparent: true; opacity: .7'},this.hologram);
    entity('a-cone',{position:'0 1.45 0','radius-bottom':.25,'radius-top':.4,height:.8,color:'#4ad6e2',material:'shader: flat; transparent: true; opacity: .35'},this.hologram);
    for(const side of [-1,1])entity('a-box',{position:`${side*.38} 1.47 0`,rotation:`0 0 ${side*18}`,width:.13,height:.61,depth:.17,color:'#5ee9e1',material:'shader: flat; transparent: true; opacity: .38'},this.hologram);
    for(let i=0;i<6;i++)entity('a-torus',{position:`0 ${.9+i*.22} 0`,rotation:'90 0 0',radius:.42,'radius-tubular':.009,color:'#52eada',material:'shader: flat'},this.hologram);
    this.portalRobot=this.makeRobot(s);this.portalRobot.setAttribute('visible',false);
  }
  label(parent,text,w,h,color){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.font='80px LabSans';c.fillStyle=color;c.textAlign='center';c.fillText(text,256,100);const tex=new AFRAME.THREE.CanvasTexture(canvas);tex.colorSpace=AFRAME.THREE.SRGBColorSpace;const mesh=new AFRAME.THREE.Mesh(new AFRAME.THREE.PlaneGeometry(w,h),new AFRAME.THREE.MeshBasicMaterial({map:tex,transparent:true}));const el=entity('a-entity',{},parent);el.setObject3D('mesh',mesh);}
  makeRobot(parent){
    const robot=entity('a-entity',{},parent);
    entity('a-box',{position:'0 .29 0',width:.31,height:.3,depth:.27,color:'#b3c9d5',material:'metalness: .25; roughness: .4'},robot);
    entity('a-box',{position:'0 .31 -.145',width:.21,height:.15,depth:.025,color:'#23384b'},robot);
    entity('a-sphere',{position:'0 .32 -.165',radius:.045,color:'#75f6d6',material:'shader: flat','segments-width':12,'segments-height':8},robot);
    entity('a-box',{position:'0 .49 0',width:.12,height:.1,depth:.12,color:'#536e83'},robot);
    entity('a-box',{position:'0 .63 0',width:.4,height:.25,depth:.32,color:'#d1dfe5',material:'metalness: .2; roughness: .4'},robot);
    entity('a-box',{position:'0 .64 -.169',width:.32,height:.12,depth:.025,color:'#0b2235'},robot);
    for(const x of [-.085,.085])entity('a-box',{position:`${x} .65 -.188`,width:.045,height:.055,depth:.012,color:'#72ffe0',material:'shader: flat'},robot);
    for(const side of [-1,1]){
      entity('a-cylinder',{position:`${side*.21} .14 0`,rotation:'0 0 90',radius:.14,height:.12,color:'#182b3e','segments-radial':12},robot);
      entity('a-cylinder',{position:`${side*.277} .14 0`,rotation:'0 0 90',radius:.07,height:.016,color:'#6a9bab','segments-radial':12},robot);
      entity('a-box',{position:`${side*.22} .34 0`,rotation:`0 0 ${side*12}`,width:.085,height:.22,depth:.1,color:'#657f94'},robot);
    }
    entity('a-cylinder',{position:'0 .83 0',radius:.012,height:.15,color:'#69889b'},robot);
    entity('a-sphere',{position:'0 .91 0',radius:.027,color:'#75f6d6',material:'shader: flat','segments-width':8,'segments-height':6},robot);
    return robot;
  }
  moveRobot(state,animate=true){const pos=`${(state.x-2)*.56} .16 ${(state.y-2)*.56}`;if(animate)this.robot.setAttribute('animation__move',`property: position; to: ${pos}; dur: 380; easing: easeInOutSine`);else{this.robot.removeAttribute('animation__move');this.robot.setAttribute('position',pos);}this.robot.setAttribute('rotation',`0 ${-state.dir*90} 0`);this.beams.forEach(b=>b.setAttribute('visible',state.tick%2===1));}
  openDoor(open){this.doorLeaves.forEach((leaf,index)=>leaf.setAttribute('animation__open',`property: position; to: ${(index===0?-1:1)*(open?1.72:.575)} 0 0; dur: 1500; easing: easeInOutCubic`));}
  powerPortal(level){if(level===0){this.portalSurface.removeAttribute('animation__finale');this.portalSurface.setAttribute('material','color','#6b6b9a');}else this.portalSurface.setAttribute('material','color','#bbdcff');this.portalSurface.setAttribute('material','opacity',.12+level*.7);this.portalRings.forEach((r,i)=>{r.setAttribute('visible',i<Math.ceil(level*3)||level===0);if(level>0)r.setAttribute('animation',`property: rotation; to: 0 0 ${360+i*30}; dur: ${16000-i*3000}; loop: true; easing: linear`);else r.removeAttribute('animation');});}
  portalMove(node){const [x,y]=this.config.portal.nodes[node];this.portalRobot.setAttribute('visible',true);this.portalRobot.setAttribute('animation__move',`property: position; to: ${22.1+x*.6} .4 ${-4-y*.6}; dur: 550; easing: easeInOutSine`);}
  finale(){this.portalSurface.setAttribute('animation__finale','property: material.color; to: #57dcca; dur: 2500; easing: easeInOutSine');}
}
