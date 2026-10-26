const fs=require('fs'),path=require('path'),crypto=require('crypto'),core=require('./core.cjs');
function readSave(file){try{const raw=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));if(!raw||![1,2].includes(raw.version)||!raw.owned||typeof raw.owned!=='object')return null;return{raw,file,mtime:fs.statSync(file).mtimeMs};}catch{return null;}}
function findLegacy(portableDir,searchRoots=[]){
 const direct=[path.join(portableDir,'data/collection.json'),path.join(portableDir,'data/collection.json.bak')].map(readSave).find(Boolean);if(direct)return direct;
 const found=new Map(),visit=(dir,depth)=>{if(depth<0)return;for(const name of ['collection.json','collection.json.bak']){const candidate=readSave(path.join(dir,'data',name));if(candidate&&!found.has(path.dirname(candidate.file)))found.set(path.dirname(candidate.file),candidate);}
  if(!depth)return;let children;try{children=fs.readdirSync(dir,{withFileTypes:true});}catch{return;}for(const child of children)if(child.isDirectory()&&!child.isSymbolicLink()&&/^WuwaTappo-Offline/i.test(child.name))visit(path.join(dir,child.name),depth-1);
 };
 for(const dir of [...new Set([path.dirname(portableDir),...searchRoots])])visit(dir,2);
 return [...found.values()].sort((a,b)=>b.mtime-a.mtime)[0]||null;
}
function initProfile({dataDir,portableDir,searchRoots=[],items}){
 fs.mkdirSync(dataDir,{recursive:true});const file=path.join(dataDir,'collection.json'),existing=readSave(file),backup=readSave(file+'.bak');
 if(existing)return{state:core.normalize(existing.raw,items),warning:''};
 if(backup)return{state:core.normalize(backup.raw,items),warning:'已从存档备份恢复'};
 if(fs.existsSync(file)){fs.copyFileSync(file,file+'.damaged-'+Date.now());return{state:core.initial(items),warning:'存档无法读取，原文件已保留，请从设置打开存档目录恢复'};}
 const source=findLegacy(portableDir,searchRoots);if(!source)return{state:core.initial(items),warning:''};
 const backups=path.join(dataDir,'migration-backups');fs.mkdirSync(backups,{recursive:true});const copy=path.join(backups,'collection-'+Date.now()+'.json');fs.copyFileSync(source.file,copy);
 const bytes=fs.readFileSync(source.file);fs.writeFileSync(path.join(dataDir,'migration.json'),JSON.stringify({from:source.file,backup:copy,at:new Date().toISOString(),sha256:crypto.createHash('sha256').update(bytes).digest('hex')},null,2));
 return{state:core.normalize(source.raw,items),warning:'已自动继承旧版收藏与设置',migratedFrom:source.file};
}
function createWriter(file){
 let pending=Promise.resolve();return state=>{const content=JSON.stringify(state,null,2);const write=pending.then(async()=>{await fs.promises.writeFile(file+'.tmp',content);try{await fs.promises.copyFile(file,file+'.bak');}catch(e){if(e.code!=='ENOENT')throw e;}await fs.promises.rename(file+'.tmp',file);});pending=write.catch(()=>{});return write;};
}
module.exports={readSave,findLegacy,initProfile,createWriter};
