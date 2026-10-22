// Main-thread watchdog is independent of worker arithmetic and worker timers.
export class SearchController {
  constructor({createWorker,now=Date.now,onUpdate,onState}) {Object.assign(this,{createWorker,now,onUpdate,onState});this.state='idle';this.revision=0;this.worker=null;this.cutoff=null;}
  emit(state,detail='') {this.state=state;this.onState(state,detail);}
  send(type,extra={}) {this.worker.postMessage({type,revision:++this.revision,...extra});}
  start(pattern,seconds) {
    this.dispose();this.allowance=seconds*1000;this.deadline=this.now()+this.allowance;this.emit('running');
    try {
      const w=this.worker=this.createWorker();
      w.onmessage=({data})=>{if(this.worker!==w||data.revision!==this.revision)return;this.onUpdate(data);if(data.status==='error'){this.fail();return;}if(data.status!=='running'){this.cutoff=null;this.emit(data.status);if(data.status==='found')this.dispose();}};
      w.onerror=e=>{e.preventDefault?.();if(this.worker===w)this.fail();};w.onmessageerror=()=>{if(this.worker===w)this.fail();};
      this.send('start',{pattern,deadline:this.deadline});
    } catch {this.fail();}
  }
  fail(){this.dispose();this.emit('error','The calculation worker could not run. Try reloading in a current browser; your session state is unavailable.');}
  apply(seconds){this.allowance=seconds*1000;if(this.state==='running'){this.deadline=this.now()+this.allowance;this.send('allowance',{deadline:this.deadline});}}
  resume(seconds){if(!this.worker||!['paused','timeout'].includes(this.state))return;this.allowance=seconds*1000;this.deadline=this.now()+this.allowance;this.cutoff=null;this.emit('running');this.send('resume',{deadline:this.deadline});}
  pause(){if(this.state!=='running')return;this.emit('pausing');this.cutoff=this.now()+2000;this.send('pause');}
  tick(){
    if(this.state==='running'&&this.now()>=this.deadline){this.emit('timingout');this.cutoff=this.now()+2000;this.send('timeout');}
    if(this.cutoff!==null&&this.now()>=this.cutoff){this.dispose();this.emit('terminated','The worker did not respond within two seconds and was terminated. Only the last confirmed counts are shown. State was lost; start a new search.');}
  }
  stop(){this.dispose();this.emit('stopped');}
  dispose(){this.worker?.terminate();this.worker=null;this.cutoff=null;}
}
