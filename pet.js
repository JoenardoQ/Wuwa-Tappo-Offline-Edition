let state,items,map=new Map(),bodyTimer,blinkTimer,bubbleTimer,action=1,face=1,loadedId='',serial=0;
const $=id=>document.getElementById(id);
const rows=[
['Tab|Tab','Q','W','E','R','T','Y','U','I','O','P','Backspace|⌫'],
['CapsLock|Caps','A','S','D','F','G','H','J','K','L','Semicolon|;','Enter|↵'],
['Shift|Shift','Z','X','C','V','B','N','M','Comma|,','Period|.','Slash|/'],
['Ctrl|Ctrl','Meta|Win','Alt|Alt','Space|SPACE','AltRight|Alt','ShiftRight|Shift','CtrlRight|Ctrl']];
for(const row of rows){const el=document.createElement('div');el.className='keyrow';for(const value of row){const [key,label]=value.split('|'),k=document.createElement('span');k.className='key'+(key==='Space'?' space':['Shift','ShiftRight','Enter','Backspace','CapsLock','Tab'].includes(key)?' wide':'');k.dataset.key=key;const legend=document.createElement('span');legend.textContent=label||key;k.append(legend);el.append(k);}$('keyboard').append(el);}
function layers(){const c=map.get(state.character);if(!c)return;$('head').src=c.layers['head'+face]||c.image;$('body').src=c.layers['body'+action]||c.image;}
function render(){const c=map.get(state.character),a=map.get(state.accessory);if(loadedId!==c?.id){loadedId=c?.id;action=1;face=1;layers();for(const src of Object.values(c?.layers||{})){new Image().src=src;}}$('petName').textContent=c?.name||'';$('accessory').hidden=!a;if(a){$('accessory').src=a.image;$('accessory').style.transform=`translate(${(c?.offsetX||0)*200/200}px,${(c?.offsetY||0)*200/200}px)`;}$('counter').textContent=state.count.toLocaleString();renderEmotes();$('petRoot').classList.toggle('hover-fade',state.settings.hoverFade);$('openChest').hidden=!state.settings.showChest;$('inputStatus').textContent=state.settings.inputEnabled?'● 实时映射':'○ 已暂停输入';}
function pat(side){action=side==='left'?2:3;layers();clearTimeout(bodyTimer);bodyTimer=setTimeout(()=>{action=1;layers();},150);}
function emote(id){const it=map.get(id);if(it?.type==='emote')floatEmotion($('bubble'),it);}
let emoteSignature='',menuPinned=false,menuCloseTimer;
function setMenu(open){$('emoteBar').classList.toggle('emotion-menu--open',open);}
function renderEmotes(){const signature=state.emotes.join('|');if(signature===emoteSignature)return;emoteSignature=signature;$('emoteBar').replaceChildren();
 for(const [i,id]of state.emotes.entries()){const e=map.get(id);if(!e)continue;const slot=document.createElement('div'),b=document.createElement('button'),im=document.createElement('img');slot.className='emotion-dot-slot';slot.style.setProperty('--fan-i',i);b.className='emotion-dot';b.title=e.name+' · Ctrl+Alt+'+(i+1);im.className='emotion-img';im.src=e.image;im.draggable=false;b.append(im);b.onclick=()=>petAPI.command('emote',id);emotionMotion.bind(b,im);slot.append(b);$('emoteBar').append(slot);}
 $('emoteBar').classList.toggle('emotion-menu--reduce-motion',emotionMotion.reduce);
}
$('petContent').addEventListener('pointerenter',()=>{clearTimeout(menuCloseTimer);setMenu(true);});
$('petContent').addEventListener('pointerleave',()=>{menuCloseTimer=setTimeout(()=>{if(!menuPinned)setMenu(false);},160);});
$('counter').title='展开 / 收起表情';
$('counter').onclick=()=>{menuPinned=!menuPinned;setMenu(menuPinned);};
function input(e){serial=e.serial;$('counter').textContent=e.count.toLocaleString();document.querySelectorAll(`[data-key="${e.key}"]`).forEach(k=>k.classList.toggle('active',e.down));if(e.down)pat(e.side);}
petAPI.onState(s=>{state=s;render();});petAPI.onInput(input);petAPI.onEmote(emote);
petAPI.onStatus(s=>{$('inputStatus').title=s.hook+(s.warning?' · '+s.warning:'');});
$('openStudio').onclick=()=>petAPI.command('open');$('openChest').onclick=()=>petAPI.command('open','draw');
let drag=null;$('stage').addEventListener('pointerdown',e=>{if(e.button!==0||state.settings.lockDrag||state.settings.gameMode)return;drag={x:e.screenX,y:e.screenY,total:0};$('stage').setPointerCapture(e.pointerId);});
$('stage').addEventListener('pointermove',e=>{if(!drag)return;const dx=e.screenX-drag.x,dy=e.screenY-drag.y;drag.x=e.screenX;drag.y=e.screenY;drag.total+=Math.abs(dx)+Math.abs(dy);if(dx||dy)petAPI.move(dx,dy);});
$('stage').addEventListener('pointerup',()=>{if(drag&&drag.total<4){pat('left');petAPI.command('tap');}drag=null;});
function resize(){$('petRoot').style.transform=`scale(${innerWidth/320})`;}addEventListener('resize',resize);
petAPI.init().then(d=>{state=d.state;items=d.items;map=new Map(items.map(x=>[x.id,x]));render();resize();setInterval(()=>{face=2;layers();setTimeout(()=>{face=1;layers();},180);},4200);});
window.__petTest=()=>({character:state?.character,count:$('counter').textContent,serial,action,face,loaded:[$('head'),$('body')].every(x=>x.complete&&x.naturalWidth>0),bubble:!!document.querySelector('#bubble img'),keys:document.querySelectorAll('.key').length,tilt:getComputedStyle(document.querySelector('.keyboard-plane')).transform});
