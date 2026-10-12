// Read literal syntax/data only. Never import, evaluate or call game modules.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parse} from 'acorn';

const rules=new URL('../../../games/pokemon-dungeon-reimagined/src/domain/rules/',import.meta.url);
// Reviewed tables retained from plan/research/blue-rules-v3.json at repository
// checkpoint882cdd14c25b7d79445a637f3dcd97d2c92f0c35, SHA256:
// 055337db77a46e0066c84c1cca0bba5ce4b81f079e74a2f0a7972a6f9a57bd7e.
// That ledger cites pret/pmd-red@6bcbec4f906938c0243aa2026bcbd41b577bab85
// dungeon_damage.c and dungeon_config.c as comparative evidence, not Blue
// executable parity. The retired ledger is provenance, never a live input.
const attackStages=[64,69,74,79,84,89,102,115,128,179,256,332,384,409,422,435,448,460,473,486,512];
const defenseStages=[64,69,74,79,84,89,102,140,179,222,256,332,384,409,422,435,448,460,473,486,512];
const factors={little:32768,resist:58982,neutral:65536,super:98304};
const order=['little','resist','neutral','super'];
const compositionRows=[
  ['little','little','little','resist'],
  ['little','resist','resist','neutral'],
  ['little','resist','neutral','super'],
  ['resist','neutral','super','super'],
];

// Object.freeze is a recognized syntax wrapper only; it is never invoked.
function literal(node){
  if(node?.type==='Literal')return node.value;
  if(node?.type==='ArrayExpression')return node.elements.map(literal);
  if(node?.type==='ObjectExpression'){
    const entries=node.properties.map(property=>{
      assert(property.type==='Property'&&!property.computed&&property.kind==='init'&&!property.method,'Expected a plain literal property.');
      return[property.key.name??property.key.value,literal(property.value)];
    });
    assert.equal(new Set(entries.map(([key])=>key)).size,entries.length,'Duplicate literal key.');
    return Object.fromEntries(entries);
  }
  if(node?.type==='CallExpression'&&node.callee.type==='MemberExpression'&&!node.callee.computed&&
      node.callee.object.type==='Identifier'&&node.callee.object.name==='Object'&&
      node.callee.property.type==='Identifier'&&node.callee.property.name==='freeze'&&node.arguments.length===1)return literal(node.arguments[0]);
  throw new Error('Only literal table syntax may be inspected.');
}
async function declarations(file){
  const tree=parse(await readFile(new URL(file,rules),'utf8'),{ecmaVersion:'latest',sourceType:'module'});
  return new Map(tree.body.flatMap(statement=>{
    const declaration=statement.type==='ExportNamedDeclaration'?statement.declaration:statement;
    return declaration?.type==='VariableDeclaration'?declaration.declarations.map(item=>[item.id.name,item.init]):[];
  }));
}
const damage=await declarations('damage.js'),types=await declarations('type-context.js');
assert.deepEqual(literal(damage.get('ATTACK_STAGE_Q8')),attackStages,'Attack stage literals differ from reviewed facts.');
assert.deepEqual(literal(damage.get('DEFENSE_STAGE_Q8')),defenseStages,'Defense stage literals differ from reviewed facts.');
assert.deepEqual(literal(types.get('TYPE_FACTORS_Q16')),factors,'Type-factor literals differ from reviewed facts.');
const composition=literal(types.get('COMPOSITION'));
assert.deepEqual(Object.keys(composition),order);
for(const first of order)assert.deepEqual(Object.keys(composition[first]),order);
assert.deepEqual(order.map(first=>order.map(second=>composition[first][second])),compositionRows,'Symbolic composition literals differ from reviewed facts.');

const chart=JSON.parse(await readFile(new URL('../content/rule-runtime/type-matchups.json',import.meta.url),'utf8'));
assert.deepEqual(Object.keys(chart).sort(),['boundary','cells','classes','evidenceClass','schemaVersion','scope','source','types']);
assert.equal(chart.schemaVersion,1);assert.equal(chart.scope,'original-rescue-team-type-table-facts');
assert.equal(chart.evidenceClass,'original-red-engine-comparative');
assert.deepEqual(chart.source,{
  repository:'pret/pmd-red',commit:'6bcbec4f906938c0243aa2026bcbd41b577bab85',path:'src/dungeon_config.c',
  symbol:'gTypeEffectivenessChart',sha256:'f4ef6e42a0df5182c4b8eba90ea53481550d90e44cc089bdeddc0e60c8cf44d5',
  url:'https://github.com/pret/pmd-red/blob/6bcbec4f906938c0243aa2026bcbd41b577bab85/src/dungeon_config.c#L382',
});
assert.equal(createHash('sha256').update(JSON.stringify(chart.cells)).digest('hex'),'f89db28bece3867d49171cac70ce11ac2dfdad938aa29a10b81b4aa9d7a1fe30');
const elements=literal(types.get('ELEMENT_TYPES')),rows=literal(types.get('ROWS'));
assert.deepEqual(elements,['None','Normal','Fire','Water','Grass','Electric','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel']);
assert.deepEqual(chart.types,elements);assert.deepEqual(chart.classes,order);assert.equal(chart.cells.length,18);
assert.deepEqual(Object.keys(rows),elements);
for(const[index,attacker]of elements.entries()){
  const row=rows[attacker];assert.equal(row.length,3);
  const defenders=row.flat();assert.equal(new Set(defenders).size,defenders.length);
  assert(defenders.every(value=>elements.includes(value)&&value!=='None'));
  const[superTypes,resistTypes,littleTypes]=row;
  const actual=elements.map(defender=>superTypes.includes(defender)?'super':resistTypes.includes(defender)?'resist':littleTypes.includes(defender)?'little':'neutral');
  assert.deepEqual(actual,chart.cells[index],`Runtime type literals differ from source facts: ${attacker}`);
}
console.log('Blue numerical literals checked: 21 attack stages, 21 defense stages, four type factors, 16 composition cells and 324 type cells. Static AST/data only; no game execution.');
