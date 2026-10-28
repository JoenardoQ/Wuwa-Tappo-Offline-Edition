// 计算 Linux 下启动 Electron 需要追加的参数；Windows 返回空数组，行为不变。
const fs=require('fs'),path=require('path');
const read=file=>{try{return fs.readFileSync(file,'utf8').trim();}catch{return '';}};
// chrome-sandbox 为 root 所有且带 SUID，或系统允许非特权用户命名空间时，Chromium 沙箱可用。
function sandboxUsable(sandbox){
 try{const s=fs.statSync(sandbox);if(s.uid===0&&(s.mode&0o4000))return true;}catch{}
 if(read('/proc/sys/kernel/apparmor_restrict_unprivileged_userns')==='1')return false;
 if(read('/proc/sys/kernel/unprivileged_userns_clone')==='0')return false;
 if(read('/proc/sys/user/max_user_namespaces')==='0')return false;
 return true;
}
function linuxArgs(electronBinary,env=process.env){
 if(process.platform!=='linux')return[];
 const args=[];
 if(!sandboxUsable(path.join(path.dirname(electronBinary),'chrome-sandbox')))args.push('--no-sandbox');
 // 原生 Wayland 不支持置顶、定位和光标坐标，有 XWayland 时强制走 X11。
 if(env.WAYLAND_DISPLAY&&env.DISPLAY&&!env.WUWA_NATIVE_WAYLAND)args.push('--ozone-platform=x11');
 return args;
}
module.exports={sandboxUsable,linuxArgs};
