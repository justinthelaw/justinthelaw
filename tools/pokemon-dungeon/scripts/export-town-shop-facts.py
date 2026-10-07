"""Read pinned C/data text; never import or execute game source."""
import argparse
import hashlib
import json
import pathlib
import re

parser = argparse.ArgumentParser()
parser.add_argument("--source-root", type=pathlib.Path, required=True)
parser.add_argument("--check", action="store_true")
args = parser.parse_args()
w = pathlib.Path(__file__).resolve().parents[3]
source = args.source_root / 'src/dungeon_info.c'
s = source.read_text()
items=[r for p in (w/'games/pokemon-dungeon-reimagined/content/effects').glob('items-*.json') for r in json.loads(p.read_text())['records']]
by_symbol={symbol:r for r in items for symbol in r['symbols']}
native_items=json.loads((source.parent.parent/'data/item/item_data.json').read_text())
pools=[]
for name,count,service in [('sRandomItemsSetKecleonShop1',8,'kecleon-items'),('sRandomItemsSetKecleonWares1',4,'kecleon-wares')]:
 body=re.search(r'static const u16 '+name+r'\[\] = \{(.*?)\};',s,re.S)[1]
 categories=[]; entries=[]
 for symbol,percent in re.findall(r'(?:FIRST_CATEGORY_CHANCE|NEXT_CHANCE)\s*\(\s*(\w+),\s*ODDS\(([\d.]+)\)',body):
  threshold=round(float(percent)*100)
  if symbol.startswith('CATEGORY_'):categories.append({'category':symbol.removeprefix('CATEGORY_').lower(),'threshold':threshold})
  else:
   item=by_symbol[symbol]; entries.append({'itemId':item['id'],'category':item['category'],'threshold':threshold,'order':native_items[item['internalId']]['order']})
 pools.append({'serviceId':service,'slots':count,'sourceSymbol':name,'categories':categories,'items':entries})
p=w/'games/pokemon-dungeon-reimagined/content/authored/town-shop-facts.js'
output = ("import { freezeData } from '../../src/domain/state/validate.js';\n\n/** First native story tier, MAIN < (11,0). Red comparative source at\n * 6bcbec4f906938c0243aa2026bcbd41b577bab85. No unsupported stock is pruned.\n * source dungeon_info.c SHA-256: "+hashlib.sha256(source.read_bytes()).hexdigest()+"\n * @type {readonly {serviceId:string,slots:number,sourceSymbol:string,categories:readonly {category:string,threshold:number}[],items:readonly {itemId:string,category:string,threshold:number,order:number}[]}[]} */\nexport const TOWN_SHOP_POOLS = freezeData("+json.dumps(pools,indent=2)+");\n")

if args.check:
    if p.read_text() != output:
        raise SystemExit("Town stock fact source mismatch")
    print("Town stock: two native pools, 8/4 lots, exact source thresholds/item-order joins; no game execution.")
else:
    p.write_text(output)
