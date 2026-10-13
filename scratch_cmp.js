const fs=require('fs');const [a,b]=process.argv.slice(2);
const A=JSON.parse(fs.readFileSync(a,'utf8')),B=JSON.parse(fs.readFileSync(b,'utf8'));
const keys=(o,p='')=>typeof o==='string'?[p]:Object.entries(o).flatMap(([k,v])=>keys(v,p+'/'+k));
const ka=new Set(keys(A)),kb=new Set(keys(B));
const miss=[...ka].filter(k=>!kb.has(k)),extra=[...kb].filter(k=>!ka.has(k));
const ph=[];for(const k of ka){if(!kb.has(k))continue;const g=o=>k.split('/').slice(1).reduce((x,y)=>x[y],o);const f=s=>(s.match(/\{\{\w+\}\}/g)||[]).sort().join();if(f(g(A))!==f(g(B)))ph.push(k)}
console.log('events',Object.keys(A).length,Object.keys(B).length,'strings',ka.size,kb.size,'missing',miss,'extra',extra,'placeholder-mismatch',ph);
