const activities = [
  { id:'8Ball', name:'Magic 8 Ball', category:'Fortune', description:'Ask a question and get an answer from the Magic 8 Ball.', action:'Ask a question', fields:[['question','What’s on your mind?','text','Will today be a good day?']] },
  { id:'dice-roll', name:'Roll the Dice', category:'Games', description:'Roll a pair of dice.', action:'Roll the dice' },
  { id:'horse-race', name:'Horse Race', category:'Games', description:'Start a race and see which horse finishes first.', action:'Start the race' },
  { id:'api/fortune-cookie', name:'Fortune Cookie', category:'Fortune', description:'Open a cookie and read your fortune.', action:'Open a cookie' },
  { id:'coinflip/{choice}', key:'coinflip', name:'Heads or Tails', category:'Games', description:'Choose heads or tails, then flip a coin.', action:'Flip the coin', fields:[['choice','Make your call','select',['heads','tails']]] },
  { id:'dad-joke-daniel', name:'Dad Jokes', category:'Discover', description:'Get a random dad joke.', action:'Tell me a joke' },
  { id:'random-fact', name:'Random Fact', category:'Discover', description:'Learn a random fact.', action:'Learn something' },
  { id:'compliment', name:'Compliments', category:'Discover', description:'Get a compliment.', action:'Get a compliment' },
  { id:'api/slugify', name:'Slug Generator', category:'Tools', description:'Convert text into a URL-friendly string.', action:'Create slug', fields:[['text','Your text','text','My great new idea']], query:true },
  { id:'riddle', name:'Riddles', category:'Discover', description:'Get a riddle to work through.', action:'Give me a riddle' },
  { id:'studyTip', name:'Study Tips', category:'Tools', description:'Get a suggestion for your next study session.', action:'Get a study tip' },
  { id:'luckyNumber', name:'Lucky Number', category:'Fortune', description:'Generate a lucky number.', action:'Find my number' },
  { id:'planet', name:'Random Planet', category:'Discover', description:'Find out about a planet.', action:'Explore a planet' },
  { id:'random-star-wars-fact', name:'Star Wars Facts', category:'Discover', description:'Get a fact from the Star Wars universe.', action:'Get a fact' },
  { id:'pizza-topping', name:'Pizza Toppings', category:'Discover', description:'Pick a random topping for your next pizza.', action:'Pick a topping' },
  { id:'even-or-odd/{number}', key:'even-or-odd', name:'Even or Odd', category:'Tools', description:'Check whether a whole number is even or odd.', action:'Check my number', fields:[['number','Whole number','number','42']] },
  { id:'rubber_duck_fortune', name:'Duck Fortune', category:'Fortune', description:'Get a fortune from the rubber duck.', action:'Consult the duck' },
  { id:'break-reminder', name:'Break Reminder', category:'Tools', description:'Get a reminder to take a break.', action:'Take a break' }
];
const $=id=>document.getElementById(id);
function readStored(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}}
let favorites=readStored('arcade-favorites'),recent=readStored('arcade-recent'),filter='All',view='Explore',selected=null,requestId=0;
function persist(){try{localStorage.setItem('arcade-favorites',JSON.stringify(favorites));localStorage.setItem('arcade-recent',JSON.stringify(recent))}catch{}}
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node}
function render(){
  const query=$('search').value.toLowerCase();
  const list=activities.filter(a=>(filter==='All'||a.category===filter)&&(view!=='Favorites'||favorites.includes(a.id))&&(view!=='Recent'||recent.includes(a.id))&&(a.name+' '+a.description+' '+a.category).toLowerCase().includes(query));
  if(view==='Recent')list.sort((a,b)=>recent.indexOf(a.id)-recent.indexOf(b.id));
  $('cards').replaceChildren();$('empty').hidden=!!list.length;$('result-count').textContent=`${list.length} activities`;
  document.querySelector('.favorite-count').textContent=favorites.length;
  for(const a of list){
    const card=el('article','card');
    const art=el('div','card-art');const favorite=el('button','favorite'+(favorites.includes(a.id)?' is-favorite':''),favorites.includes(a.id)?'♥':'♡');favorite.setAttribute('aria-label',`Favorite ${a.name}`);favorite.setAttribute('aria-pressed',favorites.includes(a.id));favorite.onclick=()=>{favorites=favorites.includes(a.id)?favorites.filter(id=>id!==a.id):[...favorites,a.id];persist();render()};art.append(favorite);
    const body=el('div','card-body');body.append(el('span','card-label',a.category==='Fortune'?'Fortune & luck':a.category==='Tools'?'Tools':a.category),el('h3','',a.name),el('p','',a.description));const bottom=el('div','card-bottom');const play=el('button','play','Open activity');play.setAttribute('aria-label',`Open ${a.name}`);play.onclick=()=>openActivity(a);bottom.append(play);body.append(bottom);card.append(art,body);$('cards').append(card);
  }
}
function openActivity(a){clearDice();selected=a;requestId++;$('modal-category').textContent=a.category==='Fortune'?'FORTUNE & LUCK':a.category.toUpperCase();$('modal-title').textContent=a.name;$('modal-description').textContent=a.description;$('activity-fields').replaceChildren();$('activity-result').replaceChildren();$('play-button').textContent=a.action;$('play-button').disabled=false;
  for(const [name,label,type,placeholder] of a.fields||[]){const wrapper=el('label','',label);const input=el(type==='select'?'select':'input');input.name=name;input.required=true;if(type==='select'){placeholder.forEach(choice=>{const option=el('option','',choice[0].toUpperCase()+choice.slice(1));option.value=choice;input.append(option)})}else{input.type=type;input.placeholder=placeholder;if(type==='number'){input.step='1';input.min='-2147483648';input.max='2147483647'}}wrapper.append(input);$('activity-fields').append(wrapper)}
  $('activity-dialog').showModal();
}

// Faces rotate independently from the screen-space throw so the final pips match the API.
const diceFaces = {
  1: [5], 2: [1,9], 3: [1,5,9], 4: [1,3,7,9],
  5: [1,3,5,7,9], 6: [1,3,4,6,7,9]
};
const diceAngles = {1:[0,0],2:[0,-90],3:[-90,0],4:[90,0],5:[0,90],6:[0,180]};
let activeDice = null;
function clearDice(){if(activeDice){activeDice.remove();activeDice=null}}
function throwDice(){
  clearDice();
  const stage=el('div','dice-stage');stage.setAttribute('popover','manual');stage.setAttribute('aria-hidden','true');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rolls=[];
  for(let i=0;i<2;i++){
    const track=el('div','dice-track'),cube=el('div','dice-cube');
    for(let face=1;face<=6;face++){
      const side=el('div','dice-face dice-face-'+face);
      for(const position of diceFaces[face]){const pip=el('i','dice-pip');pip.style.gridArea=Math.ceil(position/3)+' / '+((position-1)%3+1);side.append(pip)}
      cube.append(side);
    }
    track.append(cube);stage.append(track);
    const endX=innerWidth/2+(i===0?-52:52)-34;
    const endY=Math.max(45,innerHeight*.68)+(i===0?-18:18)-34;
    track.style.left=endX+'px';track.style.top=endY+'px';
    const direction=i===0?-1:1;
    rolls.push({track,cube,endX,endY,direction});
  }
  $('activity-dialog').append(stage);activeDice=stage;
  // A popover sits above the modal dialog without blocking its controls.
  if(stage.showPopover)stage.showPopover();
  for(const roll of rolls){
    const {track,cube,endX,endY,direction}=roll;
    if(!reduced){
      roll.travel=track.animate([
        {transform:'translate('+direction*(innerWidth/2+110)+'px, -180px) scale(.7)',offset:0},
        {transform:'translate('+direction*100+'px, -90px) scale(1.1)',offset:.4},
        {transform:'translate('+direction*45+'px, 15px) scale(1)',offset:.6},
        {transform:'translate('+direction*18+'px, -42px) scale(1)',offset:.76},
        {transform:'translate(0, 0) scale(1)',offset:1}
      ],{duration:1500,easing:'cubic-bezier(.2,.65,.35,1)',fill:'forwards'});
      roll.spin=cube.animate([{transform:'rotateX(15deg) rotateY(20deg) rotateZ(0deg)'},{transform:'rotateX(735deg) rotateY(1100deg) rotateZ('+direction*360+'deg)'}],{duration:1100,iterations:Infinity});
    }
  }
  return {
    async settle(result){
      const values=result.dice||[result.die1,result.die2];
      if(!Array.isArray(values)||values.length!==2||values.some(v=>!Number.isInteger(v)||v<1||v>6))throw new Error('The dice result could not be read. Please roll again.');
      await Promise.all(rolls.map(r=>r.travel?r.travel.finished.catch(()=>{}):Promise.resolve()));
      if(activeDice!==stage)return;
      await Promise.all(rolls.map(async(r,i)=>{
        const current=getComputedStyle(r.cube).transform;
        if(r.spin)r.spin.cancel();
        const [x,y]=diceAngles[values[i]];
        const final='rotateX('+x+'deg) rotateY('+y+'deg)';
        r.cube.style.transform=final;
        if(!reduced)await r.cube.animate([{transform:current},{transform:final}],{duration:550,easing:'ease-out'}).finished.catch(()=>{});
      }));
      if(activeDice===stage)stage.classList.add('settled');
    },
    cancel(){if(activeDice===stage)clearDice()}
  };
}
function renderDiceResult(result,container){
  const values=result.dice||[result.die1,result.die2];
  const summary=el('div','dice-summary');
  summary.append(el('span','',values[0]+' + '+values[1]),el('strong','',String(values[0]+values[1])));
  container.append(summary);
}

function renderValue(value,container){
  if(value===null||typeof value!=='object'){container.append(el('div','',String(value??'No result returned.')));return}
  if(Array.isArray(value)){for(const item of value)renderValue(item,container);return}
  for(const [key,item] of Object.entries(value)){
    if(item&&typeof item==='object'){const section=el('div');section.append(el('p','result-key',key.replaceAll('_',' ')));renderValue(item,section);container.append(section)}else{const row=el('div','result-row');row.append(el('span','result-key',key.replaceAll('_',' ')),el('span','result-value',String(item??'—')));container.append(row)}
  }
}
$('play-form').addEventListener('submit',async event=>{
  event.preventDefault();const a=selected,id=++requestId;const data=new FormData(event.target);let path=a.id;const params=new URLSearchParams();for(const [key,value] of data){if(path.includes('{'+key+'}'))path=path.replace('{'+key+'}',encodeURIComponent(value));else if(a.query)params.set(key,value)}
  const diceRoll=a.id==='dice-roll'?throwDice():null;
  $('play-button').disabled=true;$('play-button').textContent=diceRoll?'Rolling...':'Loading...';$('activity-result').textContent='Loading your result. This can take up to a minute.';
  try{const response=await fetch('./api/backend/'+path+(params.size?'?'+params:''),{signal:AbortSignal.timeout(65000)});const text=await response.text();let result;try{result=JSON.parse(text)}catch{result={message:text}}if(!response.ok)throw new Error(result.error||result.message||`Something went wrong (${response.status}). Please try again.`);if(id!==requestId)return;if(diceRoll){await diceRoll.settle(result);if(id!==requestId)return;}
    $('activity-result').replaceChildren();if(diceRoll)renderDiceResult(result,$('activity-result'));else renderValue(result,$('activity-result'));recent=[a.id,...recent.filter(v=>v!==a.id)].slice(0,30);persist();render();
  }catch(error){if(diceRoll)diceRoll.cancel();if(id!==requestId)return;$('activity-result').replaceChildren(el('div','error',error.name==='TimeoutError'?'This is taking longer than expected. Please try again in a moment.':error.message))}finally{if(id===requestId){$('play-button').disabled=false;$('play-button').textContent=a.id==='dice-roll'?'Roll again':'Try again'}}
});
$('close-dialog').onclick=()=>$('activity-dialog').close();$('activity-dialog').addEventListener('close',()=>{requestId++;clearDice()});$('activity-dialog').addEventListener('click',event=>{if(event.target===$('activity-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close()}});
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('selected',b===button));render()});
document.querySelectorAll('[data-nav]').forEach(button=>button.onclick=()=>{view=button.dataset.nav;$('page-name').textContent=view;document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b===button));$('collection-title').textContent=view==='Explore'?'Activities':view==='Favorites'?'Favorites':'Recently played';$('collection-caption').textContent=view==='Favorites'?'Use the heart button to save an activity.':view==='Recent'?'Activities you have tried recently.':'Choose an activity to get started.';render()});
$('search').addEventListener('input',render);$('surprise').onclick=()=>openActivity(activities[Math.floor(Math.random()*activities.length)]);$('reset').onclick=()=>{view='Explore';filter='All';$('search').value='';document.querySelector('[data-nav="Explore"]').click();document.querySelector('[data-filter="All"]').click()};document.addEventListener('keydown',event=>{if(event.key==='/'&&!$('activity-dialog').open&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();$('search').focus()}});
render();
