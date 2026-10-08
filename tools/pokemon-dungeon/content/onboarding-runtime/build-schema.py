"""Generate the closed structural contract shared by authoring and browser lookup.
All record fields are required; only the 13 sparse nature score keys are optional.
The deliberately small JSON Schema vocabulary is checked by both consumers.
"""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parent
KINDS = ['questions', 'algorithm', 'results', 'partners', 'profiles', 'initialization', 'sources']
TYPES = {type(None):'null', bool:'boolean', int:'integer', str:'string', list:'array', dict:'object'}

def infer(values, path):
    types = sorted({TYPES[type(v)] for v in values})
    schema = {'type': types[0] if len(types) == 1 else types}
    objects = [v for v in values if isinstance(v, dict)]
    if objects:
        names = list(dict.fromkeys(k for v in objects for k in v))
        required = [k for k in names if all(k in v for v in objects)]
        assert len(required) == len(names) or path[-1] == 'scores', path
        schema.update(properties={k:infer([v[k] for v in objects if k in v], path+(k,)) for k in names}, required=required, additionalProperties=False)
        if path[-1] == 'scores':
            schema['properties'] = {name:{'type':'integer','minimum':1,'maximum':4} for name in ['hardy','docile','brave','jolly','impish','naive','timid','hasty','sassy','calm','relaxed','lonely','quirky']}
            schema['required'] = []
    arrays = [v for v in values if isinstance(v, list)]
    if arrays:
        items = [item for v in arrays for item in v]
        schema.update(items=infer(items,path+('*',)) if items else {'type':'null'}, minItems=0, maxItems=4096 if items else 0)
        if path == ('questions','records'): schema.update(minItems=56,maxItems=56)
        if path == ('questions','records','*','options'): schema.update(minItems=2,maxItems=5)
        if path == ('results','records'): schema.update(minItems=13,maxItems=13)
        if path == ('profiles','records'): schema.update(minItems=16,maxItems=16)
        if path == ('partners','pairs'): schema.update(minItems=129,maxItems=129)
        if path == ('partners','orderedPool'): schema.update(minItems=10,maxItems=10)
        if path == ('algorithm','categories'): schema.update(minItems=14,maxItems=14)
        if path == ('algorithm','natureOrder'): schema.update(minItems=13,maxItems=13)
    if 'string' in types: schema.update(minLength=1,maxLength=2048)
    if 'integer' in types: schema.update(minimum=0,maximum=2147483647)
    if len(path) == 2 and path[-1] in ['schemaVersion','catalogId','edition','kind']:
        assert len({json.dumps(v) for v in values}) == 1
        schema['const'] = values[0]
    return schema

# Fixed source facts are independent of the normalized input, so regeneration
# cannot silently turn an altered gender policy into a newly accepted contract.
GENDER_FACTS = {
    'sourceValues': {'male': 0, 'female': 1},
    'changesScores': False, 'changesResultColumn': True,
    'directSpeciesOverride': False, 'evidenceId': 'shared-results',
}
def constants(rule, values):
    for key, value in values.items():
        field = rule['properties'][key]
        if isinstance(value, dict): constants(field, value)
        else: field['const'] = value

schemas = {kind:infer([json.loads((ROOT/f'{kind}.json').read_text())],(kind,)) for kind in KINDS}
constants(schemas['results']['properties']['gender'], GENDER_FACTS)
result = {'schemaVersion':1,'catalogId':'original-blue-onboarding','kind':'schema','vocabulary':['type','properties','required','additionalProperties','items','minItems','maxItems','minimum','maximum','minLength','maxLength','const'], 'documents':schemas}
(ROOT/'schema.json').write_text(json.dumps(result,indent=2)+'\n')
print('Generated seven closed document schemas; sparse scores are the only optional record keys.')
