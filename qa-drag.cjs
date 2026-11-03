// Native Windows regression: exercise the same renderer IPC used by real dragging.
// QA uses an isolated profile; no real collection or Windows display setting changes.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
module.exports=async({app,pet,studio,getState})=>{
 const out=process.env.WUWA_QA_OUTPUT||path.join(__dirname,'qa-output');
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const js=(w,code)=>w.webContents.executeJavaScript(code);
 const move=async(dx,dy)=>{await js(pet,`window.petAPI.move(${dx},${dy})`);await wait(8);};
 const settings=async(value)=>{const r=await js(pet,`window.petAPI.command('settings',${JSON.stringify(value)})`);assert(r.ok,r.error);await wait(100);};
 const rendered=()=>js(pet,"({width:innerWidth,height:innerHeight,rootWidth:document.getElementById('petRoot').getBoundingClientRect().width})");
 const settledView=async()=>{let view;for(let i=0;i<120;i++){pet.webContents.invalidate();view=await rendered();if(Math.abs(view.width-pet.getBounds().width)<=2&&Math.abs(view.rootWidth-view.width)<=2)return view;await wait(25);}throw Error('Renderer resize did not settle: '+JSON.stringify({view,bounds:pet.getBounds()}));};
 const nearSize=(bounds,expected)=>{for(const k of ['width','height'])assert(Math.abs(bounds[k]-expected[k])<=2,`${k}: ${bounds[k]} vs ${expected[k]}`);};
 const result={ok:false,electron:process.versions.electron,factor:app.commandLine.getSwitchValue('force-device-scale-factor'),cases:[],checks:[]};
 try{
  for(let i=0;i<100;i++){if(await js(pet,'typeof window.__petTest==="function"&&window.__petTest().loaded').catch(()=>false))break;await wait(50);}
  assert(await js(pet,'window.__petTest().loaded'));
  for(const scale of [.65,1,1.1]){
   await settings({scale,lockDrag:false,gameMode:false,passthrough:false});
   await js(pet,"window.petAPI.command('recenter')");
   await move(0,0);await wait(100);
   const expected={width:Math.round(320*scale),height:Math.round(350*scale)},before=pet.getBounds(),viewBefore=await settledView(),samples=[];
   nearSize(before,expected);
   for(let i=0;i<120;i++){await move(i%2?8:-8,i%2?6:-6);if(i%5===4)samples.push(pet.getBounds());}
   await wait(100);const after=pet.getBounds(),viewAfter=await settledView();
   for(const k of ['width','height']){const sizes=[before,...samples,after].map(b=>b[k]);assert(Math.max(...sizes)-Math.min(...sizes)<=2,`Cumulative ${k} drift at ${scale}: ${Math.min(...sizes)} -> ${Math.max(...sizes)}`);}
   assert(samples.some(b=>b.x!==before.x||b.y!==before.y),'Drag IPC must actually move the window');
   nearSize(after,expected);assert(Math.abs(viewAfter.rootWidth-viewBefore.rootWidth)<=2,'Visible pet must not grow: '+JSON.stringify({viewBefore,viewAfter}));
   assert.equal(getState().settings.scale,scale);
   // A previously oversized native window must recover from the saved setting.
   pet.setBounds({...after,width:expected.width+40,height:expected.height+40});await wait(50);await move(0,0);await wait(100);nearSize(pet.getBounds(),expected);
   result.cases.push({scale,moves:120,expected,before,after,viewBefore,viewAfter,samples,recovered:pet.getBounds()});
  }
  for(const flag of ['lockDrag','gameMode','passthrough']){
   await settings({[flag]:true});const b=pet.getBounds();await move(-20,-20);assert.deepEqual(pet.getBounds(),b,flag);await settings({[flag]:false});result.checks.push(flag+' blocks dragging');
  }
  const b=pet.getBounds();await move('NaN',0);await move(0,'Infinity');assert.deepEqual(pet.getBounds(),b);result.checks.push('Non-finite deltas ignored');
  for(let i=0;i<100;i++){if(await js(studio,'!!window.petAPI').catch(()=>false))break;await wait(30);}
  await js(studio,'window.petAPI.move(-20,-20)');await wait(50);assert.deepEqual(pet.getBounds(),b);result.checks.push('Only pet renderer can drag pet');
  result.ok=true;
 }catch(error){result.error=error.stack;console.error(error.stack);process.exitCode=1;}
 finally{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'drag-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({factor:result.factor,ok:result.ok,cases:result.cases.length,checks:result.checks.length}));app.quit();}
};
