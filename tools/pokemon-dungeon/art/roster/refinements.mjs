// Species-specific silhouette corrections after controller inspection of contact revision 1.
import { palettes as P, ink } from '../production/painter.mjs';
const W=P.skull,D=['#262b3c','#41465b','#72758a'];
function eyes(a,{y,z,x=7,r=2.4,color='#392f3e',angry=false}){
 const t=(a.viewDirection??0)*Math.PI/4;
 for(const s of[-1,1])if(Math.cos(t)*.7-s*Math.sin(t)*.65>.02){
  const pos=[s*x,y,z];a.ellipse(pos,[r,3.2,2],color,'head',{depth:22,outline:false});
  if(a.pose.eye==='open'){a.ellipse([s*x-.4,y+1,z+1],[.9,1.8,1],ink,'head',{depth:24,outline:false});a.ellipse([s*x-1,y+1.7,z+1],[.7,.7,.7],'#fff6df','head',{depth:25,outline:false});}
  else a.line([s*x-r,y,z+1],[s*x+r,y-.5,z+1],ink,2,'head',25);
  if(angry)a.line([s*(x-r),y+3,z+1],[s*(x+r),y+4.5,z-1],D[0],2,'head',25);
 }
}
function birdFeet(a){for(const s of[-1,1]){a.limb([s*6,20,1],[s*7,7+Math.max(a.pose.gait*s,0)*3,vary(a,s)],2,P.orange);for(const off of[-1,0,1])a.line([s*7,7,vary(a,s)],[s*7+off*3,4,vary(a,s)+7],P.orange[1],2,'limb');}}
const vary=(a,s)=>a.pose.gait*s*4;
function featherWing(a,s,c,shape='rounded'){
 const spread=a.pose.spread*.45;
 a.polygon([[s*7,42,-1],[s*22,59+spread,-7],[s*40,65+spread,-10],[s*44,56+spread,-5],[s*30,42,0],[s*16,32,3]],c[1]);
 for(let i=0;i<5;i++){const x=18+i*5,y=43+i*3+spread;
 a.polygon([[s*x,y,-2],[s*(x+5),y+8,-5],[s*(x+8),y-9-(shape==='long'?4:0),2],[s*(x+3),y-4,3]],c[1]);
 a.line([s*(x+2),y+2,-2],[s*(x+6),y-7,2],c[0],1,'body',1);}
}
function avianCore(a,c){birdFeet(a);a.ellipse([0,32,-2],[10,18,15],c);a.limb([0,44,3],[0,57,9],5,c,'head');a.ellipse([0,62,11],[9,10,10],c,'head');eyes(a,{y:64,z:18,x:6,r:1.9,color:'#eee4dc',angry:true});}
function beak(a,color=P.orange,length=21,y=59,z=19){a.polygon([[-3.5,y+2,z],[0,y-2,z+length],[3.5,y+2,z],[0,y-6,z+length-2]],color[1],'head',{depth:7});a.line([0,y-2,z+length],[-2,y-1,z+2],color[0],1,'head',9);}
function bird(a,name){
 const ice=name==='articuno',fire=name==='moltres',steel=name==='skarmory',c=ice?P.blue:steel?P.gray:P.yellow;
 // Seat the steel spear one authoring unit deeper in the head. Its full length
 // remains intact when the head reaches the physical-attack extension.
 avianCore(a,c);beak(a,steel?P.gray:P.orange,steel?27:23,59,steel?18:19);
 if(name==='zapdos'){
  for(const s of[-1,1]){
   a.polygon([[s*6,43,-2],[s*15,64,-6],[s*21,50,-3],[s*35,69,-8],[s*31,49,-2],[s*44,55,-3],[s*35,38,2],[s*42,33,4],[s*22,30,5]],D[0]);
   a.polygon([[s*7,47,0],[s*15,61,-4],[s*20,46,-1],[s*32,64,-6],[s*29,45,0],[s*40,51,-1],[s*31,38,4],[s*37,35,5],[s*19,35,6]],P.yellow[1]);
  }
  a.polygon([[-7,67,10],[-13,76,5],[-4,72,8],[0,83,3],[6,73,7],[14,76,3],[8,64,11]],P.yellow[1],'head');
  a.polygon([[-5,22,-10],[-17,12,-29],[-7,18,-27],[0,9,-43],[6,18,-29],[17,12,-34],[7,26,-11]],D[0],'tail');
  a.polygon([[-3,23,-9],[-12,15,-28],[-4,20,-25],[0,13,-40],[4,21,-26],[12,16,-30],[4,26,-10]],P.yellow[1],'tail');
 }else if(fire){
  for(const s of[-1,1]){
   featherWing(a,s,P.yellow);
   a.polygon([[s*19,51,-4],[s*20,70,-9],[s*25,60,-6],[s*33,78,-11],[s*31,60,-7],[s*43,68,-10],[s*39,47,-1],[s*43,42,1],[s*33,37,3]],P.red[1]);
   a.polygon([[s*21,52,-3],[s*23,64,-6],[s*28,56,-4],[s*34,69,-8],[s*34,53,-4],[s*40,59,-6],[s*35,43,2]],P.orange[1]);
  }
  a.polygon([[-5,67,9],[-8,80,4],[-1,75,5],[3,86,0],[8,74,4],[6,66,10]],P.red[1],'head');
  a.polygon([[-6,24,-9],[-14,22,-24],[-7,26,-21],[-5,36,-37],[1,24,-31],[8,33,-43],[12,19,-25],[7,15,-14]],P.red[1],'tail');
  a.polygon([[-3,23,-10],[-7,24,-22],[0,29,-31],[4,20,-25],[8,25,-35],[6,17,-15]],P.orange[1],'tail');
 }else if(ice){
  for(const s of[-1,1])featherWing(a,s,P.blue,'long');
  for(const s of[-1,1])a.polygon([[s*4,45,7],[s*12,42,9],[s*8,28,14],[s*3,34,15],[0,28,15]],W[1]);
  for(const x of[-6,0,6])a.polygon([[x-3,69,11],[x,82+(x===0?2:0),3],[x+4,71,11]],P.blue[0],'head');
  for(const s of[-1,1]){a.line([s*3,23,-10],[s*11,10,-27],P.blue[0],5,'tail');a.line([s*11,10,-27],[s*18,18,-38],P.blue[1],4,'tail');a.line([s*18,18,-38],[s*11,30,-40],P.blue[1],3,'tail');}
 }else{
  for(const s of[-1,1]){
   a.polygon([[s*7,45,-4],[s*29,64,-9],[s*39,56,-5],[s*17,31,6]],P.gray[0]);
   for(let i=0;i<5;i++){const x=15+i*5,y=47+i*2;a.polygon([[s*x,y,-2],[s*(x+6),y+7,-5],[s*(x+8),y-17,5],[s*(x+3),y-10,6]],P.gray[1]);a.polygon([[s*(x+2),y-1,-.5],[s*(x+5),y+2,-2],[s*(x+6),y-12,5]],P.red[0]);}
  }
  a.polygon([[-5,67,7],[0,82,-8],[5,69,5]],P.gray[1],'head');
  a.polygon([[-4,23,-12],[0,28,-43],[5,20,-17]],P.gray[1],'tail');
  for(const y of[28,35,42])a.line([-7,y,11],[7,y,11],P.gray[0],2);
 }
}
function shiftry(a){
 for(const s of[-1,1]){a.limb([s*9,24,0],[s*14,10,5],4,P.brown);a.polygon([[s*8,10,-1],[s*20,10,0],[s*21,5,13],[s*7,5,13]],P.brown[1],'limb');a.line([s*10,6,2],[s*18,6,2],P.brown[0],2,'limb',3);}
 a.ellipse([0,34,0],[15,17,11],P.brown);a.ellipse([0,59,-1],[18,13,14],W,'head');
 for(const s of[-1,1]){
  a.polygon([[s*7,68,-3],[s*24,59,-8],[s*26,45,-9],[s*19,49,-7],[s*25,23,-8],[s*18,29,-5],[s*17,12,-4],[s*9,21,-2],[s*8,53,0]],W[1],'head');
  a.limb([s*12,41,0],[s*24,36+a.pose.spread,7+a.pose.reach],3,P.brown);
  const x=s*25,y=36+a.pose.spread,z=8+a.pose.reach;
  for(const k of[-1,0,1])a.polygon([[x,y,z],[x+s*(13-Math.abs(k)*3),y+k*13,z],[x+s*(15-Math.abs(k)*3),y+k*13+7,z-2],[x+s*5,y+4,z+1]],P.leaf[1],'limb');
 }
 for(const side of[-1,1]){a.ellipse([side*16,49,5],[9,17,8],W,'head');a.polygon([[side*13,53,9],[side*24,40,7],[side*19,35,10],[side*22,22,7],[side*10,30,11]],W[1],'head');}
 a.ellipse([0,56,11],[13,10,8],P.brown,'head');a.polygon([[-4,56,16],[-3,55,37],[0,53,43],[3,55,37],[4,56,16]],P.brown[1],'head');eyes(a,{y:60,z:17,x:8,color:'#d66d5e',angry:true});
 a.line([-8,49,18],[8,49,18],ink,1,'head',18);
}
function absol(a){
 a.feet({x:10,z:12,radius:3,color:D,quadruped:true});a.ellipse([0,24,-4],[13,14,22],W);
 a.ellipse([0,40,16],[13,13,12],D,'head');a.ellipse([0,33,27],[7,5,9],D,'head');
 a.polygon([[-12,45,12],[-9,58,6],[0,64,2],[13,56,3],[18,48,6],[7,54,8],[-1,47,17],[5,42,22],[-7,44,23]],W[1],'head');
 a.polygon([[8,51,9],[19,53,4],[27,65,-2],[24,79,-8],[17,72,-4],[18,62,-1],[12,56,6]],D[1],'head');
 a.polygon([[-2,22,-21],[-9,38,-30],[-21,43,-35],[-14,32,-30],[-9,20,-24]],D[1],'tail');
 for(const s of[-1,1])a.polygon([[s*6,30,13],[s*15,36,10],[s*18,27,13],[s*11,17,16],[s*5,24,19]],W[1]);
 eyes(a,{y:43,z:25,x:7,color:'#c1485d'});a.ellipse([0,35,35],[2,1.5,1],ink,'head',{depth:15});
}
function ninetales(a){
 // Nine separate tapering curves spread radially behind the fox's shoulders.
 for(let i=0;i<9;i++){
  const angle=(i-4)*.24,x=Math.sin(angle)*35,top=43+Math.cos(angle)*19,z=-26-Math.cos(angle)*8;
  a.limb([0,20,-16],[x*.75,31,z],5,P.cream,'tail');a.limb([x*.75,31,z],[x,top,z-3],4,P.cream,'tail');a.limb([x,top,z-3],[x*.75,top+9,z-4],2.5,P.cream,'tail');
 }
 a.feet({x:9,z:13,radius:2.6,color:P.cream,quadruped:true});a.ellipse([0,25,-5],[12,13,23],P.cream);a.limb([0,33,12],[0,49,16],6,P.cream,'head');a.ellipse([0,51,20],[11,11,10],P.cream,'head');
 for(const s of[-1,1]){a.polygon([[s*5,58,18],[s*10,74,13],[s*14,57,16]],P.cream[1],'head');a.polygon([[s*8,59,20],[s*10,68,16],[s*12,58,18]],P.orange[0],'head');}
 a.polygon([[-7,46,24],[-3,42,36],[0,43,40],[3,42,36],[7,46,24]],P.cream[1],'head');a.ellipse([0,44,38],[2,1.5,1],ink,'head',{depth:15});
 a.polygon([[-5,60,18],[0,70,8],[12,64,-1],[6,57,13]],P.cream[1],'head');eyes(a,{y:53,z:28,x:6,color:'#b14452'});
}
function tyranitar(a){
 a.feet({x:17,radius:6,color:P.lime,claws:true});for(const s of[-1,1])a.ellipse([s*13,20,0],[11,15,13],P.lime);
 a.polygon([[-17,17,1],[-22,37,0],[-15,54,0],[0,61,4],[15,54,0],[22,37,0],[17,17,1],[0,10,10]],P.lime[1]);
 a.polygon([[-10,36,14],[0,44,18],[10,36,14],[7,19,16],[0,14,17],[-7,19,16]],D[1]);
 // Counter the shared collapse on this thick, grounded tail shaft. Otherwise
 // its circular stroke sinks through the foot plane before the tail tip does.
 // Divide by the fixed rig scale because the authored lift is scaled before
 // the painter applies its tail collapse. Neutral geometry stays unchanged.
 const tailLift=a.pose.collapse*.4/.92;
 a.limb([0,16+tailLift,-13],[0,12+tailLift,-35],9,P.lime,'tail');a.polygon([[-8,14,-26],[0,19,-43],[8,14,-26]],P.lime[1],'tail');
 a.polygon([[-13,48,5],[-15,65,3],[-8,74,1],[8,74,1],[15,65,3],[13,48,5],[0,44,20]],P.lime[1],'head');
 a.polygon([[-10,55,14],[-8,49,28],[0,47,32],[8,49,28],[10,55,14]],P.lime[1],'head');
 for(const s of[-1,1]){
  a.limb([s*17,43,1],[s*23,31,11+a.pose.reach],5,P.lime);a.polygon([[s*8,67,0],[s*13,82,-5],[s*17,62,-2]],P.lime[1],'head');
  for(const[y,z]of[[49,-8],[35,-14],[21,-20]])a.polygon([[s*14,y,z],[s*27,y+7,z-7],[s*18,y-7,z]],P.lime[1]);
  a.polygon([[s*15,45,11],[s*19,39,13],[s*12,37,15]],D[0]);
 }
 eyes(a,{y:62,z:15,x:8,color:'#ba4553',angry:true});a.line([-7,51,26],[7,51,26],ink,1,'head',18);
}
function groudon(a){
 a.feet({x:18,radius:7,color:P.red,claws:true});for(const s of[-1,1])a.ellipse([s*15,19,-1],[12,15,14],P.red);
 a.polygon([[-22,22,-1],[-24,42,0],[-14,58,-1],[14,58,-1],[24,42,0],[22,22,-1],[0,11,14]],P.red[1]);
 a.polygon([[-12,44,13],[-16,29,15],[-11,14,15],[0,10,17],[11,14,15],[16,29,15],[12,44,13]],P.gray[1]);
 for(const y of[19,27,35,43])a.line([-12,y,17],[12,y,17],ink,2);
 a.polygon([[-14,52,7],[-17,66,1],[-10,76,-2],[10,76,-2],[17,66,1],[14,52,7]],P.red[1],'head');
 a.polygon([[-14,60,13],[-16,51,28],[-8,46,37],[8,46,37],[16,51,28],[14,60,13]],P.red[1],'head');
 a.polygon([[-13,49,25],[-9,43,33],[9,43,33],[13,49,25]],P.gray[1],'head');
 for(const s of[-1,1]){
  a.limb([s*21,42,0],[s*29,30,13+a.pose.reach],6,P.red);a.ellipse([s*28,27,15+a.pose.reach],[9,8,8],P.red,'limb');
  for(const k of[-1,0,1])a.polygon([[s*28+k*4,28,20+a.pose.reach],[s*28+k*4,22,33+a.pose.reach],[s*28+k*4+2,29,20+a.pose.reach]],W[1],'limb');
  for(const[y,z]of[[55,-3],[41,-7],[28,-12]])a.polygon([[s*19,y,z],[s*30,y+2,z-6],[s*21,y-7,z]],W[1]);
  a.line([s*9,68,9],[s*14,61,16],ink,2,'head',5);
 }
 a.polygon([[-12,18,-12],[-15,15,-26],[-7,12,-37],[0,15,-44],[7,12,-37],[15,15,-26],[12,18,-12]],P.red[1],'tail');
 for(const z of[-22,-30,-36])a.line([-8,15,z],[8,15,z],ink,2,'tail',2);
 eyes(a,{y:62,z:19,x:10,color:'#f2cf64',angry:true});a.line([-10,50,31],[10,50,31],ink,2,'head',18);
}
function gardevoir(a){
 // Curved gown panels built independently around a slim body, with a front opening.
 for(const s of[-1,1])a.polygon([[s*4,44,0],[s*9,33,-1],[s*13,22,0],[s*25,7,4],[s*17,6,10],[s*6,11,15],[s*2,23,9]],W[1]);
 a.limb([-3,23,0],[-4,6,7],2,P.green);a.limb([3,23,0],[4,6,7],2,P.green);
 a.ellipse([0,45,0],[6,13,7],P.green);
 for(const s of[-1,1]){a.limb([s*5,49,0],[s*11,39,4],2,P.green);a.limb([s*11,39,4],[s*(18+a.pose.spread*.7),29+a.pose.spread,8+a.pose.reach],1.8,P.green);}
 a.ellipse([0,63,2],[12,14,11],P.green,'head');a.ellipse([0,59,11],[8,10,5],W,'head');
 a.polygon([[-12,66,6],[-7,76,0],[3,77,-2],[13,66,3],[11,50,11],[3,54,15],[4,64,15],[-4,64,16],[-8,54,12]],P.green[1],'head');
 a.polygon([[-2,46,7],[0,54,18],[2,45,10],[0,37,17]],P.red[1]);
 eyes(a,{y:60,z:15,x:5,color:'#c34e69'});
}
export function refineCampaign(campaign){for(const c of campaign){const name=c.identity.name;if(['zapdos','moltres','articuno','skarmory'].includes(name))c.draw=a=>bird(a,name);else if({shiftry,absol,ninetales,tyranitar,groudon,gardevoir}[name])c.draw={shiftry,absol,ninetales,tyranitar,groudon,gardevoir}[name];}return campaign;}
