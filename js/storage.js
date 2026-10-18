const KEY='uaqyt-v1';
export const freshState=()=>({version:1,completed:[false,false,false],attempts:[0,0,0],hints:0,lastCost:null});
export function validateSave(s) {
  if(!s||s.version!==1||!Array.isArray(s.completed)||s.completed.length!==3||!s.completed.every(v=>typeof v==='boolean')||!Array.isArray(s.attempts)||s.attempts.length!==3||!s.attempts.every(v=>Number.isSafeInteger(v)&&v>=0)||!Number.isSafeInteger(s.hints)||s.hints<0||!(s.lastCost===null||Number.isFinite(s.lastCost)&&s.lastCost>=0)) return null;
  if(s.completed[1]&&!s.completed[0]||s.completed[2]&&!s.completed[1]) return null;
  return {version:1,completed:[...s.completed],attempts:[...s.attempts],hints:s.hints,lastCost:s.lastCost};
}
export function loadProgress() {try{return validateSave(JSON.parse(localStorage.getItem(KEY)));}catch{return null;}}
export function saveProgress(s) {try{localStorage.setItem(KEY,JSON.stringify(s));return true;}catch{return false;}}
export function getSetting(key,fallback) {try{return JSON.parse(localStorage.getItem(KEY+'-'+key))??fallback;}catch{return fallback;}}
export function setSetting(key,value) {try{localStorage.setItem(KEY+'-'+key,JSON.stringify(value));}catch{/* Memory-only play remains available. */}}
