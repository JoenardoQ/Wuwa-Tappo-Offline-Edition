const {app,BrowserWindow,ipcMain,screen,Tray,Menu,nativeImage,globalShortcut,session,shell}=require('electron');
const fs=require('fs'),path=require('path');
const core=require('./core.cjs'),storage=require('./storage.cjs'),{items}=require('./catalog.json');
const QA=process.argv.includes('--qa'),PORTABLE=app.isPackaged?path.dirname(process.execPath):__dirname;
const SELFTEST=QA&&process.argv.includes('--selftest')&&!process.argv.includes('--snapshot')&&!process.argv.includes('--interactive-test');
const dataDir=QA?path.join(process.env.WUWA_QA_OUTPUT||path.join(__dirname,'..'),'qa-data-'+process.pid):path.join(app.getPath('appData'),'WuwaTappoOffline');
fs.mkdirSync(dataDir,{recursive:true});app.setName('Wuwa Tappo 离线版');app.setPath('userData',path.join(dataDir,'runtime'));
const primaryInstance=app.requestSingleInstanceLock();
const savePath=path.join(dataDir,'collection.json'),profile=primaryInstance&&!QA?storage.initProfile({dataDir,portableDir:PORTABLE,searchRoots:[app.getPath('downloads')],items}):{state:core.initial(items),warning:''};let state=profile.state,saveWarning=profile.warning;
let pet,studio,tray,hook,hookStatus='正在连接键盘',saveTimer,quitting=false,pressed=new Set(),inputSerial=0,topTimer,pointerTimer,lastIgnore;
const writeState=storage.createWriter(savePath);
async function save(){try{await writeState(state);return true;}catch(e){saveWarning='收藏保存失败，请检查文件夹写入权限';status();return false;}}
function laterSave(){if(!saveTimer)saveTimer=setTimeout(()=>{saveTimer=null;save();},3000);}
function windows(){return[pet,studio].filter(w=>w&&!w.isDestroyed());}
function broadcast(){for(const w of windows())w.webContents.send('state',state);}
function status(){for(const w of windows())w.webContents.send('status',{hook:hookStatus,warning:saveWarning});}
function display(){const ds=screen.getAllDisplays();return ds[state.settings.monitor]||screen.getPrimaryDisplay();}
function place(){if(!pet)return;const a=display().workArea;const w=Math.round(320*state.settings.scale),h=Math.round(350*state.settings.scale);pet.setBounds({x:a.x+a.width-w-24,y:a.y+a.height-h-12,width:w,height:h});}
function keepPetOnTop(){if(!pet||pet.isDestroyed()||!pet.isVisible())return;if(!pet.isAlwaysOnTop())pet.setAlwaysOnTop(true,'screen-saver');pet.moveTop();}
function pointerMode(){if(!pet||pet.isDestroyed())return;const b=pet.getBounds(),cursor=screen.getCursorScreenPoint();const ignore=state.settings.passthrough||state.settings.gameMode||cursor.y<b.y+100*state.settings.scale;if(ignore!==lastIgnore){pet.setIgnoreMouseEvents(ignore,{forward:true});lastIgnore=ignore;}}
function applySettings(){if(!pet)return;pet.setAlwaysOnTop(true,'screen-saver');keepPetOnTop();pet.setOpacity(state.settings.opacity);pointerMode();if(tray)tray.setContextMenu(menu());}
let studioRestoreBounds=null;
function fitStudio(bounds){const a=screen.getDisplayMatching(bounds).workArea,width=Math.round(Math.max(Math.min(680,a.width),Math.min(bounds.width,a.width))),height=Math.round(Math.max(Math.min(468,a.height),Math.min(bounds.height,a.height)));return{x:Math.round(Math.max(a.x,Math.min(bounds.x,a.x+a.width-width))),y:Math.round(Math.max(a.y,Math.min(bounds.y,a.y+a.height-height))),width,height};}
function studioWindow(action){if(!studio||studio.isDestroyed())return;if(action==='minimize'){studio.minimize();return;}const b=studio.getBounds();if(action==='maximize'){if(studioRestoreBounds){studio.setBounds(fitStudio(studioRestoreBounds));studioRestoreBounds=null;}else{studioRestoreBounds=b;studio.setBounds(screen.getDisplayMatching(b).workArea);}return;}if(action==='smaller'||action==='larger'){const factor=action==='larger'?1.1:1/1.1;studioRestoreBounds=null;studio.setBounds(fitStudio({...b,width:b.width*factor,height:b.height*factor}));}}

function showStudio(){if(studio&&!studio.isDestroyed()){if(studio.isMinimized())studio.restore();studio.setBounds(fitStudio(studio.getBounds()));studio.show();studio.focus();return;}
 const a=screen.getPrimaryDisplay().workArea;
 studio=new BrowserWindow({width:Math.min(1100,a.width-50),height:Math.min(756,a.height-50),minWidth:Math.min(680,a.width),minHeight:Math.min(468,a.height),resizable:true,maximizable:true,minimizable:true,frame:false,transparent:true,show:false,title:'Wuwa Tappo 离线版 · 收藏与搭配',backgroundColor:'#00000000',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,offscreen:SELFTEST}});
 studio.loadFile('studio.html');studio.webContents.once('did-finish-load',()=>setTimeout(()=>{studio.show();studio.focus();},200));studio.on('focus',()=>setTimeout(keepPetOnTop,0));studio.on('close',e=>{if(!quitting){e.preventDefault();studio.hide();}});secure(studio);
}
function secure(w){w.webContents.setWindowOpenHandler(()=>({action:'deny'}));w.webContents.on('will-navigate',e=>e.preventDefault());}
function menu(){return Menu.buildFromTemplate([{label:'收藏与搭配',click:showStudio},{label:'显示桌宠 / 回到屏幕角落',click:()=>{pet.show();place();}},{label:'鼠标穿透（Ctrl+Alt+P 可恢复）',type:'checkbox',checked:state.settings.passthrough,click:()=>{state.settings.passthrough=!state.settings.passthrough;applySettings();save();broadcast();}},{label:'响应键盘和鼠标',type:'checkbox',checked:state.settings.inputEnabled,click:()=>{state.settings.inputEnabled=!state.settings.inputEnabled;applySettings();save();broadcast();}},{type:'separator'},{label:'退出Wuwa Tappo 离线版',click:()=>app.quit()}]);}
function input(key,down,side){if(!state.settings.inputEnabled)return;if(down&&pressed.has(key))return;if(down){pressed.add(key);const emote=core.registerTap(state,items);if(state.count===0){save();if(emote)pet?.webContents.send('emote',emote);}else laterSave();}else pressed.delete(key);const event={key,down,side,count:state.count,serial:++inputSerial};if(pet&&!pet.isDestroyed())pet.webContents.send('input',event);}
function startHook(){try{const {uIOhook,UiohookKey}=require('uiohook-napi');hook=uIOhook;const names=new Map();for(const [k,v]of Object.entries(UiohookKey))if(!names.has(v))names.set(v,k);
 hook.on('keydown',e=>{if(QA&&process.argv.includes('--selftest'))return;const key=names.get(e.keycode)||'Other';input(key,true,/^[QWERTASDFGZXCVB12345]$|Left|^Ctrl$|^Shift$|^Alt$|Tab|CapsLock/.test(key)?'left':'right');if(e.ctrlKey&&e.altKey&&['1','2','3','4','5'].includes(key)){const id=state.emotes[Number(key)-1];if(id)pet.webContents.send('emote',id);}});
 hook.on('keyup',e=>{if(QA&&process.argv.includes('--selftest'))return;input(names.get(e.keycode)||'Other',false);});hook.on('mousedown',e=>{if(QA&&process.argv.includes('--selftest'))return;input(e.button===1?'MouseLeft':e.button===2?'MouseRight':'MouseMiddle',true,e.button===1?'left':'right');});hook.on('mouseup',e=>{if(QA&&process.argv.includes('--selftest'))return;input(e.button===1?'MouseLeft':e.button===2?'MouseRight':'MouseMiddle',false);});hook.start();hookStatus='全局键盘与鼠标已连接';
 }catch(e){hookStatus='全局输入暂不可用，可点击桌宠互动';fs.appendFileSync(path.join(dataDir,'errors.log'),String(e)+'\n');}status();}
ipcMain.handle('init',()=>({state,items,filters:require('./catalog.json').filters,status:{hook:hookStatus,warning:saveWarning},monitors:screen.getAllDisplays().map((d,i)=>({id:i,label:`屏幕 ${i+1} · ${d.size.width}×${d.size.height}`}))}));
ipcMain.handle('command',async(_,name,arg)=>{try{let result=null;switch(name){
 case 'open':showStudio();if(arg){if(studio.webContents.isLoading())studio.webContents.once('did-finish-load',()=>setTimeout(()=>studio.webContents.send('page',arg),300));else studio.webContents.send('page',arg);}return {ok:true};
 case 'hide':studio?.hide();return{ok:true};
 case 'draw':result=core.draw(state,items,arg);break;
 case 'synthesize':result=core.synthesize(state,items,arg.n,arg.rarity,Math.random,arg);break;
 case 'equip':core.equip(state,items,arg);break;
 case 'emote-replace':core.replaceEmote(state,items,arg.id,arg.slot);break;
 case 'window':studioWindow(arg);return{ok:true};
 case 'favorite':if(!items.some(x=>x.id===arg))throw Error('物品不存在');state.favorites=state.favorites.includes(arg)?state.favorites.filter(x=>x!==arg):[...state.favorites,arg];break;
 case 'preset-save':{const label=String(arg||'我的搭配').trim().slice(0,24);if(state.presets.length>=12)throw Error('最多保存 12 套搭配');state.presets.push({id:Date.now().toString(36),name:label,character:state.character,accessory:state.accessory,emotes:[...state.emotes]});break;}
 case 'preset-load':{const p=state.presets.find(x=>x.id===arg);if(!p)throw Error('搭配不存在');state.character=p.character;state.accessory=p.accessory;state.emotes=[...p.emotes];break;}
 case 'preset-delete':state.presets=state.presets.filter(x=>x.id!==arg);break;
 case 'emote':if(!state.owned[arg]||!items.some(x=>x.id===arg&&x.type==='emote'))throw Error('表情未获得');pet.webContents.send('emote',arg);return{ok:true};
 case 'settings':{pressed.clear();const old=state.settings;const next=core.settings({...old,...arg});if(next.autoStart!==old.autoStart){if(!app.isPackaged&&next.autoStart)throw Error('请从便携版开启开机启动');app.setLoginItemSettings({openAtLogin:next.autoStart,path:process.execPath,args:[]});}state.settings=next;applySettings();if(next.scale!==old.scale||next.monitor!==old.monitor)place();break;}
 case 'recenter':place();pet.show();return{ok:true};
 case 'tap':if(hookStatus!=='全局键盘与鼠标已连接'){input('MouseLeft',true,'left');input('MouseLeft',false);}return{ok:true};
 case 'folder':await shell.openPath(dataDir);return{ok:true};
 case 'quit':app.quit();return{ok:true};
 default:throw Error('未知操作');}
 const saved=await save();broadcast();return{ok:true,result,warning:saved?'':saveWarning};}catch(e){return{ok:false,error:e.message};}});
ipcMain.on('move',(_,dx,dy)=>{if(state.settings.passthrough||state.settings.lockDrag||state.settings.gameMode||!Number.isFinite(dx)||!Number.isFinite(dy))return;const [x,y]=pet.getPosition();const a=screen.getDisplayMatching(pet.getBounds()).workArea;const b=pet.getBounds();pet.setPosition(Math.round(Math.max(a.x-b.width+100,Math.min(a.x+a.width-100,x+dx))),Math.round(Math.max(a.y-250,Math.min(a.y+a.height-b.height+20,y+dy))));});
ipcMain.on('resize-studio',(event,edge,dx,dy)=>{if(!studio||event.sender!==studio.webContents||!['n','s','e','w','ne','nw','se','sw'].includes(edge)||!Number.isFinite(dx)||!Number.isFinite(dy))return;studioRestoreBounds=null;const b=studio.getBounds();if(edge.includes('e'))b.width+=dx;if(edge.includes('s'))b.height+=dy;if(edge.includes('w')){b.x+=dx;b.width-=dx;}if(edge.includes('n')){b.y+=dy;b.height-=dy;}studio.setBounds(fitStudio(b));});
if(!primaryInstance){app.quit();}else{
app.on('second-instance',()=>{pet?.show();showStudio();});
app.whenReady().then(async()=>{
 session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']},(details,callback)=>callback({cancel:true}));
 session.defaultSession.setPermissionRequestHandler((_,__,callback)=>callback(false));
 pet=new BrowserWindow({width:320,height:350,transparent:true,frame:false,resizable:false,skipTaskbar:true,hasShadow:false,alwaysOnTop:true,title:'Wuwa Tappo 离线版 · 桌宠',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,offscreen:SELFTEST,backgroundThrottling:false}});
 secure(pet);pet.loadFile('pet.html');pet.webContents.once('did-finish-load',()=>setTimeout(()=>pet.showInactive(),300));pet.on('closed',()=>{pet=null;});place();applySettings();for(const event of ['show','restore','blur'])pet.on(event,()=>setTimeout(keepPetOnTop,0));topTimer=setInterval(keepPetOnTop,3000);pointerTimer=setInterval(pointerMode,80);
 const icon=nativeImage.createFromPath(path.join(__dirname,items.find(x=>x.starter&&x.type==='character').thumbnail)).resize({width:24,height:24});tray=new Tray(icon);tray.setToolTip('Wuwa Tappo 离线版 · 离线桌宠');tray.setContextMenu(menu());tray.on('double-click',showStudio);
 globalShortcut.register('CommandOrControl+Alt+P',()=>{state.settings.passthrough=!state.settings.passthrough;applySettings();save();broadcast();});
 globalShortcut.register('F7',()=>{state.settings.gameMode=false;applySettings();save();broadcast();});globalShortcut.register('F8',()=>{state.settings.monitor=(state.settings.monitor+1)%screen.getAllDisplays().length;place();save();broadcast();});
 screen.on('display-removed',()=>place());screen.on('display-metrics-changed',()=>place());startHook();save();if(QA||process.argv.includes('--studio')||state.draws===0&&state.presets.length===0)showStudio();
 if(SELFTEST){for(const w of [pet,studio]){w.hide();w.show=()=>{};w.showInactive=()=>{};w.focus=()=>{};}}
 if(QA){global.__QA={state:()=>state,pet:()=>pet,studio:()=>studio,hook:()=>hookStatus,input};if(process.argv.includes('--selftest'))require('./qa.cjs')({app,pet,studio,items,getState:()=>state,save,dataDir,input});}
});
app.on('before-quit',e=>{if(quitting)return;e.preventDefault();quitting=true;clearTimeout(saveTimer);clearInterval(topTimer);clearInterval(pointerTimer);try{hook?.stop();}catch{}globalShortcut.unregisterAll();save().finally(()=>app.quit());});
app.on('window-all-closed',()=>app.quit());}
