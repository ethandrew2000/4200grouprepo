const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/app.js','utf8');
class Element{
  constructor(tag,cls,text){this.tag=tag;this.className=cls;this.textContent=text;this.children=[];}
  append(...nodes){this.children.push(...nodes)}
  setAttribute(){}
}
function render(result){
  const container=new Element('div');
  const ctx=vm.createContext({el:(...args)=>new Element(...args),result,container});
  vm.runInContext(source.slice(source.indexOf('function renderLeaderboard('),source.indexOf('function renderValue(')),ctx);
  vm.runInContext('renderLeaderboard(result,container)',ctx);
  return container.children[0];
}
test('ranked response displays API names, scores, and ranks',()=>{
 const board=render({entries:[{rank:1,name:'Alice',score:90},{rank:2,name:'Bob',score:40}],count:2});
 const rows=board.children[2].children;
 assert.deepEqual(rows.map(row=>row.children.map(cell=>cell.textContent)),[['#1','Alice','90'],['#2','Bob','40']]);
});
test('previous API response remains usable during rollout',()=>{
 const row=render({top:[{name:'Alice',score:8}]}).children[2].children[0];
 assert.deepEqual(row.children.map(cell=>cell.textContent),['#1','Alice','8']);
});
test('empty leaderboard explains that no scores exist',()=>{
 assert.match(render({entries:[],count:0}).children[2].textContent,/No scores yet/);
});
test('player names are rendered as text',()=>{
 const name='<img src=x onerror=alert(1)>';
 const cell=render({entries:[{rank:1,name,score:1}]}).children[2].children[0].children[1];
 assert.equal(cell.textContent,name);
 assert.equal(cell.children.length,0);
});
test('malformed responses produce an error rather than an invented score',()=>{
 for(const result of [{},{entries:'invalid'},{entries:[null]},{entries:[{name:'Alice',score:'bad'}]}])assert.throws(()=>render(result),/could not be read/);
});
