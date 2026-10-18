import {getSetting,setSetting} from './storage.js';
export class AudioFeedback {
  constructor(){this.enabled=getSetting('sound',true)===true;}
  unlock(){try{this.ctx??=new (window.AudioContext||window.webkitAudioContext)();this.ctx.resume().catch(()=>{});}catch{/* Text feedback is always present. */}}
  toggle(){this.enabled=!this.enabled;setSetting('sound',this.enabled);return this.enabled;}
  play(kind='click') {
    if(!this.enabled||!this.ctx)return;
    const ctx=this.ctx,t=ctx.currentTime;const notes=kind==='success'?[392,494,587,784]:kind==='error'?[164,130]:kind==='step'?[260]:[520];
    notes.forEach((f,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=f;gain.gain.setValueAtTime(0,t+i*.13);gain.gain.linearRampToValueAtTime(.045,t+i*.13+.02);gain.gain.exponentialRampToValueAtTime(.001,t+i*.13+.22);osc.connect(gain).connect(ctx.destination);osc.start(t+i*.13);osc.stop(t+i*.13+.25);});
  }
}
