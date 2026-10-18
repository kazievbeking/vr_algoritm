export function desktopControls(scene,dispatch){
  window.addEventListener('keydown',event=>{
    if(event.repeat||/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;
    if(event.key==='Escape')dispatch('menu');
    if(scene.is('vr-mode')||document.querySelector('#landing:not([hidden])'))return;
    if(['1','2','3'].includes(event.key))dispatch('station:'+(Number(event.key)-1));
    if(event.key.toLowerCase()==='q')dispatch('turn:-30');
    if(event.key.toLowerCase()==='e')dispatch('turn:30');
  });
}
