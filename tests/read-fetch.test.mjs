import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadFetch } from '../lib/supabase/read-fetch.ts';
const origin='https://project.supabase.co';
test('one gateway failure recovers without changing headers or request options',async()=>{
 const calls=[];const options={method:'GET',headers:{Authorization:'test-only'}};
 const read=createReadFetch(origin,async(...args)=>{calls.push(args);return new Response(calls.length===1?'Gateway Timeout':'[]',{status:calls.length===1?504:200});});
 const response=await read(origin+'/rest/v1/games',options);
 assert.equal(await response.text(),'[]');assert.equal(calls.length,2);assert.equal(calls[1][1],options);
});
test('persistent failure stops after two attempts and preserves the error',async()=>{
 let calls=0;const read=createReadFetch(origin,async()=>{calls++;return new Response('Unavailable',{status:503});});
 const response=await read(origin+'/rest/v1/games');assert.equal(calls,2);assert.equal(response.status,503);assert.equal(await response.text(),'Unavailable');
});
test('writes, auth, other origins and permission errors are not retried',async()=>{
 for(const [url,method,status] of [[origin+'/rest/v1/games','POST',504],[origin+'/rest/v1/games','PATCH',504],[origin+'/auth/v1/user','GET',504],['https://other.example/rest/v1/games','GET',504],[origin+'/rest/v1/games','GET',403]]){
 let calls=0;const read=createReadFetch(origin,async()=>{calls++;return new Response('Error',{status});});
 await read(url,{method});assert.equal(calls,1);
 }
});
test('cancelled reads are not retried',async()=>{
 const controller=new AbortController();let calls=0;
 const read=createReadFetch(origin,async()=>{calls++;controller.abort();return new Response('Timeout',{status:504});});
 await read(origin+'/rest/v1/games',{signal:controller.signal});assert.equal(calls,1);
});
