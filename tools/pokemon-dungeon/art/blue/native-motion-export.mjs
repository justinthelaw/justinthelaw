import {readFile} from 'node:fs/promises';
import {nativeBattleInputs,nativeFields,battleDigest} from './native-battle-inputs.mjs';

/** Export factual source-selected animation numbers, without game execution. */
export async function exportNativeMotions({emit}){
  const {files,manifest,manifestBytes,species}=await nativeBattleInputs();
  const source=files.get('src/effect_data.c').toString(),constants=files.get('include/constants/move_id.h').toString();
  const ids=new Map([...constants.matchAll(/^#define (MOVE_\w+) (0x[0-9A-Fa-f]+|\d+)(?:\s*\/\/[^\n]*)?$/gm)].map(match=>[match[1],Number(match[2])]));
  const body=source.match(/gUnknown_80BDBC4\[NUM_MOVE_IDS\] = \{([\s\S]*?)\n\};/)?.[1],overrideBody=source.match(/gUnknown_80C183C\[\d+\] = \{([\s\S]*?)\n\};/)?.[1];
  if(!body||!overrideBody)throw Error('Native move animation tables are absent.');
  const moves=new Map([...body.matchAll(/\[(MOVE_\w+)\] = \{([^\n]+)\}/g)].map(match=>[ids.get(match[1]),nativeFields(match[2])]));
  const overrides=new Map([...overrideBody.matchAll(/\[(\d+)\] = \{([^\n]+)\}/g)].map(match=>[Number(match[1]),nativeFields(match[2])]));
  const speciesIds=new Map(species.map(record=>[`MONSTER_${record.name.toUpperCase()}`,record.speciesId]));
  const openingBytes=await readFile(new URL('../../../../games/pokemon-dungeon-reimagined/content/blue-opening.json',import.meta.url)),opening=JSON.parse(openingBytes),records={};
  // Numerical IDs remain in the reviewed authoring source, not duplicated in
  // the browser's move payload. The three action-only IDs have no name row.
  const facts=JSON.parse(await readFile(new URL('../../content/blue-source.json',import.meta.url)));
  const moveIds=new Map(facts.identities.moves.map(record=>[record.id,record.originalId]));
  for(const[id,internalId]of[['regular-attack',355],['move-struggle',352],['bide-release',357]])moveIds.set(id,internalId);
  for(const move of Object.values(opening.moves)){
    const record=moves.get(moveIds.get(move.id));if(!record)throw Error(`Native motion is missing for ${move.id}.`);
    const selected={animation:record.unk10,overrides:{},preparation:record.unk0,cast:record.unk2,target:record.unk4,travel:record.unk6,attachmentSet:record.unk14,attachmentOverrides:{},travelSpeed:record.unk6===0?0:record.unkC===1?2:record.unkC===2?3:6};
    for(let index=0;index<record.unk1C;index++){
      const override=overrides.get(record.unk20+index);if(!override)throw Error('Native species-animation table is incomplete.');
      // No admitted caller copies moves. Widen this closure before enabling
      // Assist/Mirror Move; saved Bide keeps the action-only IDs universal.
      const speciesId=speciesIds.get(override.species);if(speciesId&&Object.hasOwn(opening.species,speciesId)&&(['regular-attack','move-struggle','bide-release'].includes(move.id)||opening.species[speciesId].learnset.some(([,id])=>id===move.id))&&!Object.hasOwn(selected.overrides,speciesId)){selected.overrides[speciesId]=override.unk2;selected.attachmentOverrides[speciesId]=override.unk4;}
    }
    for(const animation of [selected.animation,...Object.values(selected.overrides)])if(!Number.isInteger(animation)||animation<0||animation>27&&animation!==98&&animation!==99)throw Error('Unknown native move motion selector.');
    for(const effect of [selected.preparation,selected.cast,selected.target,selected.travel])if(!Number.isInteger(effect)||effect<0||effect>=448)throw Error('Unknown native move effect route.');
    for(const attachment of [selected.attachmentSet,...Object.values(selected.attachmentOverrides)])if(!Number.isInteger(attachment)||attachment< -1||attachment>3)throw Error('Unknown native move attachment set.');
    records[move.id]=selected;
  }
  const modulePath='src/blue/render-move-motion-data.js';
  const data='/** Generated native move/species animation facts. Comparative Red source; no timing claim. */\n'+
    '/** @type {Readonly<Record<string,{animation:number,overrides:Record<string,number>,preparation:number,cast:number,target:number,travel:number,attachmentSet:number,attachmentOverrides:Record<string,number>,travelSpeed:number}>>} */\n'+
    `export const MOVE_MOTION_FACTS=${JSON.stringify(records)};\n`;
  await emit(new URL(`../../../../games/pokemon-dungeon-reimagined/${modulePath}`,import.meta.url),data);
  return{modulePath,bytes:Buffer.byteLength(data),sha256:battleDigest(data),moveCount:Object.keys(records).length,archive:manifest.archive,sourceManifestPath:'tools/pokemon-dungeon/art/blue/native-battle-sources.json',sourceManifestSha256:battleDigest(manifestBytes),sourceEdition:manifest.sourceEdition,openingFactsSha256:battleDigest(openingBytes)};
}
