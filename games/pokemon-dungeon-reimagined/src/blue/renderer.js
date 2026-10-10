import { text, textWidth, wrapText, panel, cursor } from './render-font.js';
import { Terrain, TILE, terrainHash } from './render-terrain.js';
import { SpriteBank } from './render-sprites.js';
import { StoryActors } from './render-story.js';
import { IntroArtwork, INTRO_CLIENT_IDS, TITLE_PROMPT_MS } from './render-intro.js';
export { OPENING_DURATION_MS, TITLE_READY_MS, TITLE_PROMPT_MS } from './render-intro.js';

/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').Actor} Actor */
/** @typedef {import('./mechanics-types.js').GameEvent} GameEvent */
/** @typedef {'opening'|'title'|'menu'|'quiz'|'gender'|'result'|'partner'|'name'|'awakening'|'trouble'|'dungeon'|'clearing'|'reunion'|'complete'} Scene */
/** @typedef {{speaker?:string,text:string,portraitSpeciesId?:string,visibleChars?:number}} Dialogue */
/** @typedef {{index:number,x:number,y:number,width:number,height:number}} ChoiceBounds */
/** @typedef {{scene:Scene,dialogue?:Dialogue|null,choices?:string[],selectedIndex?:number,choiceColumns?:number,heroSpeciesId?:string,partnerSpeciesId?:string,heroName?:string,partnerName?:string,dungeon?:DungeonState|null,menuTitle?:string,notice?:string,titleSubtitle?:string,titleImmediate?:boolean,nameValue?:string,nameTarget?:'hero'|'partner',quizProgress?:number,partnerChoices?:string[],storyPhase?:string,storyLine?:number,storyPose?:string,events?:GameEvent[],eventStartedAt?:number,topScreen?:'map'|'team'|'log',mapVisible?:boolean,showGrid?:boolean,reducedMotion?:boolean,blackout?:boolean,fade?:number,openingProgress?:number}} View */

const WIDTH = 256, HEIGHT = 192;
/** @type {Record<import('./mechanics-types.js').Direction,[number,number]>} */
const DIRECTIONS = { s:[0,1], sw:[-1,1], w:[-1,0], nw:[-1,-1], n:[0,-1], ne:[1,-1], e:[1,0], se:[1,1] };

/** @param {HTMLCanvasElement} canvas */
function contextFor(canvas) {
  canvas.width = WIDTH; canvas.height = HEIGHT;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw Error('This browser does not provide a 2D canvas.');
  context.imageSmoothingEnabled = false;
  return context;
}

/** @param {CanvasRenderingContext2D} context @param {string} color */
function fill(context, color) { context.fillStyle = color; context.fillRect(0,0,WIDTH,HEIGHT); }

/** Integer scan conversion keeps map silhouettes on the same pixel grid as sprites.
 * @param {CanvasRenderingContext2D} context @param {[number,number][]} points @param {string} color */
function pixelPolygon(context,points,color){
  context.fillStyle=color;
  const minimum=Math.max(0,Math.min(...points.map(point=>point[1]))),maximum=Math.min(191,Math.max(...points.map(point=>point[1])));
  for(let y=minimum;y<=maximum;y++){
    /** @type {number[]} */const intersections=[];
    points.forEach((first,index)=>{const second=points[(index+1)%points.length];if(!second||((first[1]>y)===(second[1]>y)))return;intersections.push(first[0]+(y-first[1])*(second[0]-first[0])/(second[1]-first[1]));});
    intersections.sort((left,right)=>left-right);
    for(let index=0;index+1<intersections.length;index+=2){const left=intersections[index],right=intersections[index+1];if(left!==undefined&&right!==undefined)context.fillRect(Math.ceil(left),y,Math.floor(right)-Math.ceil(left)+1,1);}
  }
}

/** @param {CanvasRenderingContext2D} context @param {number} time @param {boolean} [warm] */
function sky(context, time, warm = false) {
  const colors = warm ? ['#4e7199','#7296b6','#9ab8ca','#c9d1c8','#e8ddba','#f7e9c3'] : ['#2080d8','#258fea','#389df0','#67b4ef','#9bd1f5','#d3ebf8'];
  for(let y=0;y<192;y++){context.fillStyle=colors[Math.min(colors.length-1,Math.floor(y/32))]??'#d3ebf8';context.fillRect(0,y,256,1);}
  for(let n=0;n<4;n++) {
    const x=Math.round(((n*91-time/1700)%375+375)%375-55), y=101+(n*17)%32;
    context.fillStyle='#c0dff0';context.fillRect(x+8,y-24,24,42);context.fillRect(x-4,y-10,49,36);context.fillRect(x-14,y+9,64,17);
    context.fillStyle='#eef8ff';context.fillRect(x+10,y-24,18,3);context.fillRect(x+7,y-21,3,20);context.fillRect(x-4,y-10,11,3);context.fillRect(x-7,y-7,3,18);context.fillRect(x-14,y+9,7,3);context.fillRect(x-14,y+24,65,2);
  }
  context.fillStyle='#398bbf';context.fillRect(0,163,256,29);
  context.fillStyle='#6bb7d6';context.fillRect(0,166,256,2);
  for(let n=0;n<24;n++){const x=(n*43+Math.floor(time/110))%256,y=171+(n*7)%19;context.fillStyle=n%2?'#3186b7':'#7cc8df';context.fillRect(x,y,7+(n%4),1);}
}

/** The manual shows a luminous vertical cloud column, orange for its quiz
 * example and green for naming. These tones are newly authored, not sampled.
 * @param {CanvasRenderingContext2D} context @param {number} time @param {boolean} reducedMotion @param {'orange'|'green'|'blue'} tone */
function aura(context, time, reducedMotion, tone) {
  const edge= tone==='orange' ? [221,144,61] : tone==='green' ? [75,161,153] : [74,146,207];
  for(let x=0;x<256;x+=4) {
    const glow=Math.max(0,1-Math.abs(x-128)/96);
    const red=Math.round((edge[0]??221)*(1-glow)+255*glow),green=Math.round((edge[1]??144)*(1-glow)+249*glow),blue=Math.round((edge[2]??61)*(1-glow)+214*glow);
    context.fillStyle=`rgb(${red},${green},${blue})`;context.fillRect(x,0,4,192);
  }
  for(let n=0;n<11;n++) {
    const y=Math.round((n*25+(reducedMotion?0:time/80))%235)-20;
    const width=Math.round(74+Math.sin(n*2.5)*38),x=128-width/2;
    context.fillStyle=n%2?'#fff6da77':'#ffffff66';context.fillRect(Math.round(x),y,width,3);context.fillRect(Math.round(x-18),y+3,width+36,4);context.fillRect(Math.round(x),y+7,width,3);
  }
  for(let n=0;n<12;n++){const hash=terrainHash(n,8),x=hash%256,y=(hash>>>8)%192;if(reducedMotion||Math.floor(time/420+n)%4!==0)continue;context.fillStyle='#ffffff';context.fillRect(x-1,y,3,1);context.fillRect(x,y-1,1,3);}
}

/** @param {CanvasRenderingContext2D} context @param {string} value @param {number} y @param {number} scale @param {string} color */
function outlinedTitle(context,value,y,scale,color){
  const outer=/** @type {[number,number][]} */([[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,1],[-1,1],[1,-1]]);
  const inner=/** @type {[number,number][]} */([[-1,0],[1,0],[0,-1],[0,1]]);
  for(const [dx,dy]of outer)text(context,value,128+dx,y+dy,{align:'center',scale,color:'#fffde9',shadow:false});
  for(const [dx,dy]of inner)text(context,value,128+dx,y+dy,{align:'center',scale,color:'#1e416f',shadow:false});
  text(context,value,128,y,{align:'center',scale,color,shadow:true});
}

/** @param {CanvasRenderingContext2D} context @param {number} time @param {string} [label] */
function regionMap(context,time,label='Tiny Woods') {
  fill(context,'#63c5df');
  context.fillStyle='#a0dfdf';for(let y=4;y<192;y+=11)for(let x=(y%4)*9;x<256;x+=31)context.fillRect(x,y,11,1);
  const coastline=/** @type {[number,number][]} */([[25,20],[66,10],[105,18],[137,8],[180,18],[224,36],[231,66],[218,85],[225,119],[203,155],[169,171],[145,166],[121,181],[86,170],[60,158],[29,165],[14,131],[25,110],[12,74]]);
  pixelPolygon(context,coastline,'#d9db94');
  pixelPolygon(context,coastline.map(([x,y])=>[Math.round(x+(128-x)*.04),Math.round(y+(92-y)*.06)]),'#8ac768');
  for(let n=0;n<42;n++){const hash=terrainHash(n,17),x=32+hash%182,y=24+(hash>>>8)%130;if(x>100&&x<145)continue;context.fillStyle=['#5ca351','#6eaf54','#a1d072'][n%3]??'#5ca351';context.fillRect(x,y,8,6);context.fillStyle='#c1db89';context.fillRect(x+1,y,5,1);}
  context.fillStyle='#64bee0';for(let n=0;n<5;n++)context.fillRect(111+Math.round(Math.sin(n*1.8)*8),27+n*25,7,29);
  context.fillStyle='#dbc37d';context.fillRect(44,119,73,3);context.fillRect(91,83,3,39);context.fillRect(90,83,41,3);
  context.fillStyle='#f8edb5';context.fillRect(74,112,24,16);context.fillStyle='#b77743';context.fillRect(77,108,18,8);context.fillStyle='#754a2b';context.fillRect(86,120,4,8);
  const pulse=Math.floor(time/480)%2;context.fillStyle=pulse?'#fdf0a0':'#f8bb64';context.fillRect(93,72,5,5);context.fillStyle='#af424b';context.fillRect(94,73,3,3);
  panel(context,42,157,172,24);text(context,label,128,165,{align:'center'});
}

/** @param {CanvasRenderingContext2D} context @param {DungeonState} state @param {number} x @param {number} y @param {number} scale @param {boolean} [overlay] */
function minimap(context,state,x,y,scale,overlay=false){
  context.save();context.globalAlpha=overlay?.78:1;
  for(let row=0;row<state.height;row++)for(let column=0;column<state.width;column++){
    const index=row*state.width+column;
    if(!state.explored[index]||state.tiles[index]!==1)continue;
    context.fillStyle=overlay?'#f0edc866':'#5a6397';context.fillRect(x+column*scale,y+row*scale,scale,scale);
    if(overlay){context.fillStyle='#fff8cf';if(row===0||state.tiles[index-state.width]!==1)context.fillRect(x+column*scale,y+row*scale,scale,1);if(column===0||state.tiles[index-1]!==1)context.fillRect(x+column*scale,y+row*scale,1,scale);}
  }
  const drawPoint=(/** @type {{x:number,y:number}} */ point,/** @type {string} */ color)=>{context.fillStyle=color;context.fillRect(x+point.x*scale,y+point.y*scale,Math.max(2,scale),Math.max(2,scale));};
  if(state.explored[state.stairs.y*state.width+state.stairs.x])drawPoint(state.stairs,'#71c7ff');
  for(const item of state.items)if(state.visible[item.y*state.width+item.x])drawPoint(item,'#739aff');
  for(const enemy of state.enemies)if(enemy.hp>0&&state.visible[enemy.y*state.width+enemy.x])drawPoint(enemy,'#ff626a');
  if(state.partner.hp>0)drawPoint(state.partner,'#ffe16a');drawPoint(state.hero,'#ffffff');context.restore();
}

/** @param {CanvasRenderingContext2D} context @param {SpriteBank} sprites @param {DungeonState} state */
function teamScreen(context,sprites,state){
  fill(context,'#45466f');
  [state.hero,state.partner,null,null].forEach((actor,index)=>{
    const y=index*48;context.fillStyle=index%2?'#9090b9':'#a6a2c7';context.fillRect(1,y+1,254,46);
    context.fillStyle='#c4bfda';context.fillRect(3,y+1,250,1);context.fillStyle='#696d9b';context.fillRect(1,y+45,254,2);
    if(!actor){context.fillStyle='#575d69';context.fillRect(3,y+2,43,42);context.fillStyle='#8a8f99';context.fillRect(5,y+32,39,10);return;}
    sprites.portrait(context,actor.speciesId,3,y+3,41,{face:false});text(context,actor.name,55,y+5,{color:'#ffe564',maxWidth:194});
    text(context,`Level ${actor.level}`,55,y+16);text(context,`${actor.hp}/${actor.maxHp}`,115,y+16);
    context.fillStyle='#293a37';context.fillRect(171,y+17,69,5);context.fillStyle='#67e977';context.fillRect(172,y+18,Math.floor(67*Math.max(0,actor.hp)/actor.maxHp),3);
    text(context,`Item: ${actor.heldItem?actor.heldItem.kind.replaceAll('-',' '):'None'}`,55,y+27,{maxWidth:188});
    text(context,index===0?'Leader':"Let's go together",149,y+37,{maxWidth:97});
  });
}

/** @param {CanvasRenderingContext2D} context @param {SpriteBank} sprites @param {View} view */
function topDungeon(context,sprites,view){
  const state=view.dungeon;if(!state)return;
  if(view.topScreen==='team'){teamScreen(context,sprites,state);return;}
  fill(context,'#303655');
  for(let y=0;y<192;y+=3){context.fillStyle='#343a5d';context.fillRect(0,y,256,1);}
  if(view.topScreen==='log'){
    text(context,'Message Log',128,10,{align:'center',color:'#ffe6a0'});
    const lines=state.log.flatMap(value=>wrapText(value,238)).slice(-12);
    lines.forEach((line,index)=>text(context,line,9,28+index*12));return;
  }
  text(context,`Tiny Woods  B${state.floor}F`,128,9,{align:'center',color:'#f8eabd'});
  minimap(context,state,Math.round((256-state.width*3)/2),28,3);
  panel(context,8,132,240,53);
  text(context,`${state.hero.name}  Lv${state.hero.level}`,17,141,{color:'#fff3a7'});text(context,`${state.hero.hp}/${state.hero.maxHp}`,239,141,{align:'right'});
  text(context,`${state.partner.name}  Lv${state.partner.level}`,17,154,{color:'#fff3a7'});text(context,`${state.partner.hp}/${state.partner.maxHp}`,239,154,{align:'right'});
  text(context,`Belly ${Math.ceil(state.hero.belly)}/${state.hero.maxBelly}`,17,168);text(context,`${state.money} Poke`,239,168,{align:'right'});
}

/** @param {CanvasRenderingContext2D} context @param {SpriteBank} sprites @param {Dialogue} dialogue @param {number} time @param {boolean} [pink]
 * @param {'left'|'right'|'top-left'|'top-right'} [placement] @param {boolean} [preserveBreaks] */
function drawDialogue(context,sprites,dialogue,time,pink=false,placement='left',preserveBreaks=false){
  const body=preserveBreaks?dialogue.text:dialogue.text.replaceAll('\n',' ');
  const prefix=dialogue.speaker?`${dialogue.speaker}: `:'';
  const lines=wrapText(prefix+body,208);
  // The common window is 224x40 at(16,136). A legacy caller's longer page is
  // allowed one extra row instead of silently losing text during migration.
  const height=Math.max(3,lines.length)*10+10,top=176-height;
  panel(context,16,top,224,height,{pink});
  if(dialogue.portraitSpeciesId){
    const px=placement==='right'?192:placement==='top-right'?152:placement==='top-left'?64:24,py=placement.startsWith('top-')?24:Math.min(80,top-48);
    panel(context,px-3,py-3,46,46,{pink});
    sprites.portrait(context,dialogue.portraitSpeciesId,px,py,40,{flip:placement==='right'||placement==='top-right'});
  }
  const complete=Array.from(body),prefixLength=Array.from(prefix).length,limit=prefixLength+(dialogue.visibleChars??complete.length);
  let offset=0;
  lines.forEach((line,index)=>{
    const letters=Array.from(line),visible=letters.slice(0,Math.max(0,limit-offset)).join(''),y=top+8+index*10;
    if(index===0&&prefix){text(context,prefix,24,y,{color:'#ffe66b'});text(context,Array.from(visible).slice(prefixLength).join(''),25+textWidth(prefix),y);}
    else text(context,visible,24,y);
    offset+=letters.length+1;
  });
  if((dialogue.visibleChars??complete.length)>=complete.length&&Math.floor(time/380)%2===0){context.fillStyle='#fff5bb';context.fillRect(230,top+height-9,5,2);context.fillRect(231,top+height-7,3,2);context.fillRect(232,top+height-5,1,1);}
}

/** @param {CanvasRenderingContext2D} context @param {View} view @returns {ChoiceBounds[]} */
function choices(context,view){
  const values=view.choices??[];if(values.length===0)return[];
  const selected=view.selectedIndex??0;
  /** @type {ChoiceBounds[]} */const bounds=[];
  if(view.scene==='name'){
    const columns=Math.min(10,Math.max(1,view.choiceColumns??10));
    const letters=values.filter(value=>Array.from(value).length===1).length;
    panel(context,5,66,246,116);
    values.forEach((value,index)=>{
      const special=index>=letters;
      const position=special?index-letters:index;
      const x=special?12+position*60:12+(position%columns)*23;
      const y=special?155:77+Math.floor(position/columns)*23;
      const width=special?55:21;
      if(index===selected){context.fillStyle='#98a6d5';context.fillRect(x-2,y-3,width,18);context.fillStyle='#e9ecfc';context.fillRect(x-2,y-3,width,1);}
      text(context,value,x+(width-4)/2,y,{align:'center',color:index===selected?'#fff4a8':'#fffce9',maxWidth:width});
      bounds.push({index,x:x-2,y:y-4,width,height:21});
    });return bounds;
  }
  const columns=Math.min(2,Math.max(1,view.choiceColumns??(view.scene==='partner'?2:1)));
  const rows=Math.ceil(values.length/columns),rowHeight=17;
  const width=columns===2?232:Math.min(232,Math.max(95,...values.map(value=>textWidth(value)+32)));
  // The partner preview occupies y=5..53. Three compact rows leave it fully
  // visible, while the existing row scroll keeps every eligible partner reachable.
  const maxHeight=view.scene==='partner'?64:view.dialogue?104:151,height=Math.min(maxHeight,rows*rowHeight+13);
  const x=columns===2?12:Math.max(12,244-width),y=view.scene==='menu'?32:Math.max(20,(view.dialogue?128:173)-height);
  panel(context,x,y,width,height);
  const rowsVisible=Math.floor((height-13)/rowHeight);
  const selectedRow=Math.floor(selected/columns),scrollRow=Math.max(0,selectedRow-rowsVisible+1);
  values.forEach((value,index)=>{
    const row=Math.floor(index/columns)-scrollRow;if(row<0||row>=rowsVisible)return;
    const left=x+11+(index%columns)*Math.floor((width-12)/columns),top=y+8+row*rowHeight;
    const cellWidth=Math.floor((width-12)/columns)-6;
    if(index===selected)cursor(context,left-4,top);
    text(context,value,left+7,top,{color:index===selected?'#fff2a8':'#fffbea',maxWidth:cellWidth-7});
    bounds.push({index,x:left-5,y:top-4,width:cellWidth+3,height:rowHeight});
  });
  if(scrollRow>0)text(context,'^',x+width-11,y+3,{color:'#ffe6a3'});
  if(scrollRow+rowsVisible<rows)text(context,'v',x+width-11,y+height-12,{color:'#ffe6a3'});
  return bounds;
}

/** @param {CanvasRenderingContext2D} context @param {SpriteBank} sprites @param {Terrain} terrain @param {View} view @param {number} time */
function dungeon(context,sprites,terrain,view,time){
  const state=view.dungeon;if(!state)return;
  const elapsed=Math.max(0,time-(view.eventStartedAt??0)),duration=view.reducedMotion?0:145;
  const events=view.events??[],progress=duration===0?1:Math.min(1,elapsed/duration);
  const heroMove=events.find(event=>event.type==='move'&&event.actorId===state.hero.id);
  const heroX=heroMove?.from&&heroMove.to?heroMove.from.x+(heroMove.to.x-heroMove.from.x)*progress:state.hero.x;
  const heroY=heroMove?.from&&heroMove.to?heroMove.from.y+(heroMove.to.y-heroMove.from.y)*progress:state.hero.y;
  const cameraX=Math.round(heroX*TILE+12-128),cameraY=Math.round(heroY*TILE+12-99);
  terrain.dungeon(context,state,cameraX,cameraY);
  if(state.visible[state.stairs.y*state.width+state.stairs.x]){
    const x=state.stairs.x*TILE-cameraX,y=state.stairs.y*TILE-cameraY;
    context.fillStyle='#647a54';context.fillRect(x+3,y+4,18,16);context.fillStyle='#e6d9a4';
    for(let n=0;n<4;n++){context.fillRect(x+5+n*2,y+6+n*3,14-n*2,2);context.fillStyle=n%2?'#ded4a2':'#9d9e76';}
  }
  for(const item of state.items){if(!state.visible[item.y*state.width+item.x])continue;const x=item.x*TILE+12-cameraX,y=item.y*TILE+13-cameraY;
    context.fillStyle='#65774d';context.fillRect(x-5,y+3,11,2);
    if(item.kind==='poke'){context.fillStyle='#946029';context.fillRect(x-4,y-5,8,8);context.fillStyle='#ffd65e';context.fillRect(x-3,y-6,6,8);context.fillStyle='#b78135';context.fillRect(x,y-5,1,6);}
    else{context.fillStyle=item.kind==='oran-berry'?'#6d86d5':item.kind==='pecha-berry'?'#e6a0a0':'#deae55';context.fillRect(x-4,y-4,8,7);context.fillRect(x-3,y-5,6,9);context.fillStyle='#3a7b45';context.fillRect(x,y-8,2,4);context.fillRect(x+2,y-7,3,2);context.fillStyle='#d9e3ff';context.fillRect(x-2,y-3,2,2);}
  }
  const actors=[state.hero,state.partner,...state.enemies].filter(actor=>(actor.hp>0||elapsed<600&&events.some(event=>event.type==='defeat'&&(event.targetId??event.actorId)===actor.id))&&(actor===state.hero||state.visible[actor.y*state.width+actor.x])).sort((left,right)=>left.y-right.y);
  for(const actor of actors){
    const move=events.find(event=>event.type==='move'&&event.actorId===actor.id),attacked=events.some(event=>event.type==='attack'&&event.actorId===actor.id),damaged=events.some(event=>event.type==='damage'&&(event.targetId??event.actorId)===actor.id);
    const px=move?.from&&move.to?move.from.x+(move.to.x-move.from.x)*progress:actor.x;
    const py=move?.from&&move.to?move.from.y+(move.to.y-move.from.y)*progress:actor.y;
    let clip=(actor.status.sleep??0)>0?'rest-sleep':'idle';if(actor.hp<=0)clip='defeat';else if(elapsed<duration&&move)clip='walk';else if(elapsed<520&&attacked)clip='attack-physical';else if(elapsed<480&&damaged)clip='hit-light';
    const blink=damaged&&elapsed<280&&!view.reducedMotion&&Math.floor(elapsed/60)%2===0;
    const poseTime=clip==='idle'||clip==='rest-sleep'?time:elapsed;
    sprites.draw(context,actor.speciesId,px*TILE+12-cameraX,py*TILE+19-cameraY,{direction:actor.direction,clip,time:view.reducedMotion?0:poseTime,alpha:actor.hp<=0?Math.max(0,1-elapsed/600):blink?.45:1});
    if((actor.status.sleep??0)>0)text(context,'Z',px*TILE+18-cameraX,py*TILE-4-cameraY,{color:'#edf5ff'});
  }
  if(view.showGrid){context.strokeStyle='#f7f3b5';context.lineWidth=1;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)context.strokeRect(Math.round((state.hero.x+dx)*TILE-cameraX)+.5,Math.round((state.hero.y+dy)*TILE-cameraY)+.5,TILE-1,TILE-1);const direction=DIRECTIONS[state.hero.direction];context.fillStyle='#fff6a766';context.fillRect((state.hero.x+direction[0])*TILE-cameraX,(state.hero.y+direction[1])*TILE-cameraY,TILE,TILE);}
  if(view.mapVisible)minimap(context,state,44,32,3,true);
  if(elapsed<700&&!view.reducedMotion){for(const event of events){if(event.type!=='damage'&&event.type!=='heal')continue;const actor=[state.hero,state.partner,...state.enemies].find(candidate=>candidate.id===(event.targetId??event.actorId));if(!actor)continue;text(context,`${event.type==='heal'?'+':''}${event.amount??0}`,actor.x*TILE+12-cameraX,actor.y*TILE-1-cameraY-Math.floor(elapsed/70),{align:'center',color:event.type==='heal'?'#93ff9a':'#fff6ed'});}}
  text(context,`B${state.floor}F`,4,2,{color:'#fff6ad'});text(context,`Lv ${state.hero.level}`,33,2,{color:'#fff6ad'});text(context,`HP ${state.hero.hp}/${state.hero.maxHp}`,75,2,{color:'#fff6ad'});
  context.fillStyle='#343d39';context.fillRect(148,3,86,5);context.fillStyle=state.hero.hp<state.hero.maxHp/4?'#ef7860':'#83ed6c';context.fillRect(149,4,Math.floor(84*Math.max(0,state.hero.hp)/state.hero.maxHp),3);
  if(view.notice&&!view.dialogue&&!view.choices?.length){panel(context,6,153,244,34);wrapText(view.notice,227).slice(-2).forEach((line,index)=>text(context,line,13,162+index*11));}
}

/** Fixed two-screen presentation; the owner supplies state and advances time.
 * @param {HTMLCanvasElement} topCanvas @param {HTMLCanvasElement} bottomCanvas
 * @param {{initialSpecies?:string[],reducedMotion?:boolean,introClientSpeciesId?:string,signal?:AbortSignal}} [options] */
export async function createRenderer(topCanvas,bottomCanvas,options={}){
  const top=contextFor(topCanvas),bottom=contextFor(bottomCanvas),sprites=new SpriteBank(),terrain=new Terrain(),intro=new IntroArtwork(),storyActors=new StoryActors();
  const introClient=options.introClientSpeciesId??INTRO_CLIENT_IDS[Math.floor(Math.random()*INTRO_CLIENT_IDS.length)]??'pokemon-025';
  /** @type {ChoiceBounds[]} */let choiceBounds=[];
  /** @type {Scene|null} */let previousScene=null;let sceneStart=0,disposed=false,titleAnimated=false;
  function dispose(){if(disposed)return;disposed=true;options.signal?.removeEventListener('abort',dispose);sprites.dispose();terrain.dispose();intro.dispose();choiceBounds=[];fill(top,'#000000');fill(bottom,'#000000');}
  options.signal?.addEventListener('abort',dispose,{once:true});
  if(options.signal?.aborted){dispose();throw new DOMException('Loading was cancelled.','AbortError');}
  try{await Promise.all([sprites.loadSpecies([...new Set([...(options.initialSpecies??['pokemon-025','pokemon-004','pokemon-007']),'pokemon-279',introClient])]),intro.load()]);if(disposed)throw new DOMException('Loading was cancelled.','AbortError');}catch(error){dispose();throw error;}
  return {
    /** @param {string[]} ids */loadSpecies(ids){return sprites.loadSpecies(ids);},
    getChoiceBounds(){return choiceBounds.map(bound=>({...bound}));},
    /** @param {View} source @param {number} time */
    render(source,time){
      if(disposed)return;
      const view={...source,reducedMotion:source.reducedMotion??options.reducedMotion??false};
      if(previousScene!==view.scene){titleAnimated=view.scene==='title'&&previousScene==='opening'&&!view.titleImmediate;previousScene=view.scene;sceneStart=time;}
      const elapsed=time-sceneStart,animationTime=view.reducedMotion?0:elapsed;
      const hero=view.heroSpeciesId??'pokemon-025',partner=view.partnerSpeciesId??'pokemon-004';
      fill(top,'#000000');fill(bottom,'#000000');choiceBounds=[];
      if(view.scene==='opening'){
        intro.opening(bottom,sprites,introClient,elapsed,view.reducedMotion);
      }else if(view.scene==='title'){
        sky(bottom,animationTime);
        outlinedTitle(bottom,'POKéMON',40,4,'#ffe667');outlinedTitle(bottom,'Mystery Dungeon',87,2,'#f5d277');
        bottom.fillStyle='#1269aa';bottom.fillRect(39,119,178,27);bottom.fillStyle='#b7edff';bottom.fillRect(39,119,178,2);bottom.fillRect(39,144,178,2);
        text(bottom,'BLUE RESCUE TEAM',128,128,{align:'center',color:'#effaff',scale:1});
        const animated=titleAnimated&&!view.titleImmediate;
        if(animated)intro.title(bottom,elapsed,view.reducedMotion);
        const promptReady=!animated||elapsed>=TITLE_PROMPT_MS;
        const promptTime=animated?elapsed-TITLE_PROMPT_MS:elapsed;
        if(promptReady&&(view.reducedMotion||Math.floor(promptTime/(1000/6))%2===1))text(bottom,'Press START',128,171,{align:'center'});
      }else if(view.scene==='menu'){
        terrain.clearing(bottom,animationTime,{reducedMotion:view.reducedMotion});sprites.draw(bottom,hero,195,112,{direction:'sw',time:animationTime});sprites.draw(bottom,partner,220,120,{direction:'w',time:animationTime});
        if(view.menuTitle){panel(bottom,9,5,238,22);text(bottom,view.menuTitle,128,12,{align:'center'});}
      }else if(['quiz','gender','result','partner','name'].includes(view.scene)){
        aura(bottom,animationTime,view.reducedMotion,view.scene==='name'?'green':view.scene==='result'||view.scene==='partner'?'blue':'orange');
        if(view.scene==='result'){sprites.draw(bottom,hero,128,93,{direction:'s',scale:2,shadow:false,time:animationTime});}
        if(view.scene==='partner'){
          const current=view.partnerChoices?.[view.selectedIndex??0]??partner;sprites.draw(bottom,current,128,51,{direction:'s',scale:1.5,shadow:false,time:animationTime});
        }
        if(view.scene==='name'){
          panel(bottom,12,10,232,47);text(bottom,view.nameTarget==='hero'?'What is your name?':"Your partner's name?",128,18,{align:'center'});
          text(bottom,view.nameValue||'__________',128,36,{align:'center',color:'#fff0a6'});
        }
      }else if(view.scene==='dungeon'){
        topDungeon(top,sprites,view);dungeon(bottom,sprites,terrain,view,time);
        if(view.menuTitle){panel(bottom,8,17,Math.min(240,textWidth(view.menuTitle)+22),21);text(bottom,view.menuTitle,19,24,{color:'#fff0a2'});}
      }else{
        regionMap(top,animationTime);terrain.clearing(bottom,animationTime,{clearing:view.scene==='clearing',reducedMotion:view.reducedMotion});
        storyActors.draw(bottom,sprites,view,time);
        if(view.scene==='complete'){panel(bottom,26,12,204,25);text(bottom,'Caterpie was rescued!',128,21,{align:'center',color:'#fff1a0'});}
      }
      if(view.blackout){fill(top,'#000000');fill(bottom,'#000000');}
      if(view.choices?.length)choiceBounds=choices(bottom,view);
      if(view.dialogue){
        const id=view.dialogue.portraitSpeciesId,placement=id==='pokemon-012'&&view.scene==='reunion'?'top-right':id==='pokemon-010'||id==='pokemon-012'?'top-left':id===partner?'right':'left';
        if(view.blackout){
          const lines=wrapText(view.dialogue.text,208),visible=view.dialogue.visibleChars??Array.from(view.dialogue.text).length;
          let offset=0;lines.forEach((line,index)=>{const letters=Array.from(line);text(bottom,letters.slice(0,Math.max(0,visible-offset)).join(''),128,87-(lines.length-1)*6+index*12,{align:'center'});offset+=letters.length+1;});
        }else drawDialogue(bottom,sprites,view.dialogue,view.reducedMotion?1:time,false,placement,Boolean(view.menuTitle));
      }
      if(view.fade){bottom.fillStyle=`rgba(0,0,0,${Math.max(0,Math.min(1,view.fade))})`;bottom.fillRect(0,0,WIDTH,HEIGHT);top.fillStyle=bottom.fillStyle;top.fillRect(0,0,WIDTH,HEIGHT);}
    },
    dispose,
  };
}
