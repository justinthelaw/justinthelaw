"""Normalize independently researched data only; never import game source."""
import copy
import hashlib
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[4]
DEST = pathlib.Path(__file__).resolve().parent
INPUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/pokemon-effect-corpus.json')
CORPUS = json.load(open(INPUT))
if 'files' in CORPUS and 'sourcePins' in CORPUS:
    sections = {}
    for entry in CORPUS['files']:
        key = re.fullmatch(r'research-(.+)-[0-9]{2}\.json', entry['file']).group(1)
        data = (INPUT.parent / entry['file']).read_bytes()
        assert hashlib.sha256(data).hexdigest() == entry['sha256']
        sections.setdefault(key, []).append(json.loads(data))
    CORPUS = {key: sum(parts, []) if isinstance(parts[0], list) else parts[0] for key,parts in sections.items()}
CATALOG = 'original-blue-qualified-effect-facts'

def encode(v):
    return json.dumps(v, ensure_ascii=False, separators=(',', ':')) + '\n'

def save(name, v):
    text = encode(v)
    assert len(text.encode()) < 1048576, name
    (DEST / name).write_text(text)

# Full provenance stays in authoring, not browser facts. No commercial source text.
research_files = []
for key, value in CORPUS.items():
    chunks = [value]
    if len(encode(value).encode()) > 800000:
        assert isinstance(value, list)
        chunks = [value[i:i+80] for i in range(0, len(value), 80)]
    for i, chunk in enumerate(chunks):
        name = f'research-{key}-{i+1:02}.json'
        save(name, chunk)
        research_files.append({'file': name, 'sha256': hashlib.sha256((DEST/name).read_bytes()).hexdigest()})
save('research-manifest.json', {'sourcePins': CORPUS['sourcePins'], 'files': research_files})

STRIP = {'evidence', 'handlerEvidence', 'handlerConstantFacts', 'handlerConditionReferences', 'semanticVerification', 'researchHandler', 'behaviorEvidence', 'provenance', 'poolEvidence', 'rewardBlacklistEvidence', 'buyAndSellEvidence', 'selectionEvidence', 'ordinaryRewardEvidence', 'figuresDeliveryEvidence', 'evidenceLocator'}
def concise(value):
    if isinstance(value, list): return [concise(v) for v in value]
    if isinstance(value, dict):
        if value.get('op')=='revival-state-contract' and 'ref' in value:
            value=dict(value);value['contractRef']=value.pop('ref').split('.')[-1]
        if isinstance(value.get('table'),str):
            value=dict(value);target=value.pop('table')
            value['parameterRef' if target.startswith('g') else 'tableRef']=target
        return {k: (v.split('.')[-1] if k in ['contractRef','tableRef'] and isinstance(v,str) else 'decoyTreatmentTable' if k=='lookupRef' and v=='decoy-treatment-table' else concise(v)) for k,v in value.items() if k not in STRIP and (not k.endswith('Evidence') or k == 'availabilityEvidence')}
    return value

def slug(s): return re.sub('[^a-z0-9]+', '-', s.lower()).strip('-')
identity = json.load(open(ROOT/'tools/pokemon-dungeon/content/species-runtime/identities.json'))
move_ids = {r['originalId']: r['id'] for r in identity['moves']}
systems = json.load(open(ROOT/'tools/pokemon-dungeon/content/systems.json'))['records']
names = {re.sub('[^a-z0-9]', '', r['name'].lower()):r['id'] for r in systems if r['recordKind']=='move'}
for r in CORPUS['moves']:
    if r['scope']=='original-move-catalog' and r['id'] not in move_ids:
        key=re.sub('[^a-z0-9]', '',r['name'].lower())
        assert key in names, (r['id'], r['name'])
        move_ids[r['id']]=names[key]
assert len(move_ids)==356
item_rows=json.load(open(ROOT/'tools/pokemon-dungeon/content/dungeon-runtime/item-identities-01.json'))['records']
item_ids={r['sourceIndex']:r['id'] for r in item_rows}
for r in CORPUS['items']:
    if r['id'] not in item_ids: item_ids[r['id']]='item-'+slug(r['symbols'][0].removeprefix('ITEM_'))
assert len(set(item_ids.values()))==240
profiles=[]
for p in sorted((ROOT/'tools/pokemon-dungeon/content/species-runtime').glob('profiles-*.json')):profiles+=json.load(open(p))['records']
profiles_by_id={r['internalId']:r for r in profiles}
families={}
actions=[]
for source in CORPUS['moves']:
    r=concise(source); n=r.pop('id'); r['id']=f'action-{n:03}';r['internalId']=n;r['moveId']=move_ids.get(n)
    r['familyIds']=[f'family-{n:03}' for n in r.pop('familyAnnotationIds')]
    r['target']['geometryRef']='geometry-'+r['target']['geometryRef'];r['target']['relationRef']='category-'+r['target']['relationRef']
    actions.append(r)
families['actions']=actions
families['moves']=[{'id':move_ids[r['internalId']], 'actionId':r['id'], 'internalId':r['internalId']} for r in actions if r['moveId']]
families['items']=[]
for source in CORPUS['items']:
    r=concise(source); n=r.pop('id');r['id']=item_ids[n];r['internalId']=n
    r['actionId']=None if r.pop('moveActionId') is None else f"action-{source['moveActionId']:03}"
    families['items'].append(r)
families['families']=[dict(concise(r),id=f"family-{r['id']:03}",internalId=r['id']) for r in sorted(CORPUS['effectFamilies'].values(),key=lambda r:r['id'])]
families['statuses']=concise(CORPUS['statusRegistry'])
families['timers']=concise(CORPUS['statusTimerEvidence'])
families['auxiliary-statuses']=[concise(v) for v in CORPUS.get('auxiliaryStatusContracts',{}).values()]
families['geometries']=[dict(concise(v),id='geometry-'+k,internalId=int(k)) for k,v in CORPUS['targetGeometries'].items()]
families['categories']=[{'id':'category-'+k,'internalId':int(k),'relation':v} for k,v in CORPUS['targetCategories'].items()]
for key, name in [('commonRules','rules'),('guardRegistry','guards')]:
    families[name]=[{'id':k,'facts':concise(v)} for k,v in CORPUS[key].items()]
families['species-parameters']=[]
for source in CORPUS['speciesEffectParameters']:
    r=concise(source); n=r.pop('redInternalSpeciesId');p=profiles_by_id.get(n)
    r.update(id=f'body-{n:03}',internalId=n,speciesId=p['speciesId'] if p else None,formId=p['formId'] if p else None)
    families['species-parameters'].append(r)
families['terrain']=[{'id':k,'values':concise(v)} for k,v in CORPUS['terrainEffectTables'].items()]
families['contracts']=[{'id':k,'facts':concise(CORPUS[k])} for k in ['decoyTreatmentTable','turnEffectContracts','randomItemSetContract','itemAvailabilitySummary','shopOwnershipContract','gummiTables','statusGroupTimerHookCorrections'] if k in CORPUS]
for section in ['stateContracts','itemLifecycleContracts']:
    for k,v in CORPUS.get(section,{}).items():families['contracts'].append({'id':k,'facts':concise(v)})
if 'moveCallingContracts' in CORPUS:
    calling=CORPUS['moveCallingContracts']
    families['contracts'].append({'id':'move-calling-common','facts':concise({k:v for k,v in calling.items() if k in ['confidence','chargeExclusionMoveIds','chargeWeatherException']})})
    families['contracts'] += [{'id':k,'facts':concise(v)} for k,v in calling.items() if k not in ['confidence','chargeExclusionMoveIds','chargeWeatherException']]
families['treasures']=[dict(concise(r),id=f"treasure-{r['entityDefinitionIndex']:03}",itemId=item_ids[r['itemId']]) for r in CORPUS['fixedTreasureItemDefinitions']]
families['availability-routes']=[dict(concise(r),id=f"pool-{r['poolId']:03}") for r in CORPUS['itemPoolRouteEvidence']]
families['conflicts']=[dict(concise(r),id=f'conflict-{n:03}',selection={'value': next(r[k] for k in ['selected','selectedRed','selectedOriginalResearch'] if k in r), 'reason':r['evidence'], 'scope':'qualified-original-browser-contract-not-Blue-binary-parity'}) for n,r in enumerate(CORPUS['conflicts'])]
def parameter(v):
    if isinstance(v,float):return {'kind':'fixed-point-source-literal','decimal':str(v),'convertedValue':None}
    if isinstance(v,list):return [parameter(n) for n in v]
    return v
families['parameters']=[{'id':k,'value':parameter(v),'qualification':'original-red-comparative'} for k,v in CORPUS['numericEvidence'].items()]
families['parameters'] += [{'id':k,'value':concise(v),'qualification':'original-red-comparative'} for k,v in CORPUS['iqDamageTables'].items()]
# Auxiliary/floor operations are indexed separately from grouped actor statuses.
aux={}
grouped={r['id'] for r in families['statuses']}
def collect(v):
    if isinstance(v,list):
        for x in v:collect(x)
    if isinstance(v,dict):
        if 'op' in v and any(t in v['op'] for t in ['weather','floor','terrain','trap','muzzle','speed','stat-stage','belly']):
            key=hashlib.sha256(encode(v).encode()).hexdigest()[:16];aux[key]={'id':'aux-'+key,'operation':v}
        for x in v.values():collect(x)
for name in ['actions','items','families','statuses']:collect(families[name])
families['auxiliary-effects']=list(aux.values())

# Closed schemas allow only observed structural alternatives. No opaque unrestricted objects.
def schema(values):
    groups={}
    for v in values:
        t='null' if v is None else 'boolean' if isinstance(v,bool) else 'integer' if isinstance(v,int) else 'number' if isinstance(v,float) else 'string' if isinstance(v,str) else 'array' if isinstance(v,list) else 'object'
        groups.setdefault(t,[]).append(v)
    if not groups:return {'type':'null'}
    if len(groups)>1:return {'anyOf':[schema(v) for v in groups.values()]}
    t,vs=next(iter(groups.items()));s={'type':t}
    if t=='object' and all('op' in v for v in vs) and len({v['op'] for v in vs})>1:
        return {'anyOf':[schema([v for v in vs if v['op']==op]) for op in sorted({v['op'] for v in vs})]}
    if t=='object':
        keys=sorted(set().union(*(v.keys() for v in vs)));required=sorted(set(vs[0]).intersection(*(set(v) for v in vs)))
        s.update(properties={k:schema([v[k] for v in vs if k in v]) for k in keys},required=required,additionalProperties=False)
        if 'op' in required:s['properties']['op']['enum']=[vs[0]['op']]
    elif t=='array':s.update(items=schema([i for v in vs for i in v]),minItems=0,maxItems=max(1,max(map(len,vs))))
    elif t in ['integer','number']:s.update(minimum=min(vs),maximum=max(vs))
    elif t=='string':s['maxLength']=max(1,max(map(len,vs)))
    return s
for rows in families.values():
    for row in rows:row['sourceQualification']='original-red-comparative-with-explicit-conflicts'
schemas={'schemaVersion':1,'catalogId':CATALOG,'families':{k:schema(v) for k,v in families.items()}}
# This reviewed baseline is intentionally not regenerated from observed contract fields.
schemas['families']['contracts']=json.load(open(DEST/'contract-requirements.json'))['schema']
save('schemas.json',schemas)
# Keep runtime chunks well below 1 MiB and preserve numeric action order.
for name,rows in families.items():
    chunk=[];part=1
    for row in rows:
        if len(encode(chunk+[row]).encode())>400000:
            save(f'{name}-{part:02}.json',{'schemaVersion':1,'catalogId':CATALOG,'family':name,'records':chunk});part+=1;chunk=[]
        chunk.append(row)
    save(f'{name}-{part:02}.json',{'schemaVersion':1,'catalogId':CATALOG,'family':name,'records':chunk})
save('coverage.json',{'counts':{k:len(v) for k,v in families.items()},'keys':{k:[r['id'] for r in v] for k,v in families.items()},'qualification':'original-blue-identities-with-qualified-original-red-comparative-facts','blueInstructionParity':False,'domainHandlersImplemented':False})
print('Normalized:',{k:len(v) for k,v in families.items()})
