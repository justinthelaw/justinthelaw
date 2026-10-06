// Art-only early review export, deliberately separate from whole-roster production.
import { mkdir, writeFile } from 'node:fs/promises';
import { campaign } from './campaign.mjs';
import { painter } from '../production/painter.mjs';
import { pose } from '../production/pose.mjs';
import { refineCampaign } from './refinements.mjs';
refineCampaign(campaign);
function render(c,d,k,f){const a=painter(d,pose(k,f));a.viewDirection=d;c.draw(a);return a.finish();}
import { Raster } from '../pixel/raster.mjs';
const root=new URL('./evidence/',import.meta.url);await mkdir(root,{recursive:true});
const columns=6,sheet=new Raster(columns*192,Math.ceil(campaign.length/columns)*110);
for(const[c,candidate]of campaign.entries()){for(const[d,column]of[[0,0],[1,1]])sheet.paste(render(candidate,d,'idle',0),(c%columns)*192+column*96,Math.floor(c/columns)*110);}
await writeFile(new URL('campaign-cast-unlabeled.png',root),sheet.png());
await writeFile(new URL('campaign-contact-labels.json',root),JSON.stringify(campaign.map(c=>c.identity))+'\n');
console.log(`${campaign.length} campaign anatomy candidates exported for inspection`);
