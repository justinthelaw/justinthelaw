// Fixed per-identity authoring transform, never per-frame recentering or PNG resizing.
// Keeps exaggerated pose extrema inside the frozen transparent cell gutters.
export function boundedRig(a,scale=1){
 const point=p=>[p[0]*scale,8+(p[1]-8)*scale,p[2]*scale];
 const v={...a};
 v.ellipse=(p,r,c,g,o)=>a.ellipse(point(p),r.map(n=>n*scale),c,g,o);
 v.polygon=(p,c,g,o)=>a.polygon(p.map(point),c,g,o);
 v.line=(p,q,c,w,g,d)=>a.line(point(p),point(q),c,w===undefined?undefined:w*scale,g,d);
 v.limb=(p,q,r,c,g)=>a.limb(point(p),point(q),r*scale,c,g);
 v.face=o=>a.face({...o,y:8+(o.y-8)*scale,z:o.z*scale,width:o.width*scale,depth:o.depth*scale});
 v.eyePatches=o=>a.eyePatches({...o,y:8+(o.y-8)*scale,z:o.z*scale,width:o.width*scale,depth:o.depth*scale,rx:(o.rx??5)*scale,ry:(o.ry??6)*scale});
 v.feet=o=>a.feet({...o,x:(o.x??9)*scale,z:(o.z??2)*scale,radius:(o.radius??5)*scale});
 v.arms=o=>a.arms({...o,x:(o.x??13)*scale,y:8+((o.y??26)-8)*scale,z:(o.z??3)*scale,radius:(o.radius??3)*scale});
 return v;
}
