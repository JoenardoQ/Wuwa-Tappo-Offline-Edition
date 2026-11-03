const {spawnSync}=require('child_process'),path=require('path'),fs=require('fs');
if(process.platform!=='win32')throw Error('Native drag tests require Windows.');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.WUWA_QA_OUTPUT||path.join(root,'qa-output'),'drag');
const exe=process.env.WUWA_TEST_EXE||require('electron'),packaged=!!process.env.WUWA_TEST_EXE,results=[];
for(const factor of ['1','1.25','1.5','1.75','2']){
 const folder=fs.mkdtempSync((fs.mkdirSync(out,{recursive:true}),path.join(out,`scale-${factor}-`)));
 const run=spawnSync(exe,[...(packaged?[]:['.']),'--qa','--selftest','--test-drag','--force-device-scale-factor='+factor],{cwd:root,windowsHide:true,encoding:'utf8',timeout:60000,env:{...process.env,WUWA_QA_OUTPUT:folder}});
 const file=path.join(folder,'drag-result.json'),result=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):null;
 console.log(JSON.stringify({factor,exit:run.status,ok:result?.ok,cases:result?.cases.length,error:result?.error||run.error?.message}));
 if(run.status!==0||!result?.ok){console.error(run.stderr);process.exitCode=1;break;}
 results.push(result);
}
fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({ok:results.length===5&&results.every(r=>r.ok),results},null,2));
