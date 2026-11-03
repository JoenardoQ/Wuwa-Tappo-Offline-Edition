// Desktop Entry applies string escaping before Exec quoting and field expansion.
function desktopEntry(executable,options={}){
 if(/[\r\n\0]/.test(executable))throw Error('开机启动路径不能包含换行或空字符');
 const quoted='"'+executable.replace(/%/g,'%%').replace(/[\\"`$]/g,c=>'\\'+c)+'"';
 const env=[options.allowNoSandbox?'WUWA_ALLOW_NO_SANDBOX=1':'',options.nativeWayland?'WUWA_NATIVE_WAYLAND=1':''].filter(Boolean);
 const command=(env.length?'env '+env.join(' ')+' ':'')+quoted.replace(/\\/g,'\\\\');
 return ['[Desktop Entry]','Type=Application','Name=Wuwa Tappo 离线版','Exec='+command,'Terminal=false','X-GNOME-Autostart-enabled=true',''].join('\n');
}
module.exports={desktopEntry};
