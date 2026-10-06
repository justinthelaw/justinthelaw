"""Normalize independently researched facts; never execute game/source scripts.
Input is the separately reviewed scratch corpus. Checked-in outputs are sufficient
for export/check; regeneration deliberately requires the research input.
"""
import hashlib,json,re,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[4]
HERE=pathlib.Path(__file__).resolve().parent
C=json.loads(pathlib.Path('/tmp/pokemon-campaign-event-corpus.json').read_text())
PIN='6bcbec4f906938c0243aa2026bcbd41b577bab85'
def load(p):return json.loads((ROOT/p).read_text())
def records(p):return load('tools/pokemon-dungeon/content/'+p)['records']
def slug(s):return re.sub('[^a-z0-9]+','-',s.lower()).strip('-')
D=records('dungeon-runtime/dungeons-01.json');S=records('dungeon-runtime/sections-01.json')
SP=records('species-runtime/species.json');FA=load('tools/pokemon-dungeon/content/species-runtime/identities.json')['friendAreas']
IT=records('dungeon-runtime/item-identities-01.json');FR=records('dungeon-runtime/fixed-rooms-01.json')
species={r['name']:r['id'] for r in SP};areas={r['name']:r['id'] for r in FA};dungeons={r['name']:r['id'] for r in D};items={r['sourceSymbol']:r['id'] for r in IT}
for file in (ROOT/'tools/pokemon-dungeon/content/effects-runtime').glob('items-*.json'):
 for item in json.loads(file.read_text())['records']:
  for symbol in item['symbols']:items[symbol]=item['id']
sources=[];ev=[]
for r in C['sourceArtifacts']: sources.append({'id':'red:'+r['path'],'path':r['path'],'url':r['url'],'sha256':r['sha256'],'edition':'original-red-comparative','commit':PIN})
for path,cache in [('src/dungeon_config.c','src-dungeon_config.c'),('include/constants/dungeon.h','include-constants-dungeon.h')]:
 sources.append({'id':'red:'+path,'path':path,'url':'https://github.com/pret/pmd-red/blob/'+PIN+'/'+path,'sha256':hashlib.sha256(pathlib.Path('/tmp/pokemon-research/'+cache).read_bytes()).hexdigest(),'edition':'original-red-comparative','commit':PIN})
source_ids={r['id'] for r in sources}
def evidence(rows):
 ids=[]
 for r in rows:
  key='evidence-'+hashlib.sha256(json.dumps([r['path'],r.get('symbol',''),r.get('line')]).encode()).hexdigest()[:16]
  if not any(e['id']==key for e in ev):
   sid='red:'+r['path'];assert sid in source_ids,sid
   ev.append({'id':key,'sourceId':sid,'symbol':r.get('symbol',''),'line':r.get('line'),'qualification':'original-red-comparative'})
  ids.append(key)
 return ids
baseev=evidence(C['postgameUnlockRules'][0]['evidence'])
ident=[]
def identity(kind,id,meaning,source=None):
 if not any(r['id']==id for r in ident):ident.append({'id':id,'kind':kind,'definition':meaning,'sourceSymbol':source,'authoringOrigin':'campaign-catalog-v1'})
 return id
def scene(s,meaning=None):return identity('scene','campaign-scene-'+slug(s),meaning or 'Authored scene responsibility corresponding to this factual continuation; dialogue and staging are separate.',s)
def flag(s):return identity('flag','campaign-flag-'+slug(s),'Persistent campaign flag, distinct from current roster ownership.',s)
def variable(s):return identity('variable','campaign-variable-'+slug(s),'Explicit scalar bridge to sourced campaign state.',s)
def hook(s):return identity('hook',s,'Consumer invocation boundary; not an automatically scheduled event.')
for s in ['MAIN']+['SUB'+str(i) for i in range(1,10)]+['SELECT']:identity('scenario',s,'Sourced two-component scenario state; SELECT is a continuation router, not a quest.')
P=[];T=[]
def pred(kind,**kw):
 row={'kind':kind,**kw};key='predicate-'+hashlib.sha256(json.dumps(row,sort_keys=True).encode()).hexdigest()[:16]
 if not any(p['id']==key for p in P):P.append({'id':key,**row})
 return key
def allof(*ids):return pred('all',predicateIds=list(ids))
def anyof(*ids):return pred('any',predicateIds=list(ids))
def sc(n,op,c,s):return pred('scenario',scenarioId=n,comparison=op,chapter=c,step=s)
def scalar(n,op,v):return pred('scalar',variableId=variable(n),comparison=op,value=v)
def own(n,value=True):return pred('roster-ownership',speciesId=species[n],present=value)
def possession(n,scope):return pred('item-possession',itemId=items[n],scope=scope)
def area(n):return pred('friend-area-ownership',friendAreaId=areas[n])
def testflag(n,value=True,scope='persistent'):return pred('flag',flagId=flag(n),scope=scope,value=value)
def act(kind,**kw):return {'kind':kind,**kw}
def setsc(n,c,s):return act('set-scenario',scenarioId=n,chapter=c,step=s)
def setflag(n,value=True,scope='persistent'):return act('set-flag',flagId=flag(n),scope=scope,value=value)
def setscalar(n,v):return act('set-scalar',variableId=variable(n),value=v)
def call(id):return act('require-callback',callbackId=id)
def dispatch(sym):return act('queue-scene',sceneId=scene(sym))
def access(name,kind='access',value=True):return act('set-dungeon-flag',dungeonId=dungeons[name],flag=kind,value=value)
def transition(id,group,when,actions,evidenceIds,flow='continue',otherwise=None):
 hook(group);T.append({'id':id,'hookId':group,'order':sum(t['hookId']==group for t in T),'predicateId':when,'actions':actions,'onMatch':flow,'otherwise':otherwise or 'continue','evidenceIds':evidenceIds});return id
TRUE=pred('always')
def parsecondition(x):
 if isinstance(x,dict):return {'all':allof,'any':anyof}[next(iter(x))](*(parsecondition(v) for v in next(iter(x.values()))))
 if x in ['MAIN chapter in1..27','MAIN chapter18..27']:
  lo=1 if 'in1' in x else 18;return allof(pred('scenario-chapter',scenarioId='MAIN',comparison='ge',chapter=lo),pred('scenario-chapter',scenarioId='MAIN',comparison='le',chapter=27))
 m=re.fullmatch(r'(MAIN|SUB\d)(>=|<=|>|<|=)\(?([0-9]+),([0-9]+)\)?',x)
 if m:return sc(m[1],{'=':'eq','>':'gt','<':'lt','>=':'ge','<=':'le'}[m[2]],int(m[3]),int(m[4]))
 if x.startswith('owns '):return area(x[5:])
 if x.startswith('recruited '):return own(x[10:])
 m=re.fullmatch(r'(Dive|Surf) HM in (toolbox|storage)',x)
 if m:return possession('ITEM_HM_'+m[1].upper(),m[2])
 raise ValueError(x)
def parseeffect(x):
 m=re.fullmatch(r'(SUB\d)=\(([0-9]+),([0-9]+)\)',x)
 if m:return setsc(m[1],int(m[2]),int(m[3]))
 if x=='BASE_LEVEL=2':return setscalar('BASE_LEVEL',2)
 for ending,k in [(' job/access flag=true','access'),(' conquest=true','conquered'),(' order-list=true','notice')]:
  if ending in x:return access(x.split(ending)[0],k)
 raise ValueError(x)
for r in C['postgameUnlockRules']:
 transition('unlock-'+r['id'],'unlock-refresh',parsecondition(r['when']),[parseeffect(a) for a in r['effects']],evidence(r['evidence']))
# MAIN chapter/step assignments trigger the separate reset contract, even from scenes.
for r in C['mainStoryJobIntervals']:
 state=r['state'];p=sc('MAIN','eq',*state) if isinstance(state,list) else allof(sc('MAIN','ge',state['chapter'],state['stepRange'][0]),sc('MAIN','le',state['chapter'],state['stepRange'][1]))
 tests=[p,scalar('CLEAR_COUNT','ge',r['counterAtLeast'])]
 if 'additionalPredicate' in r:tests.append(sc('SUB1','ge',31,0))
 transition('main-job-'+r['id'],'main-job-dispatch',allof(*tests),[setsc('MAIN',*r['resultState']),dispatch(r['dispatch'])],evidence(r['evidence']),'stop')
transition('meanies-early-arrival','meanies-pre-wait',anyof(scalar('CLEAR_COUNT','ge',3),scalar('SCRIPT_MODE','eq',1)),[dispatch('EVENT_M01E03A_L004')],evidence(C['mainStoryJobIntervals'][1]['evidence']),'stop')
# Typed ordered day operations; MAIN15,7 blocks every later hook on either result.
dayev=evidence(C['nextDayContract']['evidence'])
for h in ['next-day','next-day-2']:
 transition(h+'-base-ready',h,allof(sc('MAIN','eq',15,7),sc('SUB1','ge',31,0),scalar('CLEAR_COUNT','ge',2)),[dispatch('EVENT_DIVIDE')],dayev,'replace-root')
 transition(h+'-base-wait',h,sc('MAIN','eq',15,7),[],dayev,'stop')
 transition(h+'-postgame',h,sc('MAIN','eq',18,4),[setsc('MAIN',19,1)],dayev)
 for before,after in [(2,3),(4,5),(6,7)]:transition(h+'-wish-'+str(before),h,sc('SUB8','eq',51,before),[setsc('SUB8',51,after)]+([access('Wish Cave','notice')] if after==7 else []),dayev)
 for before,after in [(2,3),(4,5)]:transition(h+'-gengar-'+str(before),h,sc('SUB9','eq',53,before),[setsc('SUB9',53,after)],dayev)
 if h=='next-day':
  for n,c,s in [('SUB3',36,'EVENT_S03E01A_L001'),('SUB5',44,'EVENT_S05E01A_L001'),('SUB6',46,'EVENT_S06E01A_L001')]:transition(h+'-'+n.lower(),h,sc(n,'eq',c,1),[dispatch(s)],dayev,'replace-root')
callbacks=[]
def callback(id,owner,responsibility,sourceId=None,result='acknowledged'):
 if not any(c['id']==id for c in callbacks):callbacks.append({'id':id,'owner':owner,'responsibility':responsibility,'nativeCallbackId':sourceId if id not in ['friend-area-menu','dungeon-menu','dojo-menu','entry-validation'] else None,'nativeOpcode':sourceId if id in ['friend-area-menu','dungeon-menu','dojo-menu','entry-validation'] else 59 if sourceId is not None else None,'resultContract':result,'missingBehavior':'block-operation','evidenceIds':baseev})
 return id
for args in [
 ('wish-stone-grant','inventory','Grant Wish Stone in the named post-rescue scene once; handle capacity explicitly.',40,'grant-committed'),
 ('gardevoir-invitation','recruitment','Attempt named Gardevoir recruitment with Friend Area capacity; refusal/full leaves SUB9=55,2.',None,'accepted-with-capacity'),
 ('job-reward','jobs','Construct each eligible completed mission reward; increment CLEAR_COUNT only after success, once per reward.',None,'reward-committed'),
 ('entry-validation','expedition','Validate the selected route and all entry restrictions before departure.',7,'entry-approved'),
 ('friend-area-menu','town-ui','Select a Friend Area destination or return explicit cancellation.',3,'selected-or-cancelled'),
 ('dungeon-menu','town-ui','Select a permitted dungeon and resolve rescue-to-script identity.',4,'selected-or-cancelled'),
 ('dojo-menu','town-ui','Select a Dojo route or return cancellation.',6,'selected-or-cancelled'),
 ('recruitment-eligibility','recruitment','Apply current entity recruitment eligibility, team/body/Friend Area constraints; no unconditional roster insertion.',None,'eligible'),
 ('wish-menu','wishes','Resolve Jirachi wish choice and exact sourced reward transaction.',None,'wish-committed'),
 ('munchlax-roll','town-rng','Use the owned town RNG mapping for one integer in [0,255]; appearance only on zero.',51,'roll-zero'),
 ('dismissal-1','expedition','Perform source victory dismissal/return settlement before next-day hook.',None,'settled'),
 ('dismissal-2','expedition','Perform source mode10 dismissal/return settlement before next-day hook.',None,'settled'),
 ('dismissal-3','expedition','Perform source failure dismissal/return settlement before next-day hook.',None,'settled'),
 ('return-settlement','expedition','Apply reviewed entry/outcome/rescue retention before routing to ground; no day advance while awaiting rescue.',None,'settled'),
 ('next-day-hook','campaign','Commit the narrative day boundary and run next-day rules once at the explicitly requested return boundary.',None,'day-committed'),
 ('population-refresh','town','Recompute the selected map population without changing the day.',None,'acknowledged'),
 ('reward-loop','jobs','Process selector56 Post Office group11 until no eligible rewards; selector57 then advances day and dispatches.',None,'rewards-finished'),
 ('route-fugitive-continuation','expedition','Use current route success/failed entry destination; continuation to rest/next segment is not a home return.',None,'routed'),
 ('recruit-latias-latios','recruitment','Named Pitfall Valley town recruitment transaction; never ordinary combat recruitment.',None,'recruitment-committed'),
]:callback(*args)
# Interaction graphs use semantic triggers, not original scripts/interpreter opcodes.
for key,n in [('wishConversationGraph','SUB8'),('gengarConversationGraph','SUB9')]:
 arc='wish' if n=='SUB8' else 'gengar';evs=evidence(C[key]['evidence'])
 for i,r in enumerate(C[key]['edges']):
  if r['trigger']=='next-day hook':continue
  fr=r['from'];p=sc(n,'eq',*fr) if isinstance(fr,list) else sc(n,'eq',fr['chapter'],-1)
  acts=[setsc(n,*r['to'])]
  if arc=='wish':
   if i==6:acts+=[access('Wish Cave')]
   if i==8:acts=[call('wish-stone-grant')]+acts+[access('Wish Cave','conquered'),setsc('SELECT',51,0)]
  else:
   if i==4:acts+=[access('Mt. Freeze','escort')]
   if i==5:acts+=[access('Mt. Freeze','escort',False),setsc('SELECT',53,0)]
   if i==6:acts+=[access('Murky Cave')]
   if i==7:acts+=[access('Murky Cave','conquered'),setsc('SELECT',54,0)]
   if i==8:acts=[call('gardevoir-invitation')]+acts
  trigger=hook(arc+'-'+['talk-first','wait-first','talk-second','wait-second','talk-third','wait-third','accept-notice','attempt-return','rescue-return'][i]) if arc=='wish' else hook('gengar-'+['post-office-talk','wait-first','square-talk','wait-second','base-freeze-request','freeze-success','base-murky-request','murky-success','gardevoir-accept'][i])
  transition(arc+'-edge-'+str(i),trigger,p,acts,evs,'stop')
# Callback actions are transactional prerequisites; their success cannot be assumed.
# Town arbitration: exclusive records stop selection; composed records preserve earlier groups.
town=C['townEventPriority'];town_rules=[]
def townrule(id,location,p,mode,evs):
 sceneid=scene('population-'+id,'Independently authored population/scene slot; selected by this exact predicate.')
 transition('town-'+id,'town-'+location,allof(scalar('WARP_LOCK','eq',0),p),[act('select-population',sceneId=sceneid)]+([setscalar('EVENT_LOCAL',1)] if mode=='compose' else []),evs,'stop' if mode=='exclusive' else 'continue')
buried=allof(sc('SUB7','eq',49,-1),sc('SUB7','ge',49,2),anyof(sc('SUB7','lt',49,4),scalar('EVENT_S07E01_SUM','lt',11)))
for id,p in [('dive',sc('SUB2','eq',33,3)),('wish-first',sc('SUB8','eq',51,1)),('wish-second',sc('SUB8','eq',51,3)),('wish-alone',anyof(sc('SUB8','eq',51,5),sc('SUB8','eq',51,6))),('buried',buried)]:townrule('pond-'+id,'pond',p,'exclusive',evidence(town['WhiscashPond']['evidence']))
for id,p in [('gengar-first',sc('SUB9','eq',53,1)),('gengar-wait',sc('SUB9','eq',53,2)),('wish-notice',anyof(sc('SUB8','eq',51,7),sc('SUB8','eq',51,8)))]:townrule('post-'+id,'post-office',p,'exclusive',evidence(town['PostOffice']['evidence']))
sqev=evidence(town['Square']['evidence'])
for id,p in [('spinda-arrival',allof(sc('MAIN','ge',19,-1),scalar('PREVIOUS_MAP','ne',4),sc('SUB4','eq',38,1))),('spinda-resolution',anyof(sc('SUB4','eq',43,0),sc('SUB4','eq',43,1))),('gengar-hint',anyof(sc('SUB9','eq',53,3),sc('SUB9','eq',53,4)))]:townrule('square-'+id,'square',p,'exclusive',sqev)
for id,p in [('buried',buried),('smeargle',sc('SUB1','eq',32,2)),('lombre',sc('SUB2','eq',33,2)),('silver',sc('SUB2','eq',34,1)),('spinda-active',allof(sc('SUB4','ge',38,2),sc('SUB4','lt',43,0))),('gardevoir',sc('SUB9','eq',55,2))]:townrule('square-'+id,'square',p,'compose',sqev)
transition('town-square-munchlax','town-square',allof(scalar('WARP_LOCK','eq',0),sc('MAIN','ge',19,-1),scalar('EVENT_LOCAL','eq',0),scalar('PREVIOUS_MAP','ne',4),scalar('EVENT_GONBE_0','le',0)),[call('munchlax-roll')],evidence(C['ambientContracts']['Munchlax']['evidence']))
for id,c,s in [('freeze-request',53,5),('murky-request',54,0)]:townrule('base-'+id,'base-postgame',sc('SUB9','eq',c,s),'exclusive',evidence(C['gengarConversationGraph']['evidence']))
# Explicit return policies use dedicated hooks; no catch-all treats all outings as a day.
ret=[];rete=evidence(C['dayReturnRouting']['evidence'])
for id,modes,actions,day in [
 ('base-victory',['won'],[call('dismissal-1'),call('next-day-hook'),dispatch('base-interior-group-8')],True),
 ('base-loss',['lost','mode-11'],[call('dismissal-3'),call('next-day-hook'),dispatch('base-interior-group-7')],True),
 ('base-mode10',['mode-10'],[call('dismissal-2'),call('next-day-hook'),dispatch('base-interior-group-7')],True),
 ('jobs-rewards',['won','mode-10'],[setsc('SELECT',56,0),call('reward-loop'),setsc('SELECT',57,0),call('next-day-hook'),dispatch('EVENT_DIVIDE')],True),
 ('jobs-failure',['lost','mode-11'],[call('dismissal-3'),call('next-day-hook')],True),
 ('dojo-return',['won','lost','mode-10','mode-11'],[dispatch('GETOUT_T00E01A')],False),
 ('fugitive-continuation',['won','lost','mode-10','mode-11'],[call('route-fugitive-continuation')],False),
 ('rescue-wait',['awaiting-rescue'],[],False),
 ('continue-game',['continue'],[call('population-refresh')],False),
 ('town-movement',['town-movement'],[call('population-refresh')],False)]:
 ret.append({'id':id,'outcomes':modes,'advancesNarrativeDay':day,'actions':actions,'evidenceIds':rete})
transition('dojo-postgame-specific','dojo-return',sc('MAIN','eq',18,4),[setsc('MAIN',19,1)],rete)
# All 83 native routing rows; numeric enum order is independently checked from header.
restrict={r['sourceSymbol']:r['sourceDungeonIndex'] for r in records('dungeon-runtime/restrictions-01.json')}
restrict.update({s:int(i) for s,i in re.findall(r'(DUNGEON_[A-Z0-9_]+) = ([0-9]+)',pathlib.Path('/tmp/pokemon-research/include-constants-dungeon.h').read_text())})
cross=load('tools/pokemon-dungeon/content/dungeon-runtime/research-identity-crosswalk.json');crossmap={s['sourceDungeonIndex']:(r['authoringId'],s['authoringSegmentId']) for r in cross for s in r.get('segments',[])}
for row in cross:
 if row.get('kind')=='dojo':crossmap[row['sourceDungeonIndex']]=(row['authoringId'],row['authoringId'])
# Alternate Freeze summit rows join the existing alternate-visit variant.
for r in records('dungeon-runtime/floors-01.json')+records('dungeon-runtime/floors-02.json')+records('dungeon-runtime/floors-03.json'):
 crossmap.setdefault(r['sourceDungeonIndex'],(r['dungeonId'],r['sectionId']))
routes=[]
for i,r in enumerate(C['scriptDungeonRoutes']):
 sym='SCRIPT_DUNGEON_TINY_WOODS' if i==0 else r['id'];proc=restrict[r['dungeonID']];join=crossmap.get(proc)
 maps=[]
 for key in ['mapID1','mapID2','mapID3']:maps.append(None if r[key]==-1 else identity('map','campaign-map-'+slug(str(r[key]).removeprefix('MAP_')),'Ground destination identity; never a procedural floor index.',str(r[key])))
 ss=[None if r[k]==-1 else scene(r[k]) for k in ['scriptID1','scriptID2','scriptID3']]
 purpose='rescue-wrapper' if i>=80 else 'excluded-source-slot' if i==76 else 'unused-alias' if i==21 else 'dojo' if 55<=i<=77 else 'fugitive-detour' if i in [78,79] else 'escort' if i in [37,38,39] else 'repeat-story' if i in [3,5,27] else 'campaign-expedition'
 assert join or i>=80 or i==76,(i,sym,proc)
 routes.append({'id':'campaign-route-'+str(i).zfill(2),'sourceScriptDungeonIndex':i,'sourceScriptDungeonSymbol':sym,'sourceProceduralDungeonIndex':proc,'sourceProceduralDungeonSymbol':r['dungeonID'],'sourceRescueDungeonSymbol':None if r['rescueDungeonID']==-1 else r['rescueDungeonID'],'dungeonId':join[0] if join else None,'sectionId':join[1] if join else None,'variantId':'alternate-visit' if i==38 else 'source-primary' if join else None,'purpose':purpose,'departureMapId':maps[0],'successMapId':maps[1],'failureMapId':maps[2],'firstEntrySceneId':ss[0],'repeatEntrySceneId':ss[1],'returnSceneId':ss[2],'resolvesThroughEnterIndex':i==81,'evidenceIds':evidence(r['evidence'])})
# Fixed room dispatch and source persistent flags, separate from canonical dungeon completion.
fixed={r['sourceSymbol']:r['id'] for r in FR};boss=[]
for r in C['bossSceneDispatch']:
 fl=lambda s:None if s=='NUM_CUTSCENE_FLAGS' else flag(s)
 boss.append({'id':'campaign-boss-'+slug(r['fixedRoom'].removeprefix('FIXED_ROOM_')),'fixedRoomId':fixed[r['fixedRoom']],'firstSceneId':scene(r['first']),'retrySceneId':scene(r['retry']),'revisitSceneId':scene(r['revisit']),'reachedFlagId':fl(r['reachedFlag']),'completeFlagId':fl(r['completeFlag']),'evidenceIds':evidence(r['evidence'])})
recruit=[]
for r in C['recruitmentStoryFlags']:
 name=r['species'].removeprefix('MONSTER_').replace('_',' ').title();name={'Ho Oh':'Ho-Oh'}.get(name,name)
 recruit.append({'id':'recruit-story-'+slug(name),'speciesId':species[name],'requiredFlagId':flag(r['requiredPersistentFlag']),'flagScope':'persistent','evidenceIds':evidence(C['bossRematchContracts']['postgameLegendaries']['evidence'])})
rematch=[]
for key in ['mainLegendaries','postgameLegendaries']:
 contract=C['bossRematchContracts'][key]
 for name in contract['species']:
  n='Deoxys' if name=='Deoxys Normal' else name
  p=own(n,False)
  if key=='mainLegendaries':p=allof(sc('MAIN','gt',18,3),p)
  rematch.append({'id':'rematch-'+slug(n),'speciesId':species[n],'formId':'deoxys-normal' if n=='Deoxys' else None,'presencePredicateId':p,'levelIncrement':contract.get('levelIncreaseOnRevisit',{}).get(name,0),'maximumLevel':100,'requiresValidActor':True,'requiresUnlockedExperience':True,'evidenceIds':evidence(contract['evidence'])})
# Specific Regi possession/eligibility is not the ordinary legend flag rule.
for name,part in [('Regirock','ROCK'),('Regice','ICE'),('Registeel','STEEL')]:
 p=anyof(possession('ITEM_'+part+'_PART','toolbox'),possession('ITEM_'+part+'_PART','dungeon-held'),possession('ITEM_MUSIC_BOX','toolbox'),possession('ITEM_MUSIC_BOX','dungeon-held'))
 transition('regi-'+slug(name)+'-owned','boss-'+slug(name)+'-entry',own(name),[act('remove-boss',speciesId=species[name]),setflag('CUTSCENE_FLAG_REGI_RECRUITED',True,'pending'),setflag('CUTSCENE_FLAG_REGI_ITEM_OBTAINED',True,'pending'),act('regi-exit-and-part',itemId=items['ITEM_'+part+'_PART'])],evidence(C['bossRematchContracts']['regis']['evidence']),'stop')
 transition('regi-'+slug(name)+'-item','boss-'+slug(name)+'-entry',p,[setflag('CUTSCENE_FLAG_REGI_RECRUITED',False,'both'),setflag('CUTSCENE_FLAG_REGI_ITEM_OBTAINED',True,'pending')],evidence(C['bossRematchContracts']['regis']['evidence']),'stop')
 transition('regi-'+slug(name)+'-no-item','boss-'+slug(name)+'-entry',TRUE,[setflag('CUTSCENE_FLAG_REGI_RECRUITED',False,'both'),setflag('CUTSCENE_FLAG_REGI_ITEM_OBTAINED',False,'both')],evidence(C['bossRematchContracts']['regis']['evidence']),'stop')
# Complete counter semantics are finite records, not expressions or default callbacks.
model={'scenarioIds':['MAIN']+['SUB'+str(i) for i in range(1,10)]+['SELECT'],'scenarioComponentMinimum':0,'scenarioComponentMaximum':255,'comparison':{'ordering':'lexicographic-chapter-step','negativeStepEquality':'chapter-only','negativeStepOrdering':'chapter-only','debugMainChapter':58,'debugBeforeAfterResult':False,'geComposition':'not-before','leComposition':'not-after','chapterOnlyComparison':'integer-comparison-without-debug-exception'},'mainPairAssignment':{'resetCounterId':variable('CLEAR_COUNT'),'resetValue':0,'when':'either-component-changes','samePairPreservesCounter':True},'rewardCounter':{'id':variable('CLEAR_COUNT'),'increment':1,'maximum':100,'unit':'eligible-completed-job-reward','requiresCallbackId':'job-reward','incrementAfterCallbackSuccess':True,'multipleRewardsCountSeparately':True,'failedOrEmptyOutingIncrement':0},'entryFrequency':{'id':variable('DUNGEON_ENTER_FREQUENCY'),'increment':1,'outcomes':['won','mode-10','mode-11','lost'],'narrativeDay':False},'cutsceneFlags':{'readScope':'persistent','temporaryWriteScope':'pending','flush':'or-pending-into-persistent-then-clear-pending','unset':'clear-persistent-and-pending','sentinelReads':False},'dispatchOrder':['nonstory-mission-revisit','persistent-complete-revisit','persistent-reached-retry','first-and-set-pending-reached'],'dispatchAfter':['mark-cutscene-mode','clear-weather','flush-pending-flags'],'rosterOwnership':'current-existing-roster-species','basePopulationOrder':['main-continuation','postgame-request','ordinary-population'],'callbackActionSemantics':'require-acknowledged-success-before-later-actions','ruleOrdering':'ascending-order-per-hook','unmatchedQuestState':'preserve-for-next-applicable-hook','executionProvided':False,'dialogueProvided':False,'blueBinaryParityClaimed':False}
# Additional finite policies. This fragment is incorporated into normalize.py.
# Correct source sequence and preserve the EVENT_LOCAL reset after Buried population.
order=['base-completion-safety-state','base-construction-start','howling-invitation','waterfall-pond','solar-cave','habitat-furnace-desert','habitat-boulder-cave','habitat-dragon-cave','habitat-secretive-forest','habitat-serene-sea','unown-relic','postgame-entry','spinda-beasts','latios-theft','silver-trench-birds','wish-rumor','joyous-purity','buried-relic-mail','gengar-redemption','meteor-cave','western-cave']
for t in T:
 if t['hookId']=='unlock-refresh':t['order']=order.index(t['id'].removeprefix('unlock-'))
 if t['id'] in ['town-square-spinda-resolution','town-square-gengar-hint','town-square-buried']:t['predicateId']=allof(sc('MAIN','ge',19,-1),t['predicateId'])
 if t['hookId']=='town-square' and t['order']>=4:t['order']+=1
transition('town-square-clear-local','town-square',scalar('WARP_LOCK','eq',0),[setscalar('EVENT_LOCAL',0)],sqev)
T[-1]['order']=4
T.sort(key=lambda t:(t['hookId'],t['order']))
# Native state domains are source crosswalks, not new authoring chapter IDs.
domains=[]
for key,chapters in C['scenarioDomains'].items():
 for chapter,meaning in chapters.items():
  mid=identity('milestone','campaign-stage-'+key.lower()+'-'+chapter,meaning)
  domains.append({'scenarioId':key,'chapter':int(chapter),'milestoneId':mid})
for key in ['SUB1','SUB2','SUB3','SUB4','SUB5','SUB6','SUB7','SUB8','SUB9']:identity('branch','campaign-branch-'+key.lower(),'Independent scenario branch; chapter/step projected by campaign adapter.',key)
baseMap=identity('map','campaign-map-team-base-inside','Rescue base interior ground destination.','MAP_TEAM_BASE_INSIDE')
contracts={
 'routeSelection':{
  'absentEntryIndex':-1,'absentEntryMapId':baseMap,'wrapperRouteId':'campaign-route-81','wrapperResolvesField':variable('DUNGEON_ENTER_INDEX'),
  'successOutcome':'won','successField':'successMapId','otherOutcomeField':'failureMapId',
  'tinyWoodsFailureMapId':'campaign-map-tiny-woods-entry','tinyWoodsOverridePredicateId':sc('MAIN','gt',2,-1),
  'fugitiveFailureMapIds':['campaign-map-lapis-cave-entry','campaign-map-mt-blaze-entry','campaign-map-frosty-forest-entry','campaign-map-mt-freeze-entry'],
  'fugitiveActivePredicateId':allof(sc('MAIN','gt',11,3),sc('MAIN','lt',15,0)),
  'inactiveFugitiveOverrideMapId':baseMap,'firstEntryCount':0,'firstEntryCountScope':'script-dungeon-identity','otherwiseRepeatEntry':True,
  'nativeMapSentinelMeaning':'retain-caller-routing-context','excludedRouteId':'campaign-route-76','excludedRouteCapability':'blue-exchange-adapters','evidenceIds':rete},
 'bossSpecials':{
  'nonrepeatSpeciesIds':[species[n] for n in ['Skarmory','Ekans','Gengar','Medicham','Mankey']],
  'ordinaryCombatRecruitmentDeniedSpeciesIds':[species[n] for n in ['Latias','Latios']],
  'namedEonRecruitmentCallbackId':'recruit-latias-latios',
  'celebi':{'speciesId':species['Celebi'],'presencePredicateId':own('Celebi',False),'eligibilityCallbackId':'recruitment-eligibility','eligibleOutcome':'scripted-invitation','ineligibleOutcome':'remove-actor','combat':False},
  'jirachi':{'speciesId':species['Jirachi'],'faintCompletionFlagId':flag('CUTSCENE_FLAG_JIRACHI_COMPLETE'),'faintFlagScope':'pending','recruitedOutcome':'finish','unrecruitedWithStoneCallbackId':'wish-menu','stonePredicateId':anyof(possession('ITEM_WISH_STONE','toolbox'),possession('ITEM_WISH_STONE','dungeon-held')),'withoutStoneOutcome':'finish-without-wish','ownedRevisitOutcome':'remove-actor-without-wish-warp'},
  'regis':[{'speciesId':species[n],'partItemId':items['ITEM_'+part+'_PART'],'sharedFlagId':flag('CUTSCENE_FLAG_REGI_ITEM_OBTAINED'),'refreshHooks':['boss-'+slug(n)+'-entry','corresponding-part-pickup'],'dropPartWhenFlagFalse':True,'ownedExitSpawnsMissingPart':True,'ownedExitPartBlockedByMusicBox':True,'exitPosition':'designated-exit-or-leader-fallback','partOffsetY':-1,'pickupRequiresUnrecruitedFlag':True,'pickupWritesPersistentFlag':True,'storageQualifies':False} for n,part in [('Regirock','ROCK'),('Regice','ICE'),('Registeel','STEEL')]],
  'magmaPitSecondMap':{'fixedRoomId':fixed['FIXED_ROOM_MAGMA_CAVERN_GROUDON_2'] if 'FIXED_ROOM_MAGMA_CAVERN_GROUDON_2' in fixed else next(r['fixedRoomId'] for r in boss if 'tyranitar-alakazam' in r['id']),'firstOutcome':'fallen-allies-event','reachedOutcome':'remove-protected-event-actors-and-short-continuation'},
  'evidenceIds':list(dict.fromkeys(evidence(C['bossRematchContracts'][k]['evidence'])[0] for k in ['regis','jirachi','celebi','magmaPit2','cutsceneFlags']))},
 'ambient':{
  'smeargle':{'requestVariableId':variable('FLAG_KIND_CHANGE_REQUEST'),'styleVariableId':variable('FLAG_KIND'),'requestedValue':1,'increment':1,'maximumBeforeWrap':15,'wrapTo':0,'clearRequestTo':0},
  'munchlax':{'counterVariableId':variable('EVENT_GONBE_0'),'callbackId':'munchlax-roll','drawMaximumExclusive':256,'successValue':0,'successCooldown':4,'failureCooldown':1,'tickDecrement':1,'tickMinimum':0,'presentationVariantDrawMaximumExclusive':2},
  'refreshBoundaries':['fresh-game','final-dungeon-return','explicit-native-callback-1'],
  'chansey':{'speciesId':species['Chansey'],'leaderTopic':2,'seenTopic':1,'unseenTopic':0},
  'evidenceIds':sum([evidence(C['ambientContracts'][k]['evidence']) for k in ['SmeargleFlag','Munchlax','Chansey']],[])},
 'callbackProtocol':{'nativeOpcode':59,'argumentOrder':['callback-id','short-argument','argument-one'],'resultHandling':'explicit-branch-discriminant','missingConsumer':'block-operation','implicitSuccess':False},
 'domains':domains,
 'retryPolicies':[
 {'id':'gengar-freeze-failure','scenarioId':'SUB9','chapter':53,'minimumAttemptStep':None,'restartRumor':False,'evidenceIds':evidence(C['gengarConversationGraph']['evidence'])},
 {'id':'gengar-murky-failure','scenarioId':'SUB9','chapter':54,'minimumAttemptStep':4,'restartRumor':False,'evidenceIds':evidence(C['gengarConversationGraph']['evidence'])}],
 'evidenceIds':evidence(C['stateModel']['evidence'])+evidence(C['counters']['CLEAR_COUNT']['evidence'])+evidence(C['counters']['DUNGEON_ENTER_FREQUENCY']['evidence'])}
model['rewardCounter']['explicitResetHookId']=hook('event-divide-init')
transition('init-clear-counter','event-divide-init',TRUE,[setscalar('CLEAR_COUNT',0)],evidence(C['counters']['CLEAR_COUNT']['evidence']))
# Contract callbacks cite their actual handler/hook owners, not the unlock helper.
for row in callbacks:
 if row['nativeOpcode'] in [3,4,6,7]:
  row['evidenceIds']=evidence([{'path':'src/ground_script.c','symbol':'GroundScript_Execute opcode '+str(row['nativeOpcode'])}])
 elif row['nativeCallbackId'] is not None:
  row['evidenceIds']=evidence([{'path':'src/ground_script.c','symbol':'sub_80A14E8 callback '+str(row['nativeCallbackId'])}])
 elif row['owner']=='jobs':row['evidenceIds']=evidence(C['counters']['CLEAR_COUNT']['evidence'])
 elif row['id']=='gardevoir-invitation':row['evidenceIds']=evidence(C['gengarConversationGraph']['evidence'])
 elif row['owner']=='recruitment':row['evidenceIds']=evidence(C['bossRematchContracts']['postgameLegendaries']['evidence'])
 else:row['evidenceIds']=rete

# Selected return-routing facts are flattened into conjunctive decision rows.
# No original command array, label, program counter, or scene interpreter ships.
return_decisions=[]
return_symbols={r['scriptID3'] for r in C['scriptDungeonRoutes']}
ground_enum=re.findall(r'^\s*(MAP_[A-Z0-9_]+)\s*,',pathlib.Path('/tmp/pokemon-research/campaign-include-constants-ground_map.h').read_text(),re.M)
route_symbols={r['sourceScriptDungeonSymbol']:r['id'] for r in routes}
rescue_dungeons={r['sourceRescueDungeonSymbol']:r['dungeonId'] for r in routes if r['sourceRescueDungeonSymbol'] is not None and r['dungeonId'] is not None}
rescue_dungeons.update({'RESCUE_DUNGEON_PURITY_FOREST':'purity-forest','RESCUE_DUNGEON_ODDITY_CAVE':'oddity-cave','RESCUE_DUNGEON_REMAINS_ISLAND':'remains-island','RESCUE_DUNGEON_MARVELOUS_SEA':'marvelous-sea','RESCUE_DUNGEON_FANTASY_STRAIT':'fantasy-strait'})
callback('jobs-in-underlying-dungeon','jobs','Read-only CountJobsinDungeon for the procedural dungeon resolved from DUNGEON_ENTER_INDEX. Return 1 exactly when count>0; 0 otherwise.',11,'zero-or-one')
next(r for r in callbacks if r['id']=='jobs-in-underlying-dungeon')['evidenceIds']=evidence([{'path':'src/ground_script.c','symbol':'sub_80A14E8 case0xB','line':3378}])
def inverse(pid):return pred('not',predicateId=pid)
def equalvariable(name,value):
 if name.startswith('SCENARIO_'):return pred('scenario-chapter',scenarioId=name.removeprefix('SCENARIO_'),comparison='eq',chapter=value)
 if name=='START_MODE':return pred('return-outcome',outcome={'STARTMODE_DUNGEON_WON':'won','STARTMODE_10':'mode-10'}[value])
 return scalar(name,'eq',value)
for source_graph in C['scriptControlGraph']:
 source_symbol=source_graph['id'].removeprefix('s_script_')
 if source_symbol not in return_symbols:continue
 nodes=source_graph['nodes'];group=hook('return-dispatch-'+slug(source_symbol.removeprefix('GETOUT_')));sceneid=scene(source_symbol)
 for route in routes:
  if route['returnSceneId']==sceneid:route['returnHookId']=group
 def walk(pc,selector,conditions,actions,seen):
  assert pc not in seen,(source_symbol,pc,'loop outside normalized scope')
  node=nodes[pc];op=node['op'];seen=seen|{pc}
  def go(n,sel=selector,cs=conditions,acts=actions):walk(n,sel,cs,acts,seen)
  if op=='jump':go(node['nextNode']);return
  if op=='set-branch-selector':assert node['selector']=='variable';go(node['nextNode'],('variable',node['args'][0]));return
  if op=='engine-callback':
   assert node['callbackId']==11
   go(node['nextNode'],('callback','jobs-in-underlying-dungeon'));return
  if op in ['branch','branch-selector']:
   if op=='branch-selector':
    assert node['comparison']=='eq';kind,key=selector
    condition=equalvariable(key,node['value']) if kind=='variable' else pred('callback-result',callbackId=key,comparison='eq',value=node['value'])
   else:
    raw=node['predicate'];a=raw['args']
    if raw['kind']=='equal':condition=equalvariable(*a)
    else:
     assert raw['kind'] in ['scene_eq','scene_gt'];assert not any(a0['kind']=='set-scenario' and a0['scenarioId']==a[0].removeprefix('SCENARIO_') for a0 in actions), 'post-mutation scenario predicate needs explicit projection';condition=sc(a[0].removeprefix('SCENARIO_'),'eq' if raw['kind']=='scene_eq' else 'gt',a[1],a[2])
   go(node['trueNode'],cs=conditions+[condition]);go(node['falseNode'],cs=conditions+[inverse(condition)]);return
  acts=list(actions)
  if op=='set-scenario-pair':a=node['args'];acts.append(setsc(a[0].removeprefix('SCENARIO_'),a[1],a[2]))
  elif op=='calculate-variable-immediate':a=node['args'];assert a[0]=='CALC_SET';acts.append(setscalar(a[1],a[2]))
  elif op=='set-training-completed':
   idx=node['mazeIndex'];native=55+idx if idx<21 else 77;acts.append(act('set-training-completed',dungeonId=routes[native]['dungeonId'],value=bool(node['value'])))
  elif op=='set-rescue-conquered':acts.append(act('set-dungeon-flag',dungeonId=rescue_dungeons[node['args'][0]],flag='conquered',value=True))
  elif op=='transfer-script':acts.append(dispatch(node['args'][0]))
  elif op=='change-map':
   mapsym=ground_enum[node['mapId']];mid=identity('map','campaign-map-'+slug(mapsym.removeprefix('MAP_')),'Ground continuation after a successful segment; not a procedural floor.',mapsym)
   acts.append(act('change-ground-map',mapId=mid,entryArgument=node['entryArgument']))
  elif op=='enter-script-dungeon':acts.append(act('enter-route',routeId=route_symbols[node['args'][1]],entryArgument=node['args'][0]))
  elif op not in ['halt','return']:raise ValueError((source_symbol,node))
  if op in ['transfer-script','halt','return']:
   e=evidence([dict(source_graph['source'],line=node['line'])]);tid='return-decision-'+slug(source_symbol.removeprefix('GETOUT_'))+'-'+str(sum(t['hookId']==group for t in T)).zfill(3)
   transition(tid,group,allof(*conditions) if conditions else TRUE,acts,e,'stop')
   return_decisions.append(tid)
  else:go(node['nextNode'],acts=acts)
 walk(0,None,[],[],set())
assert all('returnHookId' in r for r in routes)
contracts['returnDecisionCount']=len(return_decisions)
contracts['returnHookCount']=len(return_symbols)
contracts['returnDecisionPolicy']={'predicateEvaluation':'against-entry-state','actionApplication':'ordered-after-unique-matching-decision','callbacksReadOnly':True,'callbackQueryCaching':'once-per-return-dispatch','sourceScriptsExecuted':False}
# Scenario assignment achievements are independent persistent milestones.
for n,c,s,name,cmp in [('MAIN',8,-1,'hill-of-ancients','gt'),('MAIN',11,3,'fugitive','gt'),('MAIN',17,0,'prevent-meteor','gt'),('SUB1',31,0,'team-base-done','ge'),('SUB1',32,0,'smeargle','ge'),('SUB9',55,2,'broke-curse','ge')]:
 mid=identity('milestone','campaign-achievement-'+name,'Persistent achievement set by the sourced scenario assignment hook.')
 condition=sc(n,cmp,c,s)
 if n=='MAIN':condition=allof(pred('scenario-chapter',scenarioId='MAIN',comparison='ge',chapter=1),pred('scenario-chapter',scenarioId='MAIN',comparison='le',chapter=27),condition)
 transition('achievement-'+name,'scenario-assigned-'+n.lower(),condition,[act('set-milestone',milestoneId=mid)],evidence(C['stateModel']['evidence']))
model['comparison']['debugScenarioChapter']=model['comparison'].pop('debugMainChapter')

# Namespace metadata makes native ground indices and array projections explicit.
map_indices={name:i for i,name in enumerate(ground_enum)}
map_indices.update({'MAP_TEAM_BASE':map_indices['MAP_TEAM_BASE_PIKACHU_BASIC'],'MAP_TEAM_BASE_INSIDE':map_indices['MAP_TEAM_BASE_INSIDE_PIKACHU_BASIC']})
for row in ident:
 row['sourceNamespace']={'map':'native-ground-map','scene':'native-script-or-cutscene','scenario':'native-scenario','flag':'native-cutscene-flag','variable':'native-scalar','hook':'authored-hook','milestone':'authored-milestone','branch':'authored-branch'}[row['kind']]
 row['sourceIndex']=map_indices.get(row['sourceSymbol']) if row['kind']=='map' else None
 row['sourceArrayIndex']=None
 row['sourceReduction']='none'
 if row['kind']=='variable':
  if row['sourceSymbol']=='PREVIOUS_MAP':row['sourceSymbol']='GROUND_GETOUT'
  elif row['sourceSymbol']=='EVENT_GONBE_0':row['sourceSymbol']='EVENT_GONBE';row['sourceArrayIndex']=0
  elif row['sourceSymbol']=='EVENT_S07E01_SUM':row['sourceSymbol']='EVENT_S07E01';row['sourceReduction']='sum'
contracts['nativeNamespaces']={'scriptDungeon':'83-row route index','proceduralDungeon':'accepted dungeon generation index','rescueDungeon':'source rescue symbol, absent sentinel represented by null','groundMap':'source index on map identity; adjusted base species map resolved by town owner','scenarioSelect':'continuation pair distinct from quest scenarios'}

# Sources contain only fingerprints/locators, no raw original script bodies.
corpus_hash=hashlib.sha256(pathlib.Path('/tmp/pokemon-campaign-event-corpus.json').read_bytes()).hexdigest()
def document(kind,**kw):return {'schemaVersion':1,'catalogId':'original-blue-campaign-facts','edition':'blue-rescue-team-qualified-facts','kind':kind,**kw}
docs={'contracts':document('contracts',contracts=contracts),'model':document('model',model=model),'predicates':document('predicates',records=P),'transitions':document('transitions',records=T),'routes':document('routes',records=routes,returns=ret),'bosses':document('bosses',records=boss,recruitment=recruit,rematches=rematch),'identities':document('identities',records=ident,callbacks=callbacks),'sources':document('sources',sources=sources,evidence=ev,researchInputSha256=corpus_hash,remainingCapabilities=[{'id':'blue-display-labels','owner':'presentation','blocks':'display-label-fidelity'},{'id':'blue-exchange-adapters','owner':'rescue-exchange','blocks':'dual-slot-and-version-transport'},{'id':'authored-scene-staging','owner':'scenes','blocks':'playable-scenes-and-dialogue'}])}
reference={k:C[k] for k in ['mainStoryJobIntervals','postgameUnlockRules','bossSceneDispatch','recruitmentStoryFlags','scriptDungeonRoutes']}
reference['scriptDungeonRoutes'][0]['id']='SCRIPT_DUNGEON_TINY_WOODS'
(HERE/'source-reference.json').write_text(json.dumps(reference,indent=2)+'\n')
for k,v in docs.items():(HERE/(k+'.json')).write_text(json.dumps(v,indent=2)+'\n')
print({k:len(v.get('records',[])) for k,v in docs.items()})
