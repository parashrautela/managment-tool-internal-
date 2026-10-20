import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../lib/permissions.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {canEdit,canManage,canChangeMember}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
for (const role of ['owner','admin','member','viewer','outsider']) {
 assert.equal(canEdit(role),['owner','admin','member'].includes(role),role+' issue editing');
 assert.equal(canManage(role),['owner','admin'].includes(role),role+' project management');
 assert.equal(canChangeMember(role,'owner'),false,role+' cannot change owner');
}
assert.equal(canChangeMember('admin','admin'),false);
assert.equal(canChangeMember('owner','admin'),true);
assert.equal(canChangeMember('admin','member'),true);
assert.equal(canChangeMember('viewer','member'),false);
console.log('Permission matrix: 19 assertions passed.');
