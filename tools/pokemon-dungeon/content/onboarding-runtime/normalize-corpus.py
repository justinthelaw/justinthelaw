"""Optional data-only reauthoring: python normalize-corpus.py /tmp/pokemon-onboarding-corpus.json.
Reads factual JSON and original project wording; never imports game source.
"""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
INPUT = Path(sys.argv[1])
corpus = json.loads(INPUT.read_text())
text = json.loads((ROOT / 'text.json').read_text())
quiz = corpus['quiz']
base = {'schemaVersion': 1, 'catalogId': 'original-blue-onboarding', 'edition': 'blue-rescue-team-qualified-facts'}

def sha(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(',', ':'), sort_keys=True).encode()).hexdigest()

def write(name, value):
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def document(kind, **values):
    return {**base, 'kind': kind, **values}

def catalog(name):
    return json.loads((REPO / 'games/pokemon-dungeon-reimagined/content/species' / name).read_text())

species_profiles = {p['id']: p for n in range(1, 6) for p in catalog(f'profiles-{n}.json')['records']}
levels = {p['id']: p for n in range(1, 5) for p in catalog(f'levels-{n}.json')['records']}
learnsets = {p['id']: p for p in catalog('learnsets.json')['records']}
move_ids = {m['originalId']: m['id'] for m in catalog('identities.json')['moves']}
questions = []
for q in quiz['questions']:
    authored = text['questions'][q['id']]
    assert len(authored) == len(q['options']) + 1
    facts = {k: q[k] for k in ['id', 'originalIndex', 'sourceSymbol', 'originalQuestionId', 'categoryId', 'selectable']}
    facts['options'] = [{k: o[k] for k in ['index', 'originalAnswerId', 'originalMenuValue', 'scores', 'followUp', 'optionId']} for o in q['options']]
    questions.append({**facts, 'prompt': authored[0], 'options': [{**o, 'text': authored[i+1]} for i, o in enumerate(facts['options'])],
                      'redLocator': {'sourceId': 'red:src/data/personality_test1.h', 'line': q['sourceLocator']['line']},
                      'sharedLocator': {'sourceId': 'upc:quiz', 'renderedLine': q['sharedOriginalLocator']['renderedLine']},
                      'factsSha256': sha(facts), 'evidenceId': 'shared-quiz', 'textProvenanceId': 'project-original-en-v1'})
write('questions.json', document('questions', records=questions))
algorithm = document('algorithm', natureOrder=quiz['natureOrder'], initialScores=quiz['natureInitialScores'], categories=quiz['categories'],
    sampling={'kind': 'question-index-rejection', 'selectableIndices': list(range(55)), 'mainQuestionCount': 8, 'maximumFollowUps': 1,
              'rejectUsedCategory': True, 'markEntireCategoryBeforePresentation': True, 'uniformCategoryDraw': False,
              'rejectionConsumesMainSlot': False, 'followUpConsumesMainSlot': False, 'followUpConsumesCategory': False,
              'followUpQuestionId': 'brave-q2b', 'followUpTriggerOptionId': 'brave-q2a-a0', 'followUpSourceMenuValue': 99,
              'applyTriggerScores': False, 'genderAfterMainQuestions': True, 'evidenceId': 'red-algorithm'},
    integerMapper={'nativeDrawSourceSymbol': 'Rand32Bit', 'nativeInputMask': 65535, 'useLowBits': True, 'inputBits': 16, 'inputMinimum': 0, 'inputMaximum': 65535, 'denominator': 65536,
                   'operation': 'floor-product-divided-by-denominator', 'questionMaximumExclusive': 55, 'tieMaximumExclusive': 13,
                   'questionBucketSizes': quiz['selectionAlgorithm']['originalRandInt']['questionIndexWeightsOnUniformUint16'],
                   'tieBucketSizes': quiz['selectionAlgorithm']['originalRandInt']['tieStartWeightsOnUniformUint16'],
                   'browserStreamCanonicalId': None, 'nativeSequenceParityClaimed': False, 'evidenceId': 'red-algorithm'},
    tieBreak={'kind': 'circular-first-maximum', 'randomStart': True, 'visitCountAfterStart': 12, 'ascendingOrder': True,
              'wrapModulus': 13, 'replaceOnlyIfStrictlyGreater': True, 'uniformAmongMaxima': False,
              'exampleTiedIds': ['hardy', 'docile'], 'exampleIdealWeights': [12, 1], 'exampleIdealDenominator': 13,
              'exampleUint16Weights': [60495, 5041], 'exampleUint16Denominator': 65536, 'evidenceId': 'red-algorithm'},
    sourceLocators=[{'sourceId': 'red:' + r['path'], 'functionName': r['function'], 'line': r['line']} for r in corpus['sourceFunctionLocators'][:3]])
write('algorithm.json', algorithm)
results = [{'natureId': r['natureId'], 'description': text['results'][r['natureId']], 'maleSpeciesId': r['maleSpeciesId'], 'femaleSpeciesId': r['femaleSpeciesId'],
            'formId': None, 'evidenceId': 'shared-results', 'textProvenanceId': 'project-original-en-v1'} for r in quiz['genderResultMap']]
write('results.json', document('results', records=results, gender={'prompt': text['genderPrompt'], 'labels': text['genderLabels'], 'sourceValues': quiz['gender']['sourceValues'],
      'changesScores': False, 'changesResultColumn': True, 'directSpeciesOverride': False, 'evidenceId': 'shared-results'}))
starts = []
for original in corpus['initialization']['startingProfiles']:
    p = species_profiles[original['profileId']]
    l = levels[p['levelResourceId']]
    learn = learnsets[p['learnsetResourceId']]
    roster_moves = [{'slot': i, 'moveId': move_ids[mid], 'originalMoveId': mid, 'learnedAtLevel': 1, 'storedPP': 0} for i, (level, mid) in enumerate([r for r in learn['levelUp'] if r[0] == 1][:4])]
    start = {k: original[k] for k in ['speciesId', 'profileId', 'formId', 'originalInternalId', 'friendAreaId', 'typeIds', 'catalogResources']}
    start['rosterCreation'] = {'level': 1, 'cumulativeExp': 0, 'stats': dict(zip(['hp', 'attack', 'specialAttack', 'defense', 'specialDefense'], l['baseStats'])), 'moves': roster_moves}
    start['firstPlayable'] = {k: original[k] for k in ['level', 'cumulativeExp', 'stats', 'currentHP', 'emptyMoveSlots']}
    start['firstPlayable']['moves'] = [{k: v for k, v in m.items() if k != 'evidence'} for m in original['moves']]
    start['evidence'] = {'creation': 'red-initialization', 'stats': 'blue-profile', 'experience': p['evidence']['experience'], 'moves': 'blue-profile', 'moveFlags': 'red-initialization', 'friendAreaMembership': 'shared-areas'}
    starts.append(start)
write('profiles.json', document('profiles', records=starts))
pairings = []
start_map = {p['speciesId']: p for p in starts}
for original in corpus['initialization']['startingProfiles']:
    hero = original['speciesId']
    for partner in original['eligiblePartnerIdsInOriginalOrder']:
        pairings.append({'heroSpeciesId': hero, 'partnerSpeciesId': partner, 'heroFormId': None, 'partnerFormId': None,
                         'ownedFriendAreaIds': list(dict.fromkeys([start_map[hero]['friendAreaId'], start_map[partner]['friendAreaId']]))})
write('partners.json', document('partners', orderedPool=quiz['partners']['orderedPool'], pairs=pairings,
      policy={'excludeAnySharedNonNoneType': True, 'preservePoolOrder': True, 'genderConditioned': False, 'eligibilityEvidenceId': 'shared-results', 'orderEvidenceId': 'red-algorithm'}))
initialization = document('initialization',
    selectionOrder=['main-questions-with-conditional-followup', 'gender-result-column', 'nature-and-hero-result', 'partner-selection', 'partner-nickname-confirmation', 'opening-awakening-hero-name', 'butterfree-request', 'tiny-woods-first-player-turn'],
    stageOrder=['clear-new-game-records', 'create-level-one-roster', 'own-starter-friend-areas', 'consume-fresh-entry-guard', 'apply-tiny-woods-levels-two-to-five', 'fill-free-move-slots', 'project-full-dungeon-resources'],
    boost={'freshEntryOnly': True, 'initialConsumedFlag': False, 'setConsumedBeforeDungeonCheck': True, 'dungeonId': 'tiny-woods', 'levelsApplied': [2, 3, 4, 5],
           'repeatOnRetry': False, 'repeatOnResume': False, 'applyToAllExistingOnTeamMembers': True, 'hpCap': 999, 'otherStatCap': 255, 'sourcePredicate': 'sub_80980A4', 'canonicalGuardId': None,
           'evidenceId': 'red-initialization'},
    members={'iq': 1, 'tacticSourceSymbol': 'TACTIC_LETS_GO_TOGETHER', 'canonicalTacticId': None,
             'enabledIqSourceSymbols': ['IQ_ITEM_CATCHER', 'IQ_COURSE_CHECKER', 'IQ_ITEM_MASTER'], 'canonicalEnabledIqIds': None, 'selfCurerEnabled': False,
             'exists': True, 'onTeam': True, 'speciesSeen': True, 'heroIsLeader': True, 'partnerIsLeader': False, 'heldItemId': None,
             'belly': 100, 'maximumBelly': 100, 'heroOriginSourceSymbol': 'DUNGEON_JOIN_LOCATION_LEADER', 'partnerOriginSourceSymbol': 'DUNGEON_JOIN_LOCATION_PARTNER',
             'canonicalHeroOriginId': None, 'canonicalPartnerOriginId': None, 'evidenceId': 'red-initialization'},
    moves={'maximumSlots': 4, 'initialEntriesAtLevel': 1, 'appendLevels': [2, 3, 4, 5], 'preserveSourceOrder': True, 'appendToFirstFreeSlot': True,
           'replaceWhenFull': False, 'rosterStoredPP': 0, 'dungeonFullPP': True, 'dungeonFullHP': True, 'ginsengBoost': 0,
           'linkedToPrevious': False, 'setForShortcut': False, 'enabledForAI': True, 'evidenceId': 'red-initialization'},
    economy={'carriedItems': [], 'storedItems': [], 'carriedMoney': 0, 'bankSavings': 0, 'friendAreaOwnershipCost': 0,
             'friendAreasFromSelectedPairOnly': True, 'friendAreaServiceAvailable': False, 'inventoryMenuAvailable': False,
             'inventoryUnlockSourcePredicate': 'QUEST_SET_TEAM_NAME', 'canonicalInventoryUnlockId': None, 'evidenceId': 'red-initialization'},
    party={'memberCount': 2, 'escortCount': 0, 'roles': ['hero', 'partner'], 'leaderRole': 'hero', 'inferLeaderFromArrayIndex': False,
           'recruitmentEnabled': False, 'leaderChangeEnabled': False, 'evolutionEnabled': False, 'clientJoinsParty': False},
    naming={'heroNamePlanSceneId': 'opening-awakening', 'heroCustomNameRequired': False, 'partnerCustomNicknameRequired': False,
            'partnerDefaultName': 'selected-species-display-name', 'nicknameChangesScores': False, 'teamNamedBeforeRescue': False,
            'teamNamePlanSceneId': 'team-base-offer', 'inputRulesCanonicalId': None, 'evidenceId': 'red-initialization'},
    opening={'planSceneOrder': ['opening-awakening', 'butterfree-request', 'caterpie-clearing', 'butterfree-reunion', 'team-base-offer', 'first-mail-delivery'],
             'runtimeSceneIds': None, 'dungeonId': 'tiny-woods', 'floorIds': corpus['tinyWoods']['floorIds'], 'initialFloorId': corpus['tinyWoods']['initialFloorId'],
             'targetSpeciesId': 'pokemon-010', 'requesterSpeciesId': 'pokemon-012', 'bossSpeciesId': None,
             'terminalMapSourceSymbol': 'MAP_TINY_WOODS_END', 'terminalMapSourceIndex': 179, 'terminalMapCanonicalId': None,
             'terminalIsExplorationFloor': False, 'terminalDisplayedFloorLabel': None, 'completionOnFloorThreeEntry': False,
             'completionRequiresRescueAcknowledgement': True, 'failureCompletesObjective': False,
             'reunionRewardBeforeTeamNaming': True, 'firstMailKitAfterTeamNaming': True,
             'rewardGrantCanonicalId': None, 'firstMailKitGrantCanonicalId': None, 'evidenceId': 'red-initialization'},
    integrationJoins=[{'field': field, 'canonicalId': None, 'owner': owner, 'requirement': requirement} for field, owner, requirement in [
      ('initialCampaign', 'P19/P22', 'Accepted scene/cursor/actor/map/profile definitions before campaign creation'),
      ('iq-and-tactic', 'P17', 'Normalize supported source symbols into accepted IQ/tactic IDs and behavior'),
      ('starter-origins', 'P17/P19', 'Bind leader/partner join-location symbols to canonical origin definitions'),
      ('entry-guard', 'P19/P22', 'Bind consumed initial boost state through failure and resume'),
      ('scene-and-grant-ids', 'P19/P22', 'Bind ordered plan scenes, reward and later kit grants to accepted definitions'),
      ('names', 'P19', 'Supply accepted name bounds, validation and correction policy'),
      ('quiz-rng-stream', 'P07/P19', 'Select the accepted named stream and consume uint16 draws without native seed parity claims'),
      ('hidden-power', 'P17', 'Provide actor-conversion parameters; no initial loadout uses Hidden Power')]],
    evidenceId='red-initialization')
write('initialization.json', initialization)
# Retain source fingerprints from the independent corpus, not authored wording.
question_facts = [{k: q[k] for k in ['id', 'originalIndex', 'sourceSymbol', 'originalQuestionId', 'categoryId', 'selectable']} | {'options': [{k:o[k] for k in ['index','originalAnswerId','originalMenuValue','scores','followUp','optionId']} for o in q['options']]} for q in quiz['questions']]
profile_facts = [{k:p[k] for k in ['speciesId','profileId','formId','originalInternalId','level','cumulativeExp','stats','currentHP','emptyMoveSlots','friendAreaId','typeIds','catalogResources']} | {'moves': [{k:v for k,v in m.items() if k!='evidence'} for m in p['moves']]} for p in corpus['initialization']['startingProfiles']]
sources = [{k: s.get(k) for k in ['id','url','scope','path','gitBlob']} for s in corpus['sources']]
for source in catalog('sources.json')['sources']:
    if source['id'] in ['upc-levels', 'red-levels']:
        sources.append({'id':'species:'+source['id'],'url':source['url'],'scope':source['scope'],'path':None,'gitBlob':None})
evidence = [
 {'id':'shared-quiz','qualification':'All 56 question identities and 140 score maps agree with shared-original UPC and pinned Red. Wording is independently authored.', 'sourceIds':['upc:quiz','red:src/data/personality_test1.h']},
 {'id':'shared-results','qualification':'Shared-original nature/gender and same-type partner facts; no post-result species override is authored.', 'sourceIds':['upc:quiz-aid','red:src/data/personality_test1.h','red:src/personality_test2.c']},
 {'id':'red-algorithm','qualification':'Pinned Red comparative exact sampling, integer mapping, circular tie and partner order; no identified Blue binary or native correlated RNG parity.', 'sourceIds':['red:src/personality_test1.c','red:src/random.c','red:src/data/personality_test2.h']},
 {'id':'red-initialization','qualification':'Pinned Red comparative new-game creation, one-time boost, resource conversion, economy, naming and opening order; plan scene names are references, not accepted runtime IDs.', 'sourceIds':['red:src/pokemon.c','red:src/run_dungeon.c','red:src/exclusive_pokemon.c','red:src/main_loops.c','red:src/items.c','red:src/moves.c','red:src/pokemon_3.c','red:src/dungeon_misc.c']},
 {'id':'blue-profile','qualification':'Established species catalog base/growth/learnsets agree between Blue-reported research and pinned Red; starting PP also agrees.', 'sourceIds':['blue:data','red:src/pokemon.c','red:src/moves.c']},
 {'id':'shared-areas','qualification':'Shared-original Friend Area memberships; ownership timing is separately Red comparative.', 'sourceIds':['upc:areas','red:src/friend_area.c']},
 {'id':'upc-shared-original-corroborated-red','qualification':'EXP source qualification inherited from the established species catalog.', 'sourceIds':['species:upc-levels','species:red-levels']},
 {'id':'red-comparative-only','qualification':'Comparative EXP source qualification inherited from the established species catalog; no Blue binary proof.', 'sourceIds':['species:red-levels']},
]
write('sources.json', document('sources', createdAt='2026-10-05', sourceCommit=corpus['sourceCommit'], sources=sources, evidence=evidence,
    textProvenance={'id':'project-original-en-v1','language':'en','basis':'Independent semantic summaries and original project prose; no commercial wording or personality paragraphs copied.', 'humanNarrativeAcceptance':'pending'},
    researchInput={'filename':INPUT.name,'sha256':hashlib.sha256(INPUT.read_bytes()).hexdigest()}, catalogInputHashes=corpus['localProvenance']['catalogInputHashes'],
    factualHashes={'questions':sha(question_facts),'genderResults':sha(quiz['genderResultMap']),'partnerPool':sha(quiz['partners']['orderedPool']),'startingProfiles':sha(profile_facts)},
    blueprintHashes={'algorithm':sha(algorithm),'initialization':sha(initialization)},
    sourceArtifactHashes={'quizNumericSha256':corpus['localProvenance']['quizNumericSha256'],'semanticSummariesSha256':corpus['localProvenance']['semanticSummariesSha256']},
    validationCounts={'questions':56,'selectable':55,'options':140,'categories':14,'natures':13,'genderOutcomes':26,'partners':10,'orderedPairs':129,'startingProfiles':16},
    blueBinaryBuildVerified=False, capabilities={'questionLookup':True,'scoringFacts':True,'resultLookup':True,'partnerPairLookup':True,'startingLoadoutLookup':True,'quizExecution':False,'campaignCreation':False},
    sourceLocators=[{'sourceId':'red:'+r['path'],'functionName':r['function'],'line':r['line']} for r in corpus['sourceFunctionLocators']],
    reusePolicy='Independently structured facts and newly authored English only; public sources grant no blanket commercial content license.'))
print('Normalized 56 questions, 140 options, 13 results, 129 pairs and 16 two-stage starter profiles.')
