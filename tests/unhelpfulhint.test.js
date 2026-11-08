const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/app.js','utf8');

// Pull out just the pieces under test so the rest of app.js (DOM wiring) never runs.
const activitiesSource=source.slice(source.indexOf('const activities'),source.indexOf('];')+2);
const rendererMatch=source.match(/function renderUnhelpfulHint[\s\S]*?\n}\n/);
const effects=source.slice(source.indexOf('let activeEffect='),source.indexOf('function renderValue'));

class Element{
  constructor(tag,cls,text){this.tag=tag;this.className=cls;this.textContent=text;this.children=[];this.attributes={}}
  append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node)}}
  setAttribute(name,value){this.attributes[name]=value}
  get firstChild(){return this.children[0]}
}
function setup(code){
  const ctx=vm.createContext({el:(...args)=>new Element(...args),$:()=>new Element(),matchMedia:()=>({matches:false}),getComputedStyle:()=>({transform:'none'})});
  vm.runInContext(code,ctx);
  return{ctx,run:snippet=>vm.runInContext(snippet,ctx)};
}
function renderHint(result){
  const {run,ctx}=setup(rendererMatch[0]);
  const container=new Element('div');
  ctx.result=result;ctx.container=container;
  run('renderUnhelpfulHint(result,container)');
  return container;
}

test('renderer is present in app.js',()=>{
  assert(rendererMatch,'renderUnhelpfulHint was not found in public/app.js');
});

test('unhelpful_hint activity is defined and uses the unparameterized endpoint',()=>{
  const {run}=setup(activitiesSource);
  const activity=run("activities.find(a=>a.id==='unhelpful_hint')");
  assert(activity,'unhelpful_hint is missing from activities');
  assert.equal(activity.name,'Unhelpful Hints');
  assert.equal(activity.category,'Discover');
  assert.equal(activity.action,'Give me a hint');
  assert.equal(activity.fields,undefined);
  assert.equal(activity.query,undefined);
  assert.equal(run("activities.filter(a=>a.id==='unhelpful_hint').length"),1);
});

test('every activity id stays unique after adding the new one',()=>{
  const {run}=setup(activitiesSource);
  assert.equal(run('new Set(activities.map(a=>a.id)).size'),run('activities.length'));
});

test('unhelpful_hint has no forced animation effect',()=>{
  const {run}=setup(effects);
  assert.equal(run("startActivityEffect({id:'unhelpful_hint'})"),null);
});

test('renders the hint text and a caption when helpful is false',()=>{
  const container=renderHint({hint:'Have you tried looking around?',helpful:false});
  const card=container.firstChild;
  assert.equal(card.className,'hint-result');
  assert.equal(card.attributes['aria-label'],'Unhelpful hint');
  assert.equal(card.children[0].className,'hint-text');
  assert.equal(card.children[0].textContent,'Have you tried looking around?');
  assert.equal(card.children[1].className,'hint-caption');
  assert(card.children[1].textContent.length>0);
});

test('omits the caption when helpful is not false',()=>{
  for(const result of [{hint:'Try something.',helpful:true},{hint:'Try something.'}]){
    const card=renderHint(result).firstChild;
    assert.equal(card.children.length,1);
    assert.equal(card.children[0].className,'hint-text');
  }
});

test('hint text is inserted as plain text, not markup',()=>{
  const card=renderHint({hint:'<b>bold</b> & <script>x</script>',helpful:false}).firstChild;
  assert.equal(card.children[0].textContent,'<b>bold</b> & <script>x</script>');
});

test('malformed responses throw instead of rendering garbage',()=>{
  for(const bad of [null,undefined,{},{helpful:false},{hint:42},{hint:null},{hint:['a']}]){
    assert.throws(()=>renderHint(bad),/hint could not be read/i);
  }
});

test('failed render adds nothing to the container',()=>{
  const container=new Element('div');
  const {run,ctx}=setup(rendererMatch[0]);
  ctx.container=container;ctx.result={hint:7};
  assert.throws(()=>run('renderUnhelpfulHint(result,container)'));
  assert.equal(container.children.length,0);
});

test('submit handler dispatches unhelpful_hint to its renderer',()=>{
  assert.match(source,/a\.id==='unhelpful_hint'\)renderUnhelpfulHint\(result/);
});