// All applicable original form geometry, independent of modern variants.
import { palettes as P, ink } from '../production/painter.mjs';
import { deoxys } from './campaign.mjs';
// Unown appendage paths: coordinates are relative to the central eye, not font glyphs.
const paths={
 a:[[-15,-18,0,-35,15,-18],[-10,-21,-15,17],[10,-21,15,17]],
 b:[[0,-10,0,-30,12,-30,17,-20,10,-12],[0,10,0,28,13,28,18,18,10,11]],
 c:[[0,-12,9,-26,-8,-29,-20,-16,-20,15,-8,28,10,25,13,17]],
 d:[[0,-12,0,-30,14,-25,22,-10,22,10,14,25,0,30,0,12]],
 e:[[0,-12,0,-28,16,-28],[0,0,20,0],[0,12,0,28,16,28]],
 f:[[0,-12,0,-29,19,-29],[0,0,18,0],[0,12,0,29]],
 g:[[0,-12,12,-26,-7,-29,-21,-16,-21,14,-8,27,13,22,15,10,8,9]],
 h:[[-12,0,-19,0,-19,-28],[-19,0,-19,28],[12,0,19,0,19,-28],[19,0,19,28]],
 i:[[0,-12,0,-29,-10,-29],[0,-29,10,-29],[0,12,0,29,-10,29],[0,29,10,29]],
 j:[[0,-12,0,-29,13,-29],[0,12,0,26,-8,31,-18,24]],
 k:[[0,-12,0,-29],[0,12,0,29],[11,-6,23,-26],[11,6,23,26]],
 l:[[0,-12,0,-30],[0,12,0,28,21,28]],
 m:[[-10,0,-22,0,-22,-27,-12,-27,0,-15,12,-27,22,-27,22,24]],
 n:[[-10,0,-21,0,-21,-27,-11,-27,21,26,21,-27]],
 o:[[0,-12,-11,-27,-23,-12,-23,12,-11,27,11,27,23,12,23,-12,11,-27,0,-12]],
 p:[[0,12,0,31],[0,-12,0,-30,16,-30,23,-18,16,-8,11,-8]],
 q:[[0,-12,-13,-24,-24,-10,-24,12,-12,26,12,26,24,12,24,-10,12,-24,0,-12],[8,9,22,31]],
 r:[[0,-12,0,-30,16,-30,23,-18,15,-8,11,-8],[0,12,0,29],[9,8,22,28]],
 s:[[0,-12,11,-27,-9,-28,-20,-18,-11,-9],[0,12,-11,26,10,28,20,17,12,8]],
 t:[[0,-12,0,-29,-21,-29],[0,-29,21,-29],[0,12,0,29]],
 u:[[-12,0,-22,0,-22,-26],[-22,0,-22,19,-12,28,12,28,22,19,22,-26]],
 v:[[-11,0,-21,-28],[11,0,21,-28],[-8,9,0,29,8,9]],
 w:[[-10,0,-22,-27],[-11,9,-16,28,0,17,16,28,22,-27]],
 x:[[-8,-8,-21,-28],[8,-8,21,-28],[-8,8,-21,28],[8,8,21,28]],
 y:[[-8,-8,-21,-28],[8,-8,21,-28],[0,12,0,29]],
 z:[[-8,-8,-19,-25,21,-25,8,-8],[-8,8,-21,26,20,26]],
 exclamation:[[0,-12,0,-31],[0,12,0,19]],question:[[0,-12,0,-19,13,-29,13,-36,-2,-39,-15,-33],[0,12,0,18]],
};
export function formCharacter(profile){
 if(profile.speciesId==='pokemon-201')return{identity:{name:profile.formId,speciesId:profile.speciesId,formId:profile.formId,worldHeight:1.6,bodyPlan:'glyph-eye',features:['central cyclopean eye',`separately drawn ${profile.formId} glyph appendages`]},draw(a){const glyph=profile.formId.slice(6),lines=paths[glyph];if(!lines)throw Error(`Unown glyph missing ${glyph}`);for(const line of lines)for(let i=2;i<line.length;i+=2)a.line([line[i-2],42-line[i-1]*.65,0],[line[i],42-line[i+1]*.65,0],ink,5,'head');a.ellipse([0,42,0],[11,11,5],ink,'head');if(a.front){a.ellipse([0,42,5],[7,7,2],P.skull,'head',{depth:12});a.ellipse([0,42,7],[2.5,a.pose.eye==='open'?4:1,1],ink,'head',{depth:14});}if(glyph==='exclamation'||glyph==='question')a.ellipse([0,20,0],[4,4,4],ink,'head');}};
 if(profile.speciesId==='pokemon-386')return{identity:{name:profile.formId,speciesId:profile.speciesId,formId:profile.formId,worldHeight:2.55,bodyPlan:`dna-${profile.formId}`,features:['purple chest crystal',`${profile.formId} head torso and tentacle arrangement`]},draw:a=>deoxys(a,profile.formId.slice(7))};
 if(profile.speciesId==='pokemon-351')return{identity:{name:profile.formId,speciesId:profile.speciesId,formId:profile.formId,worldHeight:1.6,bodyPlan:`weather-${profile.formId}`,features:[`${profile.formId} silhouette and weather crown`]},draw(a){const kind=profile.formId.slice(9),c=kind==='sunny'?P.orange:kind==='rainy'?P.blue:kind==='snowy'?P.purple:P.gray;a.ellipse([0,20,0],[10,10,9],c);for(const s of[-1,1])a.ellipse([s*9,17,3],[7,7,7],P.skull);if(kind==='sunny'){for(let i=0;i<8;i++){const t=i*Math.PI/4;a.ellipse([Math.sin(t)*19,47+Math.cos(t)*19,0],[8,8,6],P.orange,'head');}a.ellipse([0,47,0],[16,16,13],P.yellow,'head');}else if(kind==='rainy'){a.polygon([[-17,43,0],[-10,56,0],[0,75,0],[10,56,0],[17,43,0],[10,31,4],[-10,31,4]],P.blue[1],'head');}else if(kind==='snowy'){a.ellipse([0,46,0],[18,21,15],P.skull,'head');a.polygon([[-19,44,4],[19,44,4],[23,32,5],[-23,32,5]],P.purple[1],'head');}else a.ellipse([0,43,0],[19,18,16],P.gray,'head');a.face({y:45,z:3,width:10,depth:13});}};
 throw new Error(`No applicable form geometry: ${profile.id}`);
}
