export const correctDoor={temp:0,inner:1,outer:0,negate:true};
export function evaluateDoor(expression,sensors,config) {
  const temp=[sensors.t<=config.temperatureMax,sensors.t<config.temperatureMax,true][expression.temp];
  const light=sensors.l>=config.lightMin;
  const inner=expression.inner===0 ? light&&sensors.backup : light||sensors.backup;
  const pressure=expression.negate ? !sensors.pressure : sensors.pressure;
  const result=expression.outer===0 ? temp&&inner&&pressure : temp||inner||pressure;
  return {temp,light,inner,pressure,result};
}
export function checkDoor(expression,config) {
  return config.cases.map(sensors=>{
    const actual=evaluateDoor(expression,sensors,config);
    const expected=sensors.t<=config.temperatureMax&&(sensors.l>=config.lightMin||sensors.backup)&&!sensors.pressure;
    return {sensors,...actual,expected,pass:actual.result===expected};
  });
}
