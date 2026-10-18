// Repeated architectural parts share instanced meshes to keep the room light in VR.
export function buildEnvironment(scene) {
  const T=AFRAME.THREE,root=new T.Group(),batches=new Map();
  const box=(position,scale,color,glow=false,rotation=0)=>{
    const key=color+':'+glow;
    if(!batches.has(key))batches.set(key,{color,glow,items:[]});
    batches.get(key).items.push({position,scale,rotation});
  };
  box([10,-.17,-1],[38,.3,23],'#101d2b');
  // Inlaid floor panels and continuous guide rails.
  for(let x=-7;x<=27;x+=2)for(let z=-8;z<=8;z+=2){
    box([x,.001,z],[1.96,.025,1.96],(x+z)%4===0?'#172838':'#122130');
  }
  for(const z of [-6.5,5.8]){
    box([10,.025,z],[35,.04,.17],'#273e50');
    box([10,.048,z],[35,.012,.035],'#42b8ba',true);
    for(let x=-6;x<28;x+=2)box([x,.035,z+.25],[.5,.025,.06],'#3a5364');
  }
  // The observation wall has deep reveals instead of a flat solid backdrop.
  box([10,3.6,-9.25],[38,7.5,.3],'#090f22');
  box([10,.55,-8.85],[38,1.1,.7],'#233446');
  box([10,6.65,-8.85],[38,1.1,.7],'#233446');
  box([10,1.16,-8.43],[36,.035,.06],'#4dbfc3',true);
  for(let x=-8;x<=28;x+=4){
    box([x,3.65,-8.6],[.25,5.2,.65],'#304656');
    box([x+.17,3.65,-8.24],[.035,4.8,.04],'#487d8e',true);
  }
  // Ceiling cassettes, structural ribs, and three distinct station bays.
  box([10,7.1,-1],[38,.25,22],'#0d1928');
  for(let n=0;n<3;n++){
    const x=n*10,accent=['#5bd8ca','#78b8f1','#b194ec'][n];
    for(const side of [-1,1]){
      box([x+side*4.45,2.65,-5.7],[.36,5.3,.5],'#2c4253');
      box([x+side*4.45,4.95,-5.7],[.35,1.5,.5],'#2c4253',false,side*.65);
      box([x+side*4.23,2.6,-5.4],[.045,3.5,.045],accent,true);
      box([x+side*3.6,.3,-2.2],[.23,.6,1.35],'#304759');
      // Subtle floor markings lead toward the console.
      for(let z=0;z<=2;z++)box([x+side*2.55,.025,z],[.07,.02,.42],accent,true);
      box([x+side*3.4,2.4,-2.16],[.12,4.28,.18],'#3a5362');
      box([x+side*3.32,2.4,-2.04],[.025,3.8,.02],accent,true);
    }
    box([x,5.75,-5.7],[8.3,.32,.55],'#2c4253');
    box([x,5.55,-5.36],[5.3,.055,.045],accent,true);
    box([x,4.5,-2.17],[6.92,.17,.24],'#304958');
    box([x,.23,-2.15],[7.05,.28,1.1],'#263f50');
    box([x,.39,-1.75],[6.5,.035,.055],accent,true);
    box([x,.06,-2],[7.8,.08,2.1],'#1c2e40');
    // Luminaire above each workstation: one six-sided frame, no extra lights.
    const ring=new T.Mesh(new T.TorusGeometry(3.9,.065,4,6),new T.MeshStandardMaterial({color:'#334b5b',roughness:.55,metalness:.25}));
    ring.rotation.x=Math.PI/2;ring.position.set(x,5.9,-1.8);root.add(ring);
    const lightRing=new T.Mesh(new T.TorusGeometry(3.83,.018,4,6),new T.MeshBasicMaterial({color:accent}));
    lightRing.rotation.x=Math.PI/2;lightRing.position.set(x,5.85,-1.8);root.add(lightRing);
    // Equipment racks sit behind the active exhibits.
    for(let j=0;j<2;j++){
      const rx=x-3.5+j*.65;
      box([rx,1.8,-7.7],[.54,2.6,.55],'#25384b');
      for(let k=0;k<5;k++){
        box([rx,1+k*.38,-7.4],[.38,.22,.025],'#101e2b');
        box([rx-.12,1.06+k*.38,-7.38],[.04,.025,.01],accent,true);
      }
    }
  }
  for(const x of [-8.8,28.8])box([x,3.5,-1],[.3,7,22],'#17283b');
  const geometry=new T.BoxGeometry(1,1,1),dummy=new T.Object3D();
  for(const batch of batches.values()){
    const material=batch.glow?new T.MeshBasicMaterial({color:batch.color}):new T.MeshStandardMaterial({color:batch.color,roughness:.68,metalness:.16});
    const mesh=new T.InstancedMesh(geometry,material,batch.items.length);
    batch.items.forEach((item,index)=>{dummy.position.set(...item.position);dummy.scale.set(...item.scale);dummy.rotation.set(0,0,item.rotation);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);});
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();root.add(mesh);
  }
  // Seeded stars are one draw call, visible through the observation wall bays.
  const positions=[],colors=[];let seed=42;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<240;i++){positions.push(-8+random()*36,1.35+random()*4.7,-8.98);const b=.35+random()*.5;colors.push(b*.75,b*.88,b);}
  const stars=new T.BufferGeometry();stars.setAttribute('position',new T.Float32BufferAttribute(positions,3));stars.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  root.add(new T.Points(stars,new T.PointsMaterial({size:.025,vertexColors:true,sizeAttenuation:true})));
  const host=document.createElement('a-entity');host.id='laboratory-architecture';scene.append(host);host.setObject3D('mesh',root);
}

export function portalTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');
  const gradient=c.createRadialGradient(256,256,8,256,256,256);
  gradient.addColorStop(0,'#e1fff5');gradient.addColorStop(.12,'#7499c9');gradient.addColorStop(.4,'#39347c');gradient.addColorStop(.77,'#4461b3');gradient.addColorStop(1,'#8cfff0');
  c.fillStyle=gradient;c.fillRect(0,0,512,512);c.translate(256,256);
  for(let j=0;j<18;j++){
    c.rotate(Math.PI*2/18);c.beginPath();c.moveTo(15,0);c.bezierCurveTo(75,-135,230,-140,253,0);c.strokeStyle=j%3===0?'#b1fff85e':'#ad9fff30';c.lineWidth=j%3===0?2:5;c.stroke();
  }
  return canvas;
}
