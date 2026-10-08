/** Original Red comparative scalar layout and native allocation statements.
 * Symbolic pointers preserve source slot/resource identity without fabricating
 * platform addresses. This is neither a Blue binary layout nor save admission. */
export const SINISTER_NATIVE_SLOT_FACTS = Object.freeze({
  id: 'sinister-native-slots-red-comparative-v1',
  commit: '6bcbec4f906938c0243aa2026bcbd41b577bab85',
  qualification: 'original-red-comparative-source-scalars-and-symbolic-pointers',
  activation: 'unselected',
  capacities: Object.freeze({teamSlots:4,wildSlots:16,activeSlots:20,teamBody:6,wildBody:16}),
  scalarSizes: Object.freeze({entity:116,info:520}),
  pointerEncoding: 'symbolic-source-pointers-with-zero-scalar-holes',
  floorGenerationStart: 10,
  floorSpriteStart: 1024,
  maxOperations: 273,
  offsets: Object.freeze({
    entity: Object.freeze({type:0,unk1C:28,unk22:34,slot:36,spawnGeneration:38,spritePointer:100,animTimer:104,anim1:106,anim2:107,direction:108,orientation:109,spriteFlag:111,infoPointer:112}),
    info: Object.freeze({species:2,apparentSpecies:4,isNotTeam:6,aiTargetPointer:128,bodyStart:359,bodySize:360}),
  }),
  sourceFiles: Object.freeze([
    Object.freeze({path:'src/run_dungeon.c',sha256:'6cc792aa349add7f72cd04694d703c1612cacef8681ef7fae840f392908a5d90'}),
    Object.freeze({path:'src/dungeon_util.c',sha256:'700a2c7c7f52b71cc463e5e7cb4b7b5c4ec69b7cfd5e4c57dd185e696470b126'}),
    Object.freeze({path:'src/dungeon_misc.c',sha256:'9f5de68c48737bb3b9aadd0b92a9ae2069a53349383d125174e7b2aeca04d90d'}),
    Object.freeze({path:'include/structs/dungeon_entity.h',sha256:'e28d3f1281547a1651ba4a9f5a16b4fef01f87f82802b776867971371c4649ad'}),
    Object.freeze({path:'include/structs/axdata.h',sha256:'f17b638c30f191f84f29d7686ba6dd255b87bdf4fd2714b889a4391b54a9bfdf'}),
    Object.freeze({path:'include/structs/str_dungeon.h',sha256:'aabd46208d12aa63947556e52cad423d76d52ba821887ef34707803497ac887c'}),
    Object.freeze({path:'include/constants/global.h',sha256:'f2fa0f4d85c9f90c72fadf9a8bcffa5b28b112daf93a804f91b23fc918f608b5'}),
  ]),
});
