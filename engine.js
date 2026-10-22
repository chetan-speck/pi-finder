// Exact unbounded linear-fractional integer spigot. One transformation per step.
export class PiSpigot {
  constructor() { this.q=1n; this.r=0n; this.t=1n; this.k=1n; this.n=3n; this.l=3n; this.integer=true; }
  step() {
    const {q,r,t,k,n,l}=this;
    if (4n*q+r-t < n*t) {
      this.q=10n*q; this.r=10n*(r-n*t); this.n=(10n*(3n*q+r))/t-10n*n;
      if(this.integer) { this.integer=false; return null; }
      return n.toString();
    }
    this.q=q*k; this.r=(2n*q+r)*l; this.t=t*l;
    this.n=(q*(7n*k)+2n+r*l)/(t*l); this.k=k+1n; this.l=l+2n;
    return null;
  }
}
export class Matcher {
  constructor(pattern) {
    if(!/^[0-9]+$/.test(pattern)) throw new Error('Enter one or more digits.');
    this.pattern=pattern; this.table=new Uint32Array(pattern.length); this.j=0; this.count=0n; this.position=null; this.recent='';
    for(let i=1,j=0;i<pattern.length;i++) { while(j && pattern[i]!==pattern[j]) j=this.table[j-1]; if(pattern[i]===pattern[j]) j++; this.table[i]=j; }
  }
  feed(digit) {
    if(this.position!==null) return this.position;
    this.count++; this.recent=(this.recent+digit).slice(-Math.max(96,this.pattern.length+32));
    while(this.j && digit!==this.pattern[this.j]) this.j=this.table[this.j-1];
    if(digit===this.pattern[this.j]) this.j++;
    if(this.j===this.pattern.length) this.position=this.count-BigInt(this.pattern.length)+1n;
    return this.position;
  }
}
export function normalize(mode,raw) {
  const s=raw.trim();
  if(mode==='birthday') {
    if(!/^\d{2}-\d{2}-\d{4}$/.test(s)) throw new Error('Use DD-MM-YYYY, for example 01-02-2000.');
    const [d,m,y]=s.split('-').map(Number); const leap=y%4===0&&(y%100!==0||y%400===0);
    const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
    if(y<1||m<1||m>12||d<1||d>days[m-1]) throw new Error('Enter a real calendar date (years 0001–9999).');
    return s.replaceAll('-','');
  }
  if(mode==='phone') {
    if(!/^\+?[0-9 ()\-]+$/.test(s)) throw new Error('Use digits, spaces, parentheses, hyphens and an optional leading +.');
    const digits=s.replace(/[ ()\-+]/g,'');
    if(!digits) throw new Error('Enter at least one phone-number digit.');
    return digits;
  }
  if(!/^[0-9]+$/.test(s)) throw new Error('Enter digits 0–9 only. Leading zeros are welcome.');
  return s;
}
export function timeoutSeconds(raw) {
  if(!/^\d+$/.test(String(raw)) || !Number.isSafeInteger(Number(raw)) || Number(raw)<1 || Number(raw)>86400) throw new Error('Choose a whole number from 1 to 86,400 seconds (24 hours per allowance).');
  return Number(raw);
}
export function supported(env) { return typeof env.Worker==='function' && typeof env.BigInt==='function'; }
