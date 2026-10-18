import {I18n} from './i18n.js';
import {GameState} from './game-state.js';
import {getSetting,setSetting,saveProgress} from './storage.js';
import {Assistant} from './assistant.js';
import {AudioFeedback} from './audio.js';
import {WorldUI} from './world-ui.js';
import {Laboratory} from './scene.js';
import {desktopControls} from './desktop-controls.js';
import {vrControls,teleport} from './vr-controls.js';
import {expandProgram,laserStep} from './tasks/laser-task.js';
import {checkDoor} from './tasks/door-task.js';
import {edgeCost,routeResult} from './tasks/portal-task.js';
import {renderPanel} from './panels.js';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export class Quest {
  async init(){
    this.i18n=new I18n();this.state=new GameState();this.audio=new AudioFeedback();this.seated=getSetting('seated',false)===true;
    await this.i18n.load();this.i18n.set(this.i18n.lang);
    const [tasks,dialogues]=await Promise.all(['tasks','dialogues'].map(async file=>{const response=await fetch(new URL('../data/'+file+'.json',import.meta.url));if(!response.ok)throw new Error(file);return response.json();}));this.tasks=tasks;
    await document.fonts.load('24px LabSans');
    this.scene=document.querySelector('a-scene');if(!this.scene.hasLoaded)await new Promise(resolve=>this.scene.addEventListener('loaded',resolve,{once:true}));
    this.assistant=new Assistant(dialogues,this.i18n);this.lab=new Laboratory(this.scene,a=>this.dispatch(a),tasks);this.ui=new WorldUI(this.scene,a=>this.dispatch(a));
    this.rig=document.querySelector('#rig');this.camera=document.querySelector('#camera');
    desktopControls(this.scene,a=>this.dispatch(a));vrControls(this.scene,a=>this.dispatch(a));
    this.bindHTML();this.resetTask();this.translateHTML();this.render();
    document.querySelector('#loading').hidden=true;document.querySelector('#landing').hidden=false;
    this.xrSupported=!!(navigator.xr&&window.isSecureContext&&await navigator.xr.isSessionSupported('immersive-vr').catch(()=>false));this.translateHTML();
  }
  bindHTML(){
    document.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>this.dispatch(button.dataset.command)));
    document.querySelector('#language').addEventListener('change',event=>this.dispatch('language:'+event.target.value));
  }
  translateHTML(){
    document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=this.i18n.t(el.dataset.i18n));
    document.title=this.i18n.t('title')+' · CHRONOS';document.querySelector('#language').value=this.i18n.lang;
    document.querySelector('#continue').hidden=!this.state.saved;
    document.querySelector('#xr-status').textContent=this.i18n.t(this.xrSupported?'vrReady':'noVR');
    document.querySelector('#enter-vr').disabled=!this.xrSupported;
  }
  render(){renderPanel(this);document.querySelector('#hud-progress').textContent=this.state.progress.completed.map((v,n)=>(v?'✓ ':'0'+(n+1)+' ')+this.i18n.t(['laser','door','portal'][n])).join('   /   ');}
  resetTask(){
    this.state.cancel();this.program=[];this.group=1;this.count=2;this.currentIndex=-1;this.robot={...this.tasks.laser.start,tick:0};
    this.expression={temp:1,inner:0,outer:1,negate:false};this.sensorIndex=0;this.doorTested=false;this.route=['S'];this.solved=false;this.final=false;this.lastError=null;this.statusKey='ready';
    this.lab.moveRobot(this.robot,false);this.lab.portalRobot.removeAttribute('animation__move');this.lab.portalRobot.setAttribute('visible',false);
    this.lab.openDoor(this.state.station===1?false:this.state.progress.completed[1]);this.lab.powerPortal(this.state.station===2?0:this.state.progress.completed[2]?1:0);
    this.assistant.say('start',this.state.station);this.ui.position(this.state.station*10);
  }
  begin(fresh){
    this.audio.unlock();this.assistant.level=[0,0,0];this.assistant.errors=[0,0,0];this.state.start(fresh);if(fresh){saveProgress(this.state.progress);this.state.saved=this.state.progress;}
    this.worldMenu=false;this.resetTask();this.final=this.state.progress.completed.every(Boolean)&&!fresh;
    document.querySelector('#landing').hidden=true;document.querySelector('#desktop-hud').hidden=this.scene.is('vr-mode');this.translateHTML();this.go(this.state.station);this.final=this.state.progress.completed.every(Boolean)&&!fresh;if(this.final)this.lab.powerPortal(1);this.render();
  }
  go(n){if(!this.state.unlocked(n)){this.statusKey='locked';this.render();return;}this.state.station=n;this.worldMenu=false;this.resetTask();teleport(this.rig,this.camera,n,this.seated,this.scene.is('vr-mode'));this.render();}
  error(key){this.lastError=key;this.statusKey=key;this.assistant.error(this.state.station);this.audio.play('error');this.render();}
  complete(){this.state.running=false;this.solved=true;this.statusKey='success';this.lastError=null;this.assistant.say('success',this.state.station);this.audio.play('success');if(!this.state.complete())this.statusKey='saveError';this.translateHTML();this.render();}
  async run(){
    if(this.state.running)return;
    const n=this.state.station,token=++this.state.generation;this.state.running=true;this.lastError=null;this.solved=false;this.statusKey='active';
    if(n===0){
      let steps;try{steps=expandProgram(this.program,this.tasks.laser.maxSteps);if(!steps.length)throw new Error('empty');}catch{this.state.running=false;this.error('invalidProgram');return;}
      this.state.attempt();this.robot={...this.tasks.laser.start,tick:0};this.lab.moveRobot(this.robot,false);
      for(const step of steps){this.currentIndex=step.index;this.render();await delay(600);if(token!==this.state.generation)return;this.robot=laserStep(this.robot,step.command,this.tasks.laser);this.lab.moveRobot(this.robot);this.audio.play('step');this.render();if(this.robot.error){this.state.running=false;this.error(this.robot.error);return;}}
      await delay(400);if(token!==this.state.generation)return;this.state.running=false;this.currentIndex=-1;
      if(this.robot.x===this.tasks.laser.goal[0]&&this.robot.y===this.tasks.laser.goal[1])this.complete();else this.error('notGoal');
    }else if(n===1){
      this.state.attempt();this.doorTested=true;this.render();await delay(500);if(token!==this.state.generation)return;this.state.running=false;
      if(checkDoor(this.expression,this.tasks.door).every(row=>row.pass)){this.lab.openDoor(true);this.complete();}else this.error('doorFail');
    }else{
      this.state.attempt();const result=routeResult(this.tasks.portal,this.route);
      if(!result.success){this.state.running=false;this.error('badRoute');return;}
      this.lab.portalRobot.setAttribute('position','22.1 .4 -4');
      for(let j=0;j<this.route.length;j++){if(token!==this.state.generation)return;this.lab.portalMove(this.route[j]);this.lab.powerPortal(j/(this.route.length-1));this.audio.play('step');this.render();await delay(650);if(token!==this.state.generation)return;}
      this.state.progress.lastCost=result.cost;this.complete();this.statusKey=result.efficient?'efficient':'inefficient';if(!result.efficient)this.assistant.text=this.i18n.t('inefficient');this.render();
    }
  }
  async dispatch(action){
    this.audio.unlock();const [type,value]=action.split(':');
    if(type==='start'){if(this.state.saved&&this.state.saved.completed.some(Boolean)&&!window.confirm(this.i18n.t('confirm')))return;this.begin(true);return;}
    if(type==='continue'){this.begin(false);return;}
    if(type==='vr'){
      if(!this.xrSupported){document.querySelector('#xr-status').textContent=this.i18n.t('noVR');return;}
      // Request the XR session inside the initiating user gesture.
      try{const entering=this.scene.enterVR();this.begin(false);await entering;}catch{document.querySelector('#xr-status').textContent=this.i18n.t('noVR');document.querySelector('#landing').hidden=false;document.querySelector('#desktop-hud').hidden=true;}return;
    }
    if(type==='language'){this.i18n.set(value);this.assistant.say('start',this.state.station);this.translateHTML();this.render();return;}
    if(type==='menu'){this.state.cancel();this.resetTask();if(this.scene.is('vr-mode'))this.worldMenu=true;else{document.querySelector('#landing').hidden=false;document.querySelector('#desktop-hud').hidden=true;this.translateHTML();}this.render();return;}
    if(type==='world-menu'){this.state.cancel();this.resetTask();this.worldMenu=true;this.render();return;}
    if(type==='resume'){this.worldMenu=false;this.render();return;}
    if(type==='new'){this.confirmNew=true;this.render();return;}
    if(type==='cancel-new'){this.confirmNew=false;this.render();return;}
    if(type==='confirm-new'){this.confirmNew=false;this.begin(true);return;}
    if(type==='sound'){this.audio.toggle();this.render();return;}
    if(type==='seated'){this.seated=!this.seated;setSetting('seated',this.seated);teleport(this.rig,this.camera,this.state.station,this.seated,this.scene.is('vr-mode'));this.render();return;}
    if(type==='turn'){
      // Rotate about the user's current headset position, preserving room-scale placement.
      const angle=-Number(value)*Math.PI/180,rig=this.rig.object3D,cam=this.camera.object3D;
      const before=new AFRAME.THREE.Vector3();cam.getWorldPosition(before);rig.rotation.y+=angle;rig.updateMatrixWorld(true);const after=new AFRAME.THREE.Vector3();cam.getWorldPosition(after);rig.position.x+=before.x-after.x;rig.position.z+=before.z-after.z;return;
    }
    if(type==='station'){this.go(Number(value));return;}
    if(type==='help'){this.state.progress.hints++;this.assistant.hint(this.state.station);this.render();return;}
    if(type==='why'){this.assistant.text=this.i18n.t(this.lastError||'noError');this.render();return;}
    if(type==='explain'){this.assistant.say('start',this.state.station);this.render();return;}
    if(type==='reset'){this.state.cancel();this.robot={...this.tasks.laser.start,tick:0};this.currentIndex=-1;this.route=['S'];this.solved=false;this.final=false;this.lab.moveRobot(this.robot,false);this.lab.portalRobot.removeAttribute('animation__move');this.lab.portalRobot.setAttribute('visible',false);this.lab.powerPortal(this.state.progress.completed[2]?1:0);this.statusKey='stopped';this.lastError=null;this.render();return;}
    if(this.state.running)return;
    if(type==='replay'){this.worldMenu=false;this.resetTask();this.render();return;}
    if(type==='finish'){this.final=true;this.lab.powerPortal(1);this.lab.finale();this.audio.play('success');this.render();return;}
    if(type==='run'){await this.run();return;}
    this.solved=false;this.lastError=null;this.statusKey='ready';
    if(type==='add'){
      if(this.program.length>=16)return;
      const item=value==='repeat'?{command:value,group:this.group,count:this.count}:{command:value};
      try{expandProgram([...this.program,item]);this.program.push(item);}catch{this.error('invalidProgram');return;}
    }
    if(type==='group')this.group=this.group%3+1;
    if(type==='count')this.count=this.count%4+1<2?2:this.count%4+1;
    if(type==='undo'){if(this.state.station===0)this.program.pop();if(this.state.station===2&&this.route.length>1)this.route.pop();}
    if(type==='clear'){this.program=[];this.route=['S'];}
    if(['temp','inner','outer','negate'].includes(type)){if(type==='temp')this.expression.temp=(this.expression.temp+1)%3;else if(type==='negate')this.expression.negate=!this.expression.negate;else this.expression[type]=1-this.expression[type];this.doorTested=false;}
    if(type==='sensor')this.sensorIndex=(this.sensorIndex+1)%this.tasks.door.cases.length;
    if(type==='node'&&this.route.length<16&&this.route.at(-1)!=='P'&&Number.isFinite(edgeCost(this.tasks.portal,this.route.at(-1),value)))this.route.push(value);
    this.audio.play();this.render();
  }
}
const quest=new Quest();
quest.init().catch(error=>{console.error(error);document.querySelector('#loading-text').textContent=quest.i18n?.messages?.kk?.loadError||'Жүктеу қатесі. HTTP сервері арқылы ашыңыз.';});
