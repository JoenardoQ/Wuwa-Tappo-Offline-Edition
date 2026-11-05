const fs=require('fs'),path=require('path'),https=require('https'),crypto=require('crypto');
const {spawn,execFile}=require('child_process'),{promisify}=require('util'),exec=promisify(execFile);
const REPO='JoenardoQ/Wuwa-Tappo-Offline-Edition',BASE='https://github.com/'+REPO;
function version(v){const m=/^v?(\d+)\.(\d+)\.(\d+)$/.exec(v);if(!m)throw Error('Release 版本号无效');return m.slice(1).map(Number);}
function newer(a,b){const x=version(a),y=version(b);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i];return false;}
function releaseAssets(release,platform,arch,current){
 if(release.draft||release.prerelease)throw Error('此版本尚未正式发布');
 if(!newer(release.tag_name,current))return null;
 if(arch!=='x64'||!['win32','linux'].includes(platform))throw Error('此系统暂不支持自动更新');
 const tag=release.tag_name;if(!/^v\d+\.\d+\.\d+$/.test(tag))throw Error('Release 标签无效');
 const stem=platform==='win32'?'WuwaTappo-Offline-42keys-':'WuwaTappo-Offline-Linux-x64-',name=stem+tag+(platform==='win32'?'.zip':'.tar.gz');
 const find=n=>{const a=release.assets?.find(x=>x.name===n&&x.state==='uploaded');if(!a||!Number.isSafeInteger(a.size)||a.size<=0||a.size>1024**3||a.browser_download_url!==BASE+'/releases/download/'+tag+'/'+n)throw Error('Release 更新包或校验文件尚未就绪');return a;};
 return{version:tag.slice(1),archive:find(name),checksum:find(stem+tag+'.sha256.txt')};
}
function safeUrl(url){const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||u.port&&!['443'].includes(u.port)||!['api.github.com','github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(u.hostname))throw Error('更新下载地址不受信任');return u;}
async function request(url,redirects=0){safeUrl(url);if(redirects>5)throw Error('下载重定向次数过多');return new Promise((resolve,reject)=>{
 const req=https.get(url,{headers:{'User-Agent':'WuwaTappo-Offline-Updater','Accept':'application/vnd.github+json'}},res=>{
  if([301,302,303,307,308].includes(res.statusCode)){res.resume();if(!res.headers.location)return reject(Error('下载重定向地址缺失'));request(new URL(res.headers.location,url).href,redirects+1).then(resolve,reject);}
  else if(res.statusCode!==200){res.resume();reject(Error('GitHub 返回 '+res.statusCode+'，请稍后重试'));}else resolve(res);
 });req.setTimeout(45000,()=>req.destroy(Error('GitHub 连接超时，请检查网络后重试')));req.on('error',reject);
 });}
async function bytes(url,max,transport=request){const stream=await transport(url),parts=[];let size=0;for await(const chunk of stream){size+=chunk.length;if(size>max){stream.destroy();throw Error('下载内容超过限制');}parts.push(chunk);}return Buffer.concat(parts);}
function checksum(text,name){const line=String(text).trim().split(/\r?\n/).find(l=>/^[a-fA-F0-9]{64}(?:\s|$)/.test(l));if(!line)throw Error('SHA-256 校验文件无效');const parts=line.trim().split(/\s+/);if(parts[1]&&parts.slice(1).join(' ').replace(/^\*/,'')!==name)throw Error('校验文件与更新包不匹配');return parts[0].toLowerCase();}
async function download(asset,dest,expected,transport,onProgress){const stream=await transport(asset.browser_download_url),handle=await fs.promises.open(dest,'wx'),hash=crypto.createHash('sha256');let size=0;
 try{for await(const chunk of stream){size+=chunk.length;if(size>asset.size)throw Error('下载包大小超过 Release 声明');hash.update(chunk);await handle.writeFile(chunk);onProgress(size/asset.size);}if(size!==asset.size||hash.digest('hex')!==expected||asset.digest&&asset.digest!=='sha256:'+expected)throw Error('更新包校验失败，当前版本未被更改');}finally{stream.destroy();await handle.close();}
}
function validEntry(name,root){return typeof name==='string'&&!name.includes('\\')&&!name.includes('\0')&&!name.startsWith('/')&&name.split('/').every(x=>x!=='.'&&x!=='..')&&(name===root||name.startsWith(root+'/'));}
function validatePlan(p){if(!/^[a-f0-9]{32}$/.test(p.token)||!path.isAbsolute(p.target)||!path.isAbsolute(p.dataDir)||p.target===path.parse(p.target).root||p.stage!==p.target+'.incoming-'+p.token||p.backup!==p.target+'.backup-'+p.token||!Number.isSafeInteger(p.pid)||p.pid<1)throw Error('更新路径验证失败');version(p.version);return p;}
async function extract(archive,destination,expectedVersion,platform,sourceDir){
 const root='WuwaTappo-Offline-'+expectedVersion;
 if(platform==='win32')await exec('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(sourceDir,'update-extract.ps1'),'-Archive',archive,'-Destination',destination,'-RootName',root],{windowsHide:true,maxBuffer:1024*1024});
 else{const listing=await exec('tar',['-tzf',archive],{maxBuffer:4*1024*1024}),types=await exec('tar',['-tvzf',archive],{maxBuffer:8*1024*1024});if(!listing.stdout.trim().split('\n').every(n=>validEntry(n.replace(/\r$/,''),root))||!types.stdout.trim().split('\n').every(n=>/^[d-]/.test(n)))throw Error('更新压缩包包含不安全路径或链接');await fs.promises.mkdir(destination);await exec('tar',['-xzf',archive,'-C',destination,'--no-same-owner'],{maxBuffer:1024*1024});}
 return path.join(destination,root);
}
function inspectPayload(dir,expected,platform){const pkg=JSON.parse(fs.readFileSync(path.join(dir,'resources/app/package.json'),'utf8'));if(pkg.name!=='wuwa-offline-companion'||pkg.version!==expected)throw Error('更新包内版本不匹配');for(const file of ['resources/app/main.cjs','resources/app/catalog.json',platform==='win32'?'WuwaTappo-Offline.exe':'WuwaTappo-Offline.sh'])if(!fs.statSync(path.join(dir,file)).isFile())throw Error('更新包缺少必要文件');}
async function launch(plan,sourceDir){const folder=path.join(plan.dataDir,'updates',plan.token);fs.mkdirSync(folder,{recursive:true});const file=path.join(folder,'plan.json');fs.writeFileSync(file,JSON.stringify(plan));
 const source=path.join(sourceDir,process.platform==='win32'?'update-install.ps1':'update-install.sh'),helper=path.join(folder,path.basename(source));fs.copyFileSync(source,helper);
 const args=process.platform==='win32'?['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',helper,'-Plan',file]:[helper,plan.target,plan.stage,plan.backup,String(plan.pid),plan.dataDir,plan.version,plan.token];
 const child=await new Promise((resolve,reject)=>{const child=spawn(process.platform==='win32'?'powershell.exe':'/bin/sh',args,{detached:true,stdio:'ignore',windowsHide:true,cwd:folder});child.once('error',reject);child.once('spawn',()=>{resolve(child);});});
 try{for(let i=0;i<200;i++){if(fs.existsSync(path.join(folder,'helper-ready'))){child.unref();return;}if(child.exitCode!==null)throw Error('安装助手启动失败');await new Promise(r=>setTimeout(r,100));}throw Error('安装助手启动超时');}catch(e){child.kill();throw e;}
}
function create(options){let busy=false;const emit=(phase,text,progress=0)=>options.onStatus({phase,text,progress});return{async run(){
 if(busy)return{ok:false,error:'正在更新，请稍候'};busy=true;
 try{if(!options.isPackaged)throw Error('请从便携版使用自动更新');emit('checking','正在检查 GitHub Release…');const transport=options.transport||request,release=JSON.parse((await bytes('https://api.github.com/repos/'+REPO+'/releases/latest',2*1024*1024,transport)).toString()),assets=releaseAssets(release,options.platform,options.arch,options.version);
 if(!assets){emit('current','已经是最新正式版本 v'+options.version);return{ok:true,current:true};}
 const token=crypto.randomBytes(16).toString('hex'),target=path.resolve(options.portableDir),plan=validatePlan({token,target,stage:target+'.incoming-'+token,backup:target+'.backup-'+token,pid:process.pid,dataDir:path.resolve(options.dataDir),version:assets.version}),folder=path.join(plan.dataDir,'updates',token),unpack=target+'.unpack-'+token;
 // Establish write access before downloading; never replace a program in a protected folder.
 await fs.promises.mkdir(unpack);await fs.promises.rmdir(unpack);await fs.promises.mkdir(folder,{recursive:true});const archive=path.join(folder,assets.archive.name),hash=checksum((await bytes(assets.checksum.browser_download_url,8192,transport)).toString(),assets.archive.name);
 emit('downloading','正在下载 v'+assets.version+' · 0%');let last=0;await download(assets.archive,archive,hash,transport,p=>{const now=Date.now();if(now-last>250||p===1){last=now;emit('downloading','正在下载 v'+assets.version+' · '+Math.round(p*100)+'%',p);}});
 emit('verifying','校验通过，正在准备更新…',1);const payload=await(options.extract||extract)(archive,unpack,assets.version,options.platform,options.sourceDir);inspectPayload(payload,assets.version,options.platform);await fs.promises.rename(payload,plan.stage);
 if(!await options.beforeInstall())throw Error('存档保存失败，已停止更新');emit('installing','正在重启并安装 v'+assets.version+'，收藏与配件会保留',1);await(options.launch||launch)(plan,options.sourceDir);options.quit();return{ok:true,installing:true};
 }catch(e){emit('error','更新未完成：'+e.message+'。当前版本仍可使用。');return{ok:false,error:e.message};}finally{busy=false;}
 }};}
function ready(dataDir,args,current){const match=args.find(x=>/^--update-token=[a-f0-9]{32}$/.test(x));if(!match)return;const token=match.slice(15),dir=path.join(dataDir,'updates',token);if(!fs.existsSync(dir))return;fs.writeFileSync(path.join(dir,'ready'),current);}
module.exports={create,ready,version,newer,releaseAssets,safeUrl,checksum,download,validEntry,validatePlan,extract,inspectPayload,REPO};
