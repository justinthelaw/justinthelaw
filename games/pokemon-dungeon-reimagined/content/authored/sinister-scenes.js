/** Original browser scene/staging data; source ownership is comparative.
 * Unselected: these definitions cannot authorize state mutation or entry.
 * Consumers must snapshot the data and prove the named raw owner.
 * @type {import('./campaign-scene-package.js').CampaignScenePackage} */
export const SINISTER_SCENES = {
  "schemaVersion": 1,
  "activation": "unselected",
  "edition": "blue-rescue-team",
  "comparison": {"edition": "red-rescue-team", "commit": "6bcbec4f906938c0243aa2026bcbd41b577bab85", "instructionParity": false},
  "stagingId": "browser-early-campaign-staging-v1",
  "resourceMutation": "caller-owned-only",
  "campaignEnding": false,
  "packageId": "sinister-scenes",
  "catalogRefs": ["campaign-route-04", "campaign-route-05", "campaign-boss-sinister-woods-team-meanies"],
  "scenes": [
    {
      "id": "browser-sinister-first-travel",
      "mapId": "browser-sinister-entry",
      "sourceId": "sinister-entry",
      "entry": {"owner": "EVENT_M01E03A_L008", "mainChapter": 5, "mainStepMinimum": 9, "mainStepMaximum": 9, "requiredReceipts": ["sinister-request-acknowledged", "story-route4-selected", "no-pending-job-return"]},
      "repeat": "first-entry",
      "returnOwner": "enter-story-route4-after-ack",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "The path disappears beneath a canopy of close-set branches. Your partner stops beside you at the entrance to Sinister Woods.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s1",
          "choices": []
        },
        {
          "id": "s1",
          "text": "\"Metapod is somewhere beyond those trees. Team Meanies came ahead of us, so we should keep moving.\"",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    },
    {
      "id": "browser-sinister-retry-travel",
      "mapId": "browser-sinister-entry",
      "sourceId": "sinister-entry",
      "entry": {"owner": "EVENT_M01E03A_L010", "mainChapter": 5, "mainStepMinimum": 10, "mainStepMaximum": 11, "requiredReceipts": ["failed-route4-or5-return-consumed", "story-route4-selected"]},
      "repeat": "retry",
      "returnOwner": "enter-story-route4-after-ack",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "You return to the forest path. Your partner studies the trees, then turns toward you.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s1",
          "choices": []
        },
        {
          "id": "s1",
          "text": "\"We did not reach Metapod last time. We still have a rescue to finish.\"",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    },
    {
      "id": "browser-sinister-first-battle",
      "mapId": "browser-sinister-arena",
      "sourceId": "sinister-fight",
      "entry": {"owner": "CUTSCENE_SINISTER_WOODS_ATTEMPT1", "mainChapter": 5, "mainStepMinimum": 9, "mainStepMaximum": 11, "requiredReceipts": ["fixed-room2-real-actors", "first-variant-selected-from-preflush-flags", "preflush-complete-false", "preflush-reached-false", "selected-first-variant-reached-flush-owned"]},
      "repeat": "first-fight",
      "returnOwner": "resume-authenticated-fixed-fight",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "Your partner searches the clearing for Metapod. A voice behind the trees stops you.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "gengar", "x": 6, "z": 4, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "ekans", "x": 4, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "medicham", "x": 8, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s1",
          "choices": []
        },
        {
          "id": "s1",
          "text": "Gengar steps out with Ekans and Medicham. \"You can turn around. This rescue belongs to us.\"",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "gengar", "x": 6, "z": 4, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "ekans", "x": 4, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "medicham", "x": 8, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s2",
          "choices": []
        },
        {
          "id": "s2",
          "text": "\"Then why block the trail?\" your partner asks. \"Metapod needs help, whoever finds him.\"",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "gengar", "x": 6, "z": 4, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "ekans", "x": 4, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "medicham", "x": 8, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s3",
          "choices": []
        },
        {
          "id": "s3",
          "text": "Medicham smiles. \"A team needs influence. We intend to have plenty of it.\"",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "gengar", "x": 6, "z": 4, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "ekans", "x": 4, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "medicham", "x": 8, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s4",
          "choices": []
        },
        {
          "id": "s4",
          "text": "Ekans adds that Caterpie could join them and Butterfree might pay well. Your partner plants their feet beside you.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "gengar", "x": 6, "z": 4, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "ekans", "x": 4, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "medicham", "x": 8, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s5",
          "choices": []
        },
        {
          "id": "s5",
          "text": "Gengar raises his arms. \"You are in our way.\" The three spread across the clearing.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "gengar", "x": 6, "z": 4, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "ekans", "x": 4, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "medicham", "x": 8, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    },
    {
      "id": "browser-sinister-retry-battle",
      "mapId": "browser-sinister-arena",
      "sourceId": "sinister-fight",
      "entry": {"owner": "CUTSCENE_SINISTER_WOODS_ATTEMPT2", "mainChapter": 5, "mainStepMinimum": 10, "mainStepMaximum": 11, "requiredReceipts": ["fixed-room2-real-actors", "retry-variant-selected-from-preflush-flags", "preflush-complete-false", "preflush-reached-true"]},
      "repeat": "retry-fight",
      "returnOwner": "resume-authenticated-fixed-fight",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "The clearing seems quiet until Team Meanies emerges again. Your partner asks why they have not rescued Metapod already.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "gengar", "x": 6, "z": 4, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "ekans", "x": 4, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "medicham", "x": 8, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s1",
          "choices": []
        },
        {
          "id": "s1",
          "text": "Gengar snaps that his team ran into trouble after the last fight. Ekans looks away; Medicham shifts uneasily.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "gengar", "x": 6, "z": 4, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "ekans", "x": 4, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "medicham", "x": 8, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s2",
          "choices": []
        },
        {
          "id": "s2",
          "text": "A brief laugh escapes your partner. Gengar clenches his fists. \"Enough. We settle this here!\"",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "gengar", "x": 6, "z": 4, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "ekans", "x": 4, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"},
            {"role": "medicham", "x": 8, "z": 5, "facing": "s", "pose": "idle", "actorSource": "authenticated-session"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    },
    {
      "id": "browser-sinister-poststory-clearing",
      "mapId": "browser-sinister-arena",
      "sourceId": "sinister-fight",
      "entry": {"owner": "CUTSCENE_SINISTER_WOODS_POSTSTORY", "mainChapter": null, "mainStepMinimum": null, "mainStepMaximum": null, "requiredReceipts": ["poststory-dispatch-selected", "fixed-room2-empty-owner", "ordinary-or-persistent-complete-precedence-proved"]},
      "repeat": "poststory",
      "returnOwner": "poststory-exit-only",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "The clearing lies still beneath the trees. Team Meanies is gone. Your team prepares to leave the woods.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    },
    {
      "id": "browser-sinister-metapod-found",
      "mapId": "browser-sinister-rescue",
      "sourceId": "sinister-return",
      "entry": {"owner": "EVENT_M01E03A_L011-map185", "mainChapter": 5, "mainStepMinimum": 11, "mainStepMaximum": 11, "requiredReceipts": ["all-three-meanies-faints-authenticated", "route4-won", "route5-zero-expedition-won", "settlement-learning-return-owned"]},
      "repeat": "owner-selected",
      "returnOwner": "request-sinister-home-before-conquest",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "Gengar backs away with Ekans and Medicham, promising another encounter. The trees swallow their retreat.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "gengar", "x": 6, "z": 4, "facing": "s", "pose": "withdraw", "actorSource": "ground-role"},
            {"role": "ekans", "x": 4, "z": 5, "facing": "s", "pose": "withdraw", "actorSource": "ground-role"},
            {"role": "medicham", "x": 8, "z": 5, "facing": "s", "pose": "withdraw", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s1",
          "choices": []
        },
        {
          "id": "s1",
          "text": "A small voice comes from the undergrowth. Metapod appears, still holding his shell stiff with fear.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "metapod", "x": 7, "z": 3, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s2",
          "choices": []
        },
        {
          "id": "s2",
          "text": "\"Caterpie sent us,\" your partner explains. \"You can come home now.\" Metapod relaxes and follows you toward the path.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "metapod", "x": 7, "z": 3, "facing": "s", "pose": "relieved", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    },
    {
      "id": "browser-sinister-home",
      "mapId": "browser-team-base-exterior",
      "sourceId": "sinister-home",
      "entry": {"owner": "EVENT_M01E03A_L011-base34", "mainChapter": 5, "mainStepMinimum": 11, "mainStepMaximum": 11, "requiredReceipts": ["metapod-scene-acknowledged", "settled-route4-resources-once"]},
      "repeat": "owner-selected",
      "returnOwner": "sinister-conquest-main6-dismiss-inside-save-divide",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "Caterpie rushes to meet Metapod outside your base. The two friends turn together to thank your team.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "caterpie", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "metapod", "x": 6, "z": 5, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s1",
          "choices": []
        },
        {
          "id": "s1",
          "text": "Caterpie lowers his head: he has no money for a reward. Your partner reassures him that bringing Metapod back safely is enough.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "caterpie", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "metapod", "x": 6, "z": 5, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s2",
          "choices": []
        },
        {
          "id": "s2",
          "text": "Looking at your small home, your partner imagines a proper rescue team base. Caterpie and Metapod eagerly offer to help when they are older.",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "caterpie", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "metapod", "x": 6, "z": 5, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": "s3",
          "choices": []
        },
        {
          "id": "s3",
          "text": "The friends head home. Your partner watches them go, then smiles at the quiet base. \"We can keep building something good here.\"",
          "placements": [
            {"role": "hero", "x": 5, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "partner", "x": 6, "z": 8, "facing": "n", "pose": "idle", "actorSource": "profile"},
            {"role": "caterpie", "x": 4, "z": 6, "facing": "s", "pose": "idle", "actorSource": "ground-role"},
            {"role": "metapod", "x": 6, "z": 5, "facing": "s", "pose": "idle", "actorSource": "ground-role"}
          ],
          "cue": "dialogue",
          "reducedMotion": "same-pose",
          "next": null,
          "choices": []
        }
      ]
    },
    {
      "id": "browser-sinister-loss-wakeup",
      "mapId": "browser-team-base-interior",
      "sourceId": "sinister-loss",
      "entry": {"owner": "EVENT_M01E03A_L009", "mainChapter": 5, "mainStepMinimum": 10, "mainStepMaximum": 11, "requiredReceipts": ["route4-or5-nonwon-return", "native-mode-not10", "loss-copyback-and-dismissal-consumed"]},
      "repeat": "after-failed-attempt",
      "returnOwner": "inside-base-input-no-conquest",
      "firstStage": "s0",
      "stages": [
        {
          "id": "s0",
          "text": "You wake inside the rescue base. The forest rescue is still unfinished. You can prepare for another attempt.",
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
