/** Original browser scene/staging data; source ownership is comparative.
 * Unselected: these definitions cannot authorize state mutation or entry.
 * Consumers must snapshot the data and prove the named raw owner.
 * @type {import('./campaign-scene-package.js').CampaignScenePackage} */
export const SILENT_CHASM_SCENES = {
  "schemaVersion": 1,
  "activation": "unselected",
  "edition": "blue-rescue-team",
  "comparison": {"edition": "red-rescue-team", "commit": "6bcbec4f906938c0243aa2026bcbd41b577bab85", "instructionParity": false},
  "stagingId": "browser-early-campaign-staging-v1",
  "resourceMutation": "caller-owned-only",
  "campaignEnding": false,
  "packageId": "silent-chasm-scenes",
  "catalogRefs": ["campaign-route-06"],
  "scenes": [
    {
      "id": "browser-silent-morning",
      "mapId": "browser-team-base-interior",
      "sourceId": "silent-morning",
      "entry": {"owner": "EVENT_M01E04A_L001", "mainChapter": 6, "mainStepMinimum": 1, "mainStepMaximum": 1, "requiredReceipts": ["event-divide-init-main6-owned", "clear-count-nonnegative"]},
      "repeat": "first-morning",
      "returnOwner": "set-main6-2-inside-input",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "Morning light reaches the rescue base. You rise to begin another day.",
          "placements": [
            {"role": "hero", "x": 4, "z": 4, "facing": "n", "pose": "wake", "actorSource": "profile"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    },
    {
      "id": "browser-silent-jumpluff-arrival",
      "mapId": "browser-team-base-exterior",
      "sourceId": "silent-request",
      "entry": {"owner": "EVENT_M01E04A_L002-base35", "mainChapter": 6, "mainStepMinimum": 2, "mainStepMaximum": 2, "requiredReceipts": ["outside-base-entry-owned"]},
      "repeat": "owner-selected",
      "returnOwner": "record-qualified-0x3b-then-request-square-recollection",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "Your partner meets you outside the base. A Jumpluff approaches hesitantly, asking whether this is the rescue team.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s1",
          "choices": []
        },
        {
          "id": "s1",
          "text": "Your partner recognizes the visitor from Pokémon Square. The memory returns before Jumpluff can explain.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    },
    {
      "id": "browser-silent-square-recollection",
      "mapId": "browser-pokemon-square",
      "sourceId": "silent-square",
      "entry": {"owner": "EVENT_M01E04A_L002-square12", "mainChapter": 6, "mainStepMinimum": 2, "mainStepMaximum": 2, "requiredReceipts": ["jumpluff-arrival-acknowledged", "qualified-callback0x3b-receipt"]},
      "repeat": "owner-selected",
      "returnOwner": "request-silent-base-agreement",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "You remember Jumpluff appealing to Shiftry in the Square. His friend needed a strong gust of wind to get free.",
          "placements": [
            {"role": "jumpluff-requester", "x": 11, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "shiftry", "x": 12, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s1",
          "choices": []
        },
        {
          "id": "s1",
          "text": "Shiftry dismissed the request, unwilling to work for such a small return. Jumpluff kept pleading for his friend.",
          "placements": [
            {"role": "jumpluff-requester", "x": 11, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "shiftry", "x": 12, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    },
    {
      "id": "browser-silent-base-agreement",
      "mapId": "browser-team-base-exterior",
      "sourceId": "silent-request",
      "entry": {"owner": "EVENT_M01E04A_L002-base36", "mainChapter": 6, "mainStepMinimum": 2, "mainStepMaximum": 2, "requiredReceipts": ["square-recollection-acknowledged"]},
      "repeat": "owner-selected",
      "returnOwner": "enable-silent-job-then-main6-3",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "Back at the base, Jumpluff explains that Shiftry accepted the rescue but has never returned.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s1",
          "choices": []
        },
        {
          "id": "s1",
          "text": "His friend is trapped between rocks. Jumpluff can travel on the wind, but thunderclouds hang over the canyon without even a breeze beneath them.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s2",
          "choices": []
        },
        {
          "id": "s2",
          "text": "Shiftry can make powerful winds with his leafy fans. Jumpluff had hoped they would free his friend. Now both rescuers and friend are missing.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s3",
          "choices": []
        },
        {
          "id": "s3",
          "text": "Your partner notices your resolve. \"We will search for them.\" Jumpluff bobs with relief, and you begin preparing for Silent Chasm.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    },
    {
      "id": "browser-silent-first-cliff",
      "mapId": "browser-silent-cliff",
      "sourceId": "silent-entry",
      "entry": {"owner": "EVENT_M01E04A_L003", "mainChapter": 6, "mainStepMinimum": 3, "mainStepMaximum": 3, "requiredReceipts": ["silent-story-job-enabled", "story-route6-selected", "entry-capacity-and-resources-authenticated"]},
      "repeat": "first-entry",
      "returnOwner": "enter-route6-no-jumpluff-guest",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "Silent Chasm opens below a steep cliff. Jumpluff points into the canyon; his friend is somewhere deep inside.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 8, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s1",
          "choices": []
        },
        {
          "id": "s1",
          "text": "Before you descend, Jumpluff mentions an old tale: an extraordinary creature sleeps in the canyon. Shiftry has not returned, so he thought you should know.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 8, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s2",
          "choices": []
        },
        {
          "id": "s2",
          "text": "Your partner suddenly clutches their stomach. \"Perhaps breakfast was bad... Yours too, right?\"",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 8, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": [
            {"id": "browser-silent-play-along", "label": "My stomach hurts too", "next": "s3"},
            {"id": "browser-silent-feel-fine", "label": "I feel fine", "next": "s4"}
          ]
        },
        {
          "id": "s3",
          "text": "You join the performance. Jumpluff gently points out that you have not eaten this morning. Your partner gives an embarrassed laugh.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "nervous", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "nervous", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 8, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s5",
          "choices": []
        },
        {
          "id": "s4",
          "text": "Your partner protests that you missed their cue. Jumpluff asks how someone with a stomachache can shout so loudly. Your partner sheepishly stands straight.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "nervous", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 8, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s5",
          "choices": []
        },
        {
          "id": "s5",
          "text": "The story is only folklore; Jumpluff knows no more about the creature. Your partner takes a breath. \"We still have to help your friend.\"",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 8, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s6",
          "choices": []
        },
        {
          "id": "s6",
          "text": "Jumpluff says his friend should be near B9F. You and your partner start down the path; Jumpluff stays at the cliff.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 8, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    },
    {
      "id": "browser-silent-rescue-abduction",
      "mapId": "browser-silent-depths",
      "sourceId": "silent-terminal",
      "entry": {"owner": "EVENT_M01E04A_L006-map187", "mainChapter": 6, "mainStepMinimum": 3, "mainStepMaximum": 3, "requiredReceipts": ["route6-b9-cleared", "terminal-learning-return-owned"]},
      "repeat": "owner-selected",
      "returnOwner": "request-silent-home-before-conquest",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "At the bottom of the chasm, the missing Jumpluff answers your call. He is safe, but asks you to look farther back.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-rescued", "x": 7, "z": 4, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s1",
          "choices": []
        },
        {
          "id": "s1",
          "text": "Shiftry lies behind him. Your partner hurries closer, but Shiftry warns you to leave while you can.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-rescued", "x": 7, "z": 4, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "shiftry", "x": 9, "z": 6, "facing": "s", "pose": "fallen", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s2",
          "choices": []
        },
        {
          "id": "s2",
          "text": "The canyon darkens. Lightning fills the sky and a furious cry rolls through the rocks. A huge bird descends toward Shiftry.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-rescued", "x": 7, "z": 4, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "shiftry", "x": 9, "z": 6, "facing": "s", "pose": "fallen", "actorSource": "ground-role"},
            {"role": "zapdos", "x": 10, "z": 2, "facing": "s", "pose": "hover", "actorSource": "ground-role"}
          ],
          "cue": "lightning",
          "reducedMotion": "static-lighting",
          "next": "s3",
          "choices": []
        },
        {
          "id": "s3",
          "text": "The bird accuses Shiftry of disturbing its sleep. Another surge of light obscures the ledge. When you can see again, Shiftry has vanished.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-rescued", "x": 7, "z": 4, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "zapdos", "x": 10, "z": 2, "facing": "s", "pose": "hover", "actorSource": "ground-role"}
          ],
          "cue": "lightning",
          "reducedMotion": "static-lighting",
          "next": "s4",
          "choices": []
        },
        {
          "id": "s4",
          "text": "\"I am Zapdos,\" the bird declares. \"Come to Mt. Thunder if you intend to recover Shiftry.\" It rises above the canyon and disappears.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-rescued", "x": 7, "z": 4, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "zapdos", "x": 10, "z": 2, "facing": "s", "pose": "withdraw", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s5",
          "choices": []
        },
        {
          "id": "s5",
          "text": "Your partner stares into the empty sky. You lead the rescued Jumpluff out of the chasm, carrying news of Shiftry with you.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-rescued", "x": 7, "z": 4, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    },
    {
      "id": "browser-silent-home-act",
      "mapId": "browser-team-base-exterior",
      "sourceId": "silent-home",
      "entry": {"owner": "EVENT_M01E04A_L006-base39", "mainChapter": 6, "mainStepMinimum": 3, "mainStepMaximum": 3, "requiredReceipts": ["rescue-abduction-acknowledged", "route6-resource-settlement-once"]},
      "repeat": "owner-selected",
      "returnOwner": "silent-conquest-main7-dismiss-inside-save-divide",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "The two Jumpluff reunite at your base. The rescued friend explains that Shiftry freed him, but his winds split a thundercloud and woke Zapdos.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "jumpluff-rescued", "x": 6, "z": 5, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s1",
          "choices": []
        },
        {
          "id": "s1",
          "text": "Alakazam arrives with Charizard and Tyranitar. He recognizes Zapdos and links the canyon's unnatural stillness to the recent disasters.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "jumpluff-rescued", "x": 6, "z": 5, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "alakazam", "x": 9, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "charizard", "x": 10, "z": 7, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "tyranitar", "x": 9, "z": 8, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s2",
          "choices": []
        },
        {
          "id": "s2",
          "text": "Alakazam says Shiftry must be rescued. Your partner volunteers, and he warns that Zapdos is far stronger than the enemies you have faced.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "jumpluff-rescued", "x": 6, "z": 5, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "alakazam", "x": 9, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "charizard", "x": 10, "z": 7, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "tyranitar", "x": 9, "z": 8, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s3",
          "choices": []
        },
        {
          "id": "s3",
          "text": "Your partner turns to you. \"We can face this together, can't we?\"",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "jumpluff-rescued", "x": 6, "z": 5, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "alakazam", "x": 9, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "charizard", "x": 10, "z": 7, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "tyranitar", "x": 9, "z": 8, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": [
            {"id": "browser-silent-courage-one", "label": "We can do this", "next": "s4"},
            {"id": "browser-silent-nervous-one", "label": "My stomach hurts", "next": "s7"}
          ]
        },
        {
          "id": "s4",
          "text": "Tyranitar warns that an electric blast can leave you trembling. Your partner waits for your answer.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "jumpluff-rescued", "x": 6, "z": 5, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "alakazam", "x": 9, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "charizard", "x": 10, "z": 7, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "tyranitar", "x": 9, "z": 8, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": [
            {"id": "browser-silent-courage-two", "label": "I am ready", "next": "s5"},
            {"id": "browser-silent-nervous-two", "label": "My stomach hurts", "next": "s7"}
          ]
        },
        {
          "id": "s5",
          "text": "Charizard describes how fierce Zapdos is. Even so, Shiftry is depending on someone coming for him.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "jumpluff-rescued", "x": 6, "z": 5, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "alakazam", "x": 9, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "charizard", "x": 10, "z": 7, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "tyranitar", "x": 9, "z": 8, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": [
            {"id": "browser-silent-courage-three", "label": "We will help him", "next": "s6"},
            {"id": "browser-silent-nervous-three", "label": "My stomach hurts", "next": "s7"}
          ]
        },
        {
          "id": "s6",
          "text": "Your partner stands tall. \"We are a rescue team. We want to help Shiftry too.\"",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "jumpluff-rescued", "x": 6, "z": 5, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "alakazam", "x": 9, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "charizard", "x": 10, "z": 7, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "tyranitar", "x": 9, "z": 8, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s8",
          "choices": []
        },
        {
          "id": "s7",
          "text": "You clutch your stomach. Your partner explains your familiar act, then firmly repeats that you both want to help Shiftry.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "nervous", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "nervous", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "jumpluff-rescued", "x": 6, "z": 5, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "alakazam", "x": 9, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "charizard", "x": 10, "z": 7, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "tyranitar", "x": 9, "z": 8, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s8",
          "choices": []
        },
        {
          "id": "s8",
          "text": "Alakazam accepts your resolve. The two teams will travel separately once they are equipped; he urges careful preparation for Mt. Thunder.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "jumpluff-rescued", "x": 6, "z": 5, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "alakazam", "x": 9, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "charizard", "x": 10, "z": 7, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "tyranitar", "x": 9, "z": 8, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s9",
          "choices": []
        },
        {
          "id": "s9",
          "text": "Your partner looks back at you with renewed energy. \"We have someone to bring home. Let us give this everything we have.\"",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "jumpluff-requester", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "jumpluff-rescued", "x": 6, "z": 5, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "alakazam", "x": 9, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "charizard", "x": 10, "z": 7, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "tyranitar", "x": 9, "z": 8, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    },
    {
      "id": "browser-silent-loss-wakeup",
      "mapId": "browser-team-base-interior",
      "sourceId": "silent-loss",
      "entry": {"owner": "EVENT_M01E04A_L004", "mainChapter": 6, "mainStepMinimum": 3, "mainStepMaximum": 3, "requiredReceipts": ["route6-nonwon-return", "native-mode-not10", "loss-copyback-and-dismissal-consumed"]},
      "repeat": "after-failed-attempt",
      "returnOwner": "inside-base-input-no-conquest",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "You wake inside the rescue base. Jumpluff and Shiftry still need help in Silent Chasm.",
          "placements": [
            {"role": "hero", "x": 4, "z": 4, "facing": "n", "pose": "wake", "actorSource": "profile"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    }
  ]
};
