(async function(){
  'use strict';
  const $=id=>document.getElementById(id), tabs=[...document.querySelectorAll('[role=tab]')];
  const session=$('session'),start=$('start');
  if(typeof Worker!=='function'||typeof BigInt!=='function') {start.disabled=true;$('input-error').textContent='This browser needs Web Workers and BigInt. Please use a current browser.';return;}
  try {
    const [{normalize,timeoutSeconds},{SearchController}]=await Promise.all([import('./engine.js'),import('./controller.js')]);
    let mode='any',pattern='',last={count:'0',active:0,recent:''};
    const fmt=n=>Number(n).toLocaleString(undefined,{maximumFractionDigits:0});
    function timeout(){try{const n=timeoutSeconds($('timeout').value);$('timeout-error').textContent='';$('timeout').removeAttribute('aria-invalid');return n;}catch(e){$('timeout-error').textContent=e.message;$('timeout').setAttribute('aria-invalid','true');$('timeout').focus();return null;}}
    const messages={running:'Searching the digits of π…',pausing:'Pausing…',paused:'Paused. Your place is saved.',timingout:'Finishing the current slice…',timeout:'Not found within the digits searched.',found:'A little you, found in π.',stopped:'Search stopped.',terminated:'Not found within the digits searched.',error:'Calculation unavailable.'};
    function state(s,detail){
      $('status').textContent=messages[s]||'Ready';
      $('status-detail').textContent=detail||({running:'Calculating privately on your device.',paused:'Resume with a fresh timeout allowance, continuing from this exact state.',timeout:'Keep exploring to continue from here with a fresh timeout allowance.',stopped:'Calculation state has been discarded. Start a new search.',found:'Your sequence’s first occurrence in the decimal expansion.'}[s]||'');
      const busy=['running','pausing','timingout'].includes(s), retained=busy||['paused','timeout'].includes(s);
      $('number').disabled=retained;tabs.forEach(t=>t.disabled=retained);start.hidden=s!=='idle';
      $('pause').hidden=s!=='running';$('resume').hidden=s!=='paused';$('continue').hidden=s!=='timeout';$('stop').hidden=!retained;
      $('new').hidden=busy; $('result').hidden=s!=='found';$('recent-wrap').hidden=s==='found';
      if(!busy)$('remaining').textContent=s==='timeout'||s==='terminated'?'0 s':'—';
      if(s==='timeout')$('progress').value=100;
    }
    function update(data){last=data;$('count').textContent=data.count.replace(/\B(?=(\d{3})+(?!\d))/g,',');$('active').textContent=(data.active/1000).toFixed(2)+' s';$('recent').textContent=data.recent||'Waiting for the first digits…';if(data.position){$('position').textContent=data.position.replace(/\B(?=(\d{3})+(?!\d))/g,',');$('match').replaceChildren();const before=data.recent.slice(0,-pattern.length);$('match').append(document.createTextNode((BigInt(data.count)>BigInt(data.recent.length)?'…':'3.')+before));const mark=document.createElement('mark');mark.textContent=pattern;$('match').append(mark);}}
    const control=new SearchController({createWorker:()=>new Worker(new URL('./worker.js',document.baseURI),{type:'module'}),onUpdate:update,onState:state});
    function apply(){const n=timeout();if(n===null)return;control.apply(n);document.querySelectorAll('[data-seconds]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.seconds)===n)));}
    $('apply-time').onclick=apply;
    document.querySelectorAll('[data-seconds]').forEach(b=>b.onclick=()=>{$('timeout').value=b.dataset.seconds;apply();});
    tabs.forEach((tab,i)=>{
      tab.onclick=()=>{mode=tab.dataset.mode;tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1;});$('input-panel').setAttribute('aria-labelledby',tab.id);$('number').value='';$('input-error').textContent='';$('number').removeAttribute('aria-invalid');const config={any:['Your meaningful number','e.g. 14159','Any sequence of digits. Keep those leading zeros.','numeric'],birthday:['Your birthday (DD-MM-YYYY)','e.g. 01-02-2000','We search DDMMYYYY: 01-02-2000 becomes 01022000.','text'],phone:['Your phone number','e.g. +91 (020) 1234-5678','Spaces, parentheses, hyphens and a leading + are removed. Zeros and country codes stay.','tel']}[mode];$('number-label').textContent=config[0];$('number').placeholder=config[1];$('input-help').textContent=config[2];$('number').inputMode=config[3];};
      tab.onkeydown=e=>{let j;if(e.key==='ArrowRight')j=(i+1)%3;if(e.key==='ArrowLeft')j=(i+2)%3;if(e.key==='Home')j=0;if(e.key==='End')j=2;if(j!==undefined){e.preventDefault();tabs[j].focus();tabs[j].click();}};
    });
    $('search-form').onsubmit=e=>{e.preventDefault();if(control.worker)return;try{pattern=normalize(mode,$('number').value);$('input-error').textContent='';$('number').removeAttribute('aria-invalid');}catch(err){$('input-error').textContent=err.message;$('number').setAttribute('aria-invalid','true');$('number').focus();return;}const seconds=timeout();if(seconds===null)return;session.hidden=false;$('search-sequence').textContent=pattern;$('result').hidden=true;update({count:'0',recent:'',active:0});$('progress').value=0;control.start(pattern,seconds);};
    $('pause').onclick=()=>control.pause();$('stop').onclick=()=>control.stop();
    const resume=()=>{const n=timeout();if(n!==null)control.resume(n);};$('resume').onclick=resume;$('continue').onclick=resume;
    $('new').onclick=()=>{control.dispose();state('idle');control.state='idle';session.hidden=true;$('number').disabled=false;$('number').focus();};
    setInterval(()=>{control.tick();if(control.state==='running'){const left=Math.max(0,control.deadline-Date.now());$('remaining').textContent=Math.ceil(left/1000)+' s';$('progress').value=100*(1-left/control.allowance);}},100);
    window.addEventListener('pagehide',()=>control.dispose());
  } catch {$('input-error').textContent='The application could not load. Reload this page in a current browser, or check that all site assets are available.';start.disabled=true;}
})();
