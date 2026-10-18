// Optional integration check: PLAYWRIGHT_CORE points to an external playwright-core directory.
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_CORE);
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE,headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[],badRequests=[];
page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.status()>=400)badRequests.push(`${r.status()} ${r.url()}`);});
await mkdir('artifacts',{recursive:true});
const click=async action=>{await page.locator(`[data-action="${action}"]`).first().evaluate(el=>el.emit('click'));await page.waitForTimeout(40);};
const completed=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('uaqyt-v1'))?.completed);
try{
  await page.goto(process.env.QUEST_URL||'http://localhost:8080/',{waitUntil:'networkidle'});
  await page.locator('#landing').waitFor({state:'visible',timeout:30000});await page.screenshot({path:'artifacts/01-landing.png'});
  await page.locator('[data-command="start"]').click();await page.waitForTimeout(500);
  // Exercise the real mouse raycaster against a projected 3D button.
  const xy=await page.locator('[data-action="add:forward"]').evaluate(el=>{const p=new AFRAME.THREE.Vector3();el.object3D.getWorldPosition(p);p.project(el.sceneEl.camera);const rect=el.sceneEl.canvas.getBoundingClientRect();return {x:rect.left+(p.x+1)/2*rect.width,y:rect.top+(1-p.y)/2*rect.height};});
  await page.mouse.move(xy.x,xy.y);await page.waitForTimeout(200);await page.mouse.click(xy.x,xy.y);await page.waitForTimeout(100);
  await click('run');await page.waitForTimeout(1200);assert.equal((await completed())[0],false);
  await click('clear');await click('add:forward');await click('count');await click('count');await click('add:repeat');
  await click('run');await page.waitForTimeout(750);await click('reset');await page.waitForTimeout(2200);assert.equal((await completed())[0],false);
  await click('add:right');await click('add:wait');await click('add:forward');await click('add:repeat');
  await page.screenshot({path:'artifacts/02-laser-program.png'});
  await page.locator('[data-action="run"]').evaluate(el=>{el.emit('click');el.emit('click');});await page.waitForFunction(()=>JSON.parse(localStorage.getItem('uaqyt-v1'))?.completed[0],null,{timeout:15000});assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('uaqyt-v1')).attempts[0]),3);
  await click('station:1');await click('run');await page.waitForTimeout(650);assert.equal((await completed())[1],false);
  // Defaults: T<40, AND inside, OR outside, no NOT.
  await click('temp');await click('temp');await click('inner');await click('outer');await click('negate');
  await click('run');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('uaqyt-v1'))?.completed[1]);await page.screenshot({path:'artifacts/03-door.png'});
  await click('station:2');await click('node:C');await click('node:P');await click('run');await page.waitForTimeout(100);assert.equal((await completed())[2],false);
  await click('clear');await click('node:C');await click('node:B');await click('node:P');await click('run');await page.waitForTimeout(750);await click('reset');await page.waitForTimeout(2200);assert.equal((await completed())[2],false);
  await click('node:C');await click('node:B');await click('node:P');await click('run');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('uaqyt-v1'))?.completed[2]);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('uaqyt-v1')).lastCost),9);
  await click('replay');await click('node:A');await click('node:B');await click('node:P');await page.screenshot({path:'artifacts/04-portal.png'});await click('run');await page.waitForTimeout(2900);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('uaqyt-v1')).lastCost),7);
  await click('finish');await page.screenshot({path:'artifacts/05-final.png'});
  await page.reload();await page.locator('#landing').waitFor({state:'visible'});assert.equal(await page.locator('#continue').isVisible(),true);await page.locator('#continue').click();await page.waitForTimeout(200);assert.deepEqual(await completed(),[true,true,true]);
  await click('new');await click('cancel-new');assert.deepEqual(await completed(),[true,true,true]);
  await click('menu');await page.locator('#language').selectOption('ru');assert.equal(await page.locator('h1').innerText(),'Ловушка времени');await page.locator('#language').selectOption('en');assert.equal(await page.locator('h1').innerText(),'Time trap');await page.locator('#language').selectOption('kk');
  await page.evaluate(()=>localStorage.setItem('uaqyt-v1','{broken'));await page.reload();await page.locator('#landing').waitFor({state:'visible'});assert.equal(await page.locator('#continue').isVisible(),false);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/06-mobile.png'});assert.equal(await page.evaluate(()=>document.querySelector('#landing').scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);assert.deepEqual(badRequests,[]);
  const report={passed:true,checks:['3D mouse ray','wrong laser program','reset during execution','duplicate run ignored','all three trials','door negative cases','over-budget route','valid non-optimal route','optimal route','final','resume','new game cancellation','three languages','corrupt save','mobile layout','no browser errors or failed requests'],errors,badRequests};
  await writeFile('artifacts/browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}catch(error){await page.screenshot({path:'artifacts/failure.png'});console.error({errors,badRequests});throw error;}finally{await browser.close();}
