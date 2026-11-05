(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Accessories=factory();})(globalThis,()=>{
 const clamp=(n,min,max,fallback)=>Number.isFinite(Number(n))?Math.max(min,Math.min(max,Number(n))):fallback;
 function list(raw){const seen=new Set();return(Array.isArray(raw)?raw:[]).filter(x=>x&&/^custom:[a-f0-9]{32}$/.test(x.id)&&!seen.has(x.id)&&seen.add(x.id)).slice(0,100).map(x=>({id:x.id,name:String(x.name||'自定义配件').slice(0,40),file:x.id.slice(7)+'.png'}));}
 function layout(value={}){return{x:clamp(value.x,-140,140,0),y:clamp(value.y,-140,140,0),scale:clamp(value.scale,.1,2,1),rotation:clamp(value.rotation,-180,180,0)};}
 function key(character,id){return character+'|'+id;}
 function view(state,items,options={}){
  const character=options.character??state.character,accessory=options.accessory??state.accessory,customId=options.customAccessory??state.customAccessory,adjustments=options.accessoryLayouts??state.accessoryLayouts??{},c=items.find(x=>x.id===character),custom=state.customAccessories?.find(x=>x.id===customId),builtin=items.find(x=>x.id===accessory);
  const item=custom||builtin;if(!item)return null;const defaults=custom?{x:0,y:-40,scale:.5,rotation:0}:{x:c?.offsetX||0,y:c?.offsetY||0,scale:1,rotation:0};
  return{id:item.id,name:item.name,image:custom?'wuwa-asset://custom/'+custom.file:item.image,...layout(adjustments[key(character,item.id)]||defaults)};
 }
 function transform(v,size=200){return `translate(${v.x*size/200}px,${v.y*size/200}px) rotate(${v.rotation}deg) scale(${v.scale})`;}
 function normalize(raw,items,custom){const allowed=new Set([...items.filter(x=>x.type==='accessory').map(x=>x.id),...custom.map(x=>x.id)]),characters=new Set(items.filter(x=>x.type==='character').map(x=>x.id)),result={};for(const [k,v]of Object.entries(raw&&typeof raw==='object'?raw:{})){const [c,id]=k.split('|');if(characters.has(c)&&allowed.has(id)&&v&&typeof v==='object')result[k]=layout(v);}return result;}
 return{list,layout,key,view,transform,normalize};
});
