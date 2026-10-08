/** @typedef {{kind:string,x:number,y:number,z:number,yaw:number,scale:[number,number,number]}} Placement */
/** @param {string} kitId */
export function stage(kitId) {
  /** @type {Placement[]} */ const props=[];
  /** @param {string} kind @param {number} x @param {number} z @param {number} [yaw] @param {number} [size] @param {number} [y] */
  const put=(kind,x,z,yaw=0,size=1,y=0)=>props.push({kind,x,y,z,yaw,scale:[size,size,size]});
  /** @param {number} i */
  const v=(i)=>.9+(i*7%5)*.07;
  for(const side of [-1,1]) for(let i=0;i<5;i++) {
    const z=5-i*4.0+(side>0?.7:0),x=side*(6.7+(i%2)*.9),yaw=i*1.7;
    if(kitId==='forest') {put('broadleaf-tree',x,z,yaw,v(i)*1.25);put('fern-cluster',side*4.1,z+.8,yaw,1.2);}
    if(kitId==='cave') {put('boulder-cluster',x,z,yaw,2.5);put('stalagmite-cluster',side*4.7,z+1,yaw,v(i));}
    if(kitId==='volcano') {put('basalt-organ',side*7.9,z,yaw,1.9);put('obsidian-spire',side*6.2,z-1,yaw,v(i));}
    if(kitId==='snow') {put('snow-pine',x,z,yaw,v(i)*1.2);put('snow-drift',side*4.6,z+.5,yaw,1.25);}
    if(kitId==='sky') {put('carved-pillar',side*5.7,z,yaw,.9);put('cloud-bank',side*9.6,z-1,yaw,2.0,-2.2);}
    if(kitId==='coast') {put('boulder-cluster',side*6.2,z,yaw,1.35);put('coral-fan',side*4.8,z+.8,yaw,v(i));put('shell-cluster',side*3.7,z+1.2,yaw,.8);}
    if(kitId==='ruins') {put(i%2?'broken-pillar':'carved-pillar',side*5.8,z,yaw,1.2);put('fern-cluster',side*4.7,z+.6,yaw,1.2);}
    if(kitId==='crystal') {put('boulder-cluster',x,z,yaw,2.1);put('crystal-cluster',side*4.7,z+.6,yaw,1.4);}
    if(kitId==='town') {if(i<2)put('fence-section',side*5.0,z,Math.PI/2,1.5);if(i%2===0)put('broadleaf-tree',side*8,z,yaw,1.15);put('flower-patch',side*3.9,z+.8,yaw,1.3);}
    if(kitId==='dojo') {put('fence-section',side*5.6,z,Math.PI/2,1.8);put(i%2?'hanging-banner':'training-post',side*4.2,z+.5,yaw,1.1);}
    if(kitId==='desert') {put('sandstone-fin',x,z,yaw,1.8);put(i%2?'fossil-ribs':'cactus',side*4.6,z+.7,yaw,1.2);}
    if(kitId==='storm') {put('basalt-organ',x,z,yaw,1.8);put('crystal-cluster',side*4.5,z+.7,yaw,1.1);}
  }
  if(kitId==='forest'){put('root-arch',0,-7,0,1.5);put('fallen-log',-3.8,-2,.4,1.2);put('mushroom-ring',4,-4,1,1.2);for(let i=0;i<5;i++)put('broadleaf-tree',(i-2)*4,-15,i,1.4);}
  if(kitId==='cave'){put('stone-arch',0,-9,0,1.9);put('crystal-cluster',3.5,-5,0,1.4);}
  if(kitId==='volcano'){put('stone-arch',0,-9,0,1.8);put('lava-vent',-3.7,-5,0,1.6);put('lava-vent',4.2,-8,1,1.2);}
  if(kitId==='snow'){put('stone-arch',0,-10,0,1.8);put('ice-shard',-3.6,-4,0,1.4);put('ice-shard',3.9,-8,1,1.2);}
  if(kitId==='sky'){put('stone-arch',0,-9,0,1.6);put('floating-island',-10,-15,0,1.5,-1);put('floating-island',9,-18,1,2,-2);put('rune-plinth',3.9,-4,0,1.1);}
  if(kitId==='coast'){put('stone-arch',0,-10,0,1.7);put('waterfall-rock',-5.7,-8,0,2);put('broadleaf-tree',6.5,-9,1,1.2);}
  if(kitId==='ruins'){put('stone-arch',0,-8,0,1.7);put('root-arch',-4,-11,.5,1.1);put('rune-plinth',3.7,-4,0,1.2);}
  if(kitId==='crystal'){put('stone-arch',0,-10,0,1.7);put('crystal-cluster',-3.3,-5,0,2.1);put('rune-plinth',3.7,-7,0,1.2);}
  if(kitId==='town'){put('cottage',-5,-5,.1,1.3);put('cottage',5,-7,-.18,1.3);put('cottage',0,-14,0,1.4);put('notice-board',-2.8,-1,.15,1);put('pond-well',3.6,-2,0,1.25);put('timber-gate',0,-9,0,1.2);}
  if(kitId==='dojo'){put('timber-gate',0,-8,0,1.8);put('stone-arch',0,-13,0,1.5);put('training-post',-3.2,-4,0,1.3);put('hanging-banner',3.4,-5,0,1.3);}
  if(kitId==='desert'){put('stone-arch',0,-10,0,1.8);put('rune-plinth',-3.5,-4,0,1.1);}
  if(kitId==='storm'){put('conducting-coil',-3.6,-5,0,1.4);put('conducting-coil',3.6,-7,0,1.2);put('sandstone-fin',0,-12,0,3);}
  if(['cave','crystal','volcano','desert'].includes(kitId))for(let i=0;i<7;i++)put('boulder-cluster',(i-3)*4,-19-(i%2)*2,i*.6,3.2+(i%3)*.3);
  if(['forest','snow','town'].includes(kitId))for(let i=0;i<7;i++)put(kitId==='snow'?'snow-pine':'broadleaf-tree',(i-3)*5,-23-(i%2)*3,i*.9,1.8);
  put('stairway',0,-5.5,0,.75);
  return props;
}
