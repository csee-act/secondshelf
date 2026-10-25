import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {createApp} from '../server.mjs';
import {recommendation,today,daysSince} from '../public/domain.js';
import {sanitizeImage} from '../lib/images.mjs';

const PHOTO='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aE1sAAAAASUVORK5CYII=';
let app,url,a,b,dir;
function cleanup(path){const target=resolve(path),root=resolve(tmpdir());assert.ok(target.startsWith(root+sep)&&basename(target).startsWith('secondshelf-'));rmSync(target,{recursive:true,force:true});}
async function client(){const r=await fetch(url+'/api/state');const data=await r.json();return {cookie:r.headers.get('set-cookie').split(';')[0],csrf:data.csrf,data};}
async function request(c,path,method='GET',data,headers={}){const r=await fetch(url+path,{method,headers:{Cookie:c.cookie,...(method!=='GET'?{'X-CSRF-Token':c.csrf}:{}),...(data?{'Content-Type':'application/json'}:{}),...headers},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,data:r.headers.get('content-type')?.includes('application/json')?await r.json():await r.arrayBuffer()};}
function newItem(overrides={}){return {name:'A real test item',photo:PHOTO,category:'Kitchen',location:'Secret cupboard 42',attachment:2,condition:'Good',story:'A secret family memory',description:'A useful appliance.',estimate:75,lastUsed:'2024-01-01',lastMoved:'2025-01-01',...overrides};}
before(async()=>{dir=mkdtempSync(join(tmpdir(),'secondshelf-test-'));app=createApp({dataDir:dir,apiKey:''});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+app.server.address().port;a=await client();b=await client();});
after(async()=>{await app.close();cleanup(dir);});

test('decision policy respects attachment, protection, unknown and approximate dates',()=>{
  const old={lastUsed:'2020-01-01',attachment:1};
  assert.equal(recommendation(old).type,'rehome');
  assert.equal(recommendation({...old,attachment:5}).type,'keep');
  assert.equal(recommendation({...old,protected:true}).type,'keep');
  assert.equal(recommendation({...old,usedApproximate:true}).type,'context');
  assert.equal(recommendation({...old,lastUsed:null}).type,'context');
  assert.equal(recommendation({...old,attachment:0}).type,'context');
  assert.equal(recommendation({...old,attachment:3}).type,'reuse');
  assert.equal(recommendation({...old,lastUsed:today()}).type,'active');
  assert.equal(recommendation({...old,listed:true}).type,'listed');
  assert.equal(daysSince('2026-04-29','2026-10-26'),180);
  assert.equal(recommendation({attachment:1,lastUsed:'2026-04-30'},'2026-10-26').type,'active');
});
test('separate sessions get private sample inventories and no fake AI availability',()=>{
  assert.equal(a.data.items.length,8);assert.equal(b.data.items.length,8);
  assert.notEqual(a.data.items[0].id,b.data.items[0].id);
  assert.equal(a.data.ai.available,false);assert.equal(a.data.listings.length,3);
});
test('CSRF tokens and origin checks protect mutations',async()=>{
  assert.equal((await request(a,'/api/items','POST',newItem(),{'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await request(a,'/api/items','POST',newItem(),{Origin:'https://unrelated.example'})).status,403);
  assert.equal((await request(a,'/api/items','POST',newItem(),{'X-CSRF-Token':b.csrf})).status,403);
});
test('create, persisted reads, ownership checks, and independent activity updates',async()=>{
  const created=await request(a,'/api/items','POST',newItem());assert.equal(created.status,201);const item=created.data.item;
  assert.equal((await request(a,'/api/state')).data.items.some(i=>i.id===item.id),true);
  assert.equal((await request(a,item.imageUrl)).status,200);
  assert.equal((await request(b,item.imageUrl)).status,404);
  assert.equal((await request(b,`/api/items/${item.id}`,'PATCH',newItem())).status,404);
  assert.equal((await request(b,`/api/items/${item.id}`,'DELETE')).status,404);
  const used=await request(a,`/api/items/${item.id}/activity`,'POST',{action:'used'});
  assert.equal(used.data.item.lastUsed,today());assert.equal(used.data.item.lastMoved,'2025-01-01');
  const moved=await request(a,`/api/items/${item.id}/activity`,'POST',{action:'moved'});
  assert.equal(moved.data.item.lastUsed,today());assert.equal(moved.data.item.lastMoved,today());
  const edited=await request(a,`/api/items/${item.id}`,'PATCH',{...moved.data.item,name:'A corrected name'});
  assert.equal(edited.status,200);assert.equal(edited.data.item.lastMoved,today());
});
test('public listings are snapshots, idempotent, shared, and exclude private fields',async()=>{
  const item=(await request(a,'/api/items','POST',newItem({name:'Private snapshot test'}))).data.item;
  const listingData={itemId:item.id,mode:'sell',price:50,name:'A public appliance',description:'The owner approved this public description.'};
  const first=await request(a,'/api/listings','POST',listingData);assert.equal(first.status,201);
  const second=await request(a,'/api/listings','POST',listingData);assert.equal(first.data.id,second.data.id);
  const publicState=(await request(b,'/api/state')).data;
  const listing=publicState.listings.find(l=>l.id===first.data.id);assert.ok(listing);assert.equal(listing.owned,false);
  const serialized=JSON.stringify(publicState.listings);assert.ok(!serialized.includes('Secret cupboard 42'));assert.ok(!serialized.includes('A secret family memory'));
  for(const key of ['story','attachment','estimate','lastUsed','lastMoved','location','user_id','item_id'])assert.equal(key in listing,false,key);
  assert.equal((await request(b,listing.imageUrl)).status,200);
  await request(a,`/api/items/${item.id}`,'PATCH',{...item,name:'Changed privately',description:'Changed private description',story:'Another secret'});
  assert.equal((await request(b,'/api/state')).data.listings.find(l=>l.id===first.data.id).name,'A public appliance');
  assert.equal((await request(b,`/api/listings/${first.data.id}`,'DELETE')).status,404);
  assert.equal((await request(a,`/api/items/${item.id}`,'DELETE')).status,409);
  assert.equal((await request(a,`/api/listings/${first.data.id}`,'DELETE')).status,200);
  assert.equal((await request(b,listing.imageUrl)).status,404);
  assert.equal((await request(a,'/api/state')).data.items.find(i=>i.id===item.id).listed,false);
  assert.equal((await request(a,`/api/items/${item.id}`,'DELETE')).status,200);
});
test('swap validation, dates, money, image validation, and location confirmation',async()=>{
  for(const changes of [{lastUsed:'2999-01-01'},{lastUsed:'2025-02-31'},{estimate:-1},{attachment:8},{photo:'data:image/svg+xml;base64,PHN2Zy8+'}])assert.equal((await request(a,'/api/items','POST',newItem(changes))).status,400);
  const item=(await request(a,'/api/items','POST',newItem())).data.item;
  assert.equal((await request(a,'/api/listings','POST',{itemId:item.id,mode:'swap',name:'A swap',description:'Good appliance'})).status,400);
  assert.equal((await request(a,'/api/listings','POST',{itemId:item.id,mode:'swap',name:'A swap',description:'Good appliance',swapFor:'A book'})).status,201);
  assert.equal((await request(a,`/api/items/${item.id}`,'PATCH',{...item,location:'A new shelf'})).status,400);
  const corrected=await request(a,`/api/items/${item.id}`,'PATCH',{...item,location:'A corrected label',confirmMove:true,recordMove:false});assert.equal(corrected.data.item.lastMoved,item.lastMoved);
  const moved=await request(a,`/api/items/${item.id}`,'PATCH',{...corrected.data.item,location:'Another room',confirmMove:true,recordMove:true});assert.equal(moved.data.item.lastMoved,today());assert.equal(moved.data.item.lastUsed,item.lastUsed);
});
test('AI unavailability is explicit and never returns simulated recognition',async()=>{
  const r=await request(a,'/api/analyze','POST',{photo:PHOTO});assert.equal(r.status,503);assert.equal(r.data.code,'AI_NOT_CONFIGURED');assert.equal('draft' in r.data,false);
});
test('images are bounded and malformed images are rejected',()=>{
  assert.equal(sanitizeImage(PHOTO).mime,'image/png');
  assert.throws(()=>sanitizeImage('data:image/jpeg;base64,YWJj'));assert.throws(()=>sanitizeImage('https://example.com/a.png'));
});
test('AI request uses only the photo and structured output; adapter handles a mocked provider',async()=>{
  const tmp=mkdtempSync(join(tmpdir(),'secondshelf-ai-test-'));let captured;
  const ai=createApp({dataDir:tmp,apiKey:'test-only-not-a-real-key',fetch:async(target,opts)=>{assert.equal(target,'https://api.openai.com/v1/responses');captured=JSON.parse(opts.body);return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify({name:'A cup',category:'Kitchen',description:'A small cup.',uncertainty:'Working condition cannot be inferred.'})}]}]}),{status:200});}});
  await new Promise(r=>ai.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+ai.server.address().port;
  try{
    const stateResponse=await fetch(base+'/api/state');const cookie=stateResponse.headers.get('set-cookie').split(';')[0],s=await stateResponse.json();
    const r=await fetch(base+'/api/analyze',{method:'POST',headers:{Cookie:cookie,'X-CSRF-Token':s.csrf,'Content-Type':'application/json'},body:JSON.stringify({photo:PHOTO,story:'DO NOT SEND THIS STORY',location:'DO NOT SEND THIS LOCATION'})});
    assert.equal(r.status,200);assert.equal((await r.json()).draft.name,'A cup');assert.equal(captured.store,false);assert.equal(captured.text.format.type,'json_schema');assert.equal(JSON.stringify(captured).includes('DO NOT SEND'),false);
  }finally{await ai.close();cleanup(tmp);}
});
test('location metadata is removed from PNG uploads while pixels remain intact',()=>{
  const original=Buffer.from(PHOTO.split(',')[1],'base64');
  const payload=Buffer.from('GPSLatitude=3.1;GPSLongitude=101.6'),type=Buffer.from('eXIf');
  const chunk=Buffer.alloc(payload.length+12);chunk.writeUInt32BE(payload.length);type.copy(chunk,4);payload.copy(chunk,8);
  let crc=0xffffffff;for(const byte of Buffer.concat([type,payload])){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}chunk.writeUInt32BE((crc^0xffffffff)>>>0,chunk.length-4);
  const input=Buffer.concat([original.subarray(0,33),chunk,original.subarray(33)]);
  const output=sanitizeImage('data:image/png;base64,'+input.toString('base64'));
  assert.deepEqual(output.bytes,original);assert.equal(output.bytes.includes(Buffer.from('GPSLatitude')),false);
});
test('inventory, images, and browser sessions survive a server restart',async()=>{
  const tmp=mkdtempSync(join(tmpdir(),'secondshelf-restart-test-'));let running=createApp({dataDir:tmp,apiKey:''});
  async function start(){await new Promise(r=>running.server.listen(0,'127.0.0.1',r));return 'http://127.0.0.1:'+running.server.address().port;}
  try{
    let base=await start();const initial=await fetch(base+'/api/state'),cookie=initial.headers.get('set-cookie').split(';')[0],state=await initial.json();
    const response=await fetch(base+'/api/items',{method:'POST',headers:{Cookie:cookie,'X-CSRF-Token':state.csrf,'Content-Type':'application/json'},body:JSON.stringify(newItem({name:'Still here after restart'}))});
    const {item}=await response.json();assert.equal(response.status,201);
    await running.close();running=createApp({dataDir:tmp,apiKey:''});base=await start();
    const reopened=await fetch(base+'/api/state',{headers:{Cookie:cookie}});const restored=await reopened.json();
    assert.equal(restored.csrf,state.csrf);assert.equal(restored.items.find(i=>i.id===item.id).name,'Still here after restart');
    assert.equal((await fetch(base+item.imageUrl,{headers:{Cookie:cookie}})).status,200);
  }finally{await running.close();cleanup(tmp);}
});
