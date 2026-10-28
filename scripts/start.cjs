// npm start：按平台补齐 Electron 启动参数后运行源码版本。
const {spawn}=require('child_process'),path=require('path');
const electron=require('electron'),{linuxArgs}=require('./electron-args.cjs');
const child=spawn(electron,[...linuxArgs(electron),'.',...process.argv.slice(2)],{cwd:path.resolve(__dirname,'..'),stdio:'inherit'});
child.on('exit',(code,signal)=>{process.exitCode=code??(signal?1:0);});
