const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/app.js','utf8');
const effects=source.slice(source.indexOf('let activeEffect='),source.indexOf('function renderValue'));
class Element{
  constructor(tag,cls,text){this.tag=tag;this.className=cls;this.textContent=text;this.children=[];this.style={setProperty(key,value){this[key]=value}};this.clientWidth=200;this.classes=new Set();this.classList={add:value=>this.classes.add(value)};this.animations=[];}
  append(...nodes){for(const node of nodes){if(node.parent)node.parent.children=node.parent.children.filter(child=>child!==node);node.parent=this;this.children.push(node)}}
  replaceChildren(...nodes){this.children=nodes}
  get firstChild(){return this.children[0]}
  get lastChild(){return this.children.at(-1)}
  setAttribute(){}
  remove(){this.removed=true}
  animate(frames,options){const animation={frames,options,finished:Promise.resolve(),cancel(){this.cancelled=true}};this.animations.push(animation);return animation}
}
function setup(reduced=false){const output=new Element();const ctx=vm.createContext({el:(...args)=>new Element(...args),$:()=>output,matchMedia:()=>({matches:reduced}),getComputedStyle:()=>({transform:'matrix(1,0,0,1,0,0)'})});vm.runInContext(effects,ctx);return{ctx,output,run:code=>vm.runInContext(code,ctx)}}
for(const reduced of [false,true]){
 test('all effect types settle and clean up; reduced motion='+reduced,async()=>{
  const {ctx,run,output}=setup(reduced);
  const cases=[['8Ball',{answer:'Yes'}],['coinflip/{choice}',{result:'tails',won:false}],['api/fortune-cookie',{fortune:'Good luck'}],['horse-race',{End:{2:'Second',1:'Winner'},Middle:{1:'Second',2:'Winner'},Horses:{1:'Winner',2:'Second'}}],['pizza-topping',{topping:'Mushrooms'}],['planet',[{name:'Hoth'}]],['rubber_duck_fortune',{duck_advice:'quack'}],['break-reminder',{reminder:'Drink water'}]];
  for(const [id,result] of cases){ctx.activity={id};ctx.result=result;run('var effect=startActivityEffect(activity)');await run('effect.settle(result)');const root=output.firstChild;assert(root.classes.has('revealed'));if(id==='coinflip/{choice}')assert.equal(root.firstChild.firstChild.style.transform,'translateY(0) rotateY(180deg)');if(id==='horse-race'){assert.equal(root.children[1].textContent,'Winner: Winner');assert.equal(run('effect.target.firstChild.firstChild.textContent'),'Winner')}
   run('clearActivityEffect()');assert(root.removed);assert.equal(run('activeEffect'),null);
  }
 });
}
test('invalid coin response fails instead of inventing an outcome',async()=>{const {run}=setup();await assert.rejects(run("startActivityEffect({id:'coinflip/{choice}'}).settle({result:'invalid'})"));});
test('close during settling prevents a late race result',async()=>{const {run}=setup();await run("var effect=startActivityEffect({id:'horse-race'});var pending=effect.settle({End:{1:'Winner'}});clearActivityEffect();pending");assert.equal(run('activeEffect'),null);});
test('text activities have no forced animation',()=>{const {run}=setup();for(const id of ['dad-joke-daniel','random-fact','riddle','api/slugify','studyTip','luckyNumber','even-or-odd/{number}','compliment','random-star-wars-fact'])assert.equal(run('startActivityEffect({id:'+JSON.stringify(id)+'})'),null);});

test('derby keeps starting lane numbers and uses the API finish order',async()=>{
 const {ctx,run,output}=setup();ctx.result={Horses:{1:'Second',2:'Winner'},Middle:{1:'Second',2:'Winner'},End:{1:'Winner',2:'Second'}};
 await run("var effect=startActivityEffect({id:'horse-race'});effect.settle(result)");
 const board=output.firstChild.firstChild.children[1];
 assert.equal(board.children.length,3);
 assert.equal(board.children[1].firstChild.children[1].textContent,'Second');
 assert.equal(board.children[2].firstChild.children[1].textContent,'Winner');
 assert(board.children[2].classes.has('derby-winner'));
 const secondTravel=board.children[1].children[1].firstChild.animations[0];
 const winnerTravel=board.children[2].children[1].firstChild.animations[0];
 assert(winnerTravel.options.duration<secondTravel.options.duration);
 assert.equal(run('effect.target.firstChild.firstChild.textContent'),'Winner');
});
