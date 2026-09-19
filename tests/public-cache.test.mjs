import test from 'node:test';
import assert from 'node:assert/strict';
import {publicReadTags, publicPathTags} from '../lib/cache/public-policy.ts';
const origin='https://project.supabase.co', key='test-publishable-key';
const headers=new Headers({apikey:key,authorization:`Bearer ${key}`});
function tags(path,method='GET',h=headers){return publicReadTags(new URL(path,origin),method,h,origin,key);}
test('published joins invalidate when either games, presets or hardware changes',()=>{
 const result=tags('/rest/v1/benchmarks?status=eq.published&select=id,games(name),handhelds!inner(name),presets(name)');
 assert.deepEqual(new Set(result),new Set(['atlas:benchmarks','atlas:games','atlas:handhelds','atlas:presets']));
});
test('user sessions and cookies cannot enter the public cache',()=>{
 for(const h of [new Headers({apikey:key,authorization:'Bearer user-token'}),new Headers({apikey:key,cookie:'session=private'}),new Headers({apikey:'different'})])
 assert.deepEqual(tags('/rest/v1/games?status=eq.published','GET',h),[]);
});
test('writes, drafts, private tables and unknown RPCs never receive cache tags',()=>{
 for(const [p,m] of [['/rest/v1/games?status=eq.published','POST'],['/rest/v1/games?status=eq.draft','GET'],['/rest/v1/games','GET'],['/rest/v1/profiles?status=eq.published','GET'],['/auth/v1/user','GET'],['/rest/v1/rpc/get_my_submissions','GET'],['https://other.example/rest/v1/games?status=eq.published','GET']]) assert.deepEqual(tags(p,m),[]);
});
test('only the two public aggregate RPCs are cacheable',()=>{
 assert.deepEqual(tags('/rest/v1/rpc/get_game_rating_summaries'),['atlas:games']);
 assert.deepEqual(tags('/rest/v1/rpc/get_monthly_top_games?p_limit=5'),['atlas:games']);
});
test('admin and user paths do not flush unrelated public content',()=>{
 assert.deepEqual(publicPathTags('/news/example'),['atlas:news']);
 assert.deepEqual(publicPathTags('/games'),['atlas:games']);
 for(const p of ['/admin/news','/profile','/my-submissions','/']) assert.deepEqual(publicPathTags(p),[]);
});
