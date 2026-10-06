"""Data-only negative validation. Runs authoring scripts, never browser modules."""
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
repo=Path(__file__).resolve().parents[4]; fixture=Path(tempfile.mkdtemp(prefix='onboarding-static-review-'))
for folder in ['tools/pokemon-dungeon/content/onboarding-runtime','games/pokemon-dungeon-reimagined/content/onboarding','games/pokemon-dungeon-reimagined/content/species']:
 shutil.copytree(repo/folder,fixture/folder)
files=['tools/pokemon-dungeon/scripts/export-onboarding.mjs','tools/pokemon-dungeon/scripts/check-onboarding.mjs','games/pokemon-dungeon-reimagined/content/onboarding.js','games/pokemon-dungeon-reimagined/plan/CAMPAIGN.md']
files += [str(p.relative_to(repo)) for p in (repo/'tools/pokemon-dungeon/content/effects-runtime').glob('actions-*.json')]
files += [str(p.relative_to(repo)) for p in (repo/'games/pokemon-dungeon-reimagined/content/dungeons').glob('floors-*.json')]
for name in files:
 target=fixture/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(repo/name,target)
(fixture/'tools/pokemon-dungeon/node_modules').symlink_to(repo/'tools/pokemon-dungeon/node_modules',target_is_directory=True)
root=fixture/'tools/pokemon-dungeon/content/onboarding-runtime'; scripts=fixture/'tools/pokemon-dungeon/scripts'
original={p.name:p.read_text() for p in root.glob('*.json')}
def run(name):return subprocess.run(['node',str(scripts/name)],text=True,capture_output=True)
assert run('check-onboarding.mjs').returncode==0
cases=[
 ('schema.json',['kind'],'set','wrong-schema'),
 ('schema.json',['extra'],'set',1),
 ('schema.json',['documents','profiles','anyOf'],'set',[]),
 ('questions.json',['records',0,'redLocator','line'],'delete',None),
 ('questions.json',['records',0,'options',0,'scores','unknown'],'set',2),
 ('questions.json',['records',0,'options',0,'scores','hardy'],'set',5),
 ('questions.json',['records',0,'options',0,'followUp'],'set','brave-q2b'),
 ('questions.json',['records',0,'options',0,'scores','hardy'],'delete',None),
 ('questions.json',['records',0,'prompt'],'set','An unreviewed replacement question.'),
 ('questions.json',['records',0,'redLocator','sourceId'],'set','missing-source'),
 ('algorithm.json',['sampling','rejectUsedCategory'],'set',False),
 ('algorithm.json',['integerMapper','inputBits'],'delete',None),
 ('algorithm.json',['integerMapper','questionBucketSizes',0],'set',1191),
 ('algorithm.json',['tieBreak','uniformAmongMaxima'],'set',True),
 ('results.json',['records',0,'maleSpeciesId'],'set','pokemon-025'),
 ('results.json',['gender','extra'],'set',False),
 ('partners.json',['pairs',0,'partnerSpeciesId'],'set','pokemon-001'),
 ('partners.json',['pairs',0,'ownedFriendAreaIds'],'set',[]),
 ('profiles.json',['records',0,'rosterCreation','stats','hp'],'delete',None),
 ('profiles.json',['records',0,'rosterCreation','level'],'set',5),
 ('profiles.json',['records',0,'rosterCreation','moves',0,'storedPP'],'set',22),
 ('profiles.json',['records',0,'firstPlayable','moves',0,'currentPP'],'set',0),
 ('profiles.json',['records',0,'evidence','creation'],'delete',None),
 ('initialization.json',['boost','repeatOnRetry'],'set',True),
 ('initialization.json',['economy','carriedMoney'],'set',1),
 ('initialization.json',['opening','runtimeSceneIds'],'set',['invented-scene']),
 ('initialization.json',['naming','teamNamedBeforeRescue'],'set',True),
 ('sources.json',['blueBinaryBuildVerified'],'set',True),
 ('sources.json',['sourceLocators'],'delete',None),
]
# Mutate every declared reference occurrence, not just a representative record.
def reference_paths(value, path=()):
 if isinstance(value, list):
  for index, row in enumerate(value): yield from reference_paths(row, path+(index,))
 elif isinstance(value, dict):
  for key, nested in value.items():
   at=path+(key,)
   if key in ['evidenceId', 'sourceId', 'textProvenanceId'] or key.endswith('EvidenceId'): yield at
   if key=='sourceIds':
    for index in range(len(nested)): yield at+(index,)
   if key=='evidence' and isinstance(nested,dict):
    for field in nested: yield at+(field,)
   yield from reference_paths(nested, at)
reference_count=0
for file,content in original.items():
 if file in ['schema.json','text.json']: continue
 for keys in reference_paths(json.loads(content)):
  cases.append((file,list(keys),'set','missing-reference-id'));reference_count+=1
cases += [
 ('results.json',['gender','changesResultColumn'],'set',False),
 ('results.json',['gender','changesScores'],'set',True),
 ('results.json',['gender','directSpeciesOverride'],'set',True),
 ('results.json',['gender','sourceValues','male'],'set',1),
 ('results.json',['gender','sourceValues','female'],'set',0),
 ('results.json',['gender','evidenceId'],'set','shared-quiz'),
 ('results.json',['gender','prompt'],'set','An unrelated prompt.'),
 ('results.json',['gender','labels','male'],'set','Unreviewed label'),
 ('results.json',['gender','labels','female'],'set','Unreviewed label'),
]
for key in json.loads(original['results.json'])['gender']:
 cases.append(('results.json',['gender',key],'delete',None))
for key in ['male','female']:
 for field in ['sourceValues','labels']:cases.append(('results.json',['gender',field,key],'delete',None))
for name,keys,action,value in cases:
 for file,content in original.items():(root/file).write_text(content)
 doc=json.loads(original[name]); parent=doc
 for key in keys[:-1]: parent=parent[key]
 if action=='delete': del parent[keys[-1]]
 else:parent[keys[-1]]=value
 (root/name).write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n')
 exported=run('export-onboarding.mjs');assert exported.returncode==0,exported.stderr
 checked=run('check-onboarding.mjs');assert checked.returncode!=0,(name,keys,'invalid record accepted')
for file,content in original.items():(root/file).write_text(content)
assert run('export-onboarding.mjs').returncode==0
assert run('check-onboarding.mjs').returncode==0
print(f'Rejected {len(cases)} ({reference_count} reference occurrences) malformed authoring fixtures; valid baseline accepted before and after; no game JS executed. Fixture: {fixture}')
