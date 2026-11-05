const activities = [
  { id:'leaderboard', name:'Leaderboard', category:'Games', description:'See the top five players and their highest scores.', action:'Show leaderboard' },
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
function openActivity(a){clearDice();clearActivityEffect();selected=a;$('activity-dialog').classList.toggle('race-dialog',a.id==='horse-race');requestId++;$('modal-category').textContent=a.category==='Fortune'?'FORTUNE & LUCK':a.category.toUpperCase();$('modal-title').textContent=a.name;$('modal-description').textContent=a.description;$('activity-fields').replaceChildren();$('activity-result').replaceChildren();$('play-button').textContent=a.action;$('play-button').disabled=false;
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


let activeEffect=null;
function clearActivityEffect(){if(activeEffect){activeEffect.cancel();activeEffect=null}}
const effectKinds={'8Ball':'eight-ball','coinflip/{choice}':'coin','api/fortune-cookie':'cookie','horse-race':'race','pizza-topping':'pizza','planet':'planet','rubber_duck_fortune':'duck','break-reminder':'breathing'};
function raceEntries(result){
  if(!result.End||typeof result.End!=='object')return [];
  return Object.entries(result.End).sort((a,b)=>Number(a[0])-Number(b[0])).map(([rank,name])=>({rank:Number(rank),name:String(name)}));
}
function startActivityEffect(activity){
  clearActivityEffect();
  const kind=effectKinds[activity.id];if(!kind)return null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root=el('div','activity-effect effect-'+kind),art=el('div','effect-art');
  art.setAttribute('aria-hidden','true');
  const caption=el('p','effect-caption','Waiting for your result...'),output=el('div','effect-output');
  root.append(art,caption,output);$('activity-result').replaceChildren(root);
  const animations=[];let cancelled=false;
  function animate(node,frames,options){if(reduced||cancelled)return Promise.resolve();const animation=node.animate(frames,options);animations.push(animation);return animation.finished.catch(()=>{})}
  function loop(node,frames,duration){animate(node,frames,{duration,iterations:Infinity,easing:'ease-in-out'})}
  if(kind==='coin'){
    const coin=el('div','toss-coin');coin.append(el('span','coin-head','H'),el('span','coin-tail','T'));art.append(coin);
    loop(coin,[{transform:'translateY(15px) rotateY(0deg)'},{transform:'translateY(-25px) rotateY(540deg)'},{transform:'translateY(15px) rotateY(1080deg)'}],1100);
  }else if(kind==='eight-ball'){
    const ball=el('div','fortune-ball');ball.append(el('span','','8'));art.append(ball);
    loop(ball,[{transform:'translateX(0) rotate(0deg)'},{transform:'translateX(-14px) rotate(-15deg)'},{transform:'translateX(14px) rotate(15deg)'},{transform:'translateX(0) rotate(0deg)'}],650);
  }else if(kind==='cookie'){
    const cookie=el('div','fortune-cookie');cookie.append(el('div','cookie-half cookie-left'),el('div','cookie-half cookie-right'));art.append(cookie);
    loop(cookie,[{transform:'rotate(-4deg)'},{transform:'rotate(4deg)'},{transform:'rotate(-4deg)'}],700);
  }else if(kind==='pizza'){
    const pizza=el('div','pizza-pie');for(let i=0;i<7;i++){const topping=el('i','pizza-dot');topping.style.left=(24+(i*31)%55)+'%';topping.style.top=(19+(i*23)%61)+'%';pizza.append(topping)}art.append(pizza);
    loop(pizza,[{transform:'rotate(0)'},{transform:'rotate(360deg)'}],2300);
  }else if(kind==='planet'){
    art.append(el('div','orbit-path'),el('div','orbit-planet'),el('div','orbit-moon'));
    loop(art.lastChild,[{transform:'rotate(0deg) translateX(65px)'},{transform:'rotate(360deg) translateX(65px)'}],3000);
  }else if(kind==='duck'){
    const duck=el('div','fortune-duck');duck.append(el('div','duck-head'),el('div','duck-wing'));art.append(el('div','duck-water'),duck);
    loop(duck,[{transform:'translateY(0) rotate(-4deg)'},{transform:'translateY(-9px) rotate(4deg)'},{transform:'translateY(0) rotate(-4deg)'}],1800);
  }else if(kind==='breathing'){
    art.append(el('div','breathing-ring'));
    caption.textContent='Take a slow breath while you wait.';
    loop(art.firstChild,[{transform:'scale(.7)',opacity:.5},{transform:'scale(1)',opacity:1},{transform:'scale(.7)',opacity:.5}],5000);
  }else{
    art.append(el('div','race-loading','Setting up the race...'));
  }
  const effect={target:output,kind,
    async settle(result){
      if(cancelled)return;
      const snapshot=art.firstChild?getComputedStyle(art.firstChild).transform:'none';
      for(const animation of animations)animation.cancel();
      root.classList.add('revealed');caption.textContent='';
      if(kind==='coin'){
        const side=String(result.result).toLowerCase();
        if(!['heads','tails'].includes(side))throw new Error('The coin result could not be read. Please try again.');
        const coin=art.firstChild,final='translateY(0) rotateY('+(side==='heads'?0:180)+'deg)';coin.style.transform=final;
        await animate(coin,[{transform:snapshot},{transform:final}],{duration:900,easing:'cubic-bezier(.2,.7,.2,1)'});
        caption.textContent=side[0].toUpperCase()+side.slice(1)+(typeof result.won==='boolean'?(result.won?' - you called it!':' - try another toss.'):'');
      }else if(kind==='race'){
        const entries=raceEntries(result);if(!entries.length)return;
        art.replaceChildren();art.setAttribute('aria-hidden','false');art.classList.add('race-track');
        const marquee=el('div','race-marquee');marquee.append(el('span','','STEP RIGHT UP'),el('strong','','DERBY NIGHT'),el('span','','16 HORSES / ONE WINNER'));
        const board=el('div','derby-board'),rail=el('div','derby-rail');rail.append(el('span','','START'),el('span','','FINISH'));
        board.append(rail);art.append(marquee,board);
        const colors=['#bc3f32','#387680','#bc8b29','#6c598c','#477448','#bb6442','#52669a','#9c4d6b'];
        const lanes=entries.map(entry=>{
          const number=Number(Object.keys(result.Horses||{}).find(k=>result.Horses[k]===entry.name)||entry.rank);
          const lane=el('div','derby-lane'),label=el('div','derby-label'),course=el('div','derby-course'),horse=el('div','derby-runner'),figure=el('div','derby-horse');
          lane.style.setProperty('--silk',colors[(number-1)%colors.length]);
          label.append(el('span','derby-number',String(number)),el('span','derby-name',entry.name));
          // Original flat cutout, like the painted horses on a carnival racing cabinet.
          figure.innerHTML='<svg viewBox="0 0 120 80" aria-hidden="true"><path fill="currentColor" d="M18 36 Q9 28 2 44 Q10 36 20 46 L27 53 Q49 65 72 49 L86 32 L98 35 L113 29 L110 21 L98 15 L95 4 L88 13 L81 12 L75 26 L66 32 Q42 24 25 34Z"/><path fill="#302a25" d="M76 26 L81 12 L88 13 L83 30Z"/><path fill="var(--silk)" d="M44 30 L66 32 L63 48 L42 47Z"/><path fill="#f8efd9" d="M89 16 L91 19 L89 21 L87 19Z"/><g class="horse-leg-front" stroke="currentColor" stroke-width="7" fill="none"><path d="M69 46 L82 61 L99 64"/><path d="M64 48 L62 65 L77 73"/></g><g class="horse-leg-back" stroke="currentColor" stroke-width="7" fill="none"><path d="M29 46 L20 60 L5 63"/><path d="M35 49 L41 66 L27 74"/></g></svg>';
          horse.append(figure,el('span','horse-saddle',String(number)));course.append(horse);lane.append(label,course);board.append(lane);
          return {...entry,number,lane,figure,horse,course};
        }).sort((a,b)=>a.number-b.number);
        for(const lane of lanes)board.append(lane.lane);
        if(!reduced){for(const word of ['On your marks','Ready','GO!']){caption.textContent=word;await animate(caption,[{opacity:.3,transform:'scale(.95)'},{opacity:1,transform:'scale(1)'}],{duration:550});if(cancelled)return;}}
        caption.textContent='And they are off!';root.classList.add('race-running');
        await Promise.all(lanes.map(entry=>{
          const midRank=Number(Object.keys(result.Middle||{}).find(k=>result.Middle[k]===entry.name)||entry.rank);
          const width=Math.max(0,entry.course.clientWidth-entry.horse.clientWidth),end='translateX('+width+'px)';entry.horse.style.transform=end;
          loop(entry.figure,[{transform:'translateY(0) rotate(-2deg)'},{transform:'translateY(-4px) rotate(2deg)'},{transform:'translateY(0) rotate(-2deg)'}],280+entry.number*9);
          return animate(entry.horse,[{transform:'translateX(0)'},{transform:'translateX('+width*(.16+(17-entry.number)*.008)+'px)',offset:.22},{transform:'translateX('+width*(.44+(17-midRank)*.013)+'px)',offset:.58},{transform:'translateX('+width*.84+'px)',offset:.88},{transform:end}],{duration:5700+entry.rank*120,easing:'linear'}).then(()=>{if(!cancelled){entry.lane.classList.add('horse-finished');if(entry.rank===1){entry.lane.classList.add('derby-winner');caption.textContent='Winner: '+entry.name;}}});
        }));
        if(cancelled)return;for(const animation of animations)animation.cancel();root.classList.add('race-complete');caption.textContent='Winner: '+entries[0].name;
        for(const entry of lanes){entry.lane.firstChild.append(el('span','derby-place','#'+entry.rank));}
      }else if(kind==='cookie'){
        const cookie=art.firstChild;
        await Promise.all([...cookie.children].map((half,i)=>{const final='translateX('+(i===0?-25:25)+'px) rotate('+(i===0?-22:22)+'deg)';half.style.transform=final;return animate(half,[{transform:'none'},{transform:final}],{duration:700,easing:'ease-out'})}));
        caption.textContent='Your fortune';
      }else{
        await animate(art,[{opacity:.65,transform:'scale(.94)'},{opacity:1,transform:'scale(1)'}],{duration:450,easing:'ease-out'});
      }
    },
    cancel(){cancelled=true;for(const animation of animations)animation.cancel();root.remove()}
  };
  activeEffect=effect;return effect;
}

function renderLeaderboard(result,container){
  const entries=result.entries ?? result.top;
  if(!Array.isArray(entries)||entries.some(entry=>!entry||typeof entry.name!=='string'||!Number.isFinite(entry.score)))throw new Error('The leaderboard could not be read. Please try again.');
  const board=el('section','leaderboard');board.setAttribute('aria-label','Top player scores');
  board.append(el('h3','','Top players'),el('p','leaderboard-caption','Highest score per player · Top five'));
  if(!entries.length){board.append(el('p','leaderboard-empty','No scores yet. Check back after someone submits a score.'));}
  else{
    const list=el('ol','leaderboard-list');
    entries.forEach((entry,index)=>{
      const row=el('li','leaderboard-entry');
      row.append(el('span','leaderboard-rank','#'+(entry.rank ?? index+1)),el('span','leaderboard-name',entry.name),el('span','leaderboard-score',entry.score.toLocaleString()));
      list.append(row);
    });
    board.append(list);
  }
  container.append(board);
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
  $('activity-result').textContent='Loading your result. This can take up to a minute.';
  const effect=startActivityEffect(a);
  $('play-button').disabled=true;$('play-button').textContent=diceRoll?'Rolling...':'Loading...';
  try{const response=await fetch('./api/backend/'+path+(params.size?'?'+params:''),{signal:AbortSignal.timeout(65000)});const text=await response.text();let result;try{result=JSON.parse(text)}catch{result={message:text}}if(!response.ok)throw new Error(result.error||result.message||`Something went wrong (${response.status}). Please try again.`);if(id!==requestId)return;if(diceRoll){await diceRoll.settle(result);if(id!==requestId)return;}
    if(effect){await effect.settle(result);if(id!==requestId)return;if(effect.kind!=='race'||!raceEntries(result).length)renderValue(result,effect.target);}
    else{$('activity-result').replaceChildren();if(diceRoll)renderDiceResult(result,$('activity-result'));else if(a.id==='leaderboard')renderLeaderboard(result,$('activity-result'));else renderValue(result,$('activity-result'));}recent=[a.id,...recent.filter(v=>v!==a.id)].slice(0,30);persist();render();
  }catch(error){if(effect)effect.cancel();if(diceRoll)diceRoll.cancel();if(id!==requestId)return;$('activity-result').replaceChildren(el('div','error',error.name==='TimeoutError'?'This is taking longer than expected. Please try again in a moment.':error.message))}finally{if(id===requestId){$('play-button').disabled=false;$('play-button').textContent=a.id==='dice-roll'?'Roll again':'Try again'}}
});
$('close-dialog').onclick=()=>$('activity-dialog').close();$('activity-dialog').addEventListener('close',()=>{requestId++;clearDice();clearActivityEffect()});$('activity-dialog').addEventListener('click',event=>{if(event.target===$('activity-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close()}});
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('selected',b===button));render()});
document.querySelectorAll('[data-nav]').forEach(button=>button.onclick=()=>{view=button.dataset.nav;$('page-name').textContent=view;document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b===button));$('collection-title').textContent=view==='Explore'?'Activities':view==='Favorites'?'Favorites':'Recently played';$('collection-caption').textContent=view==='Favorites'?'Use the heart button to save an activity.':view==='Recent'?'Activities you have tried recently.':'Choose an activity to get started.';render()});
$('search').addEventListener('input',render);$('surprise').onclick=()=>openActivity(activities[Math.floor(Math.random()*activities.length)]);$('reset').onclick=()=>{view='Explore';filter='All';$('search').value='';document.querySelector('[data-nav="Explore"]').click();document.querySelector('[data-filter="All"]').click()};document.addEventListener('keydown',event=>{if(event.key==='/'&&!$('activity-dialog').open&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();$('search').focus()}});
render();
