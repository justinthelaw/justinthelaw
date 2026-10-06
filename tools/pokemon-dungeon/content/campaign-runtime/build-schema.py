"""Derive the versioned closed data vocabulary and JSDoc projections.
This authors a schema, not a validator; independent Ajv/runtime implementations
consume the same schema. No game module is imported or executed.
"""
import json,pathlib
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[3]
KINDS=['model','predicates','transitions','routes','bosses','contracts','identities','sources']
VOCAB=['type','properties','required','additionalProperties','items','minItems','maxItems','minimum','maximum','enum','anyOf']
def signature(v):
 if v is None:return 'null'
 if isinstance(v,bool):return 'boolean'
 if isinstance(v,int):return 'integer'
 if isinstance(v,str):return 'string'
 if isinstance(v,list):return 'array'
 return 'object:'+','.join(sorted(v))+':'+str(v.get('kind',''))
def infer(values):
 groups={}
 for v in values:groups.setdefault(signature(v),[]).append(v)
 if not groups:return {'type':'null'}
 if len(groups)>1:return {'anyOf':[infer(g) for g in groups.values()]}
 key,group=next(iter(groups.items()))
 if key=='null':return {'type':'null'}
 if key=='boolean':return {'type':'boolean','enum':sorted(set(group))}
 if key=='integer':return {'type':'integer','minimum':min(group),'maximum':max(group)}
 if key=='string':return {'type':'string','enum':sorted(set(group))}
 if key=='array':return {'type':'array','minItems':0,'maxItems':max(1,max(map(len,group))),'items':infer([v for g in group for v in g])}
 fields=group[0].keys();return {'type':'object','properties':{k:infer([g[k] for g in group]) for k in fields},'required':list(fields),'additionalProperties':False}
docs={k:json.loads((HERE/(k+'.json')).read_text()) for k in KINDS}
schema={'schemaVersion':1,'catalogId':'original-blue-campaign-facts','kind':'schema','vocabulary':VOCAB,'documents':{k:infer([v]) for k,v in docs.items()}}
(HERE/'schema.json').write_text(json.dumps(schema,indent=2)+'\n')
def js(rule):
 if 'anyOf' in rule:return '('+'|'.join(js(r) for r in rule['anyOf'])+')'
 t=rule['type']
 if t=='null':return 'null'
 if t=='boolean':return 'boolean'
 if t=='integer':return 'number'
 if t=='string':
  # Literal discriminants are safe and useful; IDs remain joined at runtime.
  values=rule['enum']
  return '|'.join(json.dumps(v) for v in values) if len(values)<=15 and all(len(v)<75 for v in values) else 'string'
 if t=='array':return 'ReadonlyArray<'+js(rule['items'])+'>'
 return 'Readonly<{'+','.join(json.dumps(k)+':'+js(v) for k,v in rule['properties'].items())+'}>'
text='/** Generated closed document types from campaign/schema.json; no executable game logic. */\n'
for k,r in schema['documents'].items():text+='/** @typedef {'+js(r)+'} '+k.title()+'Document */\n'
text+='export {};\n'
(ROOT/'games/pokemon-dungeon-reimagined/content/campaign-types.js').write_text(text)
print('Closed schemas and JSDoc document types authored; no game execution.')
