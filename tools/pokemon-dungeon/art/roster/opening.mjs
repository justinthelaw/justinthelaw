// Original editable opening refinements; official Sunkern artwork is appearance
// reference only, never a raster input. All surfaces are drawn from local shapes.
import { palettes as P, ink } from '../production/painter.mjs';
const dark = ['#373337', '#514a43', '#71685b'];
function sunkern(a) {
  // One limbless seed: the face, shell and sprout move together, with no separate
  // head, feet, arms or lateral body leaves.
  a.ellipse([0,31,0],[16,24,13],P.yellow,'head');
  for (const longitude of [-.68,.68,2.05,Math.PI,4.23]) {
    const points=[];
    for (const side of [-1,1]) for (const y of (side<0?[9,15,25,37,46]:[46,37,25,15,9])) {
      const radius=Math.sqrt(Math.max(0,1-((y-31)/24)**2));
      const angle=longitude+side*.32;
      points.push([Math.sin(angle)*16.25*radius,y,Math.cos(angle)*13.25*radius]);
    }
    a.polygon(points,dark[1],'head',{outline:false});
  }
  // Jagged yellow seed rim, separate from the green two-leaf top sprout.
  for (let i=0;i<7;i++) {
    const t=i*Math.PI*2/7,x=Math.sin(t)*11,z=Math.cos(t)*9;
    a.polygon([[x-4,49,z],[x,59+(i%2)*3,z-1],[x+4,49,z]],P.yellow[1],'head');
  }
  a.line([0,54,0],[0,68,-1],P.leaf[0],2.5,'head');
  for (const side of [-1,1]) {
    a.polygon([[0,67,-1],[side*12,77,-3],[side*25,76,-2],[side*29,72,0],[side*18,66,2],[side*7,65,1]],P.leaf[1],'head');
    a.line([0,67,0],[side*23,73,0],P.leaf[0],1,'head',1);
  }
  a.face({y:35,z:7,width:8,depth:7,eyes:'#29292b'});
}
function exeggcute(a) {
  // Six independent shells, each with its own face. Unequal heights and a wide
  // staggered cluster keep rear shells legible without adding limbs or stacking.
  const eggs=[[-25,16,5,9,13],[0,16,17,10,13],[25,15,4,9,12],[-15,23,-17,10,20],[14,21,-20,9,18],[0,24,-3,11,21]];
  for (const [x,y,z,rx,ry] of eggs) {
    a.ellipse([x,y,z],[rx,ry,9],P.pink,'head');
    const t=(a.viewDirection??0)*Math.PI/4;
    for (const side of [-1,1]) if (Math.cos(t)*.75-side*Math.sin(t)*.65>.02) {
      const ex=x+side*rx*.42,ez=z+7;
      if(a.pose.eye==='open') a.ellipse([ex,y+3,ez],[1.8,2.3,1],ink,'head',{depth:3,outline:false});
      else a.line([ex-1.7,y+3,ez],[ex+1.7,y+2,ez],ink,1.5,'head',3);
      a.line([ex-side*2,y+6,ez],[ex+side*2,y+5,ez],ink,1,'head',3);
    }
    // Small shell fissures remain on the actual front shell surface.
    if(a.front){a.line([x+rx*.65,y+ry*.62,z+6],[x+rx*.3,y+ry*.36,z+9],P.brown[0],1,'head',3);a.line([x+rx*.3,y+ry*.36,z+9],[x+rx*.58,y+ry*.17,z+9],P.brown[0],1,'head',3);}
  }
}
export const openingRefinements = [
  {identity:{name:'sunkern',speciesId:'pokemon-191',formId:'default',worldHeight:1.3,bodyPlan:'individually-authored',features:['single limbless yellow seed','black vertical shell stripes','jagged yellow seed rim','thin top stem with two green leaves','no separate head or body appendages']},draw:sunkern},
  {identity:{name:'exeggcute',speciesId:'pokemon-102',formId:'default',worldHeight:1.6,bodyPlan:'individually-authored',features:['six independent pink eggs','unequal shell heights','wide staggered cluster','six faces and shell fissures','no limbs']},draw:exeggcute},
];
