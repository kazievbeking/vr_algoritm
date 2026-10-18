export class Assistant {
  constructor(dialogues,i18n){this.data=dialogues;this.i18n=i18n;this.level=[0,0,0];this.errors=[0,0,0];this.text='';}
  say(event,station){const value=this.data[event];this.text=(Array.isArray(value)?value[station]:value)[this.i18n.lang];return this.text;}
  error(station){this.errors[station]++;return this.say(this.errors[station]===1?'firstError':'repeatError',station);}
  hint(station){const level=Math.min(this.level[station]++,2);this.text=this.data.hints[station][level][this.i18n.lang];return this.text;}
}
