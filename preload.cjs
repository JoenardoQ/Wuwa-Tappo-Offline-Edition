const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('petAPI',{
 init:()=>ipcRenderer.invoke('init'), command:(name,args)=>ipcRenderer.invoke('command',name,args),
 onPage:cb=>ipcRenderer.on('page',(_,p)=>cb(p)),onState:cb=>ipcRenderer.on('state',(_,data)=>cb(data)),onInput:cb=>ipcRenderer.on('input',(_,data)=>cb(data)),
 onEmote:cb=>ipcRenderer.on('emote',(_,id)=>cb(id)),onStatus:cb=>ipcRenderer.on('status',(_,s)=>cb(s)),
 move:(dx,dy)=>ipcRenderer.send('move',dx,dy)
});
