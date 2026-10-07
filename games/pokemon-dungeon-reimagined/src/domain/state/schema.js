/** Exact finite serialized shapes; corresponding strict types live in contracts/campaign.js.
 * @typedef {{kind:'string'|'number'|'boolean'|'integer'} | {kind:'literal',value:string|number|boolean|null} | {kind:'ref',name:string} | {kind:'instance',name:import('../../contracts.js').InstanceKind} | {kind:'catalog',name:import('../../contracts.js').CatalogKind} | {kind:'array'|'record',value:Shape} | {kind:'tuple'|'union',members:Shape[]} | {kind:'object',fields:Record<string,Shape>}} Shape
 */

/** @type {Readonly<Record<string,Shape>>} */
export const SHAPES = {
  "SteelState": {
    "kind": "object",
    "fields": {
      "startedRevision": {
        "kind": "ref",
        "name": "Int"
      },
      "requestDay": {
        "kind": "ref",
        "name": "Int"
      },
      "priorExpeditions": {
        "kind": "ref",
        "name": "Int"
      },
      "attempts": {
        "kind": "ref",
        "name": "Int"
      },
      "bossVisits": {
        "kind": "ref",
        "name": "Int"
      },
      "rewardCursor": {
        "kind": "ref",
        "name": "Int"
      },
      "bossDefeated": {
        "kind": "boolean"
      },
      "rewardChoice": {
        "kind": "boolean"
      },
      "phase": {
        "kind": "union",
        "members": [
          {
            "kind": "literal",
            "value": "travel"
          },
          {
            "kind": "literal",
            "value": "exploration"
          },
          {
            "kind": "literal",
            "value": "battle-intro"
          },
          {
            "kind": "literal",
            "value": "battle"
          },
          {
            "kind": "literal",
            "value": "departure"
          },
          {
            "kind": "literal",
            "value": "bridge"
          },
          {
            "kind": "literal",
            "value": "crossing"
          },
          {
            "kind": "literal",
            "value": "thanks"
          },
          {
            "kind": "literal",
            "value": "home"
          },
          {
            "kind": "literal",
            "value": "complete"
          },
          {
            "kind": "literal",
            "value": "loss"
          },
          {
            "kind": "literal",
            "value": "ready"
          },
          {
            "kind": "literal",
            "value": "poststory"
          }
        ]
      },
      "lastSessionId": {
        "kind": "union",
        "members": [
          {
            "kind": "ref",
            "name": "SessionId"
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "winRevision": {
        "kind": "union",
        "members": [
          {
            "kind": "ref",
            "name": "Int"
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      }
    }
  },
  "CampaignStateWithSteel": {
    "kind": "object",
    "fields": {
      "steel": {
        "kind": "union",
        "members": [
          {
            "kind": "ref",
            "name": "SteelState"
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "earlyWork": {
        "kind": "union",
        "members": [
          {
            "kind": "ref",
            "name": "EarlyWorkState"
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "speciesSeen": {
        "kind": "ref",
        "name": "SpeciesSeenHistory"
      },
      "schemaVersion": {
        "kind": "literal",
        "value": 1
      },
      "contentRevision": {
        "kind": "ref",
        "name": "ContentRevision"
      },
      "revision": {
        "kind": "ref",
        "name": "Int"
      },
      "idSequence": {
        "kind": "ref",
        "name": "IdSequence"
      },
      "random": {
        "kind": "ref",
        "name": "CampaignRandomStreams"
      },
      "profile": {
        "kind": "ref",
        "name": "CampaignProfile"
      },
      "roster": {
        "kind": "record",
        "value": {
          "kind": "ref",
          "name": "PokemonRecord"
        }
      },
      "selectedPartyIds": {
        "kind": "array",
        "value": {
          "kind": "ref",
          "name": "PokemonId"
        }
      },
      "items": {
        "kind": "record",
        "value": {
          "kind": "ref",
          "name": "ItemInstance"
        }
      },
      "containers": {
        "kind": "record",
        "value": {
          "kind": "ref",
          "name": "ItemContainer"
        }
      },
      "economy": {
        "kind": "ref",
        "name": "EconomyState"
      },
      "progress": {
        "kind": "ref",
        "name": "ProgressState"
      },
      "town": {
        "kind": "ref",
        "name": "TownState"
      },
      "mode": {
        "kind": "union",
        "members": [
          {
            "kind": "literal",
            "value": "town"
          },
          {
            "kind": "literal",
            "value": "scene"
          },
          {
            "kind": "literal",
            "value": "dungeon"
          },
          {
            "kind": "literal",
            "value": "awaitingRescue"
          },
          {
            "kind": "literal",
            "value": "defeat"
          }
        ]
      },
      "session": {
        "kind": "union",
        "members": [
          {
            "kind": "ref",
            "name": "ExpeditionState"
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "pendingScene": {
        "kind": "union",
        "members": [
          {
            "kind": "ref",
            "name": "PendingScene"
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "pendingResult": {
        "kind": "union",
        "members": [
          {
            "kind": "ref",
            "name": "PendingResult"
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "rescue": {
        "kind": "ref",
        "name": "RescueState"
      },
      "options": {
        "kind": "ref",
        "name": "CampaignOptions"
      }
    }
  },
  "NativeScenarioPair": {
    "kind": "object",
    "fields": {
      "chapter": {
        "kind": "integer"
      },
      "step": {
        "kind": "integer"
      }
    }
  },
  "NativeProgressState": {
    "kind": "object",
    "fields": {
      "scenarios": {
        "kind": "object",
        "fields": {
          "MAIN": {
            "kind": "ref",
            "name": "NativeScenarioPair"
          },
          "SUB1": {
            "kind": "ref",
            "name": "NativeScenarioPair"
          },
          "SUB2": {
            "kind": "ref",
            "name": "NativeScenarioPair"
          },
          "SUB3": {
            "kind": "ref",
            "name": "NativeScenarioPair"
          },
          "SUB4": {
            "kind": "ref",
            "name": "NativeScenarioPair"
          },
          "SUB5": {
            "kind": "ref",
            "name": "NativeScenarioPair"
          },
          "SUB6": {
            "kind": "ref",
            "name": "NativeScenarioPair"
          },
          "SUB7": {
            "kind": "ref",
            "name": "NativeScenarioPair"
          },
          "SUB8": {
            "kind": "ref",
            "name": "NativeScenarioPair"
          },
          "SUB9": {
            "kind": "ref",
            "name": "NativeScenarioPair"
          },
          "SELECT": {
            "kind": "ref",
            "name": "NativeScenarioPair"
          }
        }
      },
      "clearCount": {
        "kind": "integer"
      },
      "entryFrequency": {
        "kind": "integer"
      },
      "flags": {
        "kind": "object",
        "fields": {
          "persistent": {
            "kind": "array",
            "value": {
              "kind": "boolean"
            }
          },
          "pending": {
            "kind": "array",
            "value": {
              "kind": "boolean"
            }
          }
        }
      },
      "eventS07E01": {
        "kind": "array",
        "value": {
          "kind": "boolean"
        }
      },
      "eventGonbe": {
        "kind": "tuple",
        "members": [
          {
            "kind": "integer"
          },
          {
            "kind": "integer"
          },
          {
            "kind": "integer"
          },
          {
            "kind": "integer"
          }
        ]
      },
      "scalars": {
        "kind": "object",
        "fields": {
          "baseLevel": {
            "kind": "integer"
          },
          "scriptMode": {
            "kind": "boolean"
          },
          "warpLock": {
            "kind": "integer"
          },
          "previousMap": {
            "kind": "integer"
          },
          "eventLocal": {
            "kind": "integer"
          },
          "dungeonEnter": {
            "kind": "integer"
          },
          "dungeonEnterIndex": {
            "kind": "integer"
          },
          "flagKind": {
            "kind": "integer"
          },
          "flagKindChangeRequest": {
            "kind": "integer"
          },
          "partner1Kind": {
            "kind": "integer"
          },
          "partner2Kind": {
            "kind": "integer"
          }
        }
      }
    }
  },
  "RuleCheck": {
    "kind": "union",
    "members": [
      {"kind":"object","fields":{"ok":{"kind":"literal","value":true}}},
      {
        "kind": "object",
        "fields": {
          "ok": {"kind":"literal","value":false},
          "kind": {"kind":"literal","value":"invalid"},
          "issues": {"kind":"array","value":{"kind":"ref","name":"StateIssue"}}
        }
      },
      {
        "kind": "object",
        "fields": {
          "ok": {"kind":"literal","value":false},
          "kind": {"kind":"literal","value":"unresolved"},
          "requirementIds": {"kind":"array","value":{"kind":"string"}}
        }
      }
    ]
  },
  "StateIssue": {
    "kind": "object",
    "fields": {
      "code": {
        "kind": "union",
        "members": [
          {"kind":"literal","value":"shape"},
          {"kind":"literal","value":"unknown-field"},
          {"kind":"literal","value":"unknown-id"},
          {"kind":"literal","value":"range"},
          {"kind":"literal","value":"relationship"},
          {"kind":"literal","value":"ownership"},
          {"kind":"literal","value":"unsupported-version"},
          {"kind":"literal","value":"content-mismatch"},
          {"kind":"literal","value":"unresolved-rule"}
        ]
      },
      "path": {"kind":"string"},
      "message": {"kind":"string"}
    }
  },
  "InitialCampaignLookup": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {"status":{"kind":"literal","value":"ready"},"value":{"kind":"ref","name":"InitialCampaignDefinition"}}
      },
      {
        "kind": "object",
        "fields": {"status":{"kind":"literal","value":"blocked"},"requirementIds":{"kind":"array","value":{"kind":"string"}}}
      }
    ]
  },
  "InitialCampaignDefinition": {
    "kind": "object",
    "fields": {
      "nativeProgress": {"kind":"ref","name":"NativeProgressState"},
      "profileId": {"kind":"string"},
      "hero": {"kind":"ref","name":"InitialPokemonDefinition"},
      "partner": {"kind":"ref","name":"InitialPokemonDefinition"},
      "selectedRoles": {
        "kind": "array",
        "value": {"kind":"union","members":[{"kind":"literal","value":"hero"},{"kind":"literal","value":"partner"}]}
      },
      "carriedMoney": {"kind":"ref","name":"Int"},
      "bankedMoney": {"kind":"ref","name":"Int"},
      "toolboxItems": {"kind":"array","value":{"kind":"ref","name":"ItemGrant"}},
      "storedItems": {"kind":"array","value":{"kind":"ref","name":"StoredStack"}},
      "friendAreaIds": {"kind":"array","value":{"kind":"ref","name":"FriendAreaId"}},
      "storyNodeId": {"kind":"ref","name":"StoryNodeId"},
      "milestones": {"kind":"array","value":{"kind":"ref","name":"MilestoneId"}},
      "initialBranches": {
        "kind": "array",
        "value": {
          "kind": "object",
          "fields": {"branchId":{"kind":"ref","name":"StoryBranchId"},"nodeId":{"kind":"ref","name":"StoryNodeId"}}
        }
      },
      "rankPoints": {"kind":"ref","name":"Int"},
      "town": {"kind":"ref","name":"InitialTownDefinition"},
      "initialScene": {
        "kind": "object",
        "fields": {
          "sceneId": {"kind":"ref","name":"SceneId"},
          "cursor": {"kind":"ref","name":"Int"},
          "bindings": {
            "kind": "array",
            "value": {
              "kind": "object",
              "fields": {
                "roleId": {"kind":"ref","name":"SceneRoleId"},
                "reference": {
                  "kind": "union",
                  "members": [
                    {
                      "kind": "object",
                      "fields": {
                        "kind": {"kind":"literal","value":"starter"},
                        "role": {
                          "kind": "union",
                          "members": [{"kind":"literal","value":"hero"},{"kind":"literal","value":"partner"}]
                        }
                      }
                    },
                    {
                      "kind": "object",
                      "fields": {
                        "kind": {"kind":"literal","value":"story-actor"},
                        "storyActorId": {"kind":"ref","name":"StoryActorId"}
                      }
                    }
                  ]
                }
              }
            }
          },
          "continuation": {"kind":"ref","name":"InitialContinuation"},
          "awaiting": {"kind":"ref","name":"SceneAwait"}
        }
      },
      "recruitedHistory": {"kind":"array","value":{"kind":"ref","name":"SpeciesForm"}}
    }
  },
  "InitialContinuation": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"town"},"destination":{"kind":"ref","name":"Destination"}}
      },
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"scene"},"sceneId":{"kind":"ref","name":"SceneId"}}},
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"begin-expedition"},
          "dungeonId": {"kind":"ref","name":"DungeonId"},
          "entryPolicyId": {"kind":"ref","name":"PolicyId"}
        }
      }
    ]
  },
  "PolicyId": {"kind":"catalog","name":"policy"},
  "DungeonId": {"kind":"catalog","name":"dungeon"},
  "SceneId": {"kind":"catalog","name":"scene"},
  "Destination": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"floor"},
          "address": {"kind":"ref","name":"FloorAddress"},
          "entryId": {"kind":"string"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"rest"},
          "dungeonId": {"kind":"ref","name":"DungeonId"},
          "sectionId": {"kind":"ref","name":"SectionId"},
          "mapDefinitionId": {"kind":"ref","name":"MapDefinitionId"},
          "entryId": {"kind":"string"}
        }
      },
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"scene"},"sceneId":{"kind":"ref","name":"SceneId"}}},
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"town"},
          "mapDefinitionId": {"kind":"ref","name":"MapDefinitionId"},
          "entryId": {"kind":"string"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"end-expedition"},
          "outcome": {"kind":"ref","name":"FinalOutcome"},
          "policyId": {"kind":"ref","name":"PolicyId"}
        }
      }
    ]
  },
  "FinalOutcome": {
    "kind": "union",
    "members": [
      {"kind":"literal","value":"success"},
      {"kind":"literal","value":"mission-escape"},
      {"kind":"literal","value":"escape-orb"},
      {"kind":"literal","value":"give-up"},
      {"kind":"literal","value":"fainting"},
      {"kind":"literal","value":"wind-expulsion"},
      {"kind":"literal","value":"rescue-abandoned"},
      {"kind":"literal","value":"story-exit"}
    ]
  },
  "MapDefinitionId": {"kind":"catalog","name":"map-definition"},
  "SectionId": {"kind":"catalog","name":"section"},
  "FloorAddress": {
    "kind": "object",
    "fields": {
      "dungeonId": {"kind":"ref","name":"DungeonId"},
      "sectionId": {"kind":"ref","name":"SectionId"},
      "floorId": {"kind":"ref","name":"FloorId"}
    }
  },
  "FloorId": {"kind":"catalog","name":"floor"},
  "StoryActorId": {"kind":"catalog","name":"story-actor"},
  "SceneRoleId": {"kind":"catalog","name":"scene-role"},
  "Int": {"kind":"integer"},
  "InitialTownDefinition": {
    "kind": "object",
    "fields": {
      "mapDefinitionId": {"kind":"ref","name":"MapDefinitionId"},
      "placements": {
        "kind": "array",
        "value": {
          "kind": "object",
          "fields": {
            "reference": {
              "kind": "union",
              "members": [
                {
                  "kind": "object",
                  "fields": {
                    "kind": {"kind":"literal","value":"starter"},
                    "role": {"kind":"union","members":[{"kind":"literal","value":"hero"},{"kind":"literal","value":"partner"}]}
                  }
                },
                {
                  "kind": "object",
                  "fields": {"kind":{"kind":"literal","value":"story-actor"},"storyActorId":{"kind":"ref","name":"StoryActorId"}}
                }
              ]
            },
            "position": {"kind":"ref","name":"GridPosition"},
            "facing": {"kind":"ref","name":"Facing"}
          }
        }
      },
      "day": {"kind":"ref","name":"Int"},
      "serviceStock": {
        "kind": "array",
        "value": {
          "kind": "object",
          "fields": {
            "serviceId": {"kind":"string"},
            "stockRevision": {"kind":"ref","name":"Int"},
            "items": {"kind":"array","value":{"kind":"ref","name":"StoredStack"}}
          }
        }
      }
    }
  },
  "StoredStack": {"kind":"object","fields":{"template":{"kind":"ref","name":"ItemTemplate"},"count":{"kind":"ref","name":"Int"}}},
  "ItemTemplate": {
    "kind": "object",
    "fields": {"itemId":{"kind":"ref","name":"ItemId"},"sticky":{"kind":"boolean"},"payload":{"kind":"ref","name":"ItemPayload"}}
  },
  "ItemPayload": {
    "kind": "union",
    "members": [
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"none"}}},
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"machine"},
          "moveId": {"kind":"ref","name":"MoveId"},
          "state": {"kind":"union","members":[{"kind":"literal","value":"unused"},{"kind":"literal","value":"used"}]}
        }
      },
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"charges"},"remaining":{"kind":"ref","name":"Int"}}},
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"story"},"variantId":{"kind":"ref","name":"ItemVariantId"}}
      }
    ]
  },
  "ItemVariantId": {"kind":"catalog","name":"item-variant"},
  "MoveId": {"kind":"catalog","name":"move"},
  "ItemId": {"kind":"catalog","name":"item"},
  "Facing": {
    "kind": "union",
    "members": [
      {"kind":"literal","value":"n"},
      {"kind":"literal","value":"ne"},
      {"kind":"literal","value":"e"},
      {"kind":"literal","value":"se"},
      {"kind":"literal","value":"s"},
      {"kind":"literal","value":"sw"},
      {"kind":"literal","value":"w"},
      {"kind":"literal","value":"nw"}
    ]
  },
  "GridPosition": {"kind":"object","fields":{"x":{"kind":"ref","name":"Int"},"z":{"kind":"ref","name":"Int"}}},
  "StoryNodeId": {"kind":"catalog","name":"story-node"},
  "StoryBranchId": {"kind":"catalog","name":"story-branch"},
  "MilestoneId": {"kind":"catalog","name":"milestone"},
  "FriendAreaId": {"kind":"catalog","name":"friend-area"},
  "ItemGrant": {"kind":"object","fields":{"template":{"kind":"ref","name":"ItemTemplate"},"quantity":{"kind":"ref","name":"Int"}}},
  "InitialPokemonDefinition": {
    "kind": "object",
    "fields": {
      "identity": {"kind":"ref","name":"SpeciesForm"},
      "growth": {"kind":"ref","name":"PokemonGrowth"},
      "moves": {
        "kind": "array",
        "value": {
          "kind": "object",
          "fields": {
            "moveId": {"kind":"ref","name":"MoveId"},
            "enabled": {"kind":"boolean"},
            "powerBoost": {"kind":"ref","name":"Int"},
            "ppCapacityBonus": {"kind":"ref","name":"Int"}
          }
        }
      },
      "linkedPositionGroups": {"kind":"array","value":{"kind":"array","value":{"kind":"ref","name":"Int"}}},
      "setMovePosition": {"kind":"union","members":[{"kind":"ref","name":"Int"},{"kind":"literal","value":null}]},
      "enabledIqSkillIds": {"kind":"array","value":{"kind":"ref","name":"IqSkillId"}},
      "tacticId": {"kind":"ref","name":"TacticId"},
      "friendAreaId": {"kind":"ref","name":"FriendAreaId"},
      "heldItems": {"kind":"array","value":{"kind":"ref","name":"ItemGrant"}}
    }
  },
  "TacticId": {"kind":"catalog","name":"tactic"},
  "IqSkillId": {"kind":"catalog","name":"iq-skill"},
  "PokemonGrowth": {
    "kind": "object",
    "fields": {
      "level": {"kind":"ref","name":"Int"},
      "totalExperience": {"kind":"ref","name":"Quantity"},
      "naturalStats": {"kind":"ref","name":"StatBlock"},
      "permanentStatBonuses": {"kind":"ref","name":"StatBlock"},
      "iqPoints": {"kind":"ref","name":"Int"}
    }
  },
  "StatBlock": {
    "kind": "object",
    "fields": {
      "hp": {"kind":"ref","name":"Int"},
      "attack": {"kind":"ref","name":"Int"},
      "defense": {"kind":"ref","name":"Int"},
      "specialAttack": {"kind":"ref","name":"Int"},
      "specialDefense": {"kind":"ref","name":"Int"}
    }
  },
  "Quantity": {"kind":"object","fields":{"numerator":{"kind":"ref","name":"Int"},"denominator":{"kind":"ref","name":"Int"}}},
  "SpeciesForm": {
    "kind": "object",
    "fields": {
      "speciesId": {"kind":"ref","name":"SpeciesId"},
      "formId": {"kind":"union","members":[{"kind":"ref","name":"FormId"},{"kind":"literal","value":null}]}
    }
  },
  "FormId": {"kind":"catalog","name":"form"},
  "SpeciesId": {"kind":"catalog","name":"species"},
  "ConfirmedNewGameInput": {
    "kind": "object",
    "fields": {
      "selection": {"kind":"ref","name":"ConfirmedBlueSelection"},
      "heroName": {"kind":"string"},
      "partnerName": {"kind":"string"},
      "teamName": {"kind":"string"},
      "createdAt": {"kind":"string"},
      "seed": {"kind":"ref","name":"RandomWords"},
      "options": {"kind":"ref","name":"CampaignOptions"},
      "initialProfileId": {"kind":"string"}
    }
  },
  "CampaignOptions": {
    "kind": "object",
    "fields": {
      "audio": {
        "kind": "object",
        "fields": {"master":{"kind":"number"},"music":{"kind":"number"},"effects":{"kind":"number"},"muted":{"kind":"boolean"}}
      },
      "reducedMotion": {
        "kind": "union",
        "members": [{"kind":"literal","value":"system"},{"kind":"literal","value":"on"},{"kind":"literal","value":"off"}]
      },
      "camera": {
        "kind": "object",
        "fields": {
          "invertOrbitX": {"kind":"boolean"},
          "invertOrbitY": {"kind":"boolean"},
          "sensitivity": {"kind":"number"},
          "zoom": {"kind":"number"}
        }
      },
      "controls": {
        "kind": "object",
        "fields": {
          "overlay": {
            "kind": "union",
            "members": [{"kind":"literal","value":"auto"},{"kind":"literal","value":"shown"},{"kind":"literal","value":"hidden"}]
          }
        }
      },
      "map": {"kind":"object","fields":{"showExplored":{"kind":"boolean"},"showMoveRange":{"kind":"boolean"}}},
      "accessibility": {
        "kind": "object",
        "fields": {
          "textScale": {"kind":"number"},
          "highContrast": {"kind":"boolean"},
          "colorIndependentIndicators": {"kind":"boolean"}
        }
      }
    }
  },
  "RandomWords": {"kind":"tuple","members":[{"kind":"integer"},{"kind":"integer"},{"kind":"integer"},{"kind":"integer"}]},
  "ConfirmedBlueSelection": {
    "kind": "object",
    "fields": {
      "quizRevision": {"kind":"string"},
      "outcomeId": {"kind":"string"},
      "hero": {"kind":"ref","name":"SpeciesForm"},
      "partner": {"kind":"ref","name":"SpeciesForm"}
    }
  },
  "SpeciesSeenHistory": {"kind":"object","fields": {
    "history":{"kind":"union","members":[{"kind":"literal","value":"from-creation"},{"kind":"literal","value":"legacy-incomplete"}]},
    "startedRevision":{"kind":"ref","name":"Int"},
    "identities":{"kind":"array","value":{"kind":"ref","name":"SpeciesForm"}}
  }},
  "EarlyWorkState": {
    "kind": "object",
    "fields": {
      "history":{"kind":"union","members":[{"kind":"literal","value":"from-town-start"},{"kind":"literal","value":"legacy-postings-unavailable"}]},
      "startedRevision": {
        "kind": "ref",
        "name": "Int"
      },
      "storyExpeditions": {
        "kind": "ref",
        "name": "Int"
      },
      "clientPrompt": {
        "kind": "union",
        "members": [
          {
            "kind": "object",
            "fields": {
              "actorId": {
                "kind": "ref",
                "name": "ActorId"
              },
              "stage": {
                "kind": "union",
                "members": [
                  {
                    "kind": "literal",
                    "value": "rescue"
                  },
                  {
                    "kind": "literal",
                    "value": "leave"
                  },
                  {
                    "kind": "literal",
                    "value": "confirm-leave"
                  },
                  {
                    "kind": "literal",
                    "value": "confirm-stay"
                  }
                ]
              }
            }
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "boardJobIds": {
        "kind": "array",
        "value": {
          "kind": "ref",
          "name": "JobId"
        }
      },
      "mailbox": {
        "kind": "array",
        "value": {
          "kind": "union",
          "members": [
            {
              "kind": "object",
              "fields": {
                "kind": {
                  "kind": "literal",
                  "value": "news"
                },
                "newsId": {
                  "kind": "ref",
                  "name": "Int"
                }
              }
            },
            {
              "kind": "object",
              "fields": {
                "kind": {
                  "kind": "literal",
                  "value": "job"
                },
                "jobId": {
                  "kind": "ref",
                  "name": "JobId"
                }
              }
            }
          ]
        }
      },
      "newsRead": {
        "kind": "array",
        "value": {
          "kind": "ref",
          "name": "Int"
        }
      },
      "mailPending": {
        "kind": "boolean"
      },
      "returned": {
        "kind": "union",
        "members": [
          {
            "kind": "object",
            "fields": {
              "sessionId": {
                "kind": "ref",
                "name": "SessionId"
              },
              "dungeonId": {"kind":"ref","name":"DungeonId"},
              "outcome": {
                "kind": "union",
                "members": [
                  {
                    "kind": "literal",
                    "value": "success"
                  },
                  {
                    "kind": "literal",
                    "value": "fainting"
                  },
                  {
                    "kind": "literal",
                    "value": "wind-expulsion"
                  },
                  {
                    "kind": "literal",
                    "value": "give-up"
                  }
                ]
              },
              "jobIds": {
                "kind": "array",
                "value": {
                  "kind": "ref",
                  "name": "JobId"
                }
              },
              "cursor": {
                "kind": "ref",
                "name": "Int"
              }
            }
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "reward": {
        "kind": "union",
        "members": [
          {
            "kind": "object",
            "fields": {
              "jobId": {
                "kind": "ref",
                "name": "JobId"
              },
              "preparedRevision": {
                "kind": "ref",
                "name": "Int"
              },
              "nextItem": {
                "kind": "ref",
                "name": "Int"
              }
            }
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      }
    }
  },
  "CampaignStateWithWork": {
    "kind": "object",
    "fields": {
      "earlyWork": {
        "kind": "union",
        "members": [
          {
            "kind": "ref",
            "name": "EarlyWorkState"
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "speciesSeen": {
        "kind": "ref",
        "name": "SpeciesSeenHistory"
      },
      "schemaVersion": {
        "kind": "literal",
        "value": 1
      },
      "contentRevision": {
        "kind": "ref",
        "name": "ContentRevision"
      },
      "revision": {
        "kind": "ref",
        "name": "Int"
      },
      "idSequence": {
        "kind": "ref",
        "name": "IdSequence"
      },
      "random": {
        "kind": "ref",
        "name": "CampaignRandomStreams"
      },
      "profile": {
        "kind": "ref",
        "name": "CampaignProfile"
      },
      "roster": {
        "kind": "record",
        "value": {
          "kind": "ref",
          "name": "PokemonRecord"
        }
      },
      "selectedPartyIds": {
        "kind": "array",
        "value": {
          "kind": "ref",
          "name": "PokemonId"
        }
      },
      "items": {
        "kind": "record",
        "value": {
          "kind": "ref",
          "name": "ItemInstance"
        }
      },
      "containers": {
        "kind": "record",
        "value": {
          "kind": "ref",
          "name": "ItemContainer"
        }
      },
      "economy": {
        "kind": "ref",
        "name": "EconomyState"
      },
      "progress": {
        "kind": "ref",
        "name": "ProgressState"
      },
      "town": {
        "kind": "ref",
        "name": "TownState"
      },
      "mode": {
        "kind": "union",
        "members": [
          {
            "kind": "literal",
            "value": "town"
          },
          {
            "kind": "literal",
            "value": "scene"
          },
          {
            "kind": "literal",
            "value": "dungeon"
          },
          {
            "kind": "literal",
            "value": "awaitingRescue"
          },
          {
            "kind": "literal",
            "value": "defeat"
          }
        ]
      },
      "session": {
        "kind": "union",
        "members": [
          {
            "kind": "ref",
            "name": "ExpeditionState"
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "pendingScene": {
        "kind": "union",
        "members": [
          {
            "kind": "ref",
            "name": "PendingScene"
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "pendingResult": {
        "kind": "union",
        "members": [
          {
            "kind": "ref",
            "name": "PendingResult"
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "rescue": {
        "kind": "ref",
        "name": "RescueState"
      },
      "options": {
        "kind": "ref",
        "name": "CampaignOptions"
      }
    }
  },
  "CampaignStateWithSeen": {
    "kind": "object",
    "fields": {
      "speciesSeen": {"kind":"ref","name":"SpeciesSeenHistory"},
      "schemaVersion": {"kind":"literal","value":1},
      "contentRevision": {"kind":"ref","name":"ContentRevision"},
      "revision": {"kind":"ref","name":"Int"},
      "idSequence": {"kind":"ref","name":"IdSequence"},
      "random": {"kind":"ref","name":"CampaignRandomStreams"},
      "profile": {"kind":"ref","name":"CampaignProfile"},
      "roster": {"kind":"record","value":{"kind":"ref","name":"PokemonRecord"}},
      "selectedPartyIds": {"kind":"array","value":{"kind":"ref","name":"PokemonId"}},
      "items": {"kind":"record","value":{"kind":"ref","name":"ItemInstance"}},
      "containers": {"kind":"record","value":{"kind":"ref","name":"ItemContainer"}},
      "economy": {"kind":"ref","name":"EconomyState"},
      "progress": {"kind":"ref","name":"ProgressState"},
      "town": {"kind":"ref","name":"TownState"},
      "mode": {
        "kind": "union",
        "members": [
          {"kind":"literal","value":"town"},
          {"kind":"literal","value":"scene"},
          {"kind":"literal","value":"dungeon"},
          {"kind":"literal","value":"awaitingRescue"},
          {"kind":"literal","value":"defeat"}
        ]
      },
      "session": {"kind":"union","members":[{"kind":"ref","name":"ExpeditionState"},{"kind":"literal","value":null}]},
      "pendingScene": {"kind":"union","members":[{"kind":"ref","name":"PendingScene"},{"kind":"literal","value":null}]},
      "pendingResult": {"kind":"union","members":[{"kind":"ref","name":"PendingResult"},{"kind":"literal","value":null}]},
      "rescue": {"kind":"ref","name":"RescueState"},
      "options": {"kind":"ref","name":"CampaignOptions"}
    }
  },
  "CampaignState": {
    "kind": "object",
    "fields": {
      "schemaVersion": {"kind":"literal","value":1},
      "contentRevision": {"kind":"ref","name":"ContentRevision"},
      "revision": {"kind":"ref","name":"Int"},
      "idSequence": {"kind":"ref","name":"IdSequence"},
      "random": {"kind":"ref","name":"CampaignRandomStreams"},
      "profile": {"kind":"ref","name":"CampaignProfile"},
      "roster": {"kind":"record","value":{"kind":"ref","name":"PokemonRecord"}},
      "selectedPartyIds": {"kind":"array","value":{"kind":"ref","name":"PokemonId"}},
      "items": {"kind":"record","value":{"kind":"ref","name":"ItemInstance"}},
      "containers": {"kind":"record","value":{"kind":"ref","name":"ItemContainer"}},
      "economy": {"kind":"ref","name":"EconomyState"},
      "progress": {"kind":"ref","name":"ProgressState"},
      "town": {"kind":"ref","name":"TownState"},
      "mode": {
        "kind": "union",
        "members": [
          {"kind":"literal","value":"town"},
          {"kind":"literal","value":"scene"},
          {"kind":"literal","value":"dungeon"},
          {"kind":"literal","value":"awaitingRescue"},
          {"kind":"literal","value":"defeat"}
        ]
      },
      "session": {"kind":"union","members":[{"kind":"ref","name":"ExpeditionState"},{"kind":"literal","value":null}]},
      "pendingScene": {"kind":"union","members":[{"kind":"ref","name":"PendingScene"},{"kind":"literal","value":null}]},
      "pendingResult": {"kind":"union","members":[{"kind":"ref","name":"PendingResult"},{"kind":"literal","value":null}]},
      "rescue": {"kind":"ref","name":"RescueState"},
      "options": {"kind":"ref","name":"CampaignOptions"}
    }
  },
  "RescueState": {
    "kind": "object",
    "fields": {
      "suspended": {"kind":"union","members":[{"kind":"ref","name":"SuspendedRun"},{"kind":"literal","value":null}]},
      "records": {"kind":"record","value":{"kind":"ref","name":"RescueRecord"}},
      "importedTeams": {"kind":"record","value":{"kind":"ref","name":"ImportedTeam"}}
    }
  },
  "ImportedTeam": {
    "kind": "object",
    "fields": {
      "teamId": {"kind":"ref","name":"ImportedTeamId"},
      "formatId": {"kind":"string"},
      "digest": {"kind":"string"},
      "teamName": {"kind":"string"},
      "members": {"kind":"array","value":{"kind":"ref","name":"ImportedTeamMember"}}
    }
  },
  "ImportedTeamMember": {
    "kind": "object",
    "fields": {
      "memberKey": {"kind":"string"},
      "identity": {"kind":"ref","name":"SpeciesForm"},
      "nickname": {"kind":"string"},
      "growth": {"kind":"ref","name":"PokemonGrowth"},
      "moves": {"kind":"ref","name":"MoveSet"},
      "iqSkillIds": {"kind":"array","value":{"kind":"ref","name":"IqSkillId"}},
      "tacticId": {"kind":"ref","name":"TacticId"},
      "heldItem": {"kind":"union","members":[{"kind":"ref","name":"ItemGrant"},{"kind":"literal","value":null}]}
    }
  },
  "MoveSet": {
    "kind": "object",
    "fields": {
      "slots": {"kind":"ref","name":"FourMoves"},
      "links": {"kind":"array","value":{"kind":"array","value":{"kind":"ref","name":"MoveSlotId"}}},
      "setMoveSlotId": {"kind":"union","members":[{"kind":"ref","name":"MoveSlotId"},{"kind":"literal","value":null}]}
    }
  },
  "MoveSlotId": {"kind":"instance","name":"move-slot"},
  "FourMoves": {
    "kind": "tuple",
    "members": [
      {"kind":"union","members":[{"kind":"ref","name":"MoveSlot"},{"kind":"literal","value":null}]},
      {"kind":"union","members":[{"kind":"ref","name":"MoveSlot"},{"kind":"literal","value":null}]},
      {"kind":"union","members":[{"kind":"ref","name":"MoveSlot"},{"kind":"literal","value":null}]},
      {"kind":"union","members":[{"kind":"ref","name":"MoveSlot"},{"kind":"literal","value":null}]}
    ]
  },
  "MoveSlot": {
    "kind": "object",
    "fields": {
      "moveSlotId": {"kind":"ref","name":"MoveSlotId"},
      "moveId": {"kind":"ref","name":"MoveId"},
      "enabled": {"kind":"boolean"},
      "powerBoost": {"kind":"ref","name":"Int"},
      "ppCapacityBonus": {"kind":"ref","name":"Int"}
    }
  },
  "ImportedTeamId": {"kind":"instance","name":"imported-team"},
  "RescueRecord": {
    "kind": "object",
    "fields": {
      "requestId": {"kind":"ref","name":"RescueRequestId"},
      "direction": {"kind":"union","members":[{"kind":"literal","value":"self"},{"kind":"literal","value":"other"}]},
      "formatId": {"kind":"string"},
      "digest": {"kind":"string"},
      "destination": {"kind":"ref","name":"FloorAddress"},
      "requesterName": {"kind":"string"},
      "phase": {
        "kind": "union",
        "members": [
          {"kind":"literal","value":"requested"},
          {"kind":"literal","value":"accepted"},
          {"kind":"literal","value":"completed"},
          {"kind":"literal","value":"resumed"},
          {"kind":"literal","value":"thanked"},
          {"kind":"literal","value":"abandoned"}
        ]
      },
      "reward": {"kind":"union","members":[{"kind":"ref","name":"RewardBundle"},{"kind":"literal","value":null}]},
      "linkedJobId": {"kind":"union","members":[{"kind":"ref","name":"JobId"},{"kind":"literal","value":null}]}
    }
  },
  "JobId": {"kind":"instance","name":"job"},
  "RewardBundle": {
    "kind": "object",
    "fields": {
      "money": {"kind":"ref","name":"Int"},
      "rankPoints": {"kind":"ref","name":"Int"},
      "items": {"kind":"array","value":{"kind":"ref","name":"ItemGrant"}},
      "friendAreaIds": {"kind":"array","value":{"kind":"ref","name":"FriendAreaId"}},
      "recruitGrantIds": {"kind":"array","value":{"kind":"ref","name":"GrantId"}}
    }
  },
  "GrantId": {"kind":"catalog","name":"grant"},
  "RescueRequestId": {"kind":"instance","name":"rescue-request"},
  "SuspendedRun": {
    "kind": "object",
    "fields": {
      "requestId": {"kind":"ref","name":"RescueRequestId"},
      "suspendedRevision": {"kind":"ref","name":"Int"},
      "session": {"kind":"ref","name":"ExpeditionState"},
      "itemArchive": {"kind":"ref","name":"ItemArchive"},
      "requestDigest": {"kind":"string"},
      "outcomePolicySetId": {"kind":"ref","name":"PolicyId"}
    }
  },
  "ItemArchive": {
    "kind": "object",
    "fields": {
      "items": {"kind":"record","value":{"kind":"ref","name":"ItemInstance"}},
      "containers": {"kind":"record","value":{"kind":"ref","name":"ItemContainer"}}
    }
  },
  "ItemContainer": {
    "kind": "object",
    "fields": {
      "containerId": {"kind":"ref","name":"ContainerId"},
      "owner": {"kind":"ref","name":"ContainerOwner"},
      "itemIds": {"kind":"array","value":{"kind":"ref","name":"ItemInstanceId"}}
    }
  },
  "ItemInstanceId": {"kind":"instance","name":"item-instance"},
  "ContainerOwner": {
    "kind": "union",
    "members": [
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"campaign-toolbox"}}},
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"pokemon-held"},"pokemonId":{"kind":"ref","name":"PokemonId"}}
      },
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"session-toolbox"},"sessionId":{"kind":"ref","name":"SessionId"}}
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"actor-held"},
          "sessionId": {"kind":"ref","name":"SessionId"},
          "actorId": {"kind":"ref","name":"ActorId"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"floor"},
          "sessionId": {"kind":"ref","name":"SessionId"},
          "mapId": {"kind":"ref","name":"MapId"},
          "position": {"kind":"ref","name":"GridPosition"},
          "placement": {"kind":"union","members":[{"kind":"literal","value":"ground"},{"kind":"literal","value":"buried"}]}
        }
      },
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"result-escrow"},"resultId":{"kind":"ref","name":"ResultId"}}
      }
    ]
  },
  "ResultId": {"kind":"instance","name":"result"},
  "MapId": {"kind":"instance","name":"map"},
  "SessionId": {"kind":"instance","name":"session"},
  "ActorId": {"kind":"instance","name":"actor"},
  "PokemonId": {"kind":"instance","name":"pokemon"},
  "ContainerId": {"kind":"instance","name":"container"},
  "ItemInstance": {
    "kind": "object",
    "fields": {
      "itemInstanceId": {"kind":"ref","name":"ItemInstanceId"},
      "template": {"kind":"ref","name":"ItemTemplate"},
      "quantity": {"kind":"ref","name":"Int"},
      "shopLotId": {"kind":"union","members":[{"kind":"ref","name":"ShopLotId"},{"kind":"literal","value":null}]}
    }
  },
  "ShopLotId": {"kind":"instance","name":"shop-lot"},
  "ExpeditionState": {
    "kind": "object",
    "fields": {
      "sessionId": {"kind":"ref","name":"SessionId"},
      "dungeonId": {"kind":"ref","name":"DungeonId"},
      "purpose": {
        "kind": "union",
        "members": [
          {"kind":"object","fields":{"kind":{"kind":"literal","value":"ordinary"}}},
          {
            "kind": "object",
            "fields": {"kind":{"kind":"literal","value":"story"},"storyNodeId":{"kind":"ref","name":"StoryNodeId"}}
          },
          {
            "kind": "object",
            "fields": {"kind":{"kind":"literal","value":"dojo"},"mazeId":{"kind":"ref","name":"DungeonId"}}
          },
          {
            "kind": "object",
            "fields": {"kind":{"kind":"literal","value":"friend-rescue"},"requestId":{"kind":"ref","name":"RescueRequestId"}}
          },
          {
            "kind": "object",
            "fields": {"kind":{"kind":"literal","value":"imported-maze"},"teamId":{"kind":"ref","name":"ImportedTeamId"}}
          }
        ]
      },
      "status": {"kind":"union","members":[{"kind":"literal","value":"active"},{"kind":"literal","value":"suspended"}]},
      "leaderActorId": {"kind":"ref","name":"ActorId"},
      "teamOrder": {"kind":"array","value":{"kind":"ref","name":"ActorId"}},
      "actors": {"kind":"record","value":{"kind":"ref","name":"SessionActor"}},
      "floor": {"kind":"ref","name":"FloorState"},
      "inventory": {"kind":"ref","name":"ContainerId"},
      "carriedMoney": {"kind":"ref","name":"Int"},
      "shops": {"kind":"record","value":{"kind":"ref","name":"ShopState"}},
      "objectives": {"kind":"array","value":{"kind":"ref","name":"SessionObjective"}},
      "scheduler": {"kind":"ref","name":"SchedulerState"},
      "entry": {"kind":"ref","name":"ExpeditionEntryBaseline"},
      "visitedFloorIds": {"kind":"array","value":{"kind":"ref","name":"FloorId"}},
      "completedEventIds": {"kind":"array","value":{"kind":"ref","name":"GrantId"}},
      "participantSettlements": {"kind":"array","value":{"kind":"ref","name":"ParticipantSettlement"}}
    }
  },
  "ParticipantSettlement": {
    "kind": "object",
    "fields": {
      "actorId": {"kind":"ref","name":"ActorId"},
      "pokemonId": {"kind":"union","members":[{"kind":"ref","name":"PokemonId"},{"kind":"literal","value":null}]},
      "policyId": {"kind":"ref","name":"PolicyId"},
      "revision": {"kind":"ref","name":"Int"},
      "outcome": {
        "kind": "union",
        "members": [
          {"kind":"literal","value":"returned-to-roster"},
          {"kind":"literal","value":"removed-from-team"},
          {"kind":"literal","value":"discarded-temporary"}
        ]
      }
    }
  },
  "ExpeditionEntryBaseline": {
    "kind": "object",
    "fields": {
      "sessionId": {"kind":"ref","name":"SessionId"},
      "entryRevision": {"kind":"ref","name":"Int"},
      "entryPolicyId": {"kind":"ref","name":"PolicyId"},
      "outcomePolicySetId": {"kind":"ref","name":"PolicyId"},
      "entrants": {"kind":"record","value":{"kind":"ref","name":"EntrantBaseline"}},
      "selectedPartyIds": {"kind":"array","value":{"kind":"ref","name":"PokemonId"}},
      "carriedMoney": {"kind":"ref","name":"Int"},
      "toolboxContainerId": {"kind":"ref","name":"ContainerId"},
      "itemArchive": {"kind":"ref","name":"ItemArchive"}
    }
  },
  "EntrantBaseline": {
    "kind": "object",
    "fields": {
      "pokemon": {"kind":"ref","name":"PokemonRecord"},
      "projectedGrowth": {"kind":"ref","name":"PokemonGrowth"},
      "projectedMoves": {"kind":"ref","name":"MoveSet"},
      "projectedIqSkillIds": {"kind":"array","value":{"kind":"ref","name":"IqSkillId"}},
      "projectedResources": {"kind":"ref","name":"ActorResources"},
      "projectedPp": {"kind":"ref","name":"BattleMoves"},
      "projectedTacticId": {"kind":"ref","name":"TacticId"},
      "projectedHiddenPower": {
        "kind": "union",
        "members": [
          {"kind":"object","fields":{"typeId":{"kind":"ref","name":"TypeId"},"power":{"kind":"ref","name":"Int"}}},
          {"kind":"literal","value":null}
        ]
      }
    }
  },
  "TypeId": {"kind":"catalog","name":"type"},
  "BattleMoves": {"kind":"object","fields":{"slots":{"kind":"array","value":{"kind":"ref","name":"BattleMove"}}}},
  "BattleMove": {
    "kind": "object",
    "fields": {
      "moveSlotId": {"kind":"ref","name":"MoveSlotId"},
      "currentPp": {"kind":"ref","name":"Int"},
      "sealed": {"kind":"boolean"},
      "usedForExperience": {"kind":"boolean"}
    }
  },
  "ActorResources": {
    "kind": "object",
    "fields": {
      "hp": {"kind":"ref","name":"Int"},
      "belly": {"kind":"ref","name":"Quantity"},
      "maxBelly": {"kind":"ref","name":"Quantity"},
      "hpRegenerationAccumulator": {"kind":"ref","name":"Quantity"}
    }
  },
  "PokemonRecord": {
    "kind": "object",
    "fields": {
      "pokemonId": {"kind":"ref","name":"PokemonId"},
      "identity": {"kind":"ref","name":"SpeciesForm"},
      "nickname": {"kind":"string"},
      "growth": {"kind":"ref","name":"PokemonGrowth"},
      "moves": {"kind":"ref","name":"MoveSet"},
      "enabledIqSkillIds": {"kind":"array","value":{"kind":"ref","name":"IqSkillId"}},
      "tacticId": {"kind":"ref","name":"TacticId"},
      "friendAreaId": {"kind":"ref","name":"FriendAreaId"},
      "heldContainerId": {"kind":"ref","name":"ContainerId"},
      "origin": {"kind":"ref","name":"PokemonOrigin"},
      "evolutionHistory": {
        "kind": "array",
        "value": {
          "kind": "object",
          "fields": {
            "from": {"kind":"ref","name":"SpeciesForm"},
            "to": {"kind":"ref","name":"SpeciesForm"},
            "level": {"kind":"ref","name":"Int"},
            "policyId": {"kind":"ref","name":"PolicyId"}
          }
        }
      }
    }
  },
  "PokemonOrigin": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"starter"},
          "role": {"kind":"union","members":[{"kind":"literal","value":"hero"},{"kind":"literal","value":"partner"}]},
          "selectionOutcomeId": {"kind":"string"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"recruited"},
          "location": {"kind":"ref","name":"FloorAddress"},
          "metLevel": {"kind":"ref","name":"Int"},
          "sessionId": {"kind":"ref","name":"SessionId"},
          "actor": {"kind":"ref","name":"HistoricalActorRef"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"scripted"},
          "grantId": {"kind":"ref","name":"GrantId"},
          "metLevel": {"kind":"ref","name":"Int"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"evolution-extra"},
          "sourcePokemonId": {"kind":"ref","name":"PokemonId"},
          "evolutionPolicyId": {"kind":"ref","name":"PolicyId"},
          "createdRevision": {"kind":"ref","name":"Int"}
        }
      }
    ]
  },
  "HistoricalActorRef": {
    "kind": "object",
    "fields": {
      "sessionId": {"kind":"ref","name":"SessionId"},
      "mapId": {"kind":"ref","name":"MapId"},
      "actorId": {"kind":"ref","name":"ActorId"},
      "identity": {"kind":"ref","name":"SpeciesForm"}
    }
  },
  "SchedulerState": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {
          "kind": {
            "kind": "literal",
            "value": "ready"
          },
          "roundNumber": {
            "kind": "ref",
            "name": "Int"
          },
          "schedulePolicyId": {
            "kind": "ref",
            "name": "PolicyId"
          },
          "teamSlots": {
            "kind": "array",
            "value": {
              "kind": "union",
              "members": [
                {
                  "kind": "ref",
                  "name": "ActorId"
                },
                {
                  "kind": "literal",
                  "value": null
                }
              ]
            }
          },
          "wildSlots": {
            "kind": "array",
            "value": {
              "kind": "union",
              "members": [
                {
                  "kind": "ref",
                  "name": "ActorId"
                },
                {
                  "kind": "literal",
                  "value": null
                }
              ]
            }
          },
          "continuation": {
            "kind": "ref",
            "name": "TurnContinuation"
          }
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {
            "kind": "literal",
            "value": "choice-paused"
          },
          "roundNumber": {
            "kind": "ref",
            "name": "Int"
          },
          "schedulePolicyId": {
            "kind": "ref",
            "name": "PolicyId"
          },
          "teamSlots": {
            "kind": "array",
            "value": {
              "kind": "union",
              "members": [
                {
                  "kind": "ref",
                  "name": "ActorId"
                },
                {
                  "kind": "literal",
                  "value": null
                }
              ]
            }
          },
          "wildSlots": {
            "kind": "array",
            "value": {
              "kind": "union",
              "members": [
                {
                  "kind": "ref",
                  "name": "ActorId"
                },
                {
                  "kind": "literal",
                  "value": null
                }
              ]
            }
          },
          "continuation": {
            "kind": "ref",
            "name": "TurnContinuation"
          },
          "resultId": {
            "kind": "ref",
            "name": "ResultId"
          }
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {
            "kind": "literal",
            "value": "scene-paused"
          },
          "roundNumber": {
            "kind": "ref",
            "name": "Int"
          },
          "schedulePolicyId": {
            "kind": "ref",
            "name": "PolicyId"
          },
          "teamSlots": {
            "kind": "array",
            "value": {
              "kind": "union",
              "members": [
                {
                  "kind": "ref",
                  "name": "ActorId"
                },
                {
                  "kind": "literal",
                  "value": null
                }
              ]
            }
          },
          "wildSlots": {
            "kind": "array",
            "value": {
              "kind": "union",
              "members": [
                {
                  "kind": "ref",
                  "name": "ActorId"
                },
                {
                  "kind": "literal",
                  "value": null
                }
              ]
            }
          },
          "continuation": {
            "kind": "ref",
            "name": "TurnContinuation"
          },
          "sceneInstanceId": {
            "kind": "ref",
            "name": "SceneInstanceId"
          }
        }
      }
    ]
  },
  "ActorSlotRef": {
    "kind": "object",
    "fields": {
      "side": {
        "kind": "union",
        "members": [
          {
            "kind": "literal",
            "value": "team"
          },
          {
            "kind": "literal",
            "value": "wild"
          }
        ]
      },
      "slot": {
        "kind": "ref",
        "name": "Int"
      },
      "actorId": {
        "kind": "ref",
        "name": "ActorId"
      }
    }
  },
  "TurnContinuation": {
    "kind": "object",
    "fields": {
      "phase": {
        "kind": "ref",
        "name": "Int"
      },
      "pass": {
        "kind": "union",
        "members": [
          {
            "kind": "literal",
            "value": "prephase"
          },
          {
            "kind": "literal",
            "value": "leader"
          },
          {
            "kind": "literal",
            "value": "team"
          },
          {
            "kind": "literal",
            "value": "followers"
          },
          {
            "kind": "literal",
            "value": "follower-end"
          },
          {
            "kind": "literal",
            "value": "wild"
          },
          {
            "kind": "literal",
            "value": "boundary"
          },
          {
            "kind": "literal",
            "value": "phase-end"
          }
        ]
      },
      "step": {
        "kind": "ref",
        "name": "Int"
      },
      "slotIndex": {
        "kind": "ref",
        "name": "Int"
      },
      "followerRound": {
        "kind": "ref",
        "name": "Int"
      },
      "followerOrder": {
        "kind": "array",
        "value": {
          "kind": "ref",
          "name": "ActorSlotRef"
        }
      },
      "followerIndex": {
        "kind": "ref",
        "name": "Int"
      },
      "active": {
        "kind": "union",
        "members": [
          {
            "kind": "ref",
            "name": "ActorSlotRef"
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "stage": {
        "kind": "union",
        "members": [
          {
            "kind": "literal",
            "value": "select"
          },
          {
            "kind": "literal",
            "value": "begin"
          },
          {
            "kind": "literal",
            "value": "experience"
          },
          {
            "kind": "literal",
            "value": "decision"
          },
          {
            "kind": "literal",
            "value": "effect"
          },
          {
            "kind": "literal",
            "value": "after"
          },
          {
            "kind": "literal",
            "value": "refresh"
          }
        ]
      },
      "beginningRan": {
        "kind": "boolean"
      },
      "skipBeginning": {
        "kind": "boolean"
      },
      "replanCount": {
        "kind": "ref",
        "name": "Int"
      },
      "action": {
        "kind": "union",
        "members": [
          {
            "kind": "ref",
            "name": "ResolvedAction"
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "activeEffect": {
        "kind": "union",
        "members": [
          {
            "kind": "ref",
            "name": "EffectCursor"
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "actionStop": {
        "kind": "union",
        "members": [
          {
            "kind": "literal",
            "value": "none"
          },
          {
            "kind": "literal",
            "value": "recruited"
          },
          {
            "kind": "literal",
            "value": "effect-stop"
          }
        ]
      },
      "leaderChanged": {
        "kind": "boolean"
      },
      "terminal": {
        "kind": "union",
        "members": [
          {
            "kind": "literal",
            "value": "none"
          },
          {
            "kind": "literal",
            "value": "floor-transition"
          },
          {
            "kind": "literal",
            "value": "dungeon-exit"
          },
          {
            "kind": "literal",
            "value": "rescue-pending"
          },
          {
            "kind": "literal",
            "value": "failure"
          }
        ]
      },
      "petrifiedSwapPending": {
        "kind": "boolean"
      },
      "special": {
        "kind": "union",
        "members": [
          {
            "kind": "object",
            "fields": {
              "leader": {
                "kind": "ref",
                "name": "ActorSlotRef"
              },
              "leaderChanged": {
                "kind": "boolean"
              },
              "index": {
                "kind": "ref",
                "name": "Int"
              }
            }
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      },
      "flushing": {
        "kind": "union",
        "members": [
          {
            "kind": "object",
            "fields": {
              "order": {
                "kind": "array",
                "value": {
                  "kind": "ref",
                  "name": "ActorSlotRef"
                }
              },
              "index": {
                "kind": "ref",
                "name": "Int"
              },
              "step": {
                "kind": "ref",
                "name": "Int"
              }
            }
          },
          {
            "kind": "literal",
            "value": null
          }
        ]
      }
    }
  },
  "EffectCursor": {
    "kind": "object",
    "fields": {
      "programId": {"kind":"ref","name":"EffectProgramId"},
      "instructionIndex": {"kind":"ref","name":"Int"},
      "action": {"kind":"ref","name":"ResolvedAction"},
      "targetOrder": {"kind":"array","value":{"kind":"ref","name":"ActorSlotRef"}},
      "linkedMoves":{"kind":"array","value":{"kind":"object","fields":{"moveSlotId":{"kind":"ref","name":"MoveSlotId"},"moveId":{"kind":"ref","name":"MoveId"}}}},
      "linkIndex":{"kind":"ref","name":"Int"},
      "reactionStack":{"kind":"array","value":{"kind":"object","fields":{"programId":{"kind":"ref","name":"EffectProgramId"},"instructionIndex":{"kind":"ref","name":"Int"},"source":{"kind":"ref","name":"ActorSlotRef"},"target":{"kind":"union","members":[{"kind":"ref","name":"ActorSlotRef"},{"kind":"literal","value":null}]}}}},
      "targetIndex": {"kind":"ref","name":"Int"},
      "hitIndex": {"kind":"ref","name":"Int"},
      "hitCount": {"kind":"ref","name":"Int"},
      "accumulatedDamage": {"kind":"ref","name":"Int"},
      "selectedMoveId": {"kind":"union","members":[{"kind":"ref","name":"MoveId"},{"kind":"literal","value":null}]},
      "selectedMagnitude": {"kind":"union","members":[{"kind":"ref","name":"Int"},{"kind":"literal","value":null}]}
    }
  },
  "ResolvedAction": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"move"},
          "actorId": {"kind":"ref","name":"ActorId"},
          "destination": {"kind":"ref","name":"GridPosition"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"face"},
          "actorId": {"kind":"ref","name":"ActorId"},
          "facing": {"kind":"ref","name":"Facing"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"union","members":[{"kind":"literal","value":"attack"},{"kind":"literal","value":"struggle"}]},
          "actorId": {"kind":"ref","name":"ActorId"},
          "target": {"kind":"ref","name":"TargetSelector"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"move-use"},
          "actorId": {"kind":"ref","name":"ActorId"},
          "moveSlotId": {"kind":"ref","name":"MoveSlotId"},
          "moveId": {"kind":"ref","name":"MoveId"},
          "target": {"kind":"ref","name":"TargetSelector"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"item"},
          "actorId": {"kind":"ref","name":"ActorId"},
          "itemInstanceId": {"kind":"ref","name":"ItemInstanceId"},
          "operation": {
            "kind": "union",
            "members": [
              {"kind":"literal","value":"use"},
              {"kind":"literal","value":"throw"},
              {"kind":"literal","value":"equip"},
              {"kind":"literal","value":"place"},
              {"kind":"literal","value":"swap"}
            ]
          },
          "target": {"kind":"ref","name":"TargetSelector"}
        }
      },
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"wait"},"actorId":{"kind":"ref","name":"ActorId"}}},
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"exit"},
          "actorId": {"kind":"ref","name":"ActorId"},
          "exitId": {"kind":"ref","name":"ExitId"}
        }
      },
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"escape"},"policyId":{"kind":"ref","name":"PolicyId"}}
      },
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"give-up"}}}
    ]
  },
  "ExitId": {"kind":"instance","name":"exit"},
  "TargetSelector": {
    "kind": "union",
    "members": [
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"self"}}},
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"actor"},"actorId":{"kind":"ref","name":"ActorId"}}},
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"tile"},
          "mapId": {"kind":"ref","name":"MapId"},
          "position": {"kind":"ref","name":"GridPosition"}
        }
      },
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"facing"}}},
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"room"},"roomId":{"kind":"ref","name":"RoomId"}}},
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"floor"}}}
    ]
  },
  "RoomId": {"kind":"instance","name":"room"},
  "EffectProgramId": {"kind":"catalog","name":"effect-program"},
  "SceneInstanceId": {"kind":"instance","name":"scene-instance"},
  "SessionObjective": {
    "kind": "object",
    "fields": {
      "jobId": {"kind":"union","members":[{"kind":"ref","name":"JobId"},{"kind":"literal","value":null}]},
      "definitionId": {"kind":"ref","name":"PolicyId"},
      "state": {
        "kind": "union",
        "members": [
          {"kind":"object","fields":{"kind":{"kind":"literal","value":"pending"}}},
          {
            "kind": "object",
            "fields": {
              "kind": {"kind":"literal","value":"actor-target"},
              "actorId": {"kind":"ref","name":"ActorId"},
              "complete": {"kind":"boolean"}
            }
          },
          {
            "kind": "object",
            "fields": {
              "kind": {"kind":"literal","value":"item-target"},
              "itemId": {"kind":"ref","name":"ItemId"},
              "required": {"kind":"ref","name":"Int"},
              "collected": {"kind":"ref","name":"Int"}
            }
          },
          {
            "kind": "object",
            "fields": {
              "kind": {"kind":"literal","value":"location"},
              "destination": {"kind":"ref","name":"FloorAddress"},
              "reached": {"kind":"boolean"}
            }
          },
          {
            "kind": "object",
            "fields": {"kind":{"kind":"literal","value":"complete"},"completedRevision":{"kind":"ref","name":"Int"}}
          }
        ]
      }
    }
  },
  "ShopState": {
    "kind": "object",
    "fields": {
      "shopId": {"kind":"ref","name":"ShopId"},
      "mapId": {"kind":"ref","name":"MapId"},
      "lifecycle": {"kind":"union","members":[{"kind":"literal","value":"active"},{"kind":"literal","value":"closed"}]},
      "keeperActorIds": {"kind":"array","value":{"kind":"ref","name":"ActorId"}},
      "lotById": {"kind":"record","value":{"kind":"ref","name":"ShopLot"}},
      "moneyPaid": {"kind":"ref","name":"Int"},
      "saleCredit": {"kind":"ref","name":"Int"},
      "pursuit": {
        "kind": "union",
        "members": [{"kind":"literal","value":"none"},{"kind":"literal","value":"accused"},{"kind":"literal","value":"thief"}]
      }
    }
  },
  "ShopLot": {
    "kind": "object",
    "fields": {
      "shopLotId": {"kind":"ref","name":"ShopLotId"},
      "template": {"kind":"ref","name":"ItemTemplate"},
      "unitPurchasePrice": {"kind":"ref","name":"Int"},
      "unitSalePrice": {"kind":"ref","name":"Int"},
      "quantityTaken": {"kind":"ref","name":"Int"},
      "quantityReturned": {"kind":"ref","name":"Int"},
      "quantityPaid": {"kind":"ref","name":"Int"},
      "quantitySoldToShop": {"kind":"ref","name":"Int"}
    }
  },
  "ShopId": {"kind":"instance","name":"shop"},
  "FloorState": {
    "kind": "object",
    "fields": {
      "mapId": {"kind":"ref","name":"MapId"},
      "location": {"kind":"ref","name":"FloorLocation"},
      "definitionId": {"kind":"ref","name":"MapDefinitionId"},
      "width": {"kind":"ref","name":"Int"},
      "height": {"kind":"ref","name":"Int"},
      "tiles": {"kind":"array","value":{"kind":"array","value":{"kind":"ref","name":"TileState"}}},
      "rooms": {"kind":"record","value":{"kind":"ref","name":"RoomState"}},
      "traps": {"kind":"record","value":{"kind":"ref","name":"TrapState"}},
      "exits": {"kind":"record","value":{"kind":"ref","name":"ExitState"}},
      "knowledge": {"kind":"ref","name":"FloorKnowledge"},
      "effects": {"kind":"ref","name":"FloorEffects"},
      "weather": {"kind":"ref","name":"WeatherState"},
      "turnCounter": {"kind":"ref","name":"Int"},
      "arrivalCounter": {"kind":"ref","name":"Int"},
      "windCounter": {"kind":"ref","name":"Int"},
      "triggeredEventIds": {"kind":"array","value":{"kind":"ref","name":"GrantId"}}
    }
  },
  "WeatherState": {
    "kind": "object",
    "fields": {
      "natural": {"kind":"array","value":{"kind":"ref","name":"WeatherId"}},
      "contributions": {
        "kind": "array",
        "value": {
          "kind": "object",
          "fields": {
            "weatherId": {"kind":"ref","name":"WeatherId"},
            "source": {"kind":"ref","name":"EffectSource"},
            "duration": {"kind":"ref","name":"Duration"}
          }
        }
      },
      "damageCounter": {"kind":"ref","name":"Int"}
    }
  },
  "Duration": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"counter"},
          "policyId": {"kind":"ref","name":"PolicyId"},
          "remaining": {"kind":"ref","name":"Int"}
        }
      },
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"indefinite"},"policyId":{"kind":"ref","name":"PolicyId"}}
      },
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"floor"},"policyId":{"kind":"ref","name":"PolicyId"}}},
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"until-action"},"policyId":{"kind":"ref","name":"PolicyId"}}
      }
    ]
  },
  "EffectSource": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"actor"},
          "actor": {"kind":"ref","name":"HistoricalActorRef"},
          "moveId": {"kind":"union","members":[{"kind":"ref","name":"MoveId"},{"kind":"literal","value":null}]}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"item"},
          "itemId": {"kind":"ref","name":"ItemId"},
          "user": {"kind":"union","members":[{"kind":"ref","name":"HistoricalActorRef"},{"kind":"literal","value":null}]}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"trap"},
          "mapId": {"kind":"ref","name":"MapId"},
          "trapId": {"kind":"ref","name":"TrapId"},
          "trapKindId": {"kind":"ref","name":"TrapKindId"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"ability"},
          "actor": {"kind":"ref","name":"HistoricalActorRef"},
          "abilityId": {"kind":"ref","name":"AbilityId"}
        }
      },
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"weather"},"weatherId":{"kind":"ref","name":"WeatherId"}}
      },
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"script"},"grantId":{"kind":"ref","name":"GrantId"}}}
    ]
  },
  "WeatherId": {"kind":"catalog","name":"weather"},
  "AbilityId": {"kind":"catalog","name":"ability"},
  "TrapKindId": {"kind":"catalog","name":"trap-kind"},
  "TrapId": {"kind":"instance","name":"trap"},
  "FloorEffects": {
    "kind": "object",
    "fields": {
      "mudSport": {"kind":"union","members":[{"kind":"ref","name":"AuxiliaryCondition"},{"kind":"literal","value":null}]},
      "waterSport": {"kind":"union","members":[{"kind":"ref","name":"AuxiliaryCondition"},{"kind":"literal","value":null}]}
    }
  },
  "AuxiliaryCondition": {"kind":"object","fields":{"source":{"kind":"ref","name":"EffectSource"},"duration":{"kind":"ref","name":"Duration"}}},
  "FloorKnowledge": {
    "kind": "object",
    "fields": {
      "explored": {"kind":"array","value":{"kind":"array","value":{"kind":"boolean"}}},
      "layoutRevealed": {"kind":"boolean"},
      "stairsRevealed": {"kind":"boolean"},
      "itemSense": {"kind":"boolean"},
      "actorSense": {"kind":"boolean"},
      "itemHoldersIdentified": {"kind":"boolean"}
    }
  },
  "ExitState": {
    "kind": "object",
    "fields": {
      "exitId": {"kind":"ref","name":"ExitId"},
      "position": {"kind":"ref","name":"GridPosition"},
      "kind": {
        "kind": "union",
        "members": [
          {"kind":"literal","value":"stairs-up"},
          {"kind":"literal","value":"stairs-down"},
          {"kind":"literal","value":"warp"},
          {"kind":"literal","value":"boundary"},
          {"kind":"literal","value":"rescue-spot"}
        ]
      },
      "destination": {"kind":"ref","name":"Destination"},
      "lock": {
        "kind": "union",
        "members": [
          {"kind":"object","fields":{"kind":{"kind":"literal","value":"open"}}},
          {
            "kind": "object",
            "fields": {"kind":{"kind":"literal","value":"condition"},"policyId":{"kind":"ref","name":"PolicyId"}}
          }
        ]
      }
    }
  },
  "TrapState": {
    "kind": "object",
    "fields": {
      "trapId": {"kind":"ref","name":"TrapId"},
      "trapKindId": {"kind":"ref","name":"TrapKindId"},
      "position": {"kind":"ref","name":"GridPosition"},
      "revealed": {"kind":"boolean"},
      "affiliation": {
        "kind": "union",
        "members": [{"kind":"literal","value":"team"},{"kind":"literal","value":"hostile"},{"kind":"literal","value":"neutral"}]
      },
      "activation": {
        "kind": "union",
        "members": [{"kind":"literal","value":"armed"},{"kind":"literal","value":"spent"},{"kind":"literal","value":"disabled"}]
      }
    }
  },
  "RoomState": {
    "kind": "object",
    "fields": {
      "roomId": {"kind":"ref","name":"RoomId"},
      "kind": {
        "kind": "union",
        "members": [
          {"kind":"literal","value":"ordinary"},
          {"kind":"literal","value":"monster-house"},
          {"kind":"literal","value":"shop"},
          {"kind":"literal","value":"reward-chamber"}
        ]
      },
      "bounds": {
        "kind": "object",
        "fields": {
          "x": {"kind":"ref","name":"Int"},
          "z": {"kind":"ref","name":"Int"},
          "width": {"kind":"ref","name":"Int"},
          "height": {"kind":"ref","name":"Int"}
        }
      },
      "monsterHouse": {
        "kind": "union",
        "members": [
          {"kind":"literal","value":"none"},
          {"kind":"literal","value":"armed"},
          {"kind":"literal","value":"triggered"},
          {"kind":"literal","value":"cleared"}
        ]
      },
      "initiallyHidden": {"kind":"boolean"}
    }
  },
  "TileState": {
    "kind": "object",
    "fields": {
      "terrainId": {"kind":"ref","name":"TerrainId"},
      "roomId": {"kind":"union","members":[{"kind":"ref","name":"RoomId"},{"kind":"literal","value":null}]},
      "unbreakable": {"kind":"boolean"},
      "junction": {"kind":"boolean"},
      "shopId": {"kind":"union","members":[{"kind":"ref","name":"ShopId"},{"kind":"literal","value":null}]}
    }
  },
  "TerrainId": {"kind":"catalog","name":"terrain"},
  "FloorLocation": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"exploration"},"address":{"kind":"ref","name":"FloorAddress"}}
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"boss"},
          "address": {"kind":"ref","name":"FloorAddress"},
          "encounterId": {"kind":"ref","name":"EncounterId"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"rest"},
          "dungeonId": {"kind":"ref","name":"DungeonId"},
          "sectionId": {"kind":"ref","name":"SectionId"},
          "mapDefinitionId": {"kind":"ref","name":"MapDefinitionId"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"terminal"},
          "dungeonId": {"kind":"ref","name":"DungeonId"},
          "sceneId": {"kind":"ref","name":"SceneId"},
          "mapDefinitionId": {"kind":"ref","name":"MapDefinitionId"}
        }
      }
    ]
  },
  "EncounterId": {"kind":"catalog","name":"encounter"},
  "SessionActor": {
    "kind": "object",
    "fields": {
      "actorId": {"kind":"ref","name":"ActorId"},
      "binding": {"kind":"ref","name":"ActorBinding"},
      "affiliation": {
        "kind": "union",
        "members": [{"kind":"literal","value":"team"},{"kind":"literal","value":"hostile"},{"kind":"literal","value":"neutral"}]
      },
      "identity": {"kind":"ref","name":"SpeciesForm"},
      "growth": {"kind":"ref","name":"PokemonGrowth"},
      "moves": {"kind":"ref","name":"MoveSet"},
      "enabledIqSkillIds": {"kind":"array","value":{"kind":"ref","name":"IqSkillId"}},
      "tacticId": {"kind":"ref","name":"TacticId"},
      "battleMoves": {"kind":"ref","name":"BattleMoves"},
      "resources": {"kind":"ref","name":"ActorResources"},
      "placement": {"kind":"ref","name":"ActorPlacement"},
      "facing": {"kind":"ref","name":"Facing"},
      "conditions": {"kind":"ref","name":"ActorConditions"},
      "auxiliaryConditions": {"kind":"ref","name":"ActorAuxiliaryConditions"},
      "stages": {"kind":"ref","name":"StatStages"},
      "multipliers": {"kind":"ref","name":"StatMultipliers"},
      "speed": {"kind":"ref","name":"ActorSpeedState"},
      "memory": {"kind":"ref","name":"ActorMemory"},
      "overrides": {"kind":"ref","name":"ActorOverrides"},
      "heldContainerId": {"kind":"ref","name":"ContainerId"},
      "gains": {"kind":"ref","name":"RunGains"},
      "ai": {
        "kind": "object",
        "fields": {
          "target": {"kind":"union","members":[{"kind":"ref","name":"TargetSelector"},{"kind":"literal","value":null}]},
          "destination": {"kind":"union","members":[{"kind":"ref","name":"GridPosition"},{"kind":"literal","value":null}]},
          "waitingForLeader": {"kind":"boolean"}
        }
      }
    }
  },
  "RunGains": {
    "kind": "object",
    "fields": {
      "experience": {"kind":"ref","name":"Quantity"},
      "statItems": {"kind":"ref","name":"StatBlock"},
      "iq": {"kind":"ref","name":"Int"},
      "maxBelly": {"kind":"ref","name":"Quantity"},
      "moveBoosts": {
        "kind": "array",
        "value": {
          "kind": "object",
          "fields": {"moveSlotId":{"kind":"ref","name":"MoveSlotId"},"amount":{"kind":"ref","name":"Int"}}
        }
      }
    }
  },
  "ActorOverrides": {
    "kind": "object",
    "fields": {
      "types": {
        "kind": "union",
        "members": [{"kind":"array","value":{"kind":"ref","name":"TypeId"}},{"kind":"literal","value":null}]
      },
      "abilities": {
        "kind": "union",
        "members": [{"kind":"array","value":{"kind":"ref","name":"AbilityId"}},{"kind":"literal","value":null}]
      },
      "form": {
        "kind": "union",
        "members": [
          {
            "kind": "object",
            "fields": {"formId":{"kind":"ref","name":"FormId"},"policyId":{"kind":"ref","name":"PolicyId"}}
          },
          {"kind":"literal","value":null}
        ]
      },
      "hiddenPower": {
        "kind": "union",
        "members": [
          {"kind":"object","fields":{"typeId":{"kind":"ref","name":"TypeId"},"power":{"kind":"ref","name":"Int"}}},
          {"kind":"literal","value":null}
        ]
      }
    }
  },
  "ActorMemory": {
    "kind": "object",
    "fields": {
      "lastUsedMove": {
        "kind": "union",
        "members": [
          {
            "kind": "object",
            "fields": {
              "moveId": {"kind":"ref","name":"MoveId"},
              "moveSlotId": {"kind":"union","members":[{"kind":"ref","name":"MoveSlotId"},{"kind":"literal","value":null}]}
            }
          },
          {"kind":"literal","value":null}
        ]
      },
      "lastIncomingMove": {
        "kind": "union",
        "members": [
          {
            "kind": "object",
            "fields": {"moveId":{"kind":"ref","name":"MoveId"},"from":{"kind":"ref","name":"HistoricalActorRef"}}
          },
          {"kind":"literal","value":null}
        ]
      },
      "lastDamage": {
        "kind": "union",
        "members": [
          {
            "kind": "object",
            "fields": {
              "amount": {"kind":"ref","name":"Int"},
              "category": {
                "kind": "union",
                "members": [
                  {"kind":"literal","value":"physical"},
                  {"kind":"literal","value":"special"},
                  {"kind":"literal","value":"other"}
                ]
              },
              "from": {"kind":"union","members":[{"kind":"ref","name":"HistoricalActorRef"},{"kind":"literal","value":null}]}
            }
          },
          {"kind":"literal","value":null}
        ]
      },
      "furyCutterCount": {"kind":"ref","name":"Int"},
      "protectCount": {"kind":"ref","name":"Int"},
      "stockpileCount": {"kind":"ref","name":"Int"},
      "attackedThisOpportunity": {"kind":"boolean"},
      "movedThisOpportunity": {"kind":"boolean"},
      "experienceContributors": {"kind":"array","value":{"kind":"ref","name":"ActorId"}}
    }
  },
  "ActorSpeedState": {
    "kind": "object",
    "fields": {
      "positiveTimers": {
        "kind": "array",
        "value": {
          "kind": "ref",
          "name": "Int"
        }
      },
      "negativeTimers": {
        "kind": "array",
        "value": {
          "kind": "ref",
          "name": "Int"
        }
      },
      "cachedStage": {
        "kind": "ref",
        "name": "Int"
      },
      "speedBoostCounter": {
        "kind": "ref",
        "name": "Int"
      },
      "attackLocked": {
        "kind": "boolean"
      },
      "speedRaisedThisAction": {
        "kind": "boolean"
      },
      "movementPending": {
        "kind": "boolean"
      },
      "endEffectsPending": {
        "kind": "boolean"
      },
      "deferred": {
        "kind": "boolean"
      },
      "swapSkip": {
        "kind": "boolean"
      },
      "petrifiedSwap": {
        "kind": "boolean"
      },
      "replan": {
        "kind": "boolean"
      }
    }
  },
  "StatMultipliers": {
    "kind": "object",
    "fields": {
      "attack": {"kind":"ref","name":"Quantity"},
      "defense": {"kind":"ref","name":"Quantity"},
      "specialAttack": {"kind":"ref","name":"Quantity"},
      "specialDefense": {"kind":"ref","name":"Quantity"}
    }
  },
  "StatStages": {
    "kind": "object",
    "fields": {
      "attack": {"kind":"ref","name":"Int"},
      "defense": {"kind":"ref","name":"Int"},
      "specialAttack": {"kind":"ref","name":"Int"},
      "specialDefense": {"kind":"ref","name":"Int"},
      "accuracy": {"kind":"ref","name":"Int"},
      "evasion": {"kind":"ref","name":"Int"}
    }
  },
  "ActorAuxiliaryConditions": {
    "kind": "object",
    "fields": {
      "perishSong": {"kind":"union","members":[{"kind":"ref","name":"AuxiliaryCondition"},{"kind":"literal","value":null}]},
      "muzzled": {"kind":"union","members":[{"kind":"ref","name":"AuxiliaryCondition"},{"kind":"literal","value":null}]},
      "grudge": {"kind":"union","members":[{"kind":"ref","name":"AuxiliaryCondition"},{"kind":"literal","value":null}]},
      "exposed": {"kind":"union","members":[{"kind":"ref","name":"AuxiliaryCondition"},{"kind":"literal","value":null}]}
    }
  },
  "ActorConditions": {
    "kind": "object",
    "fields": {
      "sleep": {"kind":"union","members":[{"kind":"ref","name":"ConditionState"},{"kind":"literal","value":null}]},
      "burn": {"kind":"union","members":[{"kind":"ref","name":"ConditionState"},{"kind":"literal","value":null}]},
      "frozen": {"kind":"union","members":[{"kind":"ref","name":"ConditionState"},{"kind":"literal","value":null}]},
      "cringe": {"kind":"union","members":[{"kind":"ref","name":"ConditionState"},{"kind":"literal","value":null}]},
      "bide": {"kind":"union","members":[{"kind":"ref","name":"ConditionState"},{"kind":"literal","value":null}]},
      "reflect": {"kind":"union","members":[{"kind":"ref","name":"ConditionState"},{"kind":"literal","value":null}]},
      "curse": {"kind":"union","members":[{"kind":"ref","name":"ConditionState"},{"kind":"literal","value":null}]},
      "leechSeed": {"kind":"union","members":[{"kind":"ref","name":"ConditionState"},{"kind":"literal","value":null}]},
      "sureShot": {"kind":"union","members":[{"kind":"ref","name":"ConditionState"},{"kind":"literal","value":null}]},
      "longToss": {"kind":"union","members":[{"kind":"ref","name":"ConditionState"},{"kind":"literal","value":null}]},
      "invisible": {"kind":"union","members":[{"kind":"ref","name":"ConditionState"},{"kind":"literal","value":null}]},
      "blinker": {"kind":"union","members":[{"kind":"ref","name":"ConditionState"},{"kind":"literal","value":null}]}
    }
  },
  "ConditionState": {
    "kind": "object",
    "fields": {
      "statusId": {"kind":"ref","name":"StatusId"},
      "source": {"kind":"ref","name":"EffectSource"},
      "duration": {"kind":"ref","name":"Duration"},
      "periodicCountdown": {"kind":"union","members":[{"kind":"ref","name":"Int"},{"kind":"literal","value":null}]},
      "payload": {"kind":"ref","name":"ConditionPayload"}
    }
  },
  "ConditionPayload": {
    "kind": "union",
    "members": [
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"none"}}},
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"actor-link"},
          "actorId": {"kind":"union","members":[{"kind":"ref","name":"ActorId"},{"kind":"literal","value":null}]}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"move-lock"},
          "moveSlotId": {"kind":"ref","name":"MoveSlotId"},
          "moveId": {"kind":"ref","name":"MoveId"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"charge"},
          "moveSlotId": {"kind":"ref","name":"MoveSlotId"},
          "moveId": {"kind":"ref","name":"MoveId"},
          "target": {"kind":"ref","name":"TargetSelector"},
          "storedDamage": {"kind":"ref","name":"Int"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"bide"},
          "storedDamage": {"kind":"ref","name":"Int"},
          "lastAttackerId": {"kind":"union","members":[{"kind":"ref","name":"ActorId"},{"kind":"literal","value":null}]}
        }
      },
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"copied-combat"},"projection":{"kind":"ref","name":"CopiedCombatProjection"}}
      }
    ]
  },
  "CopiedCombatProjection": {
    "kind": "object",
    "fields": {
      "identity": {"kind":"ref","name":"SpeciesForm"},
      "types": {
        "kind": "union",
        "members": [{"kind":"array","value":{"kind":"ref","name":"TypeId"}},{"kind":"literal","value":null}]
      },
      "abilities": {
        "kind": "union",
        "members": [{"kind":"array","value":{"kind":"ref","name":"AbilityId"}},{"kind":"literal","value":null}]
      },
      "stats": {"kind":"union","members":[{"kind":"ref","name":"StatBlock"},{"kind":"literal","value":null}]},
      "moves": {"kind":"union","members":[{"kind":"ref","name":"MoveSet"},{"kind":"literal","value":null}]},
      "movePp": {"kind":"union","members":[{"kind":"ref","name":"BattleMoves"},{"kind":"literal","value":null}]}
    }
  },
  "StatusId": {
    "kind": "union",
    "members": [
      {"kind":"literal","value":"sleep"},
      {"kind":"literal","value":"sleepless"},
      {"kind":"literal","value":"nightmare"},
      {"kind":"literal","value":"yawning"},
      {"kind":"literal","value":"napping"},
      {"kind":"literal","value":"burn"},
      {"kind":"literal","value":"poisoned"},
      {"kind":"literal","value":"badly-poisoned"},
      {"kind":"literal","value":"paralysis"},
      {"kind":"literal","value":"frozen"},
      {"kind":"literal","value":"shadow-hold"},
      {"kind":"literal","value":"wrap"},
      {"kind":"literal","value":"wrapped"},
      {"kind":"literal","value":"ingrain"},
      {"kind":"literal","value":"petrified"},
      {"kind":"literal","value":"constriction"},
      {"kind":"literal","value":"cringe"},
      {"kind":"literal","value":"confused"},
      {"kind":"literal","value":"paused"},
      {"kind":"literal","value":"cowering"},
      {"kind":"literal","value":"taunted"},
      {"kind":"literal","value":"encore"},
      {"kind":"literal","value":"infatuated"},
      {"kind":"literal","value":"bide"},
      {"kind":"literal","value":"solarbeam"},
      {"kind":"literal","value":"sky-attack"},
      {"kind":"literal","value":"razor-wind"},
      {"kind":"literal","value":"focus-punch"},
      {"kind":"literal","value":"skull-bash"},
      {"kind":"literal","value":"flying"},
      {"kind":"literal","value":"bouncing"},
      {"kind":"literal","value":"diving"},
      {"kind":"literal","value":"digging"},
      {"kind":"literal","value":"charging"},
      {"kind":"literal","value":"enraged"},
      {"kind":"literal","value":"reflect"},
      {"kind":"literal","value":"safeguard"},
      {"kind":"literal","value":"light-screen"},
      {"kind":"literal","value":"counter"},
      {"kind":"literal","value":"magic-coat"},
      {"kind":"literal","value":"wish"},
      {"kind":"literal","value":"protect"},
      {"kind":"literal","value":"mirror-coat"},
      {"kind":"literal","value":"enduring"},
      {"kind":"literal","value":"mini-counter"},
      {"kind":"literal","value":"mirror-move"},
      {"kind":"literal","value":"conversion2"},
      {"kind":"literal","value":"vital-throw"},
      {"kind":"literal","value":"mist"},
      {"kind":"literal","value":"cursed"},
      {"kind":"literal","value":"decoy"},
      {"kind":"literal","value":"snatch"},
      {"kind":"literal","value":"leech-seed"},
      {"kind":"literal","value":"destiny-bond"},
      {"kind":"literal","value":"sure-shot"},
      {"kind":"literal","value":"whiffer"},
      {"kind":"literal","value":"set-damage"},
      {"kind":"literal","value":"focus-energy"},
      {"kind":"literal","value":"long-toss"},
      {"kind":"literal","value":"pierce"},
      {"kind":"literal","value":"invisible"},
      {"kind":"literal","value":"transformed"},
      {"kind":"literal","value":"mobile"},
      {"kind":"literal","value":"blinker"},
      {"kind":"literal","value":"cross-eyed"},
      {"kind":"literal","value":"eyedrops"}
    ]
  },
  "ActorPlacement": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"map"},
          "mapId": {"kind":"ref","name":"MapId"},
          "position": {"kind":"ref","name":"GridPosition"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"off-map"},
          "reason": {
            "kind": "union",
            "members": [
              {"kind":"literal","value":"fainted"},
              {"kind":"literal","value":"dismissed"},
              {"kind":"literal","value":"rescued"},
              {"kind":"literal","value":"staged"}
            ]
          }
        }
      }
    ]
  },
  "ActorBinding": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"roster"},"pokemonId":{"kind":"ref","name":"PokemonId"}}
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"wild"},
          "encounterId": {"kind":"ref","name":"EncounterId"},
          "spawnedAt": {"kind":"ref","name":"FloorAddress"}
        }
      },
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"boss"},"encounterId":{"kind":"ref","name":"EncounterId"}}
      },
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"guest"},"storyActorId":{"kind":"ref","name":"StoryActorId"}}
      },
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"job-client"},"jobId":{"kind":"ref","name":"JobId"}}},
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"temporary-recruit"},
          "origin": {"kind":"ref","name":"PokemonOrigin"},
          "nickname": {"kind":"string"},
          "recruitPolicyId": {"kind":"ref","name":"PolicyId"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"imported-team"},
          "teamId": {"kind":"ref","name":"ImportedTeamId"},
          "memberKey": {"kind":"string"}
        }
      }
    ]
  },
  "PendingResult": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {
          "resultId": {"kind":"ref","name":"ResultId"},
          "createdRevision": {"kind":"ref","name":"Int"},
          "cursor": {"kind":"ref","name":"Int"},
          "kind": {"kind":"literal","value":"expedition-complete"},
          "summary": {"kind":"ref","name":"ExpeditionSummary"},
          "continuation": {"kind":"ref","name":"Continuation"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "resultId": {"kind":"ref","name":"ResultId"},
          "createdRevision": {"kind":"ref","name":"Int"},
          "cursor": {"kind":"ref","name":"Int"},
          "kind": {"kind":"literal","value":"defeat"},
          "summary": {"kind":"ref","name":"ExpeditionSummary"},
          "continuation": {"kind":"ref","name":"Continuation"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "resultId": {"kind":"ref","name":"ResultId"},
          "createdRevision": {"kind":"ref","name":"Int"},
          "cursor": {"kind":"ref","name":"Int"},
          "kind": {"kind":"literal","value":"job-reward"},
          "jobId": {"kind":"ref","name":"JobId"},
          "reward": {"kind":"ref","name":"RewardBundle"},
          "grantedRevision": {"kind":"ref","name":"Int"},
          "continuation": {"kind":"ref","name":"Continuation"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "resultId": {"kind":"ref","name":"ResultId"},
          "createdRevision": {"kind":"ref","name":"Int"},
          "cursor": {"kind":"ref","name":"Int"},
          "kind": {"kind":"literal","value":"recruit-choice"},
          "sessionId": {"kind":"ref","name":"SessionId"},
          "actorId": {"kind":"ref","name":"ActorId"},
          "optionIds": {
            "kind": "array",
            "value": {"kind":"union","members":[{"kind":"literal","value":"accept"},{"kind":"literal","value":"decline"}]}
          },
          "continuation": {"kind":"ref","name":"Continuation"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "resultId": {"kind":"ref","name":"ResultId"},
          "createdRevision": {"kind":"ref","name":"Int"},
          "cursor": {"kind":"ref","name":"Int"},
          "kind": {"kind":"literal","value":"move-learn-choice"},
          "sessionId": {"kind":"union","members":[{"kind":"ref","name":"SessionId"},{"kind":"literal","value":null}]},
          "owner": {
            "kind": "union",
            "members": [
              {
                "kind": "object",
                "fields": {"kind":{"kind":"literal","value":"pokemon"},"pokemonId":{"kind":"ref","name":"PokemonId"}}
              },
              {
                "kind": "object",
                "fields": {"kind":{"kind":"literal","value":"actor"},"actorId":{"kind":"ref","name":"ActorId"}}
              }
            ]
          },
          "moveId": {"kind":"ref","name":"MoveId"},
          "replaceableSlotIds": {"kind":"array","value":{"kind":"ref","name":"MoveSlotId"}},
          "canDecline": {"kind":"boolean"},
          "continuation": {"kind":"ref","name":"Continuation"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "resultId": {"kind":"ref","name":"ResultId"},
          "createdRevision": {"kind":"ref","name":"Int"},
          "cursor": {"kind":"ref","name":"Int"},
          "kind": {"kind":"literal","value":"choice"},
          "choiceId": {"kind":"ref","name":"SceneChoiceId"},
          "options": {
            "kind": "array",
            "value": {
              "kind": "object",
              "fields": {"optionId":{"kind":"ref","name":"SceneOptionId"},"continuation":{"kind":"ref","name":"Continuation"}}
            }
          }
        }
      },
      {
        "kind": "object",
        "fields": {
          "resultId": {"kind":"ref","name":"ResultId"},
          "createdRevision": {"kind":"ref","name":"Int"},
          "cursor": {"kind":"ref","name":"Int"},
          "kind": {"kind":"literal","value":"rescue"},
          "requestId": {"kind":"ref","name":"RescueRequestId"},
          "stage": {
            "kind": "union",
            "members": [
              {"kind":"literal","value":"request-ready"},
              {"kind":"literal","value":"resumed"},
              {"kind":"literal","value":"reward-ready"}
            ]
          },
          "continuation": {"kind":"ref","name":"Continuation"}
        }
      }
    ]
  },
  "Continuation": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"town"},"destination":{"kind":"ref","name":"Destination"}}
      },
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"resume-session"},"sessionId":{"kind":"ref","name":"SessionId"}}
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"begin-expedition"},
          "dungeonId": {"kind":"ref","name":"DungeonId"},
          "entryPolicyId": {"kind":"ref","name":"PolicyId"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"change-floor"},
          "sessionId": {"kind":"ref","name":"SessionId"},
          "destination": {"kind":"ref","name":"Destination"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"end-expedition"},
          "sessionId": {"kind":"ref","name":"SessionId"},
          "outcome": {"kind":"ref","name":"FinalOutcome"},
          "policyId": {"kind":"ref","name":"PolicyId"}
        }
      },
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"scene"},"sceneId":{"kind":"ref","name":"SceneId"}}},
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"resume-turn"},
          "sessionId": {"kind":"ref","name":"SessionId"},
          "gate": {
            "kind": "union",
            "members": [
              {
                "kind": "object",
                "fields": {"kind":{"kind":"literal","value":"result"},"resultId":{"kind":"ref","name":"ResultId"}}
              },
              {
                "kind": "object",
                "fields": {"kind":{"kind":"literal","value":"scene"},"sceneInstanceId":{"kind":"ref","name":"SceneInstanceId"}}
              }
            ]
          }
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"request-rescue"},
          "sessionId": {"kind":"ref","name":"SessionId"},
          "policyId": {"kind":"ref","name":"PolicyId"}
        }
      },
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"await-rescue"},"requestId":{"kind":"ref","name":"RescueRequestId"}}
      }
    ]
  },
  "SceneOptionId": {"kind":"catalog","name":"scene-option"},
  "SceneChoiceId": {"kind":"catalog","name":"scene-choice"},
  "ExpeditionSummary": {
    "kind": "object",
    "fields": {
      "sessionId": {"kind":"ref","name":"SessionId"},
      "dungeonId": {"kind":"ref","name":"DungeonId"},
      "outcome": {"kind":"ref","name":"FinalOutcome"},
      "retainedPokemonIds": {"kind":"array","value":{"kind":"ref","name":"PokemonId"}},
      "lostItemTemplates": {"kind":"array","value":{"kind":"ref","name":"ItemGrant"}},
      "moneyChange": {"kind":"ref","name":"Int"},
      "completedJobIds": {"kind":"array","value":{"kind":"ref","name":"JobId"}}
    }
  },
  "PendingScene": {
    "kind": "object",
    "fields": {
      "sceneInstanceId": {"kind":"ref","name":"SceneInstanceId"},
      "sceneId": {"kind":"ref","name":"SceneId"},
      "cursor": {"kind":"ref","name":"Int"},
      "entryRevision": {"kind":"ref","name":"Int"},
      "bindings": {"kind":"array","value":{"kind":"ref","name":"SceneBinding"}},
      "choices": {
        "kind": "array",
        "value": {
          "kind": "object",
          "fields": {"choiceId":{"kind":"ref","name":"SceneChoiceId"},"optionId":{"kind":"ref","name":"SceneOptionId"}}
        }
      },
      "awaiting": {"kind":"ref","name":"SceneAwait"},
      "continuation": {"kind":"ref","name":"Continuation"}
    }
  },
  "SceneAwait": {
    "kind": "union",
    "members": [
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"name-input"},"field":{"kind":"literal","value":"team"},"value":{"kind":"string"}}},
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"name-confirm"},"field":{"kind":"literal","value":"team"},"value":{"kind":"string"},"choiceId":{"kind":"ref","name":"SceneChoiceId"},"optionIds":{"kind":"array","value":{"kind":"ref","name":"SceneOptionId"}}}},
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"advance"}}},
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"choice"},
          "choiceId": {"kind":"ref","name":"SceneChoiceId"},
          "optionIds": {"kind":"array","value":{"kind":"ref","name":"SceneOptionId"}}
        }
      }
    ]
  },
  "SceneBinding": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {
          "roleId": {"kind":"ref","name":"SceneRoleId"},
          "kind": {"kind":"literal","value":"pokemon"},
          "pokemonId": {"kind":"ref","name":"PokemonId"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "roleId": {"kind":"ref","name":"SceneRoleId"},
          "kind": {"kind":"literal","value":"actor"},
          "actorId": {"kind":"ref","name":"ActorId"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "roleId": {"kind":"ref","name":"SceneRoleId"},
          "kind": {"kind":"literal","value":"story-actor"},
          "storyActorId": {"kind":"ref","name":"StoryActorId"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "roleId": {"kind":"ref","name":"SceneRoleId"},
          "kind": {"kind":"literal","value":"job"},
          "jobId": {"kind":"ref","name":"JobId"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "roleId": {"kind":"ref","name":"SceneRoleId"},
          "kind": {"kind":"literal","value":"item"},
          "itemInstanceId": {"kind":"ref","name":"ItemInstanceId"}
        }
      }
    ]
  },
  "TownState": {
    "kind": "object",
    "fields": {
      "mapDefinitionId": {"kind":"ref","name":"MapDefinitionId"},
      "placements": {"kind":"array","value":{"kind":"ref","name":"TownPlacement"}},
      "day": {"kind":"ref","name":"Int"},
      "serviceStock": {
        "kind": "array",
        "value": {"kind":"union","members":[{
          "kind": "object",
          "fields": {
            "serviceId": {"kind":"string"},
            "stockRevision": {"kind":"ref","name":"Int"},
            "items": {"kind":"array","value":{"kind":"ref","name":"StoredStack"}}
          }
        },{"kind":"object","fields":{
          "kind":{"kind":"literal","value":"lots"},
          "serviceId":{"kind":"string"},
          "stockRevision":{"kind":"ref","name":"Int"},
          "lots":{"kind":"array","value":{"kind":"ref","name":"ItemGrant"}}
        }}]}
      }
    }
  },
  "TownPlacement": {
    "kind": "object",
    "fields": {
      "reference": {
        "kind": "union",
        "members": [
          {
            "kind": "object",
            "fields": {"kind":{"kind":"literal","value":"pokemon"},"pokemonId":{"kind":"ref","name":"PokemonId"}}
          },
          {
            "kind": "object",
            "fields": {"kind":{"kind":"literal","value":"story-actor"},"storyActorId":{"kind":"ref","name":"StoryActorId"}}
          }
        ]
      },
      "position": {"kind":"ref","name":"GridPosition"},
      "facing": {"kind":"ref","name":"Facing"}
    }
  },
  "ProgressState": {
    "kind": "object",
    "fields": {
      "native": {"kind":"ref","name":"NativeProgressState"},
      "storyNodeId": {"kind":"ref","name":"StoryNodeId"},
      "branches": {"kind":"record","value":{"kind":"ref","name":"BranchProgress"}},
      "milestones": {"kind":"record","value":{"kind":"ref","name":"MilestoneRecord"}},
      "clears": {"kind":"record","value":{"kind":"ref","name":"DungeonClearRecord"}},
      "recruitedHistory": {"kind":"array","value":{"kind":"ref","name":"SpeciesForm"}},
      "seenScenes": {"kind":"record","value":{"kind":"ref","name":"SceneVisit"}},
      "rankPoints": {"kind":"ref","name":"Int"},
      "jobs": {"kind":"record","value":{"kind":"ref","name":"JobRecord"}},
      "acceptedJobIds": {"kind":"array","value":{"kind":"ref","name":"JobId"}},
      "appliedGrants": {
        "kind": "array",
        "value": {
          "kind": "object",
          "fields": {
            "grantId": {"kind":"ref","name":"GrantId"},
            "revision": {"kind":"ref","name":"Int"},
            "day": {"kind":"ref","name":"Int"}
          }
        }
      },
      "consumedMail": {
        "kind": "array",
        "value": {
          "kind": "object",
          "fields": {"formatId":{"kind":"string"},"digest":{"kind":"string"},"appliedRevision":{"kind":"ref","name":"Int"}}
        }
      },
      "statistics": {
        "kind": "object",
        "fields": {
          "jobsCompleted": {"kind":"ref","name":"Int"},
          "rescuesCompleted": {"kind":"ref","name":"Int"},
          "expeditions": {"kind":"ref","name":"Int"}
        }
      }
    }
  },
  "JobRecord": {
    "kind": "object",
    "fields": {
      "jobId": {"kind":"ref","name":"JobId"},
      "source": {
        "kind": "union",
        "members": [
          {"kind":"object","fields": {
            "kind":{"kind":"literal","value":"generated"},
            "generationPolicyId":{"kind":"ref","name":"PolicyId"},
            "posting":{"kind":"union","members":[{"kind":"literal","value":"board"},{"kind":"literal","value":"mailbox"}]},
            "generatedDay":{"kind":"ref","name":"Int"},
            "seed":{"kind":"ref","name":"Int"},
            "missionType":{"kind":"union","members":[{"kind":"literal","value":0},{"kind":"literal","value":1},{"kind":"literal","value":3},{"kind":"literal","value":4}]},
            "targetItem":{"kind":"catalog","name":"item"},
            "itemReward":{"kind":"catalog","name":"item"},
            "rewardType":{"kind":"union","members":[{"kind":"literal","value":0},{"kind":"literal","value":1},{"kind":"literal","value":2},{"kind":"literal","value":3},{"kind":"literal","value":4},{"kind":"literal","value":5},{"kind":"literal","value":6},{"kind":"literal","value":7}]}
          }},
          {
            "kind": "object",
            "fields": {
              "kind": {"kind":"literal","value":"generated"},
              "generationPolicyId": {"kind":"ref","name":"PolicyId"},
              "generatedDay": {"kind":"ref","name":"Int"}
            }
          },
          {
            "kind": "object",
            "fields": {"kind":{"kind":"literal","value":"mail"},"digest":{"kind":"string"},"formatId":{"kind":"string"}}
          },
          {
            "kind": "object",
            "fields": {"kind":{"kind":"literal","value":"authored"},"grantId":{"kind":"ref","name":"GrantId"}}
          }
        ]
      },
      "goal": {"kind":"ref","name":"JobGoal"},
      "difficultyId": {"kind":"string"},
      "reward": {"kind":"ref","name":"RewardBundle"},
      "phase": {"kind":"ref","name":"JobPhase"}
    }
  },
  "JobPhase": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"offered"},
          "offeredDay": {"kind":"ref","name":"Int"},
          "expiryDay": {"kind":"union","members":[{"kind":"ref","name":"Int"},{"kind":"literal","value":null}]}
        }
      },
      {"kind":"object","fields":{"kind":{"kind":"literal","value":"suspended"},"acceptedRevision":{"kind":"ref","name":"Int"}}},
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"accepted"},"acceptedRevision":{"kind":"ref","name":"Int"}}
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"active"},
          "sessionId": {"kind":"ref","name":"SessionId"},
          "objectiveIndex": {"kind":"ref","name":"Int"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"objective-complete"},
          "sessionId": {"kind":"ref","name":"SessionId"},
          "completedRevision": {"kind":"ref","name":"Int"}
        }
      },
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"reward-ready"},"completedRevision":{"kind":"ref","name":"Int"}}
      },
      {
        "kind": "object",
        "fields": {"kind":{"kind":"literal","value":"claimed"},"claimedRevision":{"kind":"ref","name":"Int"}}
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"failed"},
          "reasonId": {"kind":"ref","name":"PolicyId"},
          "failedRevision": {"kind":"ref","name":"Int"}
        }
      }
    ]
  },
  "JobGoal": {
    "kind": "union",
    "members": [
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"rescue"},
          "client": {"kind":"ref","name":"JobClient"},
          "destination": {"kind":"ref","name":"FloorAddress"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"escort"},
          "client": {"kind":"ref","name":"JobClient"},
          "destination": {"kind":"ref","name":"FloorAddress"},
          "recipient": {"kind":"ref","name":"JobClient"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"deliver-item"},
          "client": {"kind":"ref","name":"JobClient"},
          "destination": {"kind":"ref","name":"FloorAddress"},
          "itemId": {"kind":"ref","name":"ItemId"},
          "quantity": {"kind":"ref","name":"Int"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"retrieve-item"},
          "client": {"kind":"ref","name":"JobClient"},
          "destination": {"kind":"ref","name":"FloorAddress"},
          "itemId": {"kind":"ref","name":"ItemId"},
          "quantity": {"kind":"ref","name":"Int"}
        }
      },
      {
        "kind": "object",
        "fields": {
          "kind": {"kind":"literal","value":"find-pokemon"},
          "client": {"kind":"ref","name":"JobClient"},
          "destination": {"kind":"ref","name":"FloorAddress"},
          "target": {"kind":"ref","name":"JobClient"}
        }
      }
    ]
  },
  "JobClient": {
    "kind": "object",
    "fields": {
      "identity": {"kind":"ref","name":"SpeciesForm"},
      "nickname": {"kind":"union","members":[{"kind":"string"},{"kind":"literal","value":null}]}
    }
  },
  "SceneVisit": {
    "kind": "object",
    "fields": {
      "sceneId": {"kind":"ref","name":"SceneId"},
      "count": {"kind":"ref","name":"Int"},
      "firstRevision": {"kind":"ref","name":"Int"},
      "lastRevision": {"kind":"ref","name":"Int"},
      "firstDay": {"kind":"ref","name":"Int"},
      "lastDay": {"kind":"ref","name":"Int"}
    }
  },
  "DungeonClearRecord": {
    "kind": "object",
    "fields": {
      "dungeonId": {"kind":"ref","name":"DungeonId"},
      "firstClearRevision": {"kind":"ref","name":"Int"},
      "lastClearRevision": {"kind":"ref","name":"Int"},
      "firstClearDay": {"kind":"ref","name":"Int"},
      "lastClearDay": {"kind":"ref","name":"Int"},
      "clearCount": {"kind":"ref","name":"Int"},
      "reachedFloorIds": {"kind":"array","value":{"kind":"ref","name":"FloorId"}}
    }
  },
  "MilestoneRecord": {
    "kind": "object",
    "fields": {
      "milestoneId": {"kind":"ref","name":"MilestoneId"},
      "acquiredRevision": {"kind":"ref","name":"Int"},
      "acquiredDay": {"kind":"ref","name":"Int"}
    }
  },
  "BranchProgress": {
    "kind": "object",
    "fields": {
      "branchId": {"kind":"ref","name":"StoryBranchId"},
      "nodeId": {"kind":"ref","name":"StoryNodeId"},
      "enteredRevision": {"kind":"ref","name":"Int"},
      "enteredDay": {"kind":"ref","name":"Int"}
    }
  },
  "EconomyState": {
    "kind": "object",
    "fields": {
      "carriedMoney": {"kind":"ref","name":"Int"},
      "bankedMoney": {"kind":"ref","name":"Int"},
      "toolbox": {"kind":"ref","name":"ContainerId"},
      "storedItems": {"kind":"array","value":{"kind":"ref","name":"StoredStack"}},
      "ownedFriendAreaIds": {"kind":"array","value":{"kind":"ref","name":"FriendAreaId"}}
    }
  },
  "CampaignProfile": {
    "kind": "object",
    "fields": {
      "referenceEdition": {"kind":"literal","value":"blue-rescue-team"},
      "heroId": {"kind":"ref","name":"PokemonId"},
      "partnerId": {"kind":"ref","name":"PokemonId"},
      "originalHeroIdentity": {"kind":"ref","name":"SpeciesForm"},
      "originalPartnerIdentity": {"kind":"ref","name":"SpeciesForm"},
      "teamName": {"kind":"string"},
      "createdAt": {"kind":"string"},
      "selection": {"kind":"object","fields":{"quizRevision":{"kind":"string"},"outcomeId":{"kind":"string"}}}
    }
  },
  "CampaignRandomStreams": {
    "kind": "object",
    "fields": {
      "layout": {"kind":"ref","name":"RandomState"},
      "encountersItems": {"kind":"ref","name":"RandomState"},
      "combatRecruitment": {"kind":"ref","name":"RandomState"},
      "jobsRewards": {"kind":"ref","name":"RandomState"}
    }
  },
  "RandomState": {
    "kind": "object",
    "fields": {
      "algorithm": {"kind":"literal","value":"xoshiro128ss-v1"},
      "words": {"kind":"ref","name":"RandomWords"},
      "draws": {"kind":"integer"}
    }
  },
  "IdSequence": {"kind":"object","fields":{"next":{"kind":"integer"}}},
  "ContentRevision": {"kind":"string"}
};

/** @param {object} value */
function freezeSchema(value) {
  for (const child of Object.values(value)) if (child && typeof child === 'object') freezeSchema(child);
  Object.freeze(value);
}
freezeSchema(SHAPES);
