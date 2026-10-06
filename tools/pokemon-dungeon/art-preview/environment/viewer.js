import * as THREE from 'three';
import { stage } from './staging.js';
/** @typedef {[number,number,number]} V3 */
/** @typedef {{shape:'box'|'cylinder'|'cone'|'sphere',size:V3,position:V3,rotation:V3,materialId:string,segments?:number}} Part */
/** @typedef {{id:string,color:string,texturePath?:string,roughness:number,emissive?:string,emissiveIntensity?:number}} MaterialSpec */
/** @typedef {{id:string,name:string,materials:MaterialSpec[],props:{id:string,parts:Part[]}[],terrain:{floor:string,wall:string,water:string,lava:string},lighting:{background:string,fog:{color:string,near:number,far:number},ambient:{sky:string,ground:string,intensity:number},key:{color:string,intensity:number,position:V3}}}} Kit */
/** @typedef {{id:string,kitId:string,label:string,propIds:string[],floorTint:string,wallTint:string,staging:string,artBrief:string}} Variant */
/** @typedef {{kits:Kit[],variants:Variant[],textures:{path:string,width:number,height:number}[]}} Manifest */
/** @param {string} id */
function el(id){const value=document.getElementById(id);if(!value)throw new Error(`Missing ${id}`);return value;}
/** @param {string} id */
function select(id){const value=el(id);if(!(value instanceof HTMLSelectElement))throw new Error(`Missing select ${id}`);return value;}
const canvas=el('preview');if(!(canvas instanceof HTMLCanvasElement))throw new Error('Canvas missing');
const characterToggle=el('characters');if(!(characterToggle instanceof HTMLInputElement))throw new Error('Character toggle missing');
const kitSelect=select('kit'),variantSelect=select('variant'),status=el('status'),stats=el('stats');
const params=new URLSearchParams(location.search),assetBase=new URL('../../../../games/pokemon-dungeon-reimagined/assets/environment/production/',import.meta.url);
const renderer=new THREE.WebGLRenderer({canvas,antialias:false});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(51,1,.1,120);
/** @type {Manifest|undefined} */let manifest;
/** @type {THREE.Group|undefined} */let world;
/** @type {Map<string,THREE.MeshStandardMaterial>} */const materials=new Map();
/** @type {THREE.Texture[]} */let worldTextures=[];
/** @type {Set<THREE.BufferGeometry>} */let geometries=new Set();
/** @type {{mesh:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>,texture:THREE.Texture}[]} */const characters=[];
const characterRoot=new THREE.Group();scene.add(characterRoot);
/** @type {Set<THREE.InstancedMesh>} */const liveInstanceMeshes=new Set();
let createdInstanceMeshes=0,disposedInstanceMeshes=0;
function instanceStats(){document.body.dataset.instanceMeshesCreated=String(createdInstanceMeshes);document.body.dataset.instanceMeshesDisposed=String(disposedInstanceMeshes);document.body.dataset.instanceMeshesLive=String(liveInstanceMeshes.size);}
/** @param {THREE.InstancedMesh} mesh */
function trackInstanceMesh(mesh){liveInstanceMeshes.add(mesh);createdInstanceMeshes++;mesh.addEventListener('dispose',()=>{if(!liveInstanceMeshes.delete(mesh))throw new Error('Duplicate instance disposal');disposedInstanceMeshes++;instanceStats();});instanceStats();}
let yaw=Number(params.get('angle')??0)*Math.PI/4,disposed=false,animation=0,loading=false,pending=false,revision=0,textureBytes=0,disposedTextures=0;
function cleanup(){if(world){scene.remove(world);world.traverse(node=>{if(node instanceof THREE.InstancedMesh)node.dispose();if(node instanceof THREE.DirectionalLight)node.shadow.dispose();});world.clear();world=undefined;}for(const g of geometries)g.dispose();geometries=new Set();for(const m of materials.values())m.dispose();materials.clear();for(const t of worldTextures)t.dispose();disposedTextures+=worldTextures.length;worldTextures=[];textureBytes=0;}
function frameCamera(){const portrait=camera.aspect<1,overview=Math.abs(Math.sin(yaw/2))>.01,distance=overview?14:portrait?10.2:10.6;camera.position.set(Math.sin(yaw)*distance+1.1,overview?11:portrait?3.3:3.7,Math.cos(yaw)*distance);camera.lookAt(0,1,-1.8);document.body.dataset.cameraYaw=String(yaw);}
function resize(){if(disposed)return;const bounds=canvas.getBoundingClientRect();renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(bounds.width,bounds.height,false);camera.aspect=bounds.width/bounds.height;camera.updateProjectionMatrix();frameCamera();}
/** @param {Part} part */
function primitive(part){const n=part.segments??6;let g;if(part.shape==='box')g=new THREE.BoxGeometry(1,1,1);else if(part.shape==='cylinder')g=new THREE.CylinderGeometry(.5,.5,1,n);else if(part.shape==='cone')g=new THREE.ConeGeometry(.5,1,n);else g=new THREE.SphereGeometry(.5,n,Math.max(3,Math.floor(n/2)));geometries.add(g);return g;}
/** @param {Kit} kit @param {Variant|undefined} variant */
function createScene(kit,variant){
  world=new THREE.Group();scene.add(world);
  const spec=kit.lighting;scene.background=new THREE.Color(spec.background);scene.fog=new THREE.Fog(spec.fog.color,spec.fog.near,spec.fog.far);
  world.add(new THREE.HemisphereLight(spec.ambient.sky,spec.ambient.ground,spec.ambient.intensity));
  const key=new THREE.DirectionalLight(spec.key.color,spec.key.intensity);key.position.fromArray(spec.key.position);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-15;key.shadow.camera.right=15;key.shadow.camera.top=18;key.shadow.camera.bottom=-18;key.shadow.normalBias=.03;world.add(key);
  if(kit.id==='volcano'||kit.id==='crystal')for(const side of [-1,1]){const light=new THREE.PointLight(kit.id==='volcano'?'#ed8f54':'#81bdd8',kit.id==='volcano'?35:18,18,2);light.position.set(side*5,1.5,-2);world.add(light);}
  const width=['sky','coast','dojo','volcano'].includes(kit.id)?12:48;
  const floorGeometry=new THREE.PlaneGeometry(width,90,Math.round(width),90);floorGeometry.rotateX(-Math.PI/2);const pos=floorGeometry.getAttribute('position');
  if(!['town','dojo','sky','ruins'].includes(kit.id))for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,-.04+Math.sin(x*.7)*Math.cos(z*.65)*.025);}
  floorGeometry.computeVertexNormals();const uv=floorGeometry.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*width*.5,uv.getY(i)*45);geometries.add(floorGeometry);
  const floor=new THREE.Mesh(floorGeometry,materials.get('floor'));floor.position.z=-22;floor.receiveShadow=true;world.add(floor);
  if(variant){materials.get('floor')?.color.multiply(new THREE.Color(variant.floorTint));materials.get('wall')?.color.multiply(new THREE.Color(variant.wallTint));}
  if(['coast','volcano'].includes(kit.id)){const g=new THREE.PlaneGeometry(70,70);g.rotateX(-Math.PI/2);const attr=g.getAttribute('uv');for(let i=0;i<attr.count;i++)attr.setXY(i,attr.getX(i)*18,attr.getY(i)*18);geometries.add(g);const liquid=new THREE.Mesh(g,materials.get(kit.id==='volcano'?'lava':'water'));liquid.position.set(0,-.22,-9);world.add(liquid);}
  const placements=stage(kit.id);
  if(variant)variant.propIds.slice(0,2).forEach((kind,i)=>placements.push({kind,x:i===0?-3.4:3.4,y:0,z:-1-i*2,yaw:i*.4,scale:[.9,.9,.9]}));
  /** @type {Map<string,{geometry:THREE.BufferGeometry,material:THREE.MeshStandardMaterial,matrices:THREE.Matrix4[]}>} */const groups=new Map();
  const dummy=new THREE.Object3D(),parent=new THREE.Object3D();
  for(const placement of placements){const prop=kit.props.find(p=>p.id===placement.kind);if(!prop)throw new Error(`Missing staged prop ${kit.id}/${placement.kind}`);parent.position.set(placement.x,placement.y,placement.z);parent.rotation.set(0,placement.yaw,0);parent.scale.fromArray(placement.scale);parent.updateMatrix();
    for(const part of prop.parts){const groupKey=`${part.shape}/${part.segments??6}/${part.materialId}`;let group=groups.get(groupKey);if(!group){const material=materials.get(part.materialId);if(!material)throw new Error(`Missing material ${part.materialId}`);group={geometry:primitive(part),material,matrices:[]};groups.set(groupKey,group);}dummy.position.fromArray(part.position);dummy.rotation.fromArray(part.rotation);dummy.scale.fromArray(part.size);dummy.updateMatrix();group.matrices.push(parent.matrix.clone().multiply(dummy.matrix));}
  }
  for(const group of groups.values()){const mesh=new THREE.InstancedMesh(group.geometry,group.material,group.matrices.length);trackInstanceMesh(mesh);group.matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();world.add(mesh);}
  document.body.dataset.instances=String(placements.length);document.body.dataset.kit=kit.id;document.body.dataset.textureBytes=String(textureBytes);document.body.dataset.disposedTextures=String(disposedTextures);
}
async function loadKit(){const token=++revision;if(loading){pending=true;return;}loading=true;document.body.dataset.ready='loading';delete document.body.dataset.renderedRevision;cleanup();
  try{const kit=manifest?.kits.find(k=>k.id===kitSelect.value);if(!kit)throw new Error('Kit absent');const variant=manifest?.variants.find(v=>v.id===variantSelect.value);
    /** @type {Map<string,THREE.Texture>} */const textures=new Map();
    for(const path of [...new Set(kit.materials.flatMap(m=>m.texturePath?[m.texturePath]:[]))]){const texture=await new THREE.TextureLoader().loadAsync(new URL(path,assetBase).href);if(disposed||token!==revision){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;textures.set(path,texture);worldTextures.push(texture);textureBytes+=Math.ceil(128*128*4*4/3);}
    for(const spec of kit.materials){const m=new THREE.MeshStandardMaterial({color:spec.color,roughness:spec.roughness,metalness:0,flatShading:true,map:spec.texturePath?textures.get(spec.texturePath):undefined,emissive:spec.emissive??'#000000',emissiveIntensity:spec.emissiveIntensity??0});materials.set(spec.id,m);}
    createScene(kit,variant);el('kit-title').textContent=variant?.label??kit.name;el('kit-description').textContent=variant?.artBrief??'Original materials, dimensional silhouettes and clear travel space. Art composition only.';status.textContent=`${kit.id} · ${worldTextures.length} local textures · ${(textureBytes/1048576).toFixed(3)} MiB with mipmaps`;document.body.dataset.ready='true';
  }catch(error){console.error(error);status.textContent=`Environment unavailable: ${error instanceof Error?error.message:String(error)}`;document.body.dataset.ready='error';cleanup();}
  finally{loading=false;if(pending&&!disposed){pending=false;void loadKit();}}
}
function listVariants(){variantSelect.replaceChildren();const none=document.createElement('option');none.value='';none.textContent='Kit composition';variantSelect.append(none);for(const v of manifest?.variants.filter(v=>v.kitId===kitSelect.value)??[]){const option=document.createElement('option');option.value=v.id;option.textContent=v.label;variantSelect.append(option);}}
async function loadCharacters(){for(const [name,x,z]of /** @type {[string,number,number][]} */([['pikachu',-.8,3.3],['charmander',1.1,2.8]])){const texture=await new THREE.TextureLoader().loadAsync(new URL(`../../art/production/output/${name}-idle.png`,import.meta.url).href);if(disposed){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=texture.magFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.repeat.set(.25,.125);const height=name==='pikachu'?1.7:1.8,g=new THREE.PlaneGeometry(height,height);g.translate(0,height*(92/96-.5),0);const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:texture,alphaTest:.5,side:THREE.DoubleSide}));mesh.position.set(x,0,z);characterRoot.add(mesh);characters.push({mesh,texture});const shadow=new THREE.Mesh(new THREE.CircleGeometry(.37,24),new THREE.MeshBasicMaterial({color:'#18252a',transparent:true,opacity:.48,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.y=.65;shadow.position.set(x,.006,z);characterRoot.add(shadow);}}
function draw(){if(disposed)return;if(!document.hidden){for(const c of characters){const bearing=Math.atan2(camera.position.x-c.mesh.position.x,camera.position.z-c.mesh.position.z),row=(Math.round((Math.PI-bearing)/(Math.PI/4))%8+8)%8;c.mesh.rotation.y=bearing;c.texture.offset.set(0,1-(row+1)/8);}renderer.render(scene,camera);if(world&&document.body.dataset.ready==='true')document.body.dataset.renderedRevision=String(revision);stats.textContent=`${renderer.info.render.calls} draws · ${renderer.info.render.triangles.toLocaleString()} triangles · ${disposedTextures} textures released`;document.body.dataset.drawCalls=String(renderer.info.render.calls);document.body.dataset.triangles=String(renderer.info.render.triangles);}animation=requestAnimationFrame(draw);}
kitSelect.addEventListener('change',()=>{listVariants();void loadKit();});variantSelect.addEventListener('change',()=>void loadKit());el('left').addEventListener('click',()=>{yaw-=Math.PI/4;frameCamera();});el('right').addEventListener('click',()=>{yaw+=Math.PI/4;frameCamera();});el('reset').addEventListener('click',()=>{yaw=0;frameCamera();});characterToggle.addEventListener('change',()=>{characterRoot.visible=characterToggle.checked;});canvas.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();yaw+=(event.key==='ArrowRight'?1:-1)*Math.PI/4;frameCamera();}});
const observer=new ResizeObserver(resize);observer.observe(canvas);canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(animation);status.textContent='Graphics interrupted. Reload this art inspector to recover.';});window.addEventListener('pagehide',()=>{disposed=true;revision++;cancelAnimationFrame(animation);observer.disconnect();cleanup();characterRoot.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();node.material.dispose();}});for(const c of characters)c.texture.dispose();renderer.dispose();});window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
async function init(){try{const response=await fetch(new URL('manifest.json',assetBase));if(!response.ok)throw new Error('Manifest unavailable');manifest=/** @type {Manifest} */(await response.json());for(const kit of manifest.kits){const option=document.createElement('option');option.value=kit.id;option.textContent=kit.name;kitSelect.append(option);}kitSelect.value=manifest.kits.some(k=>k.id===params.get('kit'))?params.get('kit')??'forest':'forest';listVariants();if(manifest.variants.some(v=>v.id===params.get('variant')&&v.kitId===kitSelect.value))variantSelect.value=params.get('variant')??'';await loadCharacters();await loadKit();}catch(error){console.error(error);status.textContent='Environment assets could not load.';document.body.dataset.ready='error';}}
resize();draw();void init();
