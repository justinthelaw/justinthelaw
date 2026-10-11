import { text, textWidth, wrapText, panel, cursor, dialogueArrow, nativeHud, nativeDamage, nativeTouchToolbar, touchToolbarBounds, nativeMenuFrame, disposeFont, disposeNativeUi } from './render-font.js';
import { Terrain, TILE } from './render-terrain.js';
import { AuraBackdrop } from './render-aura.js';
import { SpriteBank } from './render-sprites.js';
import { StoryActors } from './render-story.js';
import { IntroArtwork, INTRO_CLIENT_IDS, TITLE_PROMPT_MS } from './render-intro.js';
import { TACTICS, tacticFor } from './mechanics-policy.js';
import { renderNaming } from './render-naming.js';
import { UiArtwork } from './render-ui-art.js';
import { fileMenu, dungeonMenu } from './render-menus.js';
import { StatusSprites } from './render-status.js';
import { DungeonNotice } from './render-notice.js';
import { itemName } from './mechanics.js';
import { cameraSight } from './mechanics-visibility.js';
import { NativeMap } from './render-map.js';
export { BOOT_DURATION_MS, OPENING_DURATION_MS, TITLE_READY_MS, TITLE_PROMPT_MS } from './render-intro.js';

/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').Actor} Actor */
/** @typedef {import('./mechanics-types.js').GameEvent} GameEvent */
/** @typedef {'opening'|'title'|'menu'|'quiz'|'gender'|'result'|'partner'|'name'|'awakening'|'trouble'|'dungeon'|'clearing'|'reunion'|'complete'} Scene */
/** @typedef {{speaker?:string,text:string,portraitSpeciesId?:string,portraitEmotion?:string,visibleChars?:number}} Dialogue */
/** @typedef {{index:number,x:number,y:number,width:number,height:number}} ChoiceBounds */
/** @typedef {{scene:Scene,gender?:'male'|'female',dialogue?:Dialogue|null,choices?:string[],disabledChoices?:boolean[],selectedIndex?:number,choiceColumns?:number,heroSpeciesId?:string,partnerSpeciesId?:string,heroName?:string,partnerName?:string,dungeon?:DungeonState|null,cameraActorId?:'hero'|'partner',menuActorId?:'hero'|'partner',dungeonLightLevel?:number,menuTitle?:string,notice?:string,titleSubtitle?:string,titleImmediate?:boolean,nameValue?:string,nameTarget?:'hero'|'partner',naming?:import('./naming.js').NamingState,quizProgress?:number,partnerChoices?:string[],storyPhase?:string,storyLine?:number,storyPose?:string,events?:GameEvent[],eventStartedAt?:number,eventDuration?:number,topScreen?:'map'|'team'|'log',mapStyle?:import('./map-mode.js').MapStyle,floorMapOpen?:boolean,mapMonsterDots?:boolean,mapInputTurn?:number,showGrid?:boolean,gridLines?:boolean,showToolbar?:boolean,reducedMotion?:boolean,blackout?:boolean,fade?:number,openingProgress?:number}} View */

const WIDTH = 256, HEIGHT = 192;
const AURA_SCENES = new Set(['quiz', 'gender', 'result', 'partner', 'name']);
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

/** @param {CanvasRenderingContext2D} context @param {SpriteBank} sprites @param {UiArtwork} artwork @param {DungeonState} state @param {boolean} pink @param {number} time */
function teamScreen(context,sprites,artwork,state,pink,time){
  [state.hero,state.partner,null,null].forEach((actor,index)=>{
    const y=index*48;artwork.row(context,y,Boolean(actor),pink);if(!actor)return;
    // Original Blue captures use native world sprites on 48-pixel pedestals.
    // The SW walk loop contains every directly matched preview pose; its Blue
    // preview animation cadence has not yet been independently frame-timed.
    sprites.draw(context,actor.speciesId,24,y+40,{direction:'sw',clip:'walk',time,shadow:false,dungeon:true});
    // The official English manual and retail capture287134 agree on this
    // compact layout; press ss01 has a different, retained reference indent.
    text(context,actor.name,56,y+8,{color:'#fbfb00',maxWidth:192});
    text(context,`Level ${actor.level}`,60,y+19);
    text(context,String(actor.hp),134,y+19,{align:'right'});text(context,'/',134,y+19);text(context,String(actor.maxHp),157,y+19,{align:'right'});
    const width=Math.min(94,Math.max(1,actor.maxHp)),filled=Math.floor(width*Math.max(0,actor.hp)/actor.maxHp);
    context.fillStyle='#fbfbfb';context.fillRect(162,y+20,width,1);context.fillRect(162,y+28,width,1);
    context.fillStyle='#000000';context.fillRect(162,y+21,width,7);
    context.fillStyle=actor.hp<=Math.floor(actor.maxHp/4)?'#fb5959':actor.hp<=Math.floor(actor.maxHp/2)?'#fbfb59':'#59fb59';context.fillRect(162,y+22,filled,5);
    text(context,actor.heldItem?itemName(actor.heldItem.kind):'Item: None',60,y+30,{maxWidth:84});
    text(context,index===0?'Leader':TACTICS.find(tactic=>tactic.id===tacticFor(actor))?.name??'',148,y+30,{maxWidth:106});
  });
}

/** @param {CanvasRenderingContext2D} context @param {SpriteBank} sprites @param {UiArtwork} artwork @param {NativeMap} map @param {View} view @param {number} time */
function topDungeon(context,sprites,artwork,map,view,time){
  const state=view.dungeon;if(!state)return;
  if(view.topScreen==='team'){teamScreen(context,sprites,artwork,state,view.gender==='female',view.reducedMotion?0:time);return;}
  fill(context,'#303655');
  for(let y=0;y<192;y+=3){context.fillStyle='#343a5d';context.fillRect(0,y,256,1);}
  if(view.topScreen==='log'){
    text(context,'Message Log',128,10,{align:'center',color:'#ffe6a0'});
    const lines=state.log.flatMap(value=>wrapText(value,238)).slice(-12);
    lines.forEach((line,index)=>text(context,line,9,28+index*12));return;
  }
  map.draw(context,state,{style:'upper',reducedMotion:view.reducedMotion});
  // English Blue manual p25: the upper map footer contains member rows only.
  // Geometry is measured from its half-size capture, not a native pixel proof;
  // retain the observed male blue frame until a female dungeon capture exists.
  panel(context,16,128,224,64);
  [state.hero,state.partner].forEach((actor,index)=>{
    const y=136+index*12;
    text(context,actor.name,28,y,{color:'#fbfb00',maxWidth:60});
    text(context,`Level ${actor.level}`,96,y);
    text(context,`${String(actor.hp).padStart(3,' ')}/${String(actor.maxHp).padStart(3,' ')}`,160,y);
  });
}

/** @param {CanvasRenderingContext2D} context @param {SpriteBank} sprites @param {Dialogue} dialogue @param {number} time @param {boolean} [pink]
 * @param {'left'|'right'|'top-left'|'top-right'} [placement] @param {boolean} [preserveBreaks] */
function drawDialogue(context,sprites,dialogue,time,pink=false,placement='left',preserveBreaks=false){
  const body=preserveBreaks?dialogue.text:dialogue.text.replaceAll('\n',' ');
  const prefix=dialogue.speaker?`${dialogue.speaker}: `:'';
  const lines=wrapText(prefix+body,204);
  // The common window is 224x40 at(16,136). A legacy caller's longer page is
  // allowed one extra row instead of silently losing text during migration.
  const height=Math.max(3,lines.length)*11+7,top=176-height;
  panel(context,16,top,224,height,{pink,kind:'dialogue'});
  if(dialogue.portraitSpeciesId){
    const px=placement==='right'?192:placement==='top-right'?152:placement==='top-left'?64:24,py=placement.startsWith('top-')?24:Math.min(80,top-48);
    panel(context,px-4,py-4,48,48,{pink,kind:'portrait'});
    sprites.portrait(context,dialogue.portraitSpeciesId,px,py,40,{flip:placement==='right'||placement==='top-right',emotion:dialogue.portraitEmotion});
  }
  const complete=Array.from(body),prefixLength=Array.from(prefix).length,limit=prefixLength+(dialogue.visibleChars??complete.length);
  let offset=0;
  lines.forEach((line,index)=>{
    const letters=Array.from(line),visible=letters.slice(0,Math.max(0,limit-offset)).join(''),y=top+4+index*11;
    if(index===0&&prefix){
      text(context,dialogue.speaker??'',28,y,{color:'#fbfb00'});
      text(context,': ',28+textWidth(dialogue.speaker??''),y);
      text(context,Array.from(visible).slice(prefixLength).join(''),28+textWidth(prefix),y);
    }else text(context,visible,28,y);
    offset+=letters.length+1;
  });
  if((dialogue.visibleChars??complete.length)>=complete.length&&(Math.floor(time*60/1000)&8)!==0)dialogueArrow(context,120,top+height-5);
}

/** @param {CanvasRenderingContext2D} context @param {View} view @returns {ChoiceBounds[]} */
function choices(context,view){
  const values=view.choices??[];if(values.length===0)return[];
  if(view.scene==='menu')return fileMenu(context,view);
  if(view.scene==='dungeon'){const bounds=dungeonMenu(context,view);if(bounds)return bounds;}
  const selected=view.selectedIndex??0;
  /** @type {ChoiceBounds[]} */const bounds=[];
  if(view.scene==='partner'&&view.partnerChoices){
    const height=8*(Math.ceil(12*values.length/8)+2),pink=view.gender==='female';
    nativeMenuFrame(context,24,32,72,height,48,pink);text(context,'Pokémon',36,32);
    values.forEach((value,index)=>{
      const y=48+index*12;if(index===selected)cursor(context,24,y+1);
      text(context,value,32,y);bounds.push({index,x:24,y:y-1,width:72,height:12});
    });return bounds;
  }
  const columns=Math.min(2,Math.max(1,view.choiceColumns??1));
  const rows=Math.ceil(values.length/columns),rowHeight=17;
  const width=columns===2?232:Math.min(232,Math.max(95,...values.map(value=>textWidth(value)+32)));
  const maxHeight=view.scene==='partner'?64:view.dialogue?104:151,height=Math.min(maxHeight,rows*rowHeight+13);
  const rightPortrait=Boolean(view.dialogue?.portraitSpeciesId&&view.dialogue.portraitSpeciesId===view.partnerSpeciesId);
  const x=columns===2||rightPortrait?12:Math.max(12,244-width),y=Math.max(20,(view.dialogue?128:173)-height);
  panel(context,x,y,width,height);
  const rowsVisible=Math.floor((height-13)/rowHeight);
  const selectedRow=Math.floor(selected/columns),scrollRow=Math.max(0,selectedRow-rowsVisible+1);
  values.forEach((value,index)=>{
    const row=Math.floor(index/columns)-scrollRow;if(row<0||row>=rowsVisible)return;
    const left=x+11+(index%columns)*Math.floor((width-12)/columns),top=y+8+row*rowHeight;
    const cellWidth=Math.floor((width-12)/columns)-6;
    if(index===selected)cursor(context,left-4,top);
    text(context,value,left+7,top,{color:view.disabledChoices?.[index]?'#8b93a9':index===selected?'#fff2a8':'#fffbea',maxWidth:cellWidth-7});
    bounds.push({index,x:left-5,y:top-4,width:cellWidth+3,height:rowHeight});
  });
  if(scrollRow>0)text(context,'^',x+width-11,y+3,{color:'#ffe6a3'});
  if(scrollRow+rowsVisible<rows)text(context,'v',x+width-11,y+height-12,{color:'#ffe6a3'});
  return bounds;
}

/** Native rotate mode highlights the leader and five cells ahead. The Grids
 * preference controls the remaining visible floor lines, not a permanent grid.
 * @param {CanvasRenderingContext2D} context @param {DungeonState} state
 * @param {number} cameraX @param {number} cameraY @param {boolean} lines */
function drawFacingGuide(context,state,cameraX,cameraY,lines){
  if(lines){
    context.strokeStyle='#fbfbfb88';context.lineWidth=1;
    const left=Math.floor(cameraX/TILE),top=Math.floor(cameraY/TILE);
    for(let y=Math.max(0,top);y<Math.min(state.height,top+10);y++)for(let x=Math.max(0,left);x<Math.min(state.width,left+12);x++){
      const index=y*state.width+x;
      if(state.visible[index]&&state.tiles[index]===1)context.strokeRect(Math.round(x*TILE-cameraX)+.5,Math.round(y*TILE-cameraY)+.5,TILE-1,TILE-1);
    }
  }
  const [dx,dy]=DIRECTIONS[state.hero.direction];context.fillStyle='#fbfb0066';
  for(let step=0;step<6;step++){
    const x=state.hero.x+dx*step,y=state.hero.y+dy*step,index=y*state.width+x;
    if(x>=0&&y>=0&&x<state.width&&y<state.height&&state.visible[index]&&state.tiles[index]===1)context.fillRect(Math.round(x*TILE-cameraX),Math.round(y*TILE-cameraY),TILE,TILE);
  }
}

/** @param {CanvasRenderingContext2D} context @param {SpriteBank} sprites @param {Terrain} terrain @param {StatusSprites} statuses @param {DungeonNotice} notice @param {NativeMap} map @param {View} view @param {number} time */
function dungeon(context,sprites,terrain,statuses,notice,map,view,time){
  const state=view.dungeon;if(!state)return;
  const elapsed=Math.max(0,time-(view.eventStartedAt??0)),duration=view.reducedMotion?0:view.eventDuration??400;
  const events=view.events??[],progress=duration===0?1:Math.min(1,elapsed/duration);
  const focus=state[view.cameraActorId??'hero'],fullyLit=view.dungeonLightLevel===0;
  if(view.floorMapOpen){
    fill(context,'#000000');notice.reset();
    map.draw(context,state,{style:view.mapStyle==='shade'?'shade':'clear',modal:true,showMonsters:view.mapMonsterDots,reducedMotion:view.reducedMotion});
    nativeHud(context,{floor:state.floor,level:focus.level,hp:focus.hp,maxHp:focus.maxHp,belly:focus.belly,leader:focus===state.hero,pink:view.gender==='female',time});
    return;
  }
  const focusMove=events.find(event=>event.type==='move'&&event.actorId===focus.id);
  const focusX=focusMove?.from&&focusMove.to?focusMove.from.x+(focusMove.to.x-focusMove.from.x)*progress:focus.x;
  const focusY=focusMove?.from&&focusMove.to?focusMove.from.y+(focusMove.to.y-focusMove.from.y)*progress:focus.y;
  const cameraX=Math.round(focusX*TILE+12-128),cameraY=Math.round(focusY*TILE+16-108);
  terrain.dungeon(context,state,cameraX,cameraY,{fullyLit});
  if(fullyLit||state.visible[state.stairs.y*state.width+state.stairs.x]){
    const x=state.stairs.x*TILE-cameraX,y=state.stairs.y*TILE-cameraY;
    terrain.stairs(context,x,y);
  }
  for(const item of state.items)if(fullyLit||state.visible[item.y*state.width+item.x])terrain.item(context,item.kind,item.x*TILE+12-cameraX,item.y*TILE+12-cameraY);
  const actors=[state.hero,state.partner,...state.enemies].filter(actor=>(actor.hp>0||elapsed<600&&events.some(event=>event.type==='defeat'&&(event.targetId??event.actorId)===actor.id))&&(fullyLit||actor===state.hero||actor===state.partner||state.visible[actor.y*state.width+actor.x])).sort((left,right)=>left.y-right.y);
  statuses.beginFrame(state,time,{reducedMotion:view.reducedMotion});
  for(const actor of actors){
    const move=events.find(event=>event.type==='move'&&event.actorId===actor.id),attacked=events.some(event=>event.type==='attack'&&event.actorId===actor.id),damaged=events.some(event=>event.type==='damage'&&(event.targetId??event.actorId)===actor.id);
    const px=move?.from&&move.to?move.from.x+(move.to.x-move.from.x)*progress:actor.x;
    const py=move?.from&&move.to?move.from.y+(move.to.y-move.from.y)*progress:actor.y;
    let clip=(actor.status.sleep??0)>0?'rest-sleep':'idle';if(actor.hp<=0)clip='defeat';else if(elapsed<duration&&move)clip='walk';else if(elapsed<520&&attacked)clip='attack-physical';else if(elapsed<480&&damaged)clip='hit-light';
    const blink=damaged&&elapsed<280&&!view.reducedMotion&&Math.floor(elapsed/60)%2===0;
    const poseTime=clip==='idle'||clip==='rest-sleep'?time:elapsed;
    const attachment=sprites.draw(context,actor.speciesId,px*TILE+12-cameraX,py*TILE+16-cameraY,{direction:actor.direction,clip,time:view.reducedMotion?0:poseTime,dungeon:true,teamShadow:actor.id==='hero'||actor.id==='partner',alpha:actor.hp<=0?Math.max(0,1-elapsed/600):blink?.45:1});
    statuses.draw(context,actor,attachment);
  }
  if(!view.reducedMotion&&elapsed<duration)for(const event of events){
    if(event.type!=='throw'||!event.from||!event.to||event.text!=='oran-berry'&&event.text!=='pecha-berry'&&event.text!=='rawst-berry')continue;
    const x=event.from.x+(event.to.x-event.from.x)*progress,y=event.from.y+(event.to.y-event.from.y)*progress;
    terrain.item(context,event.text,x*TILE+12-cameraX,y*TILE+12-cameraY);
  }
  if(view.showGrid)drawFacingGuide(context,state,cameraX,cameraY,view.gridLines!==false);
  if(!view.menuTitle&&(view.mapStyle==='clear'||view.mapStyle==='shade'))map.draw(context,state,{style:view.mapStyle,reducedMotion:view.reducedMotion});
  if(elapsed<1000&&!view.reducedMotion){for(const event of events){if(event.type!=='damage'&&event.type!=='heal')continue;const actor=[state.hero,state.partner,...state.enemies].find(candidate=>candidate.id===(event.targetId??event.actorId));if(!actor)continue;nativeDamage(context,event.amount??0,actor.x*TILE+12-cameraX,actor.y*TILE+16-cameraY-24-Math.floor(elapsed*60/1000*46/256),event.type==='heal');}}
  nativeHud(context,{floor:state.floor,level:focus.level,hp:focus.hp,maxHp:focus.maxHp,belly:focus.belly,leader:focus===state.hero,pink:view.gender==='female',time});
  notice.draw(context,view.notice??'',time,{pink:view.gender==='female',visible:!view.dialogue&&!view.choices?.length,reducedMotion:view.reducedMotion});
}

/** Fixed two-screen presentation; the owner supplies state and advances time.
 * @param {HTMLCanvasElement} topCanvas @param {HTMLCanvasElement} bottomCanvas
 * @param {{initialSpecies?:string[],reducedMotion?:boolean,introClientSpeciesId?:string,signal?:AbortSignal}} [options] */
export async function createRenderer(topCanvas,bottomCanvas,options={}){
  const top=contextFor(topCanvas),bottom=contextFor(bottomCanvas),sprites=new SpriteBank(),terrain=new Terrain(),intro=new IntroArtwork(),aura=new AuraBackdrop(),storyActors=new StoryActors(),artwork=new UiArtwork(),statuses=new StatusSprites(),notice=new DungeonNotice(),map=new NativeMap();
  const introClient=options.introClientSpeciesId??INTRO_CLIENT_IDS[Math.floor(Math.random()*INTRO_CLIENT_IDS.length)]??'pokemon-025';
  /** @type {ChoiceBounds[]} */let choiceBounds=[];
  let toolbarVisible=false;
  /** @type {Scene|null} */let previousScene=null;let sceneStart=0,disposed=false,titleAnimated=false;
  let waitingDialogue='',waitingSince=0;
  /** @type {boolean[]} */let sight=[];
  /** @type {number[]|null} */let sightTiles=null;let sightKey='';
  function dispose(){if(disposed)return;disposed=true;options.signal?.removeEventListener('abort',dispose);sprites.dispose();terrain.dispose();intro.dispose();aura.dispose();artwork.dispose();statuses.dispose();notice.reset();map.reset();disposeFont();disposeNativeUi();choiceBounds=[];sight=[];sightTiles=null;toolbarVisible=false;fill(top,'#000000');fill(bottom,'#000000');}
  options.signal?.addEventListener('abort',dispose,{once:true});
  if(options.signal?.aborted){dispose();throw new DOMException('Loading was cancelled.','AbortError');}
  try{await Promise.all([sprites.loadSpecies([...new Set([...(options.initialSpecies??['pokemon-025','pokemon-004','pokemon-007']),'pokemon-279',introClient])]),intro.load(),terrain.load(),aura.load(),artwork.load(),statuses.load()]);if(disposed)throw new DOMException('Loading was cancelled.','AbortError');}catch(error){dispose();throw error;}
  return {
    /** @param {string[]} ids */loadSpecies(ids){return sprites.loadSpecies(ids);},
    getChoiceBounds(){return choiceBounds.map(bound=>({...bound}));},
    getToolbarBounds(){return toolbarVisible?touchToolbarBounds():[];},
    /** @param {View} source @param {number} time */
    render(source,time){
      if(disposed)return;
      const view={...source,reducedMotion:source.reducedMotion??options.reducedMotion??false};
      if(view.scene!=='dungeon')notice.reset();
      if(previousScene==='dungeon'&&view.scene!=='dungeon'){statuses.reset();map.reset();sight=[];sightTiles=null;sightKey='';}
      if(view.scene==='dungeon'&&view.dungeon){
        const state=view.dungeon,focus=state[view.cameraActorId??'hero'],key=`${focus.id}:${focus.x}:${focus.y}:${focus.hp>0}`;
        if(sightTiles!==state.tiles||sightKey!==key){
          if(sight.length!==state.width*state.height)sight=Array(state.width*state.height).fill(false);
          cameraSight(state,focus,sight);sightTiles=state.tiles;sightKey=key;
        }
        // A transient projection keeps camera sight out of saved/AI state.
        view.dungeon={...state,visible:sight};
        map.beginFrame(state,time,!view.floorMapOpen&&(view.topScreen==='map'||!view.menuTitle&&(view.mapStyle==='clear'||view.mapStyle==='shade')),view.mapInputTurn);
      }
      if(previousScene!==view.scene){if(AURA_SCENES.has(view.scene)&&!AURA_SCENES.has(previousScene??''))aura.reset(time);titleAnimated=view.scene==='title'&&previousScene==='opening'&&!view.titleImmediate;previousScene=view.scene;sceneStart=time;}
      const elapsed=time-sceneStart,animationTime=view.reducedMotion?0:elapsed;
      const hero=view.heroSpeciesId??'pokemon-025',partner=view.partnerSpeciesId??'pokemon-004';
      fill(top,'#000000');fill(bottom,'#000000');choiceBounds=[];toolbarVisible=false;
      if(view.scene==='opening'){
        intro.opening(bottom,sprites,introClient,elapsed,view.reducedMotion);
      }else if(view.scene==='title'){
        intro.titleBackdrop(bottom,elapsed,view.reducedMotion);
        const animated=titleAnimated&&!view.titleImmediate;
        if(animated)intro.title(bottom,sprites,elapsed,view.reducedMotion);
        const promptReady=!animated||elapsed>=TITLE_PROMPT_MS;
        const promptTime=animated?elapsed-TITLE_PROMPT_MS:elapsed;
        if(promptReady&&(view.reducedMotion||Math.floor(promptTime/(1000/6))%2===1))intro.titlePrompt(bottom);
      }else if(view.scene==='menu'){
        artwork.menu(bottom);
      }else if(['quiz','gender','result','partner','name'].includes(view.scene)){
        aura.draw(bottom,time,{reducedMotion:view.reducedMotion,mode:'cycle'});
        if(view.scene==='result'&&view.storyLine===2){panel(bottom,100,60,48,48,{pink:view.gender==='female',kind:'portrait'});sprites.portrait(bottom,hero,104,64,40,{flip:true,emotion:'happy'});}
        if(view.scene==='partner'){
          const current=view.partnerChoices?.[view.selectedIndex??0]??partner;panel(bottom,116,44,48,48,{pink:view.gender==='female',kind:'portrait'});sprites.portrait(bottom,current,120,48,40,{flip:true,emotion:'normal'});
        }
        if(view.scene==='name')choiceBounds=renderNaming(bottom,view,time);
      }else if(view.scene==='dungeon'){
        topDungeon(top,sprites,artwork,map,view,time);dungeon(bottom,sprites,terrain,statuses,notice,map,view,time);
        toolbarVisible=Boolean(view.showToolbar&&!view.dialogue&&!view.choices?.length);
        if(toolbarVisible)nativeTouchToolbar(bottom,view.gender==='female');
      }else{
        terrain.regionMap(top);panel(top,56,152,184,32,{pink:view.gender==='female'});text(top,'Tiny Woods',121,162);
        terrain.clearing(bottom,animationTime,{clearing:view.scene==='clearing',reducedMotion:view.reducedMotion});
        storyActors.draw(bottom,sprites,view,time);
        if(view.scene==='complete'){panel(bottom,26,12,204,28);text(bottom,'Caterpie was rescued!',128,20,{align:'center',color:'#fbfb00'});}
      }
      if(view.blackout){fill(top,'#000000');fill(bottom,'#000000');}
      if(view.choices?.length&&view.scene!=='name')choiceBounds=choices(bottom,view);
      const completedDialogue=view.dialogue&&(view.dialogue.visibleChars??Array.from(view.dialogue.text).length)>=Array.from(view.dialogue.text).length;
      const waitingKey=completedDialogue?`${view.scene}:${view.storyLine}:${view.dialogue?.speaker??''}:${view.dialogue?.text}`:'';
      if(waitingKey!==waitingDialogue){waitingDialogue=waitingKey;waitingSince=time;}
      if(view.dialogue){
        const id=view.dialogue.portraitSpeciesId,placement=id==='pokemon-012'&&view.scene==='reunion'?'top-right':id==='pokemon-010'||id==='pokemon-012'?'top-left':id===partner?'right':'left';
        if(view.blackout){
          const lines=wrapText(view.dialogue.text,208),visible=view.dialogue.visibleChars??Array.from(view.dialogue.text).length;
          let offset=0;lines.forEach((line,index)=>{const letters=Array.from(line);text(bottom,letters.slice(0,Math.max(0,visible-offset)).join(''),128,87-(lines.length-1)*6+index*12,{align:'center'});offset+=letters.length+1;});
        }else drawDialogue(bottom,sprites,view.dialogue,view.reducedMotion?150:time-waitingSince,view.gender==='female',placement,Boolean(view.menuTitle));
      }
      if(view.fade){bottom.fillStyle=`rgba(0,0,0,${Math.max(0,Math.min(1,view.fade))})`;bottom.fillRect(0,0,WIDTH,HEIGHT);top.fillStyle=bottom.fillStyle;top.fillRect(0,0,WIDTH,HEIGHT);}
    },
    dispose,
  };
}
