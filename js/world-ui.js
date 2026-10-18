const W=1600,H=1000;
export class WorldUI {
  constructor(scene,dispatch){
    this.canvas=document.createElement('canvas');this.canvas.width=W;this.canvas.height=H;this.ctx=this.canvas.getContext('2d');this.dispatch=dispatch;
    this.root=document.createElement('a-entity');scene.append(this.root);
    this.texture=new AFRAME.THREE.CanvasTexture(this.canvas);this.texture.colorSpace=AFRAME.THREE.SRGBColorSpace;
    const mesh=new AFRAME.THREE.Mesh(new AFRAME.THREE.PlaneGeometry(6.4,4),new AFRAME.THREE.MeshBasicMaterial({map:this.texture,side:AFRAME.THREE.DoubleSide}));
    this.root.setObject3D('mesh',mesh);this.buttons=[];
  }
  position(x){this.root.setAttribute('position',`${x} 2.35 -2`);}
  begin(){this.buttons.forEach(b=>b.remove());this.buttons=[];const c=this.ctx;c.clearRect(0,0,W,H);c.fillStyle='#071421';c.fillRect(0,0,W,H);c.strokeStyle='#244653';c.lineWidth=3;c.strokeRect(2,2,W-4,H-4);c.fillStyle='#50ead0';c.fillRect(0,0,6,H);}
  text(text,x,y,size=24,color='#d8e8ee',maxWidth=1500){const c=this.ctx;c.font=`${size>=30?'600':'400'} ${size}px LabSans, sans-serif`;c.fillStyle=color;c.textAlign='left';c.textBaseline='top';let line='',yy=y;for(const word of String(text).split(' ')){if(c.measureText(line+word).width>maxWidth&&line){c.fillText(line.trim(),x,yy);yy+=size*1.34;line='';}line+=word+' ';}c.fillText(line.trim(),x,yy);return yy+size*1.34;}
  rect(x,y,w,h,color='#102936'){const c=this.ctx;c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,10);c.fill();}
  line(x1,y1,x2,y2,color='#426473',width=3){const c=this.ctx;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
  button(label,x,y,w,h,action,{disabled=false,active=false,accent=false}={}){
    this.rect(x,y,w,h,disabled?'#12202b':active?'#276856':accent?'#2dc8b1':'#193544');
    const c=this.ctx;c.save();c.font=`600 22px LabSans, sans-serif`;const size=Math.min(22,22*(w-20)/Math.max(1,c.measureText(label).width));c.font=`600 ${size}px LabSans, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=disabled?'#637783':accent?'#041a22':'#e2f4f6';c.fillText(label,x+w/2,y+h/2);c.restore();
    if(disabled)return;
    const hit=document.createElement('a-plane');hit.classList.add('interactive');hit.dataset.action=action;
    hit.setAttribute('width',w/W*6.4);hit.setAttribute('height',h/H*4);hit.setAttribute('position',`${((x+w/2)/W-.5)*6.4} ${(0.5-(y+h/2)/H)*4} 0.014`);
    hit.setAttribute('material','shader: flat; transparent: true; opacity: 0; depthWrite: false');
    hit.addEventListener('click',()=>this.dispatch(action));this.root.append(hit);this.buttons.push(hit);
  }
  end(){this.texture.needsUpdate=true;}
  dispose(){this.buttons.forEach(b=>b.remove());this.texture.dispose();this.root.getObject3D('mesh').geometry.dispose();this.root.getObject3D('mesh').material.dispose();this.root.remove();}
}
