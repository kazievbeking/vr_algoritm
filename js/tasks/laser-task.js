export function expandProgram(program, limit=64) {
  const steps=[];
  if (!Array.isArray(program) || program.length>16) throw new Error('limit');
  program.forEach((item,index)=>{
    if (item.command==='repeat') {
      if (!Number.isInteger(item.count)||item.count<2||item.count>4||!Number.isInteger(item.group)||item.group<1||item.group>3||item.group>index) throw new Error('group');
      const group=program.slice(index-item.group,index);
      if (group.some(c=>c.command==='repeat')) throw new Error('nested');
      for(let n=1;n<item.count;n++) for(const c of group) steps.push({command:c.command,index});
    } else {
      if(!['forward','left','right','wait'].includes(item.command)) throw new Error('command');
      steps.push({command:item.command,index});
    }
    if(steps.length>limit) throw new Error('limit');
  });
  return steps;
}
export const laserActive = tick => tick%2===1;
export function laserStep(state,command,config) {
  const next={...state,tick:state.tick+1};
  if(command==='left') next.dir=(next.dir+3)%4;
  if(command==='right') next.dir=(next.dir+1)%4;
  if(command==='forward') {
    const [dx,dy]=[[0,-1],[1,0],[0,1],[-1,0]][next.dir]; next.x+=dx; next.y+=dy;
  }
  if(next.x<0||next.y<0||next.x>=config.size||next.y>=config.size) return {...next,error:'boundary'};
  if(config.obstacles.some(([x,y])=>x===next.x&&y===next.y)) return {...next,error:'obstacle'};
  if(laserActive(next.tick)&&config.lasers.some(([x,y])=>x===next.x&&y===next.y)) return {...next,error:'laserHit'};
  return next;
}
export function simulate(program,config) {
  let state={...config.start,tick:0}; const trace=[];
  for(const step of expandProgram(program,config.maxSteps)) {state=laserStep(state,step.command,config);trace.push({...state,index:step.index});if(state.error) break;}
  return {state,trace,success:!state.error&&state.x===config.goal[0]&&state.y===config.goal[1]};
}
