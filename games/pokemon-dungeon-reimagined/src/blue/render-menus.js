/** Source-sized Rescue Team menu windows. Blue translations not directly
 * captured remain qualified in reference/blue-visual.md. */
import {text,textWidth,panel,cursor,nativeMenuFrame,nativeMoveIcon,nativeHeart,wrapText} from './render-font.js';

/** @typedef {import('./renderer.js').View} View */
/** @typedef {import('./renderer.js').ChoiceBounds} ChoiceBounds */

/** @param {CanvasRenderingContext2D} context @param {View} view
 * @param {number} x @param {number} y @param {number} width @param {number} [rowHeight]
 * @returns {ChoiceBounds[]} */
function rows(context,view,x,y,width,rowHeight=12){
  return(view.choices??[]).map((label,index)=>{
    const top=y+index*rowHeight;
    if(index===(view.selectedIndex??0))cursor(context,x-8,top+1);
    text(context,label,x,top,{maxWidth:width,color:view.disabledChoices?.[index]?'#929292':'#fbfbfb'});
    return{index,x:x-8,y:top-1,width:width+8,height:rowHeight};
  });
}

/** @param {CanvasRenderingContext2D} context @param {View} view @returns {ChoiceBounds[]} */
export function fileMenu(context,view){
  const labels=view.choices??[],pink=view.gender==='female';
  if(!labels.length)return[];
  const width=Math.min(224,8*Math.ceil(Math.max(80,...labels.map(label=>textWidth(label)+8))/8));
  const height=8*Math.ceil(labels.length*12/8);
  panel(context,16,8,width+16,height+16,{pink});
  if(view.menuTitle==='Blue Rescue Team'&&!view.dialogue){
    /** @type {Record<string,string>} */const help={
      'New Game':'Begin the personality quiz and a new rescue.',
      'Continue':'Resume your saved rescue.',
      'Adventure Log':'Review your rescue progress.',
      'Delete Save Data':'Delete this opening adventure\'s save.',
    };
    const description=help[labels[view.selectedIndex??0]??''];
    if(description){panel(context,16,128,224,40,{pink});wrapText(description,200).slice(0,2).forEach((line,index)=>text(context,line,32,138+index*12));}
  }
  return rows(context,view,32,18,width-8);
}

/** @param {CanvasRenderingContext2D} context @param {View} view @returns {ChoiceBounds[]|null} */
export function dungeonMenu(context,view){
  const state=view.dungeon,labels=view.choices??[];
  if(!state||!labels.length||!view.menuTitle)return null;
  const pink=view.gender==='female';
  if(view.menuTitle==='Menu'){
    panel(context,16,32,64,72,{pink});
    panel(context,80,40,152,32,{pink});
    text(context,'Tiny Woods',156,50,{align:'center'});
    panel(context,16,112,224,64,{pink});
    [state.hero,state.partner].forEach((actor,index)=>{
      text(context,actor.name,28,120+index*12,{maxWidth:64,color:'#fbfb00'});
      text(context,`${actor.hp}/${actor.maxHp}`,128,120+index*12,{align:'right'});
    });
    text(context,`Belly: ${Math.floor(state.hero.belly)}/${state.hero.maxBelly}`,139,120,{maxWidth:93});
    text(context,`Money: ${state.money}`,139,132,{maxWidth:93});
    text(context,'Weather: Clear',139,144,{maxWidth:93});
    // Play time is not invented from turns or wall time. The save owner does
    // not yet expose the native elapsed-play timer to this presentation.
    return rows(context,view,32,42,40,11);
  }
  if(view.menuTitle==='Team'){
    // Tiny Woods has no Toolbox: the source chooses a normal window at(2,3),
    // 14 tiles wide, with first-entry y0. Two10-pixel entries round to3 tiles;
    // distributing that content height gives the original12-pixel row spacing.
    const members=[state.hero,state.partner],height=8*Math.ceil(members.length*10/8),rowHeight=height/members.length;
    panel(context,16,32,128,height+16,{pink});
    return members.map((member,index)=>{
      const y=40+Math.floor(index*rowHeight),quarter=Math.floor(member.maxHp/4);
      const tier=member.hp<=quarter?0:member.hp<=quarter*2?1:member.hp<=quarter*3?2:3;
      if(index===0)nativeMoveIcon(context,'star',33,y);
      text(context,member.name,41,y,{color:view.disabledChoices?.[index]?'#fb8259':'#fbfb00',maxWidth:72});
      // Both opening members have nonnegative recruited IDs. Red hearts are
      // reserved for newly recruited/guest sentinel IDs, not for the leader.
      nativeHeart(context,'yellow',tier,113,y);
      if(index===(view.selectedIndex??0))cursor(context,24,y+1);
      return{index,x:24,y:y-1,width:112,height:rowHeight};
    });
  }
  const actor=view.menuActorId&&view.menuTitle===`${state[view.menuActorId].name}'s Moves`?state[view.menuActorId]:[state.hero,state.partner].find(candidate=>view.menuTitle===`${candidate.name}'s Moves`);
  if(actor){
    const struggling=labels[0]==='Struggle',offset=struggling?1:0;
    const visibleCount=Math.max(4,actor.moves.length+offset),height=8*Math.ceil(visibleCount*12/8)+16;
    nativeMenuFrame(context,24,32,144,height,104,pink);
    text(context,view.menuTitle,34,32,{maxWidth:112});
    /** @type {ChoiceBounds[]} */const bounds=[];
    if(struggling){text(context,'Struggle',40,48);bounds.push({index:0,x:24,y:47,width:144,height:12});if((view.selectedIndex??0)===0)cursor(context,24,49);}
    actor.moves.forEach((move,index)=>{
      const choice=index+offset,y=48+choice*12;
      if(choice>0){context.fillStyle='#fbfbfb';context.fillRect(36,y-2,120,1);}
      if(actor===state.hero&&move.set)nativeMoveIcon(context,'set',32,y);
      if(actor!==state.hero&&move.enabled)nativeMoveIcon(context,'star',32,y);
      text(context,move.name,40,y,{maxWidth:90,color:move.pp===0?'#929292':'#fbfbfb'});
      text(context,`${move.pp}/${move.maxPp}`,130,y,{maxWidth:38});
      if(choice===(view.selectedIndex??0))cursor(context,24,y+1);
      bounds.push({index:choice,x:24,y:y-1,width:144,height:12});
    });
    panel(context,16,120,224,40,{pink});
    const hint=actor===state.hero?'Choose a move to use, set, or inspect.':'Choose a move to switch its use or inspect it.';
    wrapText(hint,208).slice(0,2).forEach((line,index)=>text(context,line,24,128+index*11));
    return bounds;
  }
  const width=Math.min(216,8*Math.ceil(Math.max(textWidth(view.menuTitle)+24,...labels.map(label=>textWidth(label)+16))/8));
  const available=view.dialogue?5:10,visible=Math.min(available,labels.length),scroll=Math.max(0,(view.selectedIndex??0)-visible+1),height=8*Math.ceil(visible*12/8)+16;
  const headerWidth=Math.min(width-16,8*Math.ceil((textWidth(view.menuTitle)+8)/8));
  nativeMenuFrame(context,24,32,width,height,headerWidth,pink);
  text(context,view.menuTitle,36,32,{maxWidth:headerWidth});
  /** @type {ChoiceBounds[]} */const bounds=[];
  for(let index=scroll;index<Math.min(labels.length,scroll+visible);index++){
    const label=labels[index]??'',y=48+(index-scroll)*12;
    if(index===(view.selectedIndex??0))cursor(context,24,y+1);
    text(context,label,32,y,{maxWidth:width-8,color:view.disabledChoices?.[index]?'#929292':'#fbfbfb'});
    bounds.push({index,x:24,y:y-1,width,height:12});
  }
  return bounds;
}
