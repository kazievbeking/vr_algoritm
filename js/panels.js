import {laserActive} from './tasks/laser-task.js';
import {evaluateDoor,checkDoor} from './tasks/door-task.js';
import {edgeCost,routeCost,shortestPath} from './tasks/portal-task.js';
export function renderPanel(app){
  const {ui:u,i18n:i,state:s}=app,t=k=>i.t(k),n=s.station;
  u.begin();
  u.text('CHRONOS / 0'+(n+1),40,25,20,'#56e5d0');
  u.text(t(['laser','door','portal'][n]),40,58,38);
  u.text(t(s.running?'active':app.solved?'complete':'ready'),1100,35,20,'#59dfcd');
  ['laser','door','portal'].forEach((key,j)=>u.button(`${s.progress.completed[j]?'✓':'0'+(j+1)}  ${t(key)}`,40+j*510,120,490,52,'station:'+j,{disabled:!s.unlocked(j),active:j===n}));
  if(app.confirmNew){
    u.text(t('confirm'),180,330,36,'#ecedf7',1200);u.button(t('yes'),300,510,430,80,'confirm-new',{accent:true});u.button(t('cancel'),800,510,430,80,'cancel-new');u.end();return;
  }
  if(app.final){
    u.text(t('final'),100,240,60,'#65f3d9');u.text(t('finalText'),100,335,29,'#cfdeec',1350);
    [t('sequence'),t('logic'),t('graph')].forEach((label,j)=>{u.rect(100+j*480,460,450,100);u.text('✓ '+label,120+j*480,490,25,'#6af2d5');});
    u.text(`${t('attempts')}: ${s.progress.attempts.join(' / ')}     ${t('hints')}: ${s.progress.hints}`,100,610,30);
    const best=shortestPath(app.tasks.portal).cost,cost=s.progress.lastCost;
    u.text(`${t('cost')}: ${cost}   ·   ${t('optimal')}: ${best}   ·   ${t('efficiency')}: ${cost?Math.round(best/cost*100):0}%`,100,675,29,'#a995f3');
    u.button(t('replay'),100,800,400,70,'replay');u.button(t('new'),550,800,400,70,'new');u.button(t('menu'),1000,800,400,70,'menu');u.end();return;
  }
  if(app.worldMenu){
    u.text(t('controls'),90,240,28,'#d4e4ed',1400);u.text(t('vrControls'),90,360,28,'#d4e4ed',1400);
    u.button(t('return'),90,510,650,75,'resume',{accent:true});u.button(t('new'),780,510,650,75,'new');
    ['kk','ru','en'].forEach((lang,j)=>u.button(['ҚАЗ','РУС','ENG'][j],90+j*230,620,210,65,'language:'+lang,{active:i.lang===lang}));
    u.button(`${t('sound')}: ${t(app.audio.enabled?'on':'off')}`,90,730,430,65,'sound');
    u.button(t(app.seated?'seated':'standing'),550,730,430,65,'seated');u.text(t('ruleBased'),90,850,23,'#8ba3b9');u.end();return;
  }
  u.text(t(['laserRule','doorRule','portalRule'][n]),40,196,23,'#adc4d3',1510);
  if(n===0)laser(app,t);if(n===1)door(app,t);if(n===2)portal(app,t);
  u.rect(40,728,1520,66,app.lastError?'#3b2235':'#102f36');
  u.text(t(app.statusKey||'ready'),60,746,23,app.lastError?'#ffadbd':'#7ae5d3',app.solved?970:1450);
  if(app.solved)u.button(t(n===2?'finish':'next'),1110,738,430,47,n===2?'finish':'station:'+(n+1),{accent:true});
  u.rect(40,812,1520,105,'#112234');u.text(t('scientist'),60,825,17,'#a495eb');u.text(app.assistant.text,60,851,22,'#e0e7f1',1460);
  const actions=[['help','help'],['why','why'],['explain','explain'],['replay','replay'],['menu','world-menu']];
  actions.forEach(([label,action],j)=>u.button(t(label),40+j*306,937,290,44,action,{disabled:s.running&&['replay'].includes(action)}));
  u.end();
}
function laser(app,t){
  const {ui:u,state:s,robot:r}=app;
  ['forward','left','right','wait'].forEach((key,j)=>u.button(t(key),40+j*178,290,164,53,'add:'+key,{disabled:s.running||app.program.length>=16}));
  u.button(`${t('group')}: ${app.group}`,40,356,270,46,'group',{disabled:s.running});u.button(`${t('count')}: ${app.count}`,325,356,270,46,'count',{disabled:s.running});
  u.button(t('repeat'),610,356,135,46,'add:repeat',{disabled:s.running||app.program.length>=16});
  u.text(t('program')+`  ${app.program.length}/16`,40,416,18,'#6eb8c3');
  if(!app.program.length)u.text(t('empty'),60,465,25,'#839aaa');
  app.program.forEach((item,index)=>{const x=40+Math.floor(index/8)*355,y=450+index%8*23;u.rect(x,y,344,21,app.currentIndex===index?'#287f70':'#0f2432');u.text(`${index+1}. ${t(item.command)}${item.command==='repeat'?` (${item.group} × ${item.count})`:''}`,x+7,y+1,16,app.currentIndex===index?'#c4fff0':'#c2d2df',330);});
  [['undo','undo'],['clear','clear'],['run','run'],['stop','reset']].forEach(([key,action],j)=>u.button(t(key),40+j*178,656,164,53,action,{disabled:action==='run'&&(s.running||!app.program.length)||['undo','clear'].includes(action)&&s.running,accent:action==='run'}));
  const x0=960,y0=294,cell=65,cfg=app.tasks.laser;
  for(let y=0;y<5;y++)for(let x=0;x<5;x++){
    const block=cfg.obstacles.some(([a,b])=>a===x&&b===y),beam=cfg.lasers.some(([a,b])=>a===x&&b===y);
    u.rect(x0+x*cell,y0+y*cell,cell-5,cell-5,block?'#4f5870':beam?(laserActive(r.tick)?'#a52b52':'#42384d'):x===4&&y===0?'#257b68':'#183b4b');
    if(block)u.text('■',x0+x*cell+15,y0+y*cell+12,27,'#8595ab');
    if(x===0&&y===4)u.text('S',x0+20,y0+4*cell+15,25,'#68e2cd');
    if(x===4&&y===0)u.text('P',x0+4*cell+20,y0+15,25,'#68e2cd');
  }
  if(r.x>=0&&r.x<5&&r.y>=0&&r.y<5){const c=u.ctx,x=x0+r.x*cell+30,y=y0+r.y*cell+30;c.save();c.translate(x,y);c.rotate(r.dir*Math.PI/2);c.fillStyle='#b1ffe9';c.beginPath();c.moveTo(0,-20);c.lineTo(18,16);c.lineTo(0,9);c.lineTo(-18,16);c.closePath();c.fill();c.restore();}
  u.text(t('legend'),830,631,20,'#96b3c4',690);
  u.text(`${t('tick')}: ${r.tick} · ${t(laserActive(r.tick)?'on':'off')}`,830,661,23,'#62ddcc');
  u.text(`${t('nextPhase')}: ${r.tick+1} / ${t(laserActive(r.tick+1)?'on':'off')}`,830,692,20,'#c3b3ef');
}
function door(app,t){
  const {ui:u,expression:e}=app;
  const c=app.tasks.door,sensors=c.cases[app.sensorIndex],values=evaluateDoor(e,sensors,c);
  const temps=['T ≤ 40°C','T < 40°C',t('always')];
  u.button(temps[e.temp],40,295,280,55,'temp');u.button(t(e.outer===0?'and':'or'),335,295,150,55,'outer');
  u.button(`${t('not')}: ${t(e.negate?'on':'off')}`,500,295,245,55,'negate');
  u.button(`${t('light')} ≥ 50   ${t(e.inner===0?'and':'or')}   ${t('backup')}`,40,366,705,55,'inner');
  const tempColor=values.temp?'#65e5b5':'#ff90ac',innerColor=values.inner?'#65e5b5':'#ff90ac',pressureColor=values.pressure?'#65e5b5':'#ff90ac';
  u.text(temps[e.temp],40,448,25,tempColor);u.text(t(e.outer===0?'and':'or'),315,448,23);
  u.text(`(${t('light')} ≥ 50 ${t(e.inner===0?'and':'or')} ${t('backup')})`,40,490,24,innerColor,700);
  u.text(`${t(e.outer===0?'and':'or')} ${e.negate?t('not'):''} ${t('pressure')}`,40,535,24,pressureColor);
  u.text(t(values.result?'if':'else'),40,583,26,values.result?'#65e5b5':'#ff90ac');
  u.button(t('test'),40,650,440,58,'run',{accent:true,disabled:app.state.running});u.button(`${t('case')} ${app.sensorIndex+1} →`,500,650,245,58,'sensor');
  u.text(`${t('temperature')}: ${sensors.t}°C · ${t('light')}: ${sensors.l}`,800,295,24);
  u.text(`${t('backup')}: ${t(sensors.backup?'on':'off')} · ${t('pressure')}: ${t(sensors.pressure?'on':'off')}`,800,335,22,'#a8c2d3',750);
  u.text(`${t('case')}    T / L / R / D       ${t('actual')} / ${t('expected')}`,800,389,18,'#84b4c5');
  const rows=checkDoor(e,c);
  rows.forEach((row,j)=>{const y=425+j*33;u.rect(800,y,740,29,j===app.sensorIndex?'#244652':'#102533');const v=row.sensors;u.text(`${j+1}       ${v.t} / ${v.l} / ${+v.backup} / ${+v.pressure}`,815,y+4,18);if(app.doorTested)u.text(`${t(row.result?'true':'false')} / ${t(row.expected?'true':'false')} ${row.pass?'✓':'×'}`,1135,y+4,17,row.pass?'#6ce0b6':'#ff8aaa');});
  u.text(`R: ${t('backup')} · D: ${t('pressure')}`,800,696,17,'#91adbd');
}
function portal(app,t){
  const {ui:u,route,state:s}=app,g=app.tasks.portal,cost=routeCost(g,route),current=route.at(-1);
  u.text(t('route'),40,298,20,'#8ebdca');u.text(route.join(' → '),40,340,32,'#66edd4',700);
  u.text(`${t('cost')}: ${cost}`,40,408,28);u.text(`${t('energy')}: ${g.budget-cost} / ${g.budget}`,40,458,28,g.budget<cost?'#ff9db6':'#a996ed');
  Object.keys(g.nodes).forEach((node,j)=>{const c=edgeCost(g,current,node);u.button(node+(Number.isFinite(c)?` · ${c}`:''),40+(j%3)*240,535+Math.floor(j/3)*55,222,45,'node:'+node,{disabled:s.running||!Number.isFinite(c)||current==='P',active:node===current});});
  [['undo','undo'],['clear','clear'],['run','run'],['stop','reset']].forEach(([key,action],j)=>u.button(t(key),40+j*178,656,164,53,action,{disabled:s.running&&action!=='reset',accent:action==='run'}));
  const point=node=>{const [x,y]=g.nodes[node];return [860+x*152,480-y*122];};
  for(const [a,b,weight] of g.edges){const [x1,y1]=point(a),[x2,y2]=point(b);const chosen=route.some((node,j)=>j>0&&((route[j-1]===a&&node===b)||(route[j-1]===b&&node===a)));u.line(x1,y1,x2,y2,chosen?'#5cf0ce':'#344c65',chosen?6:3);const mx=(x1+x2)/2,my=(y1+y2)/2;u.rect(mx-15,my-14,30,28,'#0a1c2d');u.text(weight,mx-7,my-11,20,chosen?'#78f0d0':'#b5a3ef');}
  for(const node of Object.keys(g.nodes)){const [x,y]=point(node);u.rect(x-26,y-26,52,52,route.includes(node)?'#398c7a':'#293952');u.text(node,x-10,y-17,28,'#e2fff7');}
  u.text(t('portalRule'),800,650,19,'#8daebc',730);
}
