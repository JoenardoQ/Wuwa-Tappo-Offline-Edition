const fs=require('fs'),path=require('path'),assert=require('assert/strict'),core=require('./core.cjs');
module.exports=async({app,pet,studio,items,getState,save,dataDir,input})=>{
 const out=process.env.WUWA_QA_OUTPUT||path.join(__dirname,'..','qa');fs.mkdirSync(out,{recursive:true});const frames=new Map();for(const w of [pet,studio])w.webContents.on('paint',(_e,_dirty,frame)=>{if(!frame.isEmpty())frames.set(w.id,frame.toPNG());});const errors=[];for(const w of [pet,studio])w.webContents.on('console-message',(_e,level,message)=>{if(level===3&&!/ERR_BLOCKED_BY_CLIENT/.test(message))errors.push(message);});
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),js=(w,s)=>w.webContents.executeJavaScript(s);const results=[];async function capture(name,w){if(!process.argv.includes('--snapshot'))return;w.webContents.invalidate();await wait(350);const png=(await w.webContents.capturePage()).toPNG();if(!png.length)throw Error('Empty screenshot: '+name);fs.writeFileSync(out+'/'+name+'.png',png);}
 try{
 for(let i=0;i<80;i++){await wait(250);if(await js(studio,'typeof window.__studioTest === "function" && window.__studioTest().owned>0').catch(()=>false))break;}
 studio.show();studio.focus();pet.showInactive();await wait(1800);assert.equal((await js(studio,'window.__studioTest()')).owned,11);assert((await js(pet,'window.__petTest()')).loaded);assert.equal((await js(pet,'window.__petTest()')).keys,42);assert.equal(await js(studio,'[...document.querySelectorAll(".page")].filter(e=>getComputedStyle(e).display!=="none").length'),1);results.push('初始11件、角色分层图片加载、42键布局');
 await capture('collection',studio);await capture('pet',pet);

 if(process.argv.includes('--snapshot')){
  await js(studio,"window.petAPI.command('settings',{hoverFade:false})");
  await js(pet,"document.getElementById('counter').textContent='999';document.getElementById('counter').click()");
  await wait(850);await capture('pet-menu',pet);
  await js(studio,"window.petAPI.command('emote',"+JSON.stringify(getState().emotes[0])+")");
  await wait(50);
  await js(pet,"for(const a of document.querySelector('.local-emotion-bubble').getAnimations()){a.pause();a.currentTime=350;}");
  await capture('pet-emote',pet);
  await js(studio,"document.querySelector('[data-page=atlas]').click();document.querySelector('[data-type=emote]').click()");
  await capture('emote-atlas',studio);
  fs.writeFileSync(out+'/visual.json',JSON.stringify(await js(pet,"({toolbar:(()=>{const e=document.querySelector('.pet-toolbar'),r=e.getBoundingClientRect(),s=getComputedStyle(e);return{width:r.width,height:r.height,background:s.backgroundImage};})(),bubbles:document.querySelectorAll('.local-emotion-bubble').length})"),null,2));return;
 }

 await js(studio,"document.querySelector('[data-page=draw]').click();document.querySelector('[data-draw=\"10\"]').click()");studio.show();studio.focus();pet.showInactive();await wait(1800);assert.equal(getState().draws,10);assert.equal(await js(studio,'document.querySelectorAll(".result-card").length'),10);try{await capture('ten-draw',studio);}catch{}results.push('十连界面、10个结果、新物品保存');
 await js(studio,"document.getElementById('closeResults').click();document.querySelector('[data-draw=\"1\"]').click()");await wait(500);assert.equal(getState().draws,11);assert.equal(await js(studio,'document.querySelectorAll(".result-card").length'),1);results.push('单抽界面');
 await js(studio,"document.getElementById('closeResults').click()");const male=items.find(x=>x.starter&&x.roleId===1501);await js(studio,`window.petAPI.command('equip',${JSON.stringify(male.id)})`);await wait(400);assert.equal((await js(pet,'window.__petTest()')).character,male.id);results.push('换装同步至桌宠');
 const before=getState().count;input('A',true,'left');await wait(50);assert.equal((await js(pet,'window.__petTest()')).action,2);assert.equal(await js(pet,'document.querySelector(\'[data-key="A"]\').classList.contains("active")'),true);input('A',false);await wait(200);assert.equal(getState().count,before+1);assert.equal((await js(pet,'window.__petTest()')).action,1);assert.equal(await js(pet,'document.querySelector(\'[data-key="A"]\').classList.contains("active")'),false);results.push('输入事件、拍桌、复位、计数');

 getState().count=998;input('Q',true,'left');input('Q',true,'left');assert.equal(getState().count,999);input('Q',false);
 input('W',true,'left');input('W',true,'left');await wait(80);assert.equal(getState().count,0);assert.equal((await js(pet,'window.__petTest()')).count,'0');
 const popped=await js(pet,"[...document.querySelectorAll('.local-emotion-bubble')].map(x=>x.dataset.emote)");
 assert.equal(popped.length,1);assert(getState().emotes.includes(popped[0]));input('W',false);assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir,'collection.json'))).count,0);
 assert.equal(await js(pet,"getComputedStyle(document.querySelector('.local-emotion-bubble__img')).width"),'80px');
 assert.equal(await js(pet,"getComputedStyle(document.querySelector('.local-emotion-bubble')).animationDuration"),'1s');
 await wait(1250);assert.equal(await js(pet,"document.querySelectorAll('.local-emotion-bubble').length"),0);
 await js(pet,"document.getElementById('counter').click()");await wait(800);
 assert.equal(await js(pet,"getComputedStyle(document.querySelector('.emotion-img')).width"),'30px');
 const sourcePaths=await js(pet,"[...document.querySelectorAll('.emotion-img')].map(x=>x.getAttribute('src'))");
 assert(sourcePaths.every(src=>getState().emotes.some(id=>items.find(x=>x.id===id).image===src)));
 results.push('998→999→0、按住不重复、仅装备表情随机浮现、原版80px/1s动画、30px互动素材');
 await js(studio,"window.petAPI.command('settings',{alwaysOnTop:false})");assert.equal(getState().settings.alwaysOnTop,true);assert(pet.isAlwaysOnTop());
 const visible=pet.isVisible.bind(pet);pet.isVisible=()=>true;pet.setAlwaysOnTop(false);await wait(1150);assert(pet.isAlwaysOnTop());pet.isVisible=visible;
 results.push('置顶设置不可关闭、被取消后自动恢复最高置顶层');

 await js(studio,`window.petAPI.command('emote',${JSON.stringify(getState().emotes[0])})`);await wait(200);assert((await js(pet,'window.__petTest()')).bubble);results.push('表情气泡');
 await js(studio,"window.petAPI.command('preset-save','测试搭配')");assert.equal(getState().presets.length,1);results.push('搭配保存');
 getState().owned[male.id]=101;const synth=await js(studio,"window.petAPI.command('synthesize',{n:10,rarity:'common'})");assert(synth.ok);assert.equal(synth.result.length,10);assert(getState().owned[male.id]>=1);results.push('十次合成接口、保留最后一份');
 const offline=await js(studio,"fetch('https://example.com').then(()=>false).catch(()=>true)");assert(offline);results.push('运行期间网络请求被禁用');
 const persisted=JSON.parse(fs.readFileSync(path.join(dataDir,'collection.json'),'utf8'));assert.equal(persisted.draws,11);assert.equal(persisted.presets.length,1);results.push('磁盘存档验证');
 await js(studio,"document.querySelector('[data-page=atlas]').click()");await wait(300);assert.equal((await js(studio,'window.__studioTest()')).groupCount,4);await capture('atlas',studio);
 await js(studio,"document.querySelector('[data-type=character]').click()");assert.equal((await js(studio,'window.__studioTest()')).filterCount,3);

 assert.equal((await js(studio,'window.__studioTest()')).visibleCards,60);
 for(const n of [120,180,240,260]){
  const pos=await js(studio,"document.getElementById('inventory').scrollTop=200;window.__firstCard=document.querySelector('#inventory .item-card');document.getElementById('inventory').scrollTop");
  await js(studio,"document.getElementById('loadMore').click()");
  assert.equal((await js(studio,'window.__studioTest()')).visibleCards,n);
  assert.equal(await js(studio,"document.getElementById('inventory').scrollTop"),pos);
  assert(await js(studio,"window.__firstCard===document.querySelector('#inventory .item-card')"));
 }
 assert(await js(studio,"document.getElementById('loadMore').hidden"));
 await js(studio,"window.petAPI.command('favorite',document.querySelector('#inventory .item-card').dataset.id)");
 assert.equal((await js(studio,'window.__studioTest()')).visibleCards,260);
 await js(studio,"document.querySelector('[data-type=emote]').click()");
 for(let i=0;i<8;i++)await js(studio,"document.getElementById('loadMore').click()");
 assert.equal((await js(studio,'window.__studioTest()')).visibleCards,504);
 assert.equal(await js(studio,"new Set([...document.querySelectorAll('#inventory .item-card')].map(x=>x.dataset.id)).size"),504);
 await js(studio,"document.querySelector('[data-type=character]').click()");
 assert.equal((await js(studio,'window.__studioTest()')).visibleCards,60);
 results.push('显示更多连续加载260角色/504表情、保留滚动及旧卡片、筛选后正确重置');

 await js(studio,"document.querySelector('[data-filter=series] .select-input').click()");await wait(200);await capture('filters',studio);
 await js(studio,"document.querySelector('[data-filter=series] [data-value=\"1007\"]').click()");assert.equal((await js(studio,'window.__studioTest()')).visibleCards,10);
 await js(studio,"document.querySelector('[data-filter=role] [data-value=\"1107\"]').click()");assert.equal((await js(studio,'window.__studioTest()')).visibleCards,1);results.push('品质分组、7个系列/55个角色索引、系列与角色组合筛选');
 await js(studio,"document.querySelector('[data-page=synthesis]').click()");await wait(200);assert.equal(await js(studio,'document.querySelectorAll(".synthesis-item").length'),10);await capture('synthesis',studio);
 await js(studio,"document.querySelector('[data-synth-mode=same]').click()");assert.equal(await js(studio,'document.querySelectorAll(".synthesis-item").length'),5);results.push('升阶10槽、平阶5槽、单次与十连按钮');
 await js(studio,"document.querySelector('[data-page=settings]').click()");await wait(200);try{await capture('settings',studio);}catch{}
 assert.equal(errors.filter(e=>!e.includes('Content Security Policy')).length,0);fs.writeFileSync(out+'/result.json',JSON.stringify({ok:true,results,errors,hook:global.__QA.hook()},null,2));console.log('QA_SUCCESS '+JSON.stringify(results));
 }catch(e){fs.writeFileSync(out+'/result.json',JSON.stringify({ok:false,results,error:e.stack,errors},null,2));console.error('QA_FAILED',e);}
 finally{await wait(100);app.quit();}
};
