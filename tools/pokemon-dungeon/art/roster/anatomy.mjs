// Reusable drawing tools, not species templates: each record selects its own topology,
// proportions and appendages. Hand-authored special geometry lives in campaign.mjs.
import { palettes as P, ink } from '../production/painter.mjs';
export const colors={...P,white:P.skull,black:['#292d3b','#444a59','#737b8e'],navy:['#263d64','#45628a','#778bb1'],gold:P.yellow,silver:P.gray};
const C=c=>colors[c]??colors.gray;
export function drawAnatomy(a,d){
 const c=C(d.color),[w,h,z]=d.size, t=d.traits, has=n=>t.some(v=>v.split(':')[0]===n),value=n=>t.find(v=>v.split(':')[0]===n)?.split(':')[1];
 const kind=d.kind,quad=['quad','horse','elephant','turtle'].includes(kind), headY=quad?39:['bird','humanoid','biped','dragon'].includes(kind)?54:43,headZ=quad?16:4;
 const e=(p,r,k=c,g='body',o={})=>a.ellipse(p,r,typeof k==='string'?C(k):k,g,o);
 const poly=(p,k=c,g='body',o={})=>a.polygon(p,Array.isArray(k)?k[1]:C(k)[1],g,o);
 const face=(y=headY,z=headZ,width=w*.47,depth=11)=>{const angle=(a.viewDirection??0)*Math.PI/4;for(const side of[-1,1])if(Math.cos(angle)*.7-side*Math.sin(angle)*.65>.02){const ex=side*width,ez=z+depth*.7;if(has('closed')||a.pose.eye!=='open'){a.line([ex-2,y+1,ez],[ex+2,y,ez],ink,1.7,'head',22);}else{a.ellipse([ex,y+1,ez],[2,3,1.5],value('eyes')??'#312f3a','head',{depth:22,outline:false});a.ellipse([ex-.7,y+2,ez+1],[.65,.8,1],'#fff5db','head',{depth:23,outline:false});}}};
 const horn=(x,y,z,height,k=c)=>poly([[x-3,y,z],[x,height+y,z-2],[x+3,y,z]],k,'head');
 if(quad){a.feet({x:w*.68,z:z*.6,radius:has('hooves')?3.5:4,color:c,quadruped:true,claws:has('claws')});e([0,22,-5],[w,h,z]);e([0,headY,headZ],[w*.75,has('longneck')?20:13,12],c,'head');e([0,headY-7,headZ+9],[w*.55,6,10],c,'head');face();}
 else if(['biped','humanoid','dragon'].includes(kind)){a.feet({x:w*.65,radius:has('slender')?3:5,color:c,claws:has('claws')});e([0,28,0],[w,h,z]);a.arms({x:w,y:36,radius:has('slender')?2.5:4,color:c});e([0,headY,headZ],[has('smallhead')?w*.65:w*.9,13,12],c,'head');face();}
 else if(kind==='round'){a.feet({x:w*.56,color:c,radius:4});e([0,31,0],[w,h,z],c,'head');a.arms({x:w,y:32,radius:3,color:c});face(38,4,w*.46,z*.8);}
 else if(kind==='bird'){a.feet({x:7,color:P.yellow,radius:2.5});e([0,28,0],[w,h,z]);if(!has('heads')||value('heads')==='3')e([0,54,7],[w*.62,10,10],c,'head');for(const s of[-1,1])poly([[s*(w-2),42,0],[s*(w+12+a.pose.spread),32,-4],[s*(w+7),20,3],[s*(w-3),24,6]],c);if(!has('heads')||value('heads')==='3'){poly([[-3,52,15],[0,48,31],[3,52,15],[0,46,26]],P.yellow,'head');face(56,11,w*.37,9);}}
 else if(['fish','shark','whale'].includes(kind)){e([0,30,0],[w,h,z],c,'head');for(const s of[-1,1])poly([[s*w*.7,33,0],[s*(w+12),25,7],[s*w*.6,22,10]],c);poly([[-3,32,-z+3],[-13,44,-z-10],[0,35,-z-7],[13,44,-z-10],[3,24,-z+3]],c,'tail');if(kind==='shark')poly([[-2,40,0],[0,61,-8],[3,40,-12]],c);face(35,z*.55,w*.56,Math.max(5,z*.5));}
 else if(kind==='serpent'){for(let i=0;i<6;i++)e([Math.sin(i*.9)*w*.8,10+i*h*.32,-z+i*6],[w*(.48+i*.075),h*.3,w*(.48+i*.075)],c,'tail');e([0,55,12],[w,12,12],c,'head');face(57,16,w*.5,10);}
 else if(kind==='larva'){for(let i=0;i<4;i++){e([0,12+i*3,-z+i*z*.6],[w*(.6+i*.13),h*.6,w*.8]);for(const s of[-1,1])e([s*w*.65,5,-z+i*z*.6],[3,3,4],P.cream,'limb');}e([0,35,z*.7],[w,13,12],c,'head');face(37,z*.7+3,w*.5,10);}
 else if(kind==='pupa'){poly([[0,69,0],[-w,49,0],[-w*.7,16,0],[0,7,4],[w*.65,22,0],[w,52,0]],c,'head');for(const y of[23,34,45])a.line([-w*.65,y,4],[w*.65,y-3,4],c[0],2,'head',3);face(49,0,w*.5,4);}
 else if(['bug','spider','moth','bat'].includes(kind)){e([0,32,-5],[w,h,z]);e([0,49,8],[w*.85,12,10],c,'head');if(kind==='moth'||kind==='bat'){for(const s of[-1,1])poly([[s*5,46,-1],[s*25,70,-7],[s*37,58,-4],[s*35,29,3],[s*15,19,7],[s*5,33,2]],has('paleWings')?P.skull:c);}
 else for(const s of[-1,1])for(let i=0;i<(kind==='spider'?4:3);i++)a.limb([s*w*.7,26,-10+i*8],[s*(w+12),8,-16+i*11],2,c);face(50,11,w*.5,9);}
 else if(kind==='crab'){e([0,19,0],[w,h,z]);for(const s of[-1,1]){for(const k of[-1,0,1])a.limb([s*w*.7,16,k*7],[s*(w+9),5,k*11],2,c);a.limb([s*w*.8,24,5],[s*(w+8),38,14],3,c);e([s*(w+9),43,16],[8,10,6],c,'limb');a.line([s*(w+9),43,21],[s*(w+10),52,21],ink,2,'limb',4);e([s*w*.4,34,7],[3,7,3],c,'head');}face(36,7,w*.4,4);}
 else if(kind==='shell'){e([0,26,0],[w,h,z],c,'head');poly([[-w,27,7],[0,40,14],[w,27,7],[0,19,18]],C(value('inside')??'black'),'head');face(30,12,w*.35,4);}
 else if(kind==='star'){for(let i=0;i<(Number(value('points'))||5);i++){const t=i*Math.PI*2/(Number(value('points'))||5);poly([[Math.sin(t-.45)*9,39+Math.cos(t-.45)*9,0],[Math.sin(t)*w,39+Math.cos(t)*h,0],[Math.sin(t+.45)*9,39+Math.cos(t+.45)*9,0]],c,'head');}e([0,39,3],[9,9,3],P.yellow,'head');e([0,39,6],[5,5,2],P.red,'head');}
 else if(kind==='blob'||kind==='ghost'){e([0,25,0],[w,h,z],c,'head');for(const s of[-1,1])e([s*w*.7,10,6],[w*.45,6,z*.65]);if(kind==='blob')a.arms({x:w*.7,y:37,radius:4,color:c});else poly([[-w,17,0],[0,6,5],[w,17,0],[0,40,0]],c);face(35,4,w*.5,z*.7);}
 else if(kind==='orb'){e([0,35,0],[w,h,z],c,'head');face(39,3,w*.5,z*.8);}
 else if(['plant','flower','mushroom'].includes(kind)){a.feet({x:7,color:c,radius:4});e([0,24,0],[w,h,z]);e([0,44,3],[w*.8,11,10],c,'head');face(43,6,w*.5,8);for(const s of[-1,1])poly([[s*7,28,0],[s*25,42,-1],[s*24,23,3],[s*6,22,4]],P.leaf);}
 else if(kind==='tree'){a.feet({x:w*.6,color:c,radius:5});e([0,30,0],[w,h,z]);for(const s of[-1,1])a.limb([s*w*.6,43,0],[s*23,51,0],4,c);e([0,57,2],[w*.8,12,11],c,'head');face(56,5,w*.5,10);}
 else if(kind==='seal'){e([0,22,0],[w,h,z]);e([0,39,15],[w*.8,13,13],c,'head');for(const s of[-1,1])poly([[s*w*.7,22,5],[s*(w+11),8,14],[s*w*.6,10,17]],c,'limb');poly([[-4,15,-z],[-17,17,-z-10],[0,9,-z-5],[17,17,-z-10],[4,15,-z]],c,'tail');face(41,18,w*.5,11);}
 else if(kind==='rock'){e([0,35,0],[w,h,z],c,'head');a.arms({x:w,y:39,color:c,radius:6});if(!has('floating'))a.feet({x:w*.5,color:c,radius:6});face(41,3,w*.5,z*.85);}
 else if(kind==='egg'){e([0,29,0],[w,h,z],c,'head');a.feet({x:w*.6,color:c,radius:3});face(40,3,w*.47,z*.8);}
 else if(kind==='jelly'){e([0,49,0],[w,h,z],c,'head');for(let i=0;i<6;i++)a.limb([(i-2.5)*5,39,0],[(i-2.5)*7,8+(i%2)*8,4],2,C(value('tentacles')??d.color));face(49,3,w*.5,z*.8);}
 else if(kind==='octopus'){e([0,35,0],[w,h,z],c,'head');for(let i=0;i<8;i++){const theta=i*Math.PI/4;a.limb([Math.cos(theta)*6,20,Math.sin(theta)*6],[Math.cos(theta)*25,6,Math.sin(theta)*20],4,c);}face(41,4,w*.5,z*.8);}
 else if(kind==='seahorse'){e([0,26,0],[w,h,z]);e([0,49,5],[w+3,13,12],c,'head');e([0,43,20],[5,4,11],c,'head');a.limb([0,14,-4],[10,13,-14],3,c,'tail');a.limb([10,13,-14],[12,23,-13],3,c,'tail');face(52,8,w*.6,10);}
 else if(kind==='bell'){poly([[-w*.6,56,0],[-w,23,0],[w,23,0],[w*.6,56,0]],c,'head');e([0,56,0],[w*.6,8,z],c,'head');face(40,2,w*.5,z*.6);}
 else throw new Error(`No authored topology: ${d.dex} ${kind}`);
 // Features have explicit geometry and are composited in authoring space.
 for(const token of t){const [feature,arg]=token.split(':');const accent=C(arg??'cream');
  if(feature==='ears')for(const s of[-1,1]){const length=Number(arg)||15;poly([[s*w*.35,headY+8,headZ],[s*(w*.65+4),headY+length+10,headZ-4],[s*w*.85,headY+5,headZ+1]],c,'head');poly([[s*w*.49,headY+9,headZ+2],[s*(w*.65+3),headY+length+4,headZ-1],[s*w*.72,headY+7,headZ+3]],P.pink,'head');}
  if(feature==='roundears')for(const s of[-1,1])e([s*w*.8,headY+12,headZ],[6,7,5],c,'head');
  if(feature==='belly')e([0,kind==='round'?25:26,Math.max(z*.75,9)],[w*.67,h*.68,3],accent,'body',{outline:false});
  if(feature==='mask')for(const side of[-1,1])poly([[side*3,headY+7,headZ+12],[side*w*.8,headY+4,headZ+7],[side*w*.75,headY-3,headZ+10],[side*4,headY-1,headZ+15]],accent,'head',{depth:16,outline:false});
  if(feature==='muzzle')e([0,headY-6,headZ+11],[w*.6,7,11],accent,'head');
  if(feature==='tail') {const length=Number(arg)||23;a.limb([0,14,-z*.7],[9,12,-length],has('thicktail')?6:3,c,'tail');a.limb([9,12,-length],[14,24,-length-5],has('thicktail')?5:2,c,'tail');}
  if(feature==='bushtail'){e([7,25,-z-5],[11,12,14],accent,'tail');poly([[-3,28,-z-11],[7,40,-z-21],[17,26,-z-12]],accent,'tail');}
  if(feature==='tailfan')poly([[-4,16,-z],[-18,35,-z-13],[0,42,-z-17],[18,35,-z-13],[4,16,-z]],accent,'tail');
  if(feature==='tails')for(let i=0;i<(Number(arg)||3);i++){const offset=i-((Number(arg)||3)-1)/2;a.limb([offset*5,17,-z*.7],[offset*10,27,-z-10],3,c,'tail');}
  if(feature==='horn')horn(0,headY+10,headZ+4,Number(arg)||15,whiteColor());
  if(feature==='horns')for(const s of[-1,1])horn(s*w*.6,headY+10,headZ-2,Number(arg)||14,whiteColor());
  if(feature==='crest')poly([[-7,headY+9,headZ],[-5,headY+24,headZ-6],[0,headY+17,headZ-1],[7,headY+26,headZ-7],[8,headY+8,headZ]],accent,'head');
  if(feature==='fin')poly([[-2,headY+9,headZ+8],[0,headY+27,headZ-5],[3,headY+7,headZ-7]],accent,'head');
  if(feature==='spines')for(const y of[20,33,47])poly([[-5,y,-z*.75],[0,y+11,-z-9],[5,y,-z*.75]],accent);
  if(feature==='spiky'||feature==='spikes')for(let i=0;i<8;i++){const th=i*Math.PI/4;poly([[Math.sin(th)*(w-3),32+Math.cos(th)*(h-3),0],[Math.sin(th)*(w+8),32+Math.cos(th)*(h+8),0],[Math.sin(th+.3)*(w-3),32+Math.cos(th+.3)*(h-3),1]],accent);}
  if(feature==='ruff')for(let i=0;i<8;i++){const th=i*Math.PI/4;e([Math.sin(th)*w*.7,headY-12+Math.cos(th)*5,headZ+Math.cos(th)*7],[6,6,6],accent);}
  if(feature==='mane')for(const s of[-1,1])poly([[s*5,headY+12,headZ-3],[s*(w+8),headY+7,headZ],[s*(w+6),headY-10,headZ+4],[s*10,headY-19,headZ+5],[s*6,headY,headZ]],accent,'head');
  if(feature==='stripes')for(const s of[-1,1])for(const k of[-1,0,1])poly([[s*w*.7,26+k*6,-8],[s*(w+1),24+k*6,0],[s*w*.9,20+k*6,4]],accent,'body',{outline:false});
  if(feature==='spots')for(const s of[-1,1])for(const [y,zp]of[[21,-11],[30,-1],[22,10]])e([s*w*.85,y,zp],[3,3,4],accent,'body',{outline:false});
  if(feature==='cheeks')for(const s of[-1,1])e([s*w*.7,headY-5,headZ+11],[3,3,3],accent,'head',{outline:false});
  if(feature==='brow')for(const s of[-1,1])a.line([s*3,headY+7,headZ+13],[s*w*.7,headY+10,headZ+9],accent[1],3,'head',15);
  if(feature==='fangs')for(const s of[-1,1])poly([[s*5,headY-7,headZ+15],[s*6,headY-14,headZ+16],[s*9,headY-7,headZ+14]],P.skull,'head');
  if(feature==='whiskers')for(const s of[-1,1])for(const k of[-1,1])a.line([s*8,headY-7,headZ+14],[s*(w+14),headY-7+k*5,headZ+15],ink,1,'head',16);
  if(feature==='antennae')for(const s of[-1,1]){a.line([s*5,headY+8,headZ],[s*11,headY+24,headZ-2],accent[1],2,'head');e([s*11,headY+24,headZ-2],[2.5,2.5,2.5],accent,'head');}
  if(feature==='shell') {e([0,28,-9],[w+2,h+2,z],accent);for(const y of[18,28,38])a.line([-w*.7,y,-z-7],[w*.7,y,-z-7],accent[0],1);}
  if(feature==='cannon')for(const s of[-1,1]){a.line([s*12,37,-7],[s*17,52,4],P.gray[0],8);e([s*17,52,4],[5,3,5],ink,'body');}
  if(feature==='bulb')e([0,49,-11],[17,18,16],accent);
  if(feature==='leaves')for(let i=0;i<5;i++){const th=i*Math.PI*2/5;poly([[0,headY+9,headZ],[Math.sin(th)*22,headY+23,headZ+Math.cos(th)*19],[Math.sin(th+.4)*12,headY+14,headZ+Math.cos(th+.4)*11]],accent,'head');}
  if(feature==='flower')for(let i=0;i<5;i++){const th=i*Math.PI*2/5;e([Math.sin(th)*17,headY+15,headZ+Math.cos(th)*15],[12,5,10],accent,'head');}
  if(feature==='cap'){e([0,headY+11,headZ],[w+12,8,z+7],accent,'head');for(const s of[-1,1])e([s*10,headY+14,headZ+8],[4,2,3],P.skull,'head',{outline:false});}
  if(feature==='wings')for(const s of[-1,1])poly([[s*8,43,-5],[s*22,67,-9],[s*37,54,-8],[s*27,29,0],[s*13,34,1]],accent);
  if(feature==='smallwings')for(const s of[-1,1])poly([[s*w*.7,37,-4],[s*(w+12),47,-7],[s*(w+9),30,0]],accent);
  if(feature==='wingdots')for(const s of[-1,1])e([s*27,49,0],[7,9,2],accent,'body',{depth:3});
  if(feature==='tongue'){a.line([0,headY-7,headZ+12],[0,headY-17,headZ+28],P.pink[1],6,'head',20);}
  if(feature==='trunk'){a.limb([0,headY-2,headZ+12],[0,headY-20,headZ+21],4,c,'head');}
  if(feature==='tusks')for(const s of[-1,1])a.limb([s*8,headY-6,headZ+12],[s*14,headY-15,headZ+22],2,P.skull,'head');
  if(feature==='belt'){e([0,21,0],[w+1,4,z+1],accent);e([0,21,z+3],[4,4,2],P.yellow);}
  if(feature==='fourarms')a.arms({x:w+5,y:49,radius:5,color:c});
  if(feature==='spoons')for(const s of[-1,1]){a.line([s*(w+5),25,10],[s*(w+5),40,10],P.gray[1],2,'limb');e([s*(w+5),44,10],[4,5,2],P.gray,'limb');}
  if(feature==='claws')for(const s of[-1,1])for(const x of[-3,1,4])poly([[s*(w+3)+x,26,8],[s*(w+3)+x,23,17],[s*(w+3)+x+2,27,8]],P.skull,'limb');
  if(feature==='scythes')for(const s of[-1,1])poly([[s*(w+1),39,7],[s*(w+20),28,12],[s*(w+18),14,20],[s*(w+12),26,14]],P.skull,'limb');
  if(feature==='drills')for(const s of[-1,1])poly([[s*(w+1),40,8],[s*(w+12),14,18],[s*(w-4),30,9]],P.skull,'limb');
  if(feature==='gem')e([0,headY+7,headZ+12],[4,5,2],accent,'head',{depth:14});
  if(feature==='spiral'){const points=[];for(let i=0;i<30;i++){const th=i*.45,r=i*.32;points.push([Math.cos(th)*r,27+Math.sin(th)*r,z+3]);}for(let i=1;i<points.length;i++)a.line(points[i-1],points[i],ink,1,'body',8);}
  if(feature==='eggspots')for(const[x,y]of[[-8,26],[5,17],[10,37]])poly([[x-3,y-3,z],[x,y+4,z+1],[x+4,y-2,z]],x<0?P.red:P.blue);
  if(feature==='smoke')for(const[x,y,zp]of[[-9,57,-9],[3,68,-12],[14,73,-14]])e([x,y,zp],[9,8,8],accent);
  if(feature==='flames')for(const s of[-1,0,1]){poly([[s*7-5,headY+4,headZ-5],[s*10-7,headY+16,headZ-8],[s*10,headY+28,headZ-10],[s*10+5,headY+13,headZ-7],[s*7+5,headY+3,headZ-4]],P.red,'head');}
  if(feature==='ring') {e([0,31,z+2],[11,11,2],accent,'body',{outline:false});e([0,31,z+3],[7,7,1],c,'body',{outline:false});}
  if(feature==='nose')e([0,headY-4,headZ+13],[Number(arg)||7,6,8],arg==='red'?P.red:c,'head');
  if(feature==='mustache')for(const s of[-1,1])poly([[s*3,headY-5,headZ+14],[s*(w+10),headY-3,headZ+15],[s*(w+4),headY-12,headZ+17]],P.skull,'head');
  if(feature==='antennaorb'){a.line([0,headY+9,0],[0,headY+26,10],c[1],2,'head');e([0,headY+28,10],[5,5,5],accent,'head');}
  if(feature==='pouch'){e([0,21,z+2],[9,9,3],P.cream);e([0,24,z+5],[5,5,3],c);}
  if(feature==='sack')e([0,25,-z-6],[w,h,z],P.skull,'tail');
  if(feature==='gloves'||feature==='hands')for(const side of[-1,1])e([side*(w+3),28+a.pose.spread,5+a.pose.reach],[feature==='hands'?7:6,7,6],accent,'limb');
  if(feature==='heads')for(const side of[-1,1]){a.limb([side*7,39,-1],[side*15,57,3],3,c,'head');e([side*15,61,4],[9,10,9],c,'head');for(const offset of[-1,1])e([side*15+offset*4,63,12],[1.5,2.5,1],ink,'head',{depth:20});}
  if(feature==='half')e([0,25,0],[w*.96,h*.55,z*.96],accent,'head',{outline:false});
  if(feature==='satellites')for(const side of(d.dex===110?[1]:[-1,1])){e([side*19,22,0],[12,12,11],accent);e([side*19,24,10],[4,4,2],P.skull,'head');}
  if(feature==='cluster')for(let i=0;i<5;i++){const theta=i*Math.PI*2/5;e([Math.sin(theta)*20,15,Math.cos(theta)*16],[10,12,9],c,'head');}
  if(feature==='cracks'||feature==='scars')for(const side of[-1,1]){a.line([side*7,45,15],[side*13,34,17],accent[1],2,'head',16);a.line([side*13,34,17],[side*8,31,18],accent[1],2,'head',16);}
  if(feature==='face'){e([0,headY,headZ+4],[w*.75,11,9],accent,'head');face(headY,headZ+8,w*.4,7);}
  if(feature==='helmet')e([0,headY+6,headZ],[w*.92,11,13],accent,'head');
  if(feature==='bone'){a.line([w+4,19,10],[w+10,43,10],P.skull[1],5,'limb');for(const yy of[19,43])e([w+7,yy,10],[5,3,3],P.skull,'limb');}
  if(feature==='springlegs')for(const side of[-1,1]){a.limb([side*8,23,0],[side*13,5,8],3,accent);for(const y of[8,12,16,20])a.line([side*13-3,y,5],[side*13+3,y,5],accent[0],1,'limb',4);}
  if(feature==='skirt')poly([[-w*.65,32,0],[-w-5,9,4],[w+5,9,4],[w*.65,32,0]],accent);
  if(feature==='lips'||feature==='mouth')e([0,headY-7,headZ+14],[7,4,3],accent,'head',{depth:16});
  if(feature==='vines')for(let i=0;i<16;i++){const theta=i*Math.PI/8;a.line([Math.sin(theta)*w*.8,38+Math.cos(theta)*h*.7,4],[Math.sin(theta+.7)*w,15+Math.cos(theta)*8,8],accent[1],4,'body',4);}
  if(feature==='shoes')for(const side of[-1,1])e([side*10,5,5],[6,4,8],accent,'limb');
  if(feature==='angular')poly([[-w,32,0],[0,50,-z],[w,32,0],[0,16,z]],accent);
  if(feature==='segments')for(let i=0;i<6;i++){const xp=Math.sin(i*.9)*w*.8,yp=10+i*h*.32,zp=-z+i*6;a.line([xp-w*.7,yp,zp+5],[xp+w*.7,yp,zp+5],c[0],2,'tail',3);}
  if(feature==='pendulum'){a.line([w+4,30,10],[w+4,13,10],P.gray[0],1,'limb');e([w+4,11,10],[4,4,2],P.gray,'limb');}
  if(feature==='skullmark'){e([0,28,z+2],[6,5,1],P.cream,'body',{outline:false});for(const side of[-1,1])a.line([side*6,18,z+3],[-side*6,22,z+3],P.cream[1],2,'body',4);}
  if(feature==='leek'){a.line([w+4,19,10],[w+8,51,10],P.cream[1],5,'limb');poly([[w+5,39,10],[w-1,57,9],[w+8,53,10],[w+16,59,8],[w+11,40,11]],P.leaf,'limb');}
  if(feature==='hat'||feature==='crown'){poly([[-w-4,headY+7,headZ],[-w*.6,headY+21,headZ-3],[0,headY+27,headZ-5],[w*.6,headY+21,headZ-3],[w+4,headY+7,headZ]],accent,'head');}
  if(feature==='gills')for(const side of[-1,1])for(const k of[-1,0,1])a.line([side*w*.75,headY-3,headZ+2],[side*(w+10),headY-3+k*7,headZ+4],accent[1],3,'head');
  if(feature==='tailhand'||feature==='tailhead')e([14,29,-33],[8,feature==='tailhand'?5:8,6],accent,'tail');
  if(feature==='necklace')for(let i=0;i<7;i++){const theta=i*Math.PI/6;e([Math.cos(theta)*w*.75,headY-12,headZ+Math.sin(theta)*10],[3,3,3],accent);}
  if(feature==='coral'||feature==='antlers')for(const side of[-1,1]){a.line([side*w*.5,headY,0],[side*(w+3),headY+23,-3],accent[1],4,'head');for(const k of[0,1])a.line([side*(w-2),headY+12+k*7,-2],[side*(w+12),headY+17+k*7,-4],accent[1],3,'head');}
  if(feature==='bands')for(const y of[18,28,38])a.line([-w*.8,y,z*.7],[w*.8,y,z*.7],accent[1],3,'body',3);
  if(feature==='largeclaw')e([-(w+7),45,15],[12,15,8],c,'limb');
  if(feature==='fins')for(const side of[-1,1])poly([[side*5,headY+8,0],[side*10,headY+25,-7],[side*13,headY+6,-7]],accent,'head');
  if(feature==='halo'){e([0,headY+26,0],[10,2,7],P.yellow,'head');e([0,headY+27,1],[6,1,4],P.brown,'head',{outline:false});}
  if(feature==='pipes')for(const xx of[-12,-4,4,12]){a.line([xx,headY+5,0],[xx,headY+23,-3],c[1],5,'head');e([xx,headY+24,-3],[3,2,3],accent,'head');}
  if(feature==='jaw') {a.limb([0,45,-7],[0,62,-20],4,c);poly([[-17,51,-16],[-20,74,-19],[0,67,-21],[20,74,-19],[17,51,-16],[0,46,-13]],accent);for(const side of[-1,1])for(const yy of[55,63,70])poly([[side*15,yy,-15],[side*8,yy-2,-13],[side*15,yy-4,-15]],P.skull);}
  if(feature==='thorns')for(const side of[-1,1])poly([[side*w,25,1],[side*(w+9),34,3],[side*w,32,0]],accent);
  if(feature==='diamond')for(const yy of[17,28,39])poly([[-4,yy,z+2],[0,yy+5,z+3],[4,yy,z+2],[0,yy-5,z+3]],accent);
  if(feature==='hump'||feature==='humps')for(const zz of(feature==='humps'?[-12,7]:[-5]))e([0,40,zz],[13,15,12],accent);
  if(feature==='headlarge')e([0,39,17],[24,19,21],accent,'head');
  if(feature==='crescent')poly([[-8,62,3],[-24,48,3],[-25,28,3],[-7,12,3],[20,17,3],[0,26,7],[-6,42,7],[8,62,3]],accent,'head');
  if(feature==='eyesrings')for(let i=0;i<6;i++){const th=i*Math.PI/3;e([Math.sin(th)*22,43,Math.cos(th)*18],[5,5,3],accent,'head');}
  if(feature==='tentacles'&&kind!=='jelly')for(let i=0;i<8;i++){const th=i*Math.PI/4;a.limb([Math.sin(th)*9,headY+4,Math.cos(th)*8],[Math.sin(th)*25,headY+12,Math.cos(th)*20],3,accent,'head');}
  if(feature==='stalk')a.limb([0,13,0],[0,38,0],6,accent);
  if(feature==='zipper'){a.line([-10,headY-7,16],[10,headY-7,16],P.yellow[1],2,'head',20);for(const xx of[-7,-2,3,8])a.line([xx,headY-9,17],[xx,headY-5,17],ink,1,'head',22);}
  if(feature==='bones')for(const side of[-1,1])a.line([side*10,23,13],[-side*10,18,13],P.skull[1],3,'body',5);
  if(feature==='bananas')for(const side of[-1,0,1])a.limb([side*4,headY-10,18],[side*7,headY-21,22],3,P.yellow,'head');
  if(feature==='pearl')e([0,30,13],[9,9,8],accent,'head');
  if(feature==='heart')for(const side of[-1,1])e([side*8,43,0],[11,12,8],accent,'head');
  if(feature==='feet')a.feet({x:w*.6,color:accent,radius:5});
  if(feature==='cross'){a.line([-13,46,17],[13,25,20],P.gray[1],5,'head',20);a.line([13,46,17],[-13,25,20],P.gray[1],5,'head',20);}
  if(feature==='hooves')for(const s of[-1,1])for(const zpos of[-z*.6,z*.6])e([s*w*.68,4,zpos],[3,3,4],P.gray,'limb');
 }
 // Put facial highlights back above surface masks and muzzle features.
 if(has('mask'))face();
 function whiteColor(){return P.skull;}
}
