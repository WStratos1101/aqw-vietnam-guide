import test from 'node:test';
import assert from 'node:assert/strict';
import { disposition, duplicateGroups } from '../scripts/farm-data-sync.mjs';
import { auditCatalog } from '../Update/AQW_Farm_Inventory_V3/aqw-farm-inventory.mjs';
test('URL/name conflicts cannot assign a canonical identity',()=>{
 const r=disposition({status:'URL_NAME_CONFLICT_CHECK_WIKI',candidateIds:['a']},'target');
 assert.equal(r.status,'ambiguous');assert.equal(r.canonicalId,null);
});
test('exact matches remain pending verification and missing materials remain separate',()=>{
 assert.equal(disposition({status:'MATCHED_NEEDS_ROLE_REVIEW',candidateIds:['a']},'target').verificationStatus,'pending-role-and-wiki-review');
 assert.equal(disposition({status:'NOT_FOUND_CANDIDATE',candidateIds:[]},'material').status,'missing-material');
});
test('duplicate detection preserves distinct variants and reports canonical URL collisions',()=>{
 const items=[{id:'ac',url:'https://aqwwiki.wikidot.com/x-ac'},{id:'free',url:'https://aqwwiki.wikidot.com/x-free'},{id:'duplicate',url:'https://aqwwiki.wikidot.com/x-ac'}];
 assert.deepEqual(duplicateGroups(items,i=>i.url)[0].ids,['ac','duplicate']);
});
test('inventory refuses duplicate IDs instead of silently replacing records',()=>{
 assert.throws(()=>auditCatalog([{id:'x',name:'X'},{id:'x',name:'Y'}]),/duplicate/);
});
