const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm'),{spawnSync}=require('child_process');
const {desktopEntry}=require('./autostart.cjs');
test('Linux 自启动 Exec 保留百分号、空格和特殊字符',()=>{
 const executable='/home/test/100%fun/My Pet/$money`tick"quote\\path/WuwaTappo-Offline.sh',entry=desktopEntry(executable);
 const raw=entry.split('\n').find(x=>x.startsWith('Exec=')).slice(5);
 assert(raw.includes('100%%fun'));assert(raw.startsWith('"')&&raw.endsWith('"'));
 const decoded=raw.replace(/\\\\/g,'\\').slice(1,-1).replace(/\\([\\"`$])/g,'$1').replace(/%%/g,'%');assert.equal(decoded,executable);
 assert.throws(()=>desktopEntry('/tmp/path\nExec=unexpected'));assert.throws(()=>desktopEntry('/tmp/\0path'));
 assert(!entry.includes('WUWA_ALLOW_NO_SANDBOX'));assert(desktopEntry('/app/pet.sh',{allowNoSandbox:true,nativeWayland:true}).includes('Exec=env WUWA_ALLOW_NO_SANDBOX=1 WUWA_NATIVE_WAYLAND=1 "/app/pet.sh"'));
});
test('Linux 仅显式兼容模式关闭隔离，Wayland 兼容可关闭，Windows 参数不变',()=>{
 const code=fs.readFileSync(path.join(__dirname,'scripts/electron-args.cjs'),'utf8');
 function load(platform){const context={module:{exports:{}},process:{platform,env:{}},console:{warn:()=>{}},require:name=>name==='path'?path.posix:{statSync:()=>{throw Error('No SUID helper')},readFileSync:file=>file.endsWith('apparmor_restrict_unprivileged_userns')?'1':'0'}};vm.runInNewContext(code,context);return context.module.exports;}
 const linux=load('linux');assert.deepEqual(Array.from(linux.linuxArgs('/app/electron',{})),[]);
 assert.deepEqual(Array.from(linux.linuxArgs('/app/electron',{WUWA_ALLOW_NO_SANDBOX:'1',DISPLAY:':0',WAYLAND_DISPLAY:'wayland-0'})),['--no-sandbox','--ozone-platform=x11']);
 assert.deepEqual(Array.from(linux.linuxArgs('/app/electron',{WUWA_ALLOW_NO_SANDBOX:'0',WUWA_NATIVE_WAYLAND:'1',DISPLAY:':0',WAYLAND_DISPLAY:'wayland-0'})),[]);
 assert.deepEqual(Array.from(load('win32').linuxArgs('C:/electron.exe',{WUWA_ALLOW_NO_SANDBOX:'1',DISPLAY:':0',WAYLAND_DISPLAY:'wayland-0'})),[]);
});
test('Linux 启动器在普通、XWayland 和显式兼容模式下保留全部参数',()=>{
 const bash=process.platform==='win32'?path.join(process.env.ProgramFiles||'C:/Program Files','Git/bin/bash.exe'):'/bin/sh';
 assert(fs.existsSync(bash),'Shell required for launcher regression');
 const folder=fs.mkdtempSync(path.join(__dirname,'qa-data-launcher-'));
 try{
  const script=path.join(folder,'WuwaTappo-Offline.sh'),bin=path.join(folder,'WuwaTappo-Offline');fs.copyFileSync(path.join(__dirname,'scripts/linux/WuwaTappo-Offline.sh'),script);
  fs.writeFileSync(bin,'#!/bin/sh\nprintf "ARG:%s\\n" "$@"\n');fs.chmodSync(bin,0o755);
  const args=['--qa','--selftest','--studio','space value','literal$%'],cases=[{env:{},prefix:[]},{env:{DISPLAY:':99',WAYLAND_DISPLAY:'wayland-0'},prefix:['--ozone-platform=x11']},{env:{WUWA_ALLOW_NO_SANDBOX:'1'},prefix:['--no-sandbox']},{env:{WUWA_ALLOW_NO_SANDBOX:'1',DISPLAY:':99',WAYLAND_DISPLAY:'wayland-0'},prefix:['--ozone-platform=x11','--no-sandbox']}];
  for(const c of cases){const r=spawnSync(bash,[script.replaceAll('\\','/'),...args],{encoding:'utf8',windowsHide:true,env:{...process.env,WUWA_ALLOW_NO_SANDBOX:'',WUWA_NATIVE_WAYLAND:'',WAYLAND_DISPLAY:'',DISPLAY:'',...c.env}});assert.equal(r.status,0,r.stderr);assert.deepEqual(r.stdout.trim().split(/\r?\n/).map(x=>x.slice(4)),[...c.prefix,...args]);}
 }finally{if(!folder.startsWith(path.resolve(__dirname)+path.sep+'qa-data-launcher-'))throw Error('Unsafe cleanup');fs.rmSync(folder,{recursive:true});}
});
