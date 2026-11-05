const fs=require('fs'),path=require('path'),crypto=require('crypto');
function dimensions(b){
 if(b.length>=24&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return{width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
 if(b[0]!==255||b[1]!==216)throw Error('请选择有效的 JPG 或 PNG 图片');
 let i=2;while(i+3<b.length){if(b[i++]!==255)continue;while(b[i]===255)i++;const marker=b[i++];if(marker===217||marker===218)break;if(marker===1||marker>=208&&marker<=215)continue;const length=b.readUInt16BE(i);if(length<2||i+length>b.length)break;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)&&length>=7)return{height:b.readUInt16BE(i+3),width:b.readUInt16BE(i+5)};i+=length;}throw Error('无法读取这张 JPG 图片');
}
async function importFile(file,dataDir,nativeImage){
 const stat=await fs.promises.stat(file);if(!stat.isFile()||stat.size>12*1024*1024)throw Error('请选择不超过 12 MB 的 JPG 或 PNG 图片');
 const bytes=await fs.promises.readFile(file),size=dimensions(bytes);if(!size.width||!size.height||size.width>8192||size.height>8192||size.width*size.height>24000000)throw Error('图片尺寸过大，请使用 2400 万像素以内的图片');
 let image=nativeImage.createFromBuffer(bytes);if(image.isEmpty())throw Error('图片无法解码，请换一张 JPG 或 PNG');
 if(Math.max(size.width,size.height)>1024)image=image.resize(size.width>=size.height?{width:1024}:{height:1024});
 const id=crypto.randomBytes(16).toString('hex'),dir=path.join(dataDir,'custom-accessories');await fs.promises.mkdir(dir,{recursive:true});await fs.promises.writeFile(path.join(dir,id+'.png'),image.toPNG());
 return{id:'custom:'+id,file:id+'.png',name:path.basename(file,path.extname(file)).slice(0,40)||'自定义配件'};
}
function assetPath(url,dataDir,custom){try{const u=new URL(url),name=u.pathname.slice(1);if(u.protocol!=='wuwa-asset:'||u.hostname!=='custom'||!custom.some(x=>x.file===name)||! /^[a-f0-9]{32}\.png$/.test(name))return null;return path.join(dataDir,'custom-accessories',name);}catch{return null;}}
module.exports={dimensions,importFile,assetPath};
