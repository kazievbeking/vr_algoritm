export function vrControls(scene,dispatch){
  const right=document.querySelector('#right-hand');let latched=false;
  right.addEventListener('thumbstickmoved',event=>{const x=event.detail.x;if(Math.abs(x)<.3)latched=false;if(Math.abs(x)>.7&&!latched){latched=true;dispatch('turn:'+(x>0?30:-30));}});
  document.querySelector('#left-hand').addEventListener('ybuttondown',()=>dispatch('menu'));
  scene.addEventListener('enter-vr',()=>{document.querySelector('#desktop-hud').hidden=true;});
  scene.addEventListener('exit-vr',()=>{document.querySelector('#desktop-hud').hidden=false;});
}
export function teleport(rig,camera,n,seated=false,immersive=false){
  // Cancel only the tracked horizontal room offset; never overwrite the headset pose.
  const offset=immersive?camera.object3D.position:{x:0,z:0};
  rig.setAttribute('position',`${n*10-offset.x} ${seated&&immersive?.5:0} ${4-offset.z}`);
  rig.setAttribute('rotation','0 0 0');
  if(!immersive){const look=camera.components['look-controls'];if(look){look.yawObject.rotation.y=0;look.pitchObject.rotation.x=0;}}
}
