const activities = [
  { id:'8Ball', name:'Magic 8 Ball', category:'Fortune', icon:'🎱', description:'Big question? A little cosmic guidance is one shake away.', action:'Ask the universe', color:'purple', fields:[['question','What’s on your mind?','text','Will today be a good day?']] },
  { id:'dice-roll', name:'Roll the Dice', category:'Games', icon:'🎲', description:'Take a chance. Give a pair of dice a little room to roll.', action:'Roll the dice' },
  { id:'horse-race', name:'Off to the Races', category:'Games', icon:'🏇', description:'Sixteen horses. One finish line. Who’s your winner?', action:'Start the race', color:'green' },
  { id:'api/fortune-cookie', name:'Fortune Cookie', category:'Fortune', icon:'🥠', description:'Crack open a cookie. See what the universe has in store.', action:'Open a cookie', color:'peach' },
  { id:'coinflip/{choice}', key:'coinflip', name:'Heads or Tails', category:'Games', icon:'🪙', description:'Make your call. Let a little luck settle the rest.', action:'Flip the coin', color:'yellow', fields:[['choice','Make your call','select',['heads','tails']]] },
  { id:'dad-joke-daniel', name:'Dad Joke Department', category:'Discover', icon:'🥸', description:'Questionable humor. Unquestionably good for a break.', action:'Tell me a joke', color:'blue' },
  { id:'random-fact', name:'Well, Actually…', category:'Discover', icon:'🧠', description:'A tiny discovery for your ever-growing collection of facts.', action:'Learn something', color:'pink' },
  { id:'compliment', name:'A Little Pick-Me-Up', category:'Discover', icon:'🌷', description:'A few kind words can turn the whole day around.', action:'Brighten my day', color:'peach' },
  { id:'api/slugify', name:'Make It a Slug', category:'Tools', icon:'✍️', description:'Turn your words into a clean, URL-friendly little string.', action:'Create slug', color:'green', fields:[['text','Your text','text','My great new idea']], query:true },
  { id:'riddle', name:'Riddle Me This', category:'Discover', icon:'🧩', description:'Stretch your brain with a small mystery worth solving.', action:'Give me a riddle', color:'green' },
  { id:'studyTip', name:'Study Smarter', category:'Tools', icon:'📚', description:'A fresh study tip for the next time you hit the books.', action:'Get a study tip', color:'purple' },
  { id:'luckyNumber', name:'Your Lucky Number', category:'Fortune', icon:'✨', description:'A number with your name on it. Maybe it’s a sign.', action:'Find my number', color:'yellow' },
  { id:'planet', name:'Somewhere in Space', category:'Discover', icon:'🪐', description:'Take your curiosity on a little trip through the cosmos.', action:'Explore a planet', color:'blue' },
  { id:'random-star-wars-fact', name:'From a Galaxy Far Away', category:'Discover', icon:'🌌', description:'A small piece of the Star Wars universe, delivered to you.', action:'Use the Force', color:'purple' },
  { id:'pizza-topping', name:'Pizza Roulette', category:'Discover', icon:'🍕', description:'Dinner indecision? Let fate pick your next topping.', action:'Pick a topping', color:'peach' },
  { id:'even-or-odd/{number}', key:'even-or-odd', name:'Even or Odd', category:'Tools', icon:'🔢', description:'Give a number a quick check. Settle the debate.', action:'Check my number', color:'blue', fields:[['number','Whole number','number','42']] },
  { id:'rubber_duck_fortune', name:'The Duck Has Spoken', category:'Fortune', icon:'🦆', description:'Words of wisdom from a surprisingly insightful duck.', action:'Consult the duck', color:'yellow' },
  { id:'break-reminder', name:'Take a Breather', category:'Tools', icon:'☕', description:'A friendly reminder to pause, recharge, and reset.', action:'Take a break', color:'pink' }
];
const palettes={purple:['#eeeaf6','#9c85b6'],green:['#eaf2ee','#85a596'],peach:['#fbefe6','#c6987c'],yellow:['#f9f3df','#b9a268'],blue:['#eaf0f7','#8aa1bc'],pink:['#f6eaf0','#bc8fa6']};
const $=id=>document.getElementById(id);
function readStored(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}}
let favorites=readStored('arcade-favorites'),recent=readStored('arcade-recent'),filter='All',view='Explore',selected=null,requestId=0;
function persist(){try{localStorage.setItem('arcade-favorites',JSON.stringify(favorites));localStorage.setItem('arcade-recent',JSON.stringify(recent))}catch{}}
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node}
function render(){
  const query=$('search').value.toLowerCase();
  const list=activities.filter(a=>(filter==='All'||a.category===filter)&&(view!=='Favorites'||favorites.includes(a.id))&&(view!=='Recent'||recent.includes(a.id))&&(a.name+' '+a.description+' '+a.category).toLowerCase().includes(query));
  if(view==='Recent')list.sort((a,b)=>recent.indexOf(a.id)-recent.indexOf(b.id));
  $('cards').replaceChildren();$('empty').hidden=!!list.length;$('result-count').textContent=`${list.length} experiences`;
  document.querySelector('.favorite-count').textContent=favorites.length;
  for(const a of list){
    const card=el('article','card'),[wash,accent]=palettes[a.color||'purple'];card.style.setProperty('--wash',wash);card.style.setProperty('--accent',accent);
    const art=el('div','card-art'),icon=el('span','card-emoji',a.icon);icon.setAttribute('aria-hidden','true');const favorite=el('button','favorite'+(favorites.includes(a.id)?' is-favorite':''),favorites.includes(a.id)?'♥':'♡');favorite.setAttribute('aria-label',`Favorite ${a.name}`);favorite.setAttribute('aria-pressed',favorites.includes(a.id));favorite.onclick=()=>{favorites=favorites.includes(a.id)?favorites.filter(id=>id!==a.id):[...favorites,a.id];persist();render()};art.append(icon,favorite);
    const body=el('div','card-body');body.append(el('span','card-label',a.category==='Fortune'?'Fortune & luck':a.category==='Tools'?'Little tools':a.category),el('h3','',a.name),el('p','',a.description));const bottom=el('div','card-bottom');bottom.append(el('span','',a.category==='Games'?'A little friendly chance':'A moment of discovery'));const play=el('button','play',a.category==='Games'?'Let’s play':'Try it out');play.append(el('b','','↗'));play.setAttribute('aria-label',`Open ${a.name}`);play.onclick=()=>openActivity(a);bottom.append(play);body.append(bottom);card.append(art,body);$('cards').append(card);
  }
}
function openActivity(a){selected=a;requestId++;$('modal-category').textContent=a.category==='Fortune'?'FORTUNE & LUCK':a.category.toUpperCase();$('modal-icon').textContent=a.icon;$('modal-title').textContent=a.name;$('modal-description').textContent=a.description;$('activity-fields').replaceChildren();$('activity-result').replaceChildren();$('raw-details').hidden=true;$('play-button').textContent=a.action+' ↗';$('play-button').disabled=false;
  for(const [name,label,type,placeholder] of a.fields||[]){const wrapper=el('label','',label);const input=el(type==='select'?'select':'input');input.name=name;input.required=true;if(type==='select'){placeholder.forEach(choice=>{const option=el('option','',choice[0].toUpperCase()+choice.slice(1));option.value=choice;input.append(option)})}else{input.type=type;input.placeholder=placeholder;if(type==='number'){input.step='1';input.min='-2147483648';input.max='2147483647'}}wrapper.append(input);$('activity-fields').append(wrapper)}
  $('activity-dialog').showModal();
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
  $('play-button').disabled=true;$('play-button').textContent='A little suspense…';$('activity-result').textContent='Connecting to the class API… The server may need a moment to wake up.';$('raw-details').hidden=true;
  try{const response=await fetch('./api/backend/'+path+(params.size?'?'+params:''),{signal:AbortSignal.timeout(65000)});const text=await response.text();let result;try{result=JSON.parse(text)}catch{result={message:text}}if(!response.ok)throw new Error(result.error||result.message||`The API returned ${response.status}. Please try again.`);if(id!==requestId)return;$('activity-result').replaceChildren();renderValue(result,$('activity-result'));$('raw-result').textContent=JSON.stringify(result,null,2);$('raw-details').hidden=false;recent=[a.id,...recent.filter(v=>v!==a.id)].slice(0,30);persist();render();
  }catch(error){if(id!==requestId)return;$('activity-result').replaceChildren(el('div','error',error.name==='TimeoutError'?'The backend is still waking up. Give it a moment, then try again.':error.message))}finally{if(id===requestId){$('play-button').disabled=false;$('play-button').textContent='Try again ↗'}}
});
$('close-dialog').onclick=()=>$('activity-dialog').close();$('activity-dialog').addEventListener('close',()=>requestId++);$('activity-dialog').addEventListener('click',event=>{if(event.target===$('activity-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close()}});
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('selected',b===button));render()});
document.querySelectorAll('[data-nav]').forEach(button=>button.onclick=()=>{view=button.dataset.nav;$('page-name').textContent=view;document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b===button));$('collection-title').textContent=view==='Explore'?'Find your next distraction ↙':view==='Favorites'?'Your little collection ♡':'Pick up where you left off ◷';$('collection-caption').textContent=view==='Favorites'?'Save a little joy for later. Tap a heart to add an experience.':view==='Recent'?'Your latest adventures, all in one place.':'Small experiences. Surprisingly good times.';render()});
$('search').addEventListener('input',render);$('surprise').onclick=()=>openActivity(activities[Math.floor(Math.random()*activities.length)]);$('reset').onclick=()=>{view='Explore';filter='All';$('search').value='';document.querySelector('[data-nav="Explore"]').click();document.querySelector('[data-filter="All"]').click()};document.addEventListener('keydown',event=>{if(event.key==='/'&&!$('activity-dialog').open&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();$('search').focus()}});
async function health(){try{const response=await fetch('./api/backend/api-info',{signal:AbortSignal.timeout(65000)});if(!response.ok)throw Error();const info=await response.json();$('api-status').classList.add('online');$('api-status').lastChild.textContent=' API online';$('api-status').title=`${info.name} · v${info.version}`}catch{$('api-status').lastChild.textContent=' API unavailable';$('api-status').title='The backend could be waking up. Try an experience in a moment.'}}
render();health();
