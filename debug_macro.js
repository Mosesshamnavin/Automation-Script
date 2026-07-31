(function(){
function getFrames(){let docs=[document];let frames=document.querySelectorAll('iframe, frame');for(let f of frames){try{if(f.contentDocument||f.contentWindow.document)docs.push(f.contentDocument||f.contentWindow.document);}catch(e){}}return docs;}

function simClick(el){
if(!el)return;
el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,view:window}));
el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true,view:window}));
el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
if(typeof el.click==='function')el.click();
}

function doScopedSearch(refEl){
if(refEl){
let container=refEl.parentElement;
while(container&&container!==document.body){
let allBtns=Array.from(container.querySelectorAll('*'));
let searchBtns=allBtns.filter(b=>{
let t=(b.textContent||b.value||'').toLowerCase().trim();
return t==='search'&&b.getBoundingClientRect().width>0;
});
if(searchBtns.length>0){
let best=null;
for(let i=searchBtns.length-1;i>=0;i--){
if(searchBtns[i].tagName==='BUTTON'){best=searchBtns[i];break;}
}
if(!best)best=searchBtns[searchBtns.length-1];
if(best){
let btn=best.closest('button, input, a, div[role="button"]')||best;
if(btn.style)btn.style.border='3px solid red';
simClick(btn);
let form=btn.closest('form');
if(form){
try{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));if(typeof form.submit==='function')form.submit();}catch(err){}
}
return true;
}
}
container=container.parentElement;
}
}
for(let doc of getFrames()){
if(!doc)continue;
let allBtns=Array.from(doc.querySelectorAll('*'));
let searchBtns=allBtns.filter(b=>{
let t=(b.textContent||b.value||'').toLowerCase().trim();
return t==='search'&&b.getBoundingClientRect().width>0;
});
let best=null;
for(let i=searchBtns.length-1;i>=0;i--){
if(searchBtns[i].tagName==='BUTTON'){best=searchBtns[i];break;}
}
if(!best&&searchBtns.length>0)best=searchBtns[searchBtns.length-1];
if(best){
let btn=best.closest('button, input, a, div[role="button"]')||best;
if(btn.style)btn.style.border='3px solid red';
simClick(btn);
let form=btn.closest('form');
if(form){
try{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));if(typeof form.submit==='function')form.submit();}catch(err){}
}
return true;
}
}
return false;
}

let hasData=false;
for(let doc of getFrames()){
if(!doc)continue;
let tables=Array.from(doc.querySelectorAll('table'));
let resTables=tables.filter(t=>Array.from(t.querySelectorAll('th')).some(th=>th.textContent.toLowerCase().trim()==='note'));
let resTable=resTables.pop();
if(resTable){
let dataRows=Array.from(resTable.querySelectorAll('tbody tr')).filter(r=>r.children.length>=3);
if(dataRows.length>0){hasData=true;}
}
}

let links=Array.from(document.querySelectorAll('a'));
let tTab=links.find(e=>{
if(e.textContent.toLowerCase().trim()!=='transactions')return false;
let idx=links.indexOf(e);
let start=Math.max(0,idx-5);
for(let i=start;i<idx;i++){
if(links[i].textContent.toLowerCase().trim().startsWith('notes'))return true;
}
return false;
});
if(!tTab){tTab=links.find(e=>e.textContent.toLowerCase().trim()==='transactions');}

if(tTab){
simClick(tTab);
setTimeout(()=>{
let globalDLabel = null;
for(let doc of getFrames()){
if(!doc)continue;
let all=Array.from(doc.querySelectorAll('*'));
let dLabels=all.filter(e=>{
if(e.tagName==='TH'||e.tagName==='TD')return false;
let t=(e.textContent||'').toLowerCase().replace(/\s+/g,' ').trim();
return (t==='date from'||t==='date from *'||t==='date from:')&&e.getBoundingClientRect().width>0&&e.children.length<=2;
});
let dLabel=dLabels.pop();
if(dLabel){
globalDLabel = dLabel;
let idx=all.indexOf(dLabel);
for(let i=idx+1;i<idx+30&&i<all.length;i++){
if(all[i].tagName==='INPUT'&&all[i].getBoundingClientRect().width>0){
let d=new Date();d.setMonth(d.getMonth()-1);
let val = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0") + " 00:00";
let setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
if(setter)setter.call(all[i],val);else all[i].value=val;
all[i].dispatchEvent(new Event('input',{bubbles:true}));all[i].dispatchEvent(new Event('change',{bubbles:true}));all[i].dispatchEvent(new Event('blur',{bubbles:true}));
break;
}
}
}

let selects=Array.from(doc.querySelectorAll('select'));
let selectsRev=selects.slice().reverse();
let amtLabels=all.filter(e=>{
if(e.tagName==='TH'||e.tagName==='TD')return false;
let t=(e.textContent||'').toLowerCase().replace(/\s+/g,' ').trim();
return (t==='amount range in (to)'||t==='amount range in (to) *'||t==='amount range in (to):')&&e.getBoundingClientRect().width>0&&e.children.length<=2;
});
let amtLabel=amtLabels.pop();

if(hasData){
for(let select of selectsRev){
let opt=Array.from(select.options).find(o=>o.textContent.toLowerCase().trim().includes('redeem the bonus'));
if(opt){
select.value=opt.value;select.selectedIndex=opt.index;
select.dispatchEvent(new Event('change',{bubbles:true}));select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('blur',{bubbles:true}));
break;
}
}
if(amtLabel){
let idx=all.indexOf(amtLabel);
for(let i=idx+1;i<idx+30&&i<all.length;i++){
if(all[i].tagName==='INPUT'&&all[i].getBoundingClientRect().width>0){
let setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
if(setter)setter.call(all[i],'');else all[i].value='';
all[i].dispatchEvent(new Event('input',{bubbles:true}));all[i].dispatchEvent(new Event('change',{bubbles:true}));all[i].dispatchEvent(new Event('blur',{bubbles:true}));
break;
}
}
}
}else{
for(let select of selectsRev){
let opt=Array.from(select.options).find(o=>o.textContent.toLowerCase().trim().includes('redeem the bonus'));
if(opt){
select.value='';select.selectedIndex=0;
select.dispatchEvent(new Event('change',{bubbles:true}));select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('blur',{bubbles:true}));
break;
}
}
if(amtLabel){
let idx=all.indexOf(amtLabel);
for(let i=idx+1;i<idx+30&&i<all.length;i++){
if(all[i].tagName==='INPUT'&&all[i].getBoundingClientRect().width>0){
let setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
if(setter)setter.call(all[i],'-8.01');else all[i].value='-8.01';
all[i].dispatchEvent(new Event('input',{bubbles:true}));all[i].dispatchEvent(new Event('change',{bubbles:true}));all[i].dispatchEvent(new Event('blur',{bubbles:true}));
break;
}
}
}
}
}

setTimeout(()=>{
doScopedSearch(globalDLabel);
}, 1000);

}, 3500);
} else {
alert("Could not find the Transactions tab!");
}
})();