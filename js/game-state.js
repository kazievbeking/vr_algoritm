import {freshState,loadProgress,saveProgress} from './storage.js';
export class GameState {
  constructor(){this.saved=loadProgress();this.progress=this.saved??freshState();this.station=0;this.running=false;this.generation=0;}
  cancel(){this.generation++;this.running=false;}
  start(fresh=false){this.cancel();if(fresh)this.progress=freshState();this.station=Math.max(0,this.progress.completed.indexOf(false));if(this.progress.completed.every(Boolean))this.station=2;}
  unlocked(n){return n===0||this.progress.completed[n-1];}
  attempt(){this.progress.attempts[this.station]++;}
  complete(){this.progress.completed[this.station]=true;this.saved=this.progress;return saveProgress(this.progress);}
}
