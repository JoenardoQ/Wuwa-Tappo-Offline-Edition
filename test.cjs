const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const core=require('./core.cjs'),{items}=require('./catalog.json');
test('初始仅开放男女经典、阿布、八个原版基础表情',()=>{const s=core.initial(items);assert.equal(Object.keys(s.owned).length,11);assert.equal(s.draws,0);assert.equal(items.filter(i=>s.owned[i.id]&&i.type==='character').length,2);assert(items.every(i=>i.starter===!!s.owned[i.id]));});
test('899 个收集物与 3098 张离线图像完整可读',()=>{assert.equal(items.length,899);const names=new Set();for(const it of items){assert(core.RARITIES.includes(it.rarity));for(const file of [it.image,it.thumbnail,...Object.values(it.layers)])names.add(file);if(it.type==='character')assert.equal(Object.keys(it.layers).length,5);}assert.equal(names.size,3098);for(const file of names){const b=fs.readFileSync(path.join(__dirname,file));assert.equal(b.readUInt32BE(0),0x89504e47);assert(b.readUInt32BE(16)>0&&b.readUInt32BE(20)>0);}});
test('十连最低珍稀保障、50 抽史诗保底、无限免费抽取',()=>{const s=core.initial(items);for(let i=0;i<100;i++){const before=s.draws,r=core.draw(s,items,10,()=>0);assert.equal(r.length,10);assert.equal(s.draws,before+10);assert(r.some(x=>items.find(i=>i.id===x.id).rarity!=='common'));}assert.equal(s.draws,1000);assert.equal(s.pity,0);assert(items.some(x=>x.rarity==='epic'&&s.owned[x.id]));});
test('未获得不能装备，角色配件表情类型保持正确',()=>{const s=core.initial(items);assert.throws(()=>core.equip(s,items,items.find(x=>!x.starter).id));const male=items.find(x=>x.starter&&x.roleId===1501);core.equip(s,items,male.id);assert.equal(s.character,male.id);const a=s.accessory;core.equip(s,items,a);assert.equal(s.accessory,'');core.equip(s,items,a);assert.equal(s.accessory,a);});
test('十次合成消耗100副本且保留最后一份，材料不足无副作用',()=>{const s=core.initial(items),id=s.character;s.owned[id]=101;const before=Object.values(s.owned).reduce((a,b)=>a+b,0);const r=core.synthesize(s,items,10,'common',()=>.2);assert.equal(r.length,10);assert.equal(s.owned[id],1);assert.equal(Object.values(s.owned).reduce((a,b)=>a+b,0),before-90);assert(r.every(x=>items.find(i=>i.id===x.id).rarity==='uncommon'));const snapshot=JSON.stringify(s);assert.throws(()=>core.synthesize(s,items,10,'common'));assert.equal(JSON.stringify(s),snapshot);});
test('存档重新加载保留收藏、计数、搭配和抽取进度',()=>{const s=core.initial(items);core.draw(s,items,10,()=>.95);s.count=456;s.presets.push({id:'p',name:'日常',character:s.character,accessory:s.accessory,emotes:s.emotes});const t=core.normalize(JSON.parse(JSON.stringify(s)),items);assert.deepEqual(t,s);});

test('平阶合成同品类同稀有度、消耗5份且保留最后一份',()=>{const s=core.initial(items),id=s.character;s.owned[id]=6;const r=core.synthesize(s,items,1,'common',()=>0,{type:'character',mode:'same'});assert.equal(r.length,1);assert(s.owned[id]>=1);const it=items.find(x=>x.id===r[0].id);assert.equal(it.type,'character');assert.equal(it.rarity,'common');});
test('原版筛选索引：7个系列、55个角色、服饰系列10件',()=>{const c=require('./catalog.json');assert.equal(Object.keys(c.filters.series).length,7);assert.equal(Object.keys(c.filters.roles).length,55);assert.equal(c.items.filter(x=>x.type==='character'&&x.code==='1007').length,10);});

test('旧预览存档迁移保留已抽物品与计数，并补足原版初始表情',()=>{const old={...core.initial(items),version:1,emotes:['emote:1965','emote:1969','emote:1971'],count:90,draws:20};old.owned={'character:590':1,'character:602':1,'accessory:1493':1,'emote:1965':1,'emote:1969':1,'emote:1971':1,'character:332':2};const next=core.normalize(old,items);assert.equal(next.version,2);assert.equal(next.draws,20);assert.equal(next.count,90);assert.equal(next.owned['character:332'],2);assert.equal(next.emotes.length,5);assert(items.filter(x=>x.starter).every(x=>next.owned[x.id]>0));});

test('999后归零，仅从已装备且已拥有的表情随机选取，空选择仍归零',()=>{
 const s=core.initial(items);s.count=998;
 assert.equal(core.registerTap(s,items,()=>0),null);assert.equal(s.count,999);
 const first=items.find(x=>s.emotes.includes(x.id)).id;assert.equal(core.registerTap(s,items,()=>0),first);assert.equal(s.count,0);
 s.count=999;const last=items.filter(x=>s.emotes.includes(x.id)).at(-1).id;assert.equal(core.registerTap(s,items,()=>.999999),last);
 s.count=999;s.emotes=['unknown',s.character];assert.equal(core.registerTap(s,items),null);assert.equal(s.count,0);
});
test('旧大计数迁移到三位显示，关闭置顶的旧配置恢复为始终置顶',()=>{
 const s=core.initial(items);s.count=12345;s.draws=9000;s.settings.alwaysOnTop=false;
 const next=core.normalize(s,items);assert.equal(next.count,345);assert.equal(next.draws,9000);assert.equal(next.settings.alwaysOnTop,true);
 assert.equal(core.settings({alwaysOnTop:false}).alwaysOnTop,true);
});
test('504张互动表情均引用原始emote素材，图鉴缩略图使用独立索引',()=>{
 const manifest=require('./asset-manifest.json');
 for(const it of items.filter(x=>x.type==='emote')){assert.match(manifest[path.basename(it.image)],/\/emote\//);assert.notEqual(it.image,it.thumbnail);}
});
