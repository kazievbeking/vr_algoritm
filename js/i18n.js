import {getSetting,setSetting} from './storage.js';
export class I18n {
  constructor(){const saved=getSetting('language','kk');this.lang=['kk','ru','en'].includes(saved)?saved:'kk';this.messages={};}
  async load(){const all=await Promise.all(['kk','ru','en'].map(async lang=>[lang,await (await fetch(new URL('../locales/'+lang+'.json',import.meta.url))).json()]));this.messages=Object.fromEntries(all);}
  t(key){return this.messages[this.lang]?.[key]??key;}
  set(lang){if(!this.messages[lang])return;this.lang=lang;document.documentElement.lang=lang;setSetting('language',lang);}
}
