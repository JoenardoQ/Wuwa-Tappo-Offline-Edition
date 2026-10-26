/* Original EmotionMenu spring constants and bubble trajectory, using local assets. */
const emotionMotion=(()=>{
 const states=new Map(),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 function spring(x,v,target,k,d,dt){v+=((target-x)*k-v*d)*dt;return[x+v*dt,v];}
 function release(s){if(!s.held)return;s.held=false;s.releaseTimer=setTimeout(()=>{s.targetX=1.48;s.targetY=1.2;s.targetR=.035;s.vx+=2.4;s.vy+=3.3;s.vr+=.32;s.returnTimer=setTimeout(()=>{s.targetX=1;s.targetY=1;s.targetR=0;},115);},Math.max(0,80-(performance.now()-s.pressedAt)));}
 function bind(button,img){
  const s={button,img,x:1,y:1,r:0,vx:0,vy:0,vr:0,targetX:1,targetY:1,targetR:0,held:false,pressedAt:0};states.set(button,s);
  function press(){if(reduce||s.held)return;clearTimeout(s.releaseTimer);clearTimeout(s.returnTimer);s.held=true;s.pressedAt=performance.now();s.targetX=.86;s.targetY=.72;s.targetR=-.025;s.vy-=.8;}
  button.onpointerdown=e=>{e.stopPropagation();button.setPointerCapture(e.pointerId);press();};
  button.onpointerup=button.onpointercancel=button.onpointerleave=()=>release(s);
  button.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();press();}};
  button.onkeyup=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();release(s);button.click();}};
 }
 let previous=performance.now();
 function tick(now){const dt=Math.min((now-previous)/1000,.028);previous=now;
  for(const [button,s]of states){if(!button.isConnected){clearTimeout(s.releaseTimer);clearTimeout(s.returnTimer);states.delete(button);continue;}
   [s.x,s.vx]=spring(s.x,s.vx,s.targetX,245,13.2,dt);[s.y,s.vy]=spring(s.y,s.vy,s.targetY,285,14,dt);[s.r,s.vr]=spring(s.r,s.vr,s.targetR,205,12.5,dt);
   const x=clamp(s.x,.72,1.72),y=clamp(s.y,.62,1.55),q=clamp((s.vx-s.vy)*.022,-.13,.13),b=clamp(((x+y)*.5-1)/.42,-.35,1.25);
   const radii=[50+b*7+q*50,50-b*5-q*42,50+b*4-q*35,50-b*3+q*45,50-q*38,50+q*34,50-b*3+q*40,50+b*4-q*36].map(v=>clamp(v,38,64)+'%');
   button.style.transform='scale('+x.toFixed(4)+','+y.toFixed(4)+') rotate('+clamp(s.r+(s.vx-s.vy)*.0025,-.075,.075).toFixed(4)+'rad)';
   button.style.borderRadius=radii.slice(0,4).join(' ')+' / '+radii.slice(4).join(' ');
   s.img.style.transform='translateY('+((1-y)*3.5-s.vy*.21).toFixed(2)+'px) scale('+(1-(x-1)*.16).toFixed(3)+','+(1-(y-1)*.13).toFixed(3)+')';
  }requestAnimationFrame(tick);
 }requestAnimationFrame(tick);return{bind,reduce};
})();
const bubbleOffsets=[[-30,10],[4,-6],[28,12],[-14,2],[36,6],[-38,16],[16,-10],[-6,8]];
let bubbleIndex=0;
function floatEmotion(layer,item){
 const [x,y]=bubbleOffsets[bubbleIndex++%bubbleOffsets.length],bubble=document.createElement('div'),img=document.createElement('img');
 bubble.className='local-emotion-bubble';bubble.dataset.emote=item.id;
 bubble.style.setProperty('--bubble-ox',Math.round(x+Math.random()*10-5)+'px');
 bubble.style.setProperty('--bubble-oy',Math.round(y+Math.random()*8-4-50)+'px');
 img.src=item.image;img.alt=item.name;img.className='local-emotion-bubble__img';bubble.append(img);layer.append(bubble);
 bubble.addEventListener('animationend',()=>bubble.remove(),{once:true});
 setTimeout(()=>bubble.remove(),1200);
}
