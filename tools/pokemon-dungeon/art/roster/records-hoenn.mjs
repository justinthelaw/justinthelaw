export const source=`
253|biped|green|12,21,11|belly:red crest:leaf scythes tailfan:leaf
254|biped|green|18,25,15|belly:red crest:leaf scythes tailfan:leaf spots:yellow
256|bird|yellow|17,22,15|belly:orange crest:orange claws
257|humanoid|red|18,28,14|mane:cream belly:yellow claws flames
259|biped|blue|20,23,17|belly:blue fin:navy gills:orange tailfan:navy
260|biped|blue|25,27,20|belly:blue fins:navy gills:orange tailfan:navy claws
261|quad|gray|14,15,22|ears:12 muzzle:black tail:23 stripes:black
262|quad|gray|19,20,28|ears:17 mane:black tail:31 muzzle:black
263|quad|brown|17,15,23|stripes:cream spiky:brown tail:25 mask:brown
264|quad|cream|14,13,31|stripes:brown tail:31 ears:7
265|larva|red|12,17,19|belly:cream spines:cream horn:9
266|pupa|skull|22,19,18|spikes:skull gem:red
267|moth|black|8,20,9|paleWings wings:yellow wingdots:red antennae:black nose:5
268|pupa|purple|21,20,18|spikes:purple gem:red
269|moth|purple|12,18,11|wings:green wingdots:red antennae:yellow
270|quad|blue|18,11,19|leaves:leaf cap:leaf mouth:yellow
271|biped|green|15,21,13|belly:blue cap:leaf lips:red
272|biped|yellow|24,24,20|stripes:brown cap:leaf mouth:yellow
273|egg|brown|17,21,16|cap:gray nose:5
274|biped|brown|17,22,13|belly:cream nose:6 leaves:leaf
276|bird|navy|12,16,12|belly:skull mask:red tailfan:navy
277|bird|navy|15,21,16|belly:skull mask:red wings:navy tailfan:navy
278|bird|skull|12,14,14|wings:skull stripes:blue tailfan:skull
279|bird|skull|23,24,20|belly:yellow nose:14 wings:blue
280|humanoid|skull|9,15,8|cap:green crest:red skirt:skull
281|humanoid|skull|12,23,10|cap:green horns:9 skirt:skull slender
283|spider|blue|10,10,10|hat:yellow slender
284|bug|blue|9,15,10|wings:skull antennae:orange wingdots:yellow
285|plant|cream|21,17,18|spots:green cap:green closed
286|biped|cream|15,24,12|cap:green tail:28 tailhand:green claws
287|quad|brown|18,16,24|claws belly:cream nose:5 closed
288|biped|skull|21,27,17|claws crest:red muzzle:cream
289|biped|brown|29,28,24|belly:cream mane:cream muzzle:cream claws
290|bug|gray|12,13,17|smallwings:green claws mask:green
291|bug|yellow|10,16,12|stripes:black wings:skull smallwings:skull mask:red
292|bug|brown|14,20,12|wings:cream halo:yellow mask:black
293|round|pink|18,19,16|ears:12 closed
294|biped|purple|21,22,17|ears:16 mouth:black belt:yellow
295|biped|purple|25,27,20|pipes:yellow mouth:black tail:27
296|round|yellow|24,24,20|cheeks:red gloves:black crest:yellow belt:black
297|humanoid|cream|27,27,22|skirt:navy hands:orange crest:black
298|round|blue|16,16,14|roundears tail:32 antennaorb:blue
299|rock|navy|23,26,18|nose:red
301|quad|cream|15,17,24|ears:17 ruff:purple tail:31 tailhand:purple
302|humanoid|purple|14,21,11|ears:20 mask:gray gem:red claws
303|humanoid|cream|12,20,10|skirt:black jaw:black ears:13
304|quad|gray|18,12,22|shell:gray spots:black horns:5
305|quad|gray|25,17,27|shell:gray spots:black spines:gray claws
306|biped|gray|26,29,20|belly:gray horns:20 helmet:gray tail:34 thicktail
307|humanoid|blue|12,22,10|hat:skull belt:skull closed slender
309|quad|green|14,14,22|crest:yellow stripes:yellow tail:21
310|quad|blue|19,22,27|mane:yellow crest:yellow tail:30
311|biped|cream|12,17,10|ears:23 cheeks:red tail:20 hands:red
312|biped|cream|12,16,10|ears:24 cheeks:blue tail:19 hands:blue
313|bug|gray|15,20,13|wings:skull belly:black antennae:red ruff:red tailhand:yellow
314|bug|purple|14,19,12|wings:skull ruff:yellow mask:cream crest:purple
315|humanoid|green|10,20,9|hands:red flower:green thorns:green
316|blob|green|21,17,17|crest:yellow closed lips:yellow
317|blob|purple|28,30,22|whiskers diamond:black lips:yellow
318|fish|red|18,20,17|belly:yellow fangs tailfan:yellow fin:blue
319|shark|blue|23,20,26|belly:skull fangs gem:yellow
320|whale|blue|29,24,31|belly:cream stripes:cream
321|whale|blue|30,20,37|belly:cream stripes:cream
322|quad|yellow|21,18,27|belly:cream hump:green ears:8
323|quad|red|25,22,30|humps:gray smoke:gray ring:blue
324|turtle|orange|23,15,24|shell:gray smoke:gray spots:red
325|round|gray|16,20,14|roundears gem:pink springlegs:gray
326|biped|purple|22,24,17|roundears gem:black belly:gray tail:27
327|biped|cream|17,21,13|roundears spots:brown mask:brown tail:18
328|quad|orange|22,15,22|headlarge:orange mouth:black
329|bug|green|10,17,18|wings:green smallwings:green tail:31 mask:yellow
330|dragon|lime|17,26,17|wings:green tail:35 mask:red antennae:green
331|plant|green|21,20,18|cap:yellow spikes:green diamond:green
332|humanoid|green|19,26,14|hat:green spikes:green diamond:black
333|bird|blue|14,17,13|wings:skull antennae:blue
334|bird|blue|17,25,18|wings:skull ruff:skull antennae:blue tailfan:blue
335|biped|skull|21,25,16|ears:11 scars:red claws bushtail:skull
336|serpent|black|19,25,20|fangs stripes:yellow tailfan:red scars:purple
337|orb|cream|25,26,13|crescent:cream nose:7 mask:red
338|orb|orange|20,21,13|spiky:yellow mask:red
339|fish|gray|12,11,26|whiskers stripes:black tailfan:blue
340|fish|blue|25,22,28|whiskers belly:yellow gem:yellow
341|crab|orange|17,12,16|crest:orange belly:cream
342|crab|red|22,16,20|crest:yellow belly:cream stripes:blue
343|bell|brown|14,20,12|stripes:red horn:15
344|orb|black|24,25,18|satellites:black eyesrings:pink skirt:black
345|plant|purple|15,21,13|tentacles:pink cap:pink stalk:brown
346|plant|green|18,24,15|tentacles:pink cap:green spots:yellow
347|bug|gray|14,12,24|smallwings:skull claws stripes:black
348|bug|blue|22,25,20|belly:yellow smallwings:skull claws crest:gray
349|fish|brown|14,18,18|spots:brown tailfan:blue lips:pink
350|serpent|cream|16,26,23|tailfan:blue antennae:red ears:23 spots:red
352|biped|green|18,24,14|belly:yellow stripes:red tail:31 crest:green
353|ghost|navy|15,21,12|horn:18 mask:black
354|ghost|gray|22,24,16|ears:13 zipper:yellow tail:25 gem:yellow
355|ghost|gray|18,23,14|mask:skull gem:red bones:skull
356|biped|gray|26,28,21|bands:gray gem:red hands:cream
357|quad|green|24,24,28|longneck wings:leaf mane:leaf bananas:yellow
358|bell|blue|16,18,12|tailfan:red antennaorb:yellow
361|bell|yellow|20,24,16|mask:black belly:black
362|orb|skull|28,28,23|horns:17 mask:black cracks:black
363|round|blue|26,24,22|belly:cream spots:skull roundears
364|seal|blue|25,24,29|belly:cream mustache
365|seal|blue|29,29,31|belly:cream mane:skull tusks
366|shell|blue|21,16,19|inside:skull pearl:pink
367|serpent|blue|17,24,21|spots:orange fin:orange fangs tailfan:orange
368|serpent|pink|12,22,20|nose:5 fins:purple tailfan:pink
369|fish|brown|21,22,27|spots:brown fins:brown
370|fish|pink|19,23,9|heart:pink lips:pink
371|biped|blue|16,20,13|helmet:gray belly:yellow claws
372|shell|skull|26,25,24|bands:gray feet:blue
373|dragon|blue|23,27,20|belly:cream wings:red tail:35 thicktail muzzle:blue
374|seahorse|blue|10,23,12|gem:red claws helmet:gray
375|rock|blue|26,17,19|claws brow:gray gem:red
376|quad|blue|29,19,30|cross:gray claws mask:red
`;
