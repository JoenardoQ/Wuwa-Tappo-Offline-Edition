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

test('满5个表情可指定位置替换，已装备表情交换位置，未拥有不能替换',()=>{
 const s=core.initial(items),old=[...s.emotes],next=items.find(x=>x.starter&&x.type==='emote'&&!old.includes(x.id)).id;
 core.replaceEmote(s,items,next,2);assert.equal(s.emotes[2],next);assert.equal(s.emotes.length,5);assert.equal(new Set(s.emotes).size,5);
 core.replaceEmote(s,items,s.emotes[0],4);assert.equal(s.emotes[4],old[0]);assert.equal(s.emotes[0],old[4]);
 const before=JSON.stringify(s);assert.throws(()=>core.replaceEmote(s,items,'emote:missing',1));assert.equal(JSON.stringify(s),before);
});
test('升级自动继承当前便携版并备份，之后换解压目录仍使用同一存档',async()=>{
 const storage=require('./storage.cjs'),root=fs.mkdtempSync(path.join(__dirname,'qa-data-unit-'));
 try{const legacy=path.join(root,'old'),dataDir=path.join(root,'profile');fs.mkdirSync(path.join(legacy,'data'),{recursive:true});
 const s=core.initial(items);core.draw(s,items,10,()=>.95);s.count=521;fs.writeFileSync(path.join(legacy,'data/collection.json'),JSON.stringify(s));
 const first=storage.initProfile({dataDir,portableDir:legacy,items});assert.deepEqual(first.state,s);assert(first.migratedFrom);assert.equal(fs.readdirSync(path.join(dataDir,'migration-backups')).length,1);
 const write=storage.createWriter(path.join(dataDir,'collection.json'));first.state.count=522;await write(first.state);
 const second=storage.initProfile({dataDir,portableDir:path.join(root,'new-version'),items});assert.equal(second.state.count,522);assert.deepEqual(second.state.owned,s.owned);assert.equal(second.migratedFrom,undefined);
 assert.equal(JSON.parse(fs.readFileSync(path.join(legacy,'data/collection.json'))).count,521);
 }finally{if(!root.startsWith(path.resolve(__dirname)+path.sep+'qa-data-unit-'))throw Error('Unsafe cleanup');fs.rmSync(root,{recursive:true});}
});
test('全新解压目录自动查找Downloads旁旧版，保留抽取、收藏与搭配',()=>{
 const storage=require('./storage.cjs'),root=fs.mkdtempSync(path.join(__dirname,'qa-data-unit-'));
 try{const downloads=path.join(root,'Downloads'),legacy=path.join(downloads,'WuwaTappo-Offline-42keys-v1.0.2','WuwaTappo-Offline-1.0.2','data');fs.mkdirSync(legacy,{recursive:true});
 const s=core.initial(items);s.draws=450;s.favorites=[s.character];s.presets=[{id:'old',name:'旧搭配',character:s.character,accessory:s.accessory,emotes:s.emotes}];fs.writeFileSync(path.join(legacy,'collection.json'),JSON.stringify(s));
 const migrated=storage.initProfile({dataDir:path.join(root,'profile'),portableDir:path.join(downloads,'new'),searchRoots:[downloads],items});assert.deepEqual(migrated.state,s);
 }finally{if(!root.startsWith(path.resolve(__dirname)+path.sep+'qa-data-unit-'))throw Error('Unsafe cleanup');fs.rmSync(root,{recursive:true});}
});
test('异步存档按顺序落盘，连续保存不会覆盖较新的状态',async()=>{
 const storage=require('./storage.cjs'),root=fs.mkdtempSync(path.join(__dirname,'qa-data-unit-'));
 try{const file=path.join(root,'collection.json'),write=storage.createWriter(file),s=core.initial(items),jobs=[];for(let i=0;i<20;i++){s.count=i;jobs.push(write(s));}await Promise.all(jobs);assert.equal(storage.readSave(file).raw.count,19);assert.equal(storage.readSave(file+'.bak').raw.count,18);
 }finally{if(!root.startsWith(path.resolve(__dirname)+path.sep+'qa-data-unit-'))throw Error('Unsafe cleanup');fs.rmSync(root,{recursive:true});}
});
