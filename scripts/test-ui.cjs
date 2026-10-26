const {spawn}=require('child_process'),path=require('path'),fs=require('fs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa-output');
fs.mkdirSync(out,{recursive:true});const result=path.join(out,'result.json');if(fs.existsSync(result))fs.unlinkSync(result);
const child=spawn(require('electron'),['.','--qa','--selftest'],{cwd:root,stdio:'inherit',env:{...process.env,WUWA_QA_OUTPUT:out}});
const timeout=setTimeout(()=>{child.kill();console.error('UI tests timed out');process.exitCode=1;},90000);
child.on('exit',code=>{clearTimeout(timeout);if(code||!fs.existsSync(result)||!JSON.parse(fs.readFileSync(result)).ok)process.exitCode=1;});
