import { readFile } from 'node:fs/promises';
import { characters as starters, render as renderStarter } from '../production/characters.mjs';
import { painter } from '../production/painter.mjs';
import { pose } from '../production/pose.mjs';
import { campaign } from './campaign.mjs';
import { refineCampaign } from './refinements.mjs';
import { drawAnatomy } from './anatomy.mjs';
import { formCharacter } from './forms.mjs';
import { boundedRig } from './rig.mjs';
import { source as kanto } from './records-kanto.mjs';
import { source as johto } from './records-johto.mjs';
import { source as hoenn } from './records-hoenn.mjs';
const catalogRoot=new URL('../../content/species-runtime/',import.meta.url);
export const speciesCatalog=JSON.parse(await readFile(new URL('species.json',catalogRoot),'utf8')).records;
export const profiles=(await Promise.all([1,2,3,4,5].map(async n=>JSON.parse(await readFile(new URL(`profiles-${n}.json`,catalogRoot),'utf8')).records))).flat();
const authored=refineCampaign(campaign),byId=new Map(authored.map(c=>[c.identity.speciesId,c]));
export const records=[kanto,johto,hoenn].flatMap(source=>source.trim().split('\n').map(line=>{const[dex,kind,color,size,traits]=line.split('|');return{dex:Number(dex),kind,color,size:size.split(',').map(Number),traits:traits.split(' ')};}));
for(const record of records){const speciesId=`pokemon-${String(record.dex).padStart(3,'0')}`;if(byId.has(speciesId))throw Error(`Duplicate anatomy ${speciesId}`);const canonical=speciesCatalog.find(s=>s.id===speciesId);if(!canonical)throw Error(`Absent species ${speciesId}`);byId.set(speciesId,{identity:{name:canonical.name.toLowerCase().replace('♀','-female').replace('♂','-male').replace(/[^a-z0-9-]+/g,'-'),speciesId,formId:'default',worldHeight:Math.max(1.3,Math.min(3.3,(record.size[0]+record.size[1]+record.size[2])/28)),bodyPlan:record.kind,features:record.traits,anatomyRecord:record,review:'candidate-unaccepted'},draw:a=>drawAnatomy(a,record)});}
const starterIds=new Map(starters.map(c=>[c.identity.speciesId,c]));
export const characters=profiles.map(profile=>{let c;if(starterIds.has(profile.speciesId)){const starter=starterIds.get(profile.speciesId);c={...starter,starter:true};}else if(profile.formId)c=formCharacter(profile);else c=byId.get(profile.speciesId);if(!c)throw Error(`No authored record ${profile.id}`);return{...c,profileId:profile.id,identity:{...c.identity,formId:profile.formId??'default',catalogFormId:profile.formId,profileId:profile.id},review:'candidate-unaccepted'};});
export function render(character,direction,clip,frame){if(character.starter)return renderStarter(character,direction,clip,frame);const raw=painter(direction,pose(clip,frame));const a=boundedRig(raw,.92);a.viewDirection=direction;character.draw(a);return a.finish();}
