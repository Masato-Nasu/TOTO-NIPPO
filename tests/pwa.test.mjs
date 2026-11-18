import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
test('PWA caches only its own shell and opens offline under subdirectory',async()=>{
 const handlers={},stored=new Map(),deleted=[];let claimed=false;
 const cache={addAll:async urls=>{for(const u of urls){const rel=new URL(u).pathname.replace('/apps/toto-nippo/','')||'index.html';await readFile(new URL('../dist/'+rel,import.meta.url));stored.set(u,{body:rel})}},match:async req=>stored.get(typeof req==='string'?req:req.url)};
 vm.runInNewContext(await readFile(new URL('../dist/sw.js',import.meta.url),'utf8'),{URL,self:{location:{href:'https://example.com/apps/toto-nippo/sw.js'},addEventListener:(type,fn)=>handlers[type]=fn,clients:{claim:async()=>{claimed=true}}},caches:{open:async()=>cache,keys:async()=>['other-app','toto-nippo:/apps/toto-nippo/:old'],delete:async k=>deleted.push(k)},fetch:async()=>{throw Error('offline')}});
 let work;handlers.install({waitUntil:p=>work=p});await work;
 handlers.activate({waitUntil:p=>work=p});await work;assert.equal(claimed,true);assert.deepEqual(deleted,['toto-nippo:/apps/toto-nippo/:old']);
 let result;handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://example.com/apps/toto-nippo/?launch=1'},respondWith:p=>result=p});assert.equal((await result).body,'index.html');
 for(const url of ['https://api.openai.com/v1/responses','https://example.com/api/data','https://example.com/apps/toto-nippo/private.json']){let intercepted=false;handlers.fetch({request:{method:'GET',url},respondWith:()=>intercepted=true});assert.equal(intercepted,false)}
});
