import {PiSpigot,Matcher} from './engine.js';
let generator,matcher,status='idle',active=0,deadline=0,revision=0,timer;
function snapshot() { postMessage({status,revision,active,count:matcher?.count.toString()||'0',recent:matcher?.recent||'',position:matcher?.position?.toString()||null}); }
function slice() {
  if(status!=='running') return;
  const start=performance.now();
  try {
    while(performance.now()-start<12 && Date.now()<deadline) {
      const digit=generator.step();
      if(digit!==null && matcher.feed(digit)!==null) {status='found';break;}
    }
    active+=performance.now()-start;
    if(status==='running' && Date.now()>=deadline) status='timeout';
    snapshot();
    if(status==='running') timer=setTimeout(slice,0);
  } catch { status='error'; snapshot(); }
}
self.onmessage=({data})=>{
  try {
    clearTimeout(timer); revision=data.revision;
    if(data.type==='start') {generator=new PiSpigot();matcher=new Matcher(data.pattern);active=0;status='running';deadline=data.deadline;}
    else if(data.type==='resume' && ['paused','timeout'].includes(status)) {status='running';deadline=data.deadline;}
    else if(data.type==='pause' && status==='running') status='paused';
    else if(data.type==='timeout' && status==='running') status='timeout';
    else if(data.type==='allowance' && status==='running') deadline=data.deadline;
    snapshot(); if(status==='running') timer=setTimeout(slice,0);
  } catch {status='error';snapshot();}
};
