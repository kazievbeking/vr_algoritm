export function entity(tag,attributes,parent){const el=document.createElement(tag);for(const [key,value] of Object.entries(attributes))el.setAttribute(key,value);parent.append(el);return el;}
export const stationX=n=>n*10;
export class Laboratory {
  constructor(scene,dispatch,config){this.scene=scene;this.config=config;this.dispatch=dispatch;this.build();}
  build(){
    const s=this.scene;
    entity('a-plane',{rotation:'-90 0 0',position:'10 -0.02 -2',width:38,height:22,color:'#0c1a2b',material:'roughness: 0.85; metalness: 0.2'},s);
    entity('a-box',{position:'10 4 -9',width:38,height:8,depth:.3,color:'#101d32'},s);
    entity('a-plane',{position:'10 7 -2',rotation:'90 0 0',width:38,height:16,color:'#081323'},s);
    for(let x=-8;x<=28;x+=2){entity('a-box',{position:`${x} 0.002 -2`,width:.012,height:.008,depth:18,color:'#18354a'},s);}
    for(let z=-10;z<=8;z+=2){entity('a-box',{position:`10 0.003 ${z}`,width:38,height:.008,depth:.012,color:'#18354a'},s);}
    for(let x=-7;x<=27;x+=4){entity('a-box',{position:`${x} 3 -8.6`,width:.22,height:6,depth:.35,color:'#1c304b'},s);entity('a-box',{position:`${x+.15} 3 -8.35`,width:.035,height:4.8,depth:.04,color:'#28aab3',material:'shader: flat'},s);}
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
    entity('a-box',{width:3.2,height:.2,depth:3.2,color:'#1b2d46'},this.laserWorld);
    this.beams=[];
    for(let y=0;y<5;y++)for(let x=0;x<5;x++){
      entity('a-box',{position:`${(x-2)*.56} .13 ${(y-2)*.56}`,width:.51,height:.04,depth:.51,color:x===4&&y===0?'#237f6c':'#25435a'},this.laserWorld);
    }
    this.config.laser.obstacles.forEach(([x,y])=>entity('a-box',{position:`${(x-2)*.56} .38 ${(y-2)*.56}`,width:.48,height:.5,depth:.48,color:'#53627c'},this.laserWorld));
    this.config.laser.lasers.forEach(([x,y])=>this.beams.push(entity('a-cylinder',{position:`${(x-2)*.56} .5 ${(y-2)*.56}`,radius:.035,height:.75,color:'#ff4266',material:'shader: flat'},this.laserWorld)));
    this.robot=this.makeRobot(this.laserWorld);this.moveRobot({x:0,y:4,dir:0},false);
    entity('a-box',{position:'14.5 2 -5',width:3,height:4,depth:.4,color:'#20364e'},s);
    this.door=entity('a-box',{position:'14.5 1.7 -4.7',width:2.3,height:3.2,depth:.2,color:'#246c79'},s);
    entity('a-box',{position:'0 0 0',width:.07,height:2.8,depth:.23,color:'#59e9d4',material:'shader: flat'},this.door);
    this.portalRoot=entity('a-entity',{position:'24.5 2.6 -4'},s);
    entity('a-cylinder',{position:'0 -2.4 0',radius:2,height:.3,color:'#26304e'},this.portalRoot);
    entity('a-torus',{radius:2,'radius-tubular':.16,color:'#41416d','segments-radial':12,'segments-tubular':64},this.portalRoot);
    this.portalRings=[];
    for(let n=0;n<3;n++)this.portalRings.push(entity('a-torus',{radius:1.7+n*.1,'radius-tubular':.025,color:n%2?'#a57eff':'#4ce4d3',material:'shader: flat',rotation:`0 0 ${n*30}`},this.portalRoot));
    this.portalSurface=entity('a-circle',{radius:1.67,color:'#442978',material:'shader: flat; transparent: true; opacity: 0.12; side: double'},this.portalRoot);
    this.hologram=entity('a-entity',{position:'-4.6 .3 -2.6',animation:'property: position; to: -4.6 .42 -2.6; dir: alternate; dur: 2400; loop: true; easing: easeInOutSine'},s);
    entity('a-cylinder',{radius:.65,height:.15,color:'#21324c'},this.hologram);
    entity('a-cone',{position:'0 1.1 0',radiusBottom:.65,radiusTop:.3,height:1.9,color:'#3be8e1',material:'shader: flat; transparent: true; opacity: .10; depthWrite: false'},this.hologram);
    entity('a-sphere',{position:'0 2.1 0',radius:.27,color:'#63f5e9',material:'shader: flat; transparent: true; opacity: .7'},this.hologram);
    entity('a-cone',{position:'0 1.45 0',radiusBottom:.5,radiusTop:.23,height:.8,color:'#4ad6e2',material:'shader: flat; transparent: true; opacity: .35'},this.hologram);
    for(let i=0;i<6;i++)entity('a-torus',{position:`0 ${.9+i*.22} 0`,rotation:'90 0 0',radius:.42,'radius-tubular':.009,color:'#52eada',material:'shader: flat'},this.hologram);
    this.portalRobot=this.makeRobot(s);this.portalRobot.setAttribute('visible',false);
  }
  label(parent,text,w,h,color){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.font='80px LabSans';c.fillStyle=color;c.textAlign='center';c.fillText(text,256,100);const tex=new AFRAME.THREE.CanvasTexture(canvas);tex.colorSpace=AFRAME.THREE.SRGBColorSpace;const mesh=new AFRAME.THREE.Mesh(new AFRAME.THREE.PlaneGeometry(w,h),new AFRAME.THREE.MeshBasicMaterial({map:tex,transparent:true}));const el=entity('a-entity',{},parent);el.setObject3D('mesh',mesh);}
  makeRobot(parent){const robot=entity('a-entity',{},parent);entity('a-box',{position:'0 .34 0',width:.32,height:.35,depth:.29,color:'#b8cbd4',material:'metalness: .35; roughness: .4'},robot);entity('a-box',{position:'0 .62 0',width:.39,height:.25,depth:.32,color:'#d6e5e9'},robot);entity('a-box',{position:'0 .63 -.169',width:.29,height:.11,depth:.025,color:'#102c42'},robot);for(const x of [-.08,.08])entity('a-sphere',{position:`${x} .64 -.19`,radius:.029,color:'#5affe1',material:'shader: flat'},robot);for(const x of [-.2,.2])entity('a-sphere',{position:`${x} .12 0`,radius:.12,color:'#1b263d'},robot);entity('a-cylinder',{position:'0 .83 0',radius:.017,height:.16,color:'#66f8d8'},robot);return robot;}
  moveRobot(state,animate=true){const pos=`${(state.x-2)*.56} .16 ${(state.y-2)*.56}`;if(animate)this.robot.setAttribute('animation__move',`property: position; to: ${pos}; dur: 380; easing: easeInOutSine`);else{this.robot.removeAttribute('animation__move');this.robot.setAttribute('position',pos);}this.robot.setAttribute('rotation',`0 ${-state.dir*90} 0`);this.beams.forEach(b=>b.setAttribute('visible',state.tick%2===1));}
  openDoor(open){this.door.setAttribute('animation__open',`property: position; to: 14.5 ${open?5:1.7} -4.7; dur: 1500; easing: easeInOutCubic`);}
  powerPortal(level){if(level===0){this.portalSurface.removeAttribute('animation__finale');this.portalSurface.setAttribute('material','color','#442978');}this.portalSurface.setAttribute('material','opacity',.12+level*.7);this.portalRings.forEach((r,i)=>{r.setAttribute('visible',i<Math.ceil(level*3)||level===0);if(level>0)r.setAttribute('animation',`property: rotation; to: 0 0 ${360+i*30}; dur: ${16000-i*3000}; loop: true; easing: linear`);else r.removeAttribute('animation');});}
  portalMove(node){const [x,y]=this.config.portal.nodes[node];this.portalRobot.setAttribute('visible',true);this.portalRobot.setAttribute('animation__move',`property: position; to: ${22.1+x*.6} .4 ${-4-y*.6}; dur: 550; easing: easeInOutSine`);}
  finale(){this.portalSurface.setAttribute('animation__finale','property: material.color; to: #57dcca; dur: 2500; easing: easeInOutSine');}
}
