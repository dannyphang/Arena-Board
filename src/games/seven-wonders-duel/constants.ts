import { SWDBuilding, SWDWonder, SWDProgressToken } from "./types";

export const WONDERS: Record<number, SWDWonder> = {
  1: {
    id: 1,
    name: "The Pyramids",
    cost: { papyrus: 1, stone: 3 },
    victoryPoints: 9
  },
  2: {
    id: 2,
    name: "The Colossus",
    cost: { glass: 1, clay: 3 },
    military: 2,
    victoryPoints: 3
  },
  3: {
    id: 3,
    name: "The Great Lighthouse",
    cost: { papyrus: 2, stone: 1, wood: 1 },
    resourceChoice: ["wood", "stone", "clay"],
    victoryPoints: 4
  },
  4: {
    id: 4,
    name: "The Temple of Artemis",
    cost: { papyrus: 1, glass: 1, stone: 1, wood: 1 },
    coins: 12,
    extraTurn: true,
    victoryPoints: 0
  },
  5: {
    id: 5,
    name: "The Mausoleum",
    cost: { papyrus: 1, glass: 2, clay: 2 },
    discardBuildingTake: true,
    victoryPoints: 2
  },
  6: {
    id: 6,
    name: "The Great Library",
    cost: { papyrus: 1, glass: 1, wood: 3 },
    progressTokenFromBox: true,
    victoryPoints: 4
  },
  7: {
    id: 7,
    name: "Piraeus",
    cost: { clay: 1, stone: 1, wood: 2 },
    resourceChoice: ["papyrus", "glass"],
    extraTurn: true,
    victoryPoints: 2
  },
  8: {
    id: 8,
    name: "The Hanging Gardens",
    cost: { papyrus: 1, glass: 1, wood: 2 },
    coins: 6,
    extraTurn: true,
    victoryPoints: 3
  },
  9: {
    id: 9,
    name: "The Statue of Zeus",
    cost: { papyrus: 2, clay: 1, wood: 1, stone: 1 },
    destroyOpponentBrown: true,
    military: 1,
    victoryPoints: 3
  },
  10: {
    id: 10,
    name: "The Sphinx",
    cost: { glass: 2, clay: 1, stone: 1 },
    extraTurn: true,
    victoryPoints: 6
  },
  11: {
    id: 11,
    name: "The Appian Way",
    cost: { papyrus: 1, clay: 2, stone: 2 },
    coins: 3,
    opponentCoinLoss: 3,
    extraTurn: true,
    victoryPoints: 3
  },
  12: {
    id: 12,
    name: "Circus Maximus",
    cost: { glass: 1, wood: 1, stone: 2 },
    destroyOpponentGrey: true,
    military: 1,
    victoryPoints: 3
  }
};

export const PROGRESS_TOKENS: Record<number, SWDProgressToken> = {
  1: {
    id: 1,
    name: "Agriculture",
    coins: 6,
    victoryPoints: 4,
    description: "Immediately gain 6 coins. Worth 4 victory points at the end of the game."
  },
  2: {
    id: 2,
    name: "Architecture",
    description: "Future Wonders constructed by you cost 2 fewer resources of your choice."
  },
  3: {
    id: 3,
    name: "Economy",
    description: "You gain the coins spent by your opponent when they trade for resources with the bank."
  },
  4: {
    id: 4,
    name: "Law",
    scientificSymbol: 2,
    description: "Grants a scientific symbol (Scales), counting towards Scientific Supremacy."
  },
  5: {
    id: 5,
    name: "Masonry",
    description: "Future blue (Civilian) buildings constructed by you cost 2 fewer resources."
  },
  6: {
    id: 6,
    name: "Mathematics",
    description: "At the end of the game, score 3 victory points for each Progress Token you possess (including this one)."
  },
  7: {
    id: 7,
    name: "Philosophy",
    victoryPoints: 7,
    description: "Worth 7 victory points at the end of the game."
  },
  8: {
    id: 8,
    name: "Strategy",
    description: "New Military Buildings (red cards) you construct benefit from +1 extra Shield."
  },
  9: {
    id: 9,
    name: "Theology",
    description: "All future Wonders constructed by you gain the Play Again (extra turn) effect."
  },
  10: {
    id: 10,
    name: "Urbanism",
    coins: 6,
    description: "Gain 6 coins immediately. Each time you construct a building for free through linking, gain 4 coins."
  }
};

export const SCIENTIFIC_SYMBOLS_INFO: Record<number, { name: string; description: string }> = {
  1: { name: "Astrolabe", description: "Sphere with celestial coordinates" },
  2: { name: "Law", description: "Scales of justice" },
  3: { name: "Sundial", description: "Timekeeping instrument" },
  4: { name: "Mortar", description: "Pharmacy and alchemy" },
  5: { name: "Quill", description: "Manuscript and literature" },
  6: { name: "Wheel", description: "Mechanics and engineering" },
  7: { name: "Plumb Bob", description: "Architecture and mathematics" }
};

export const BUILDINGS: Record<number, SWDBuilding> = {
  "1": {
    "id": 1,
    "age": 1,
    "name": "Lumber Yard",
    "type": "brown",
    "cost": {},
    "resources": {
      "wood": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "2": {
    "id": 2,
    "age": 1,
    "name": "Stone Pit",
    "type": "brown",
    "cost": {
      "coins": 1
    },
    "resources": {
      "stone": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "3": {
    "id": 3,
    "age": 1,
    "name": "Clay Pool",
    "type": "brown",
    "cost": {},
    "resources": {
      "clay": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "4": {
    "id": 4,
    "age": 1,
    "name": "Logging Camp",
    "type": "brown",
    "cost": {
      "coins": 1
    },
    "resources": {
      "wood": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "5": {
    "id": 5,
    "age": 1,
    "name": "Quarry",
    "type": "brown",
    "cost": {},
    "resources": {
      "stone": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "6": {
    "id": 6,
    "age": 1,
    "name": "Clay Pit",
    "type": "brown",
    "cost": {
      "coins": 1
    },
    "resources": {
      "clay": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "7": {
    "id": 7,
    "age": 1,
    "name": "Glassworks",
    "type": "grey",
    "cost": {
      "coins": 1
    },
    "resources": {
      "glass": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "8": {
    "id": 8,
    "age": 1,
    "name": "Press",
    "type": "grey",
    "cost": {
      "coins": 1
    },
    "resources": {
      "papyrus": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "9": {
    "id": 9,
    "age": 1,
    "name": "Stable",
    "type": "red",
    "cost": {
      "wood": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 1,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      29
    ]
  },
  "10": {
    "id": 10,
    "age": 1,
    "name": "Garrison",
    "type": "red",
    "cost": {
      "clay": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 1,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      30
    ]
  },
  "11": {
    "id": 11,
    "age": 1,
    "name": "Palisade",
    "type": "red",
    "cost": {
      "coins": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 1,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      50
    ]
  },
  "12": {
    "id": 12,
    "age": 1,
    "name": "Guard Tower",
    "type": "red",
    "cost": {},
    "resources": {},
    "resourceChoice": [],
    "military": 1,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "13": {
    "id": 13,
    "age": 1,
    "name": "Scriptorium",
    "type": "green",
    "cost": {
      "coins": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": 6,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      37
    ]
  },
  "14": {
    "id": 14,
    "age": 1,
    "name": "Workshop",
    "type": "green",
    "cost": {
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 1,
    "coins": 0,
    "scientificSymbol": 5,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "15": {
    "id": 15,
    "age": 1,
    "name": "Pharmacist",
    "type": "green",
    "cost": {
      "coins": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": 4,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      36
    ]
  },
  "16": {
    "id": 16,
    "age": 1,
    "name": "Apothecary",
    "type": "green",
    "cost": {
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 1,
    "coins": 0,
    "scientificSymbol": 7,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "17": {
    "id": 17,
    "age": 1,
    "name": "Tavern",
    "type": "yellow",
    "cost": {},
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 4,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      59
    ]
  },
  "18": {
    "id": 18,
    "age": 1,
    "name": "Stone Reserve",
    "type": "yellow",
    "cost": {
      "coins": 3
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [
      "stone"
    ],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "19": {
    "id": 19,
    "age": 1,
    "name": "Clay Reserve",
    "type": "yellow",
    "cost": {
      "coins": 3
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [
      "clay"
    ],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "20": {
    "id": 20,
    "age": 1,
    "name": "Wood Reserve",
    "type": "yellow",
    "cost": {
      "coins": 3
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [
      "wood"
    ],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "21": {
    "id": 21,
    "age": 1,
    "name": "Theater",
    "type": "blue",
    "cost": {},
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      43
    ]
  },
  "22": {
    "id": 22,
    "age": 1,
    "name": "Altar",
    "type": "blue",
    "cost": {},
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      42
    ]
  },
  "23": {
    "id": 23,
    "age": 1,
    "name": "Baths",
    "type": "blue",
    "cost": {
      "stone": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      45
    ]
  },
  "24": {
    "id": 24,
    "age": 2,
    "name": "Sawmill",
    "type": "brown",
    "cost": {
      "coins": 2
    },
    "resources": {
      "wood": 2
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "25": {
    "id": 25,
    "age": 2,
    "name": "Shelf Quarry",
    "type": "brown",
    "cost": {
      "coins": 2
    },
    "resources": {
      "stone": 2
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "26": {
    "id": 26,
    "age": 2,
    "name": "Brickyard",
    "type": "brown",
    "cost": {
      "coins": 2
    },
    "resources": {
      "clay": 2
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "27": {
    "id": 27,
    "age": 2,
    "name": "Glass-Blower",
    "type": "grey",
    "cost": {},
    "resources": {
      "glass": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "28": {
    "id": 28,
    "age": 2,
    "name": "Drying Room",
    "type": "grey",
    "cost": {},
    "resources": {
      "papyrus": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "29": {
    "id": 29,
    "age": 2,
    "name": "Horse Breeders",
    "type": "red",
    "cost": {
      "clay": 1,
      "wood": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 1,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 9
  },
  "30": {
    "id": 30,
    "age": 2,
    "name": "Barracks",
    "type": "red",
    "cost": {
      "coins": 3
    },
    "resources": {},
    "resourceChoice": [],
    "military": 1,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 10
  },
  "31": {
    "id": 31,
    "age": 2,
    "name": "Walls",
    "type": "red",
    "cost": {
      "stone": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 2,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "32": {
    "id": 32,
    "age": 2,
    "name": "Archery Range",
    "type": "red",
    "cost": {
      "stone": 1,
      "wood": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 2,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      49
    ]
  },
  "33": {
    "id": 33,
    "age": 2,
    "name": "Parade Ground",
    "type": "red",
    "cost": {
      "clay": 2,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 2,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      47
    ]
  },
  "34": {
    "id": 34,
    "age": 2,
    "name": "School",
    "type": "green",
    "cost": {
      "wood": 1,
      "papyrus": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 1,
    "coins": 0,
    "scientificSymbol": 7,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      53
    ]
  },
  "35": {
    "id": 35,
    "age": 2,
    "name": "Laboratory",
    "type": "green",
    "cost": {
      "wood": 1,
      "glass": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 1,
    "coins": 0,
    "scientificSymbol": 5,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      55
    ]
  },
  "36": {
    "id": 36,
    "age": 2,
    "name": "Dispensary",
    "type": "green",
    "cost": {
      "clay": 2,
      "stone": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 2,
    "coins": 0,
    "scientificSymbol": 4,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 15
  },
  "37": {
    "id": 37,
    "age": 2,
    "name": "Library",
    "type": "green",
    "cost": {
      "stone": 1,
      "wood": 1,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 2,
    "coins": 0,
    "scientificSymbol": 6,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 13
  },
  "38": {
    "id": 38,
    "age": 2,
    "name": "Brewery",
    "type": "yellow",
    "cost": {},
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 6,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      56
    ]
  },
  "39": {
    "id": 39,
    "age": 2,
    "name": "Forum",
    "type": "yellow",
    "cost": {
      "coins": 3,
      "clay": 1
    },
    "resources": {},
    "resourceChoice": [
      "glass",
      "papyrus"
    ],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "40": {
    "id": 40,
    "age": 2,
    "name": "Caravansery",
    "type": "yellow",
    "cost": {
      "coins": 2,
      "glass": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [
      "wood",
      "clay",
      "stone"
    ],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "41": {
    "id": 41,
    "age": 2,
    "name": "Customs House",
    "type": "yellow",
    "cost": {
      "coins": 4
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [
      "papyrus",
      "glass"
    ],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "42": {
    "id": 42,
    "age": 2,
    "name": "Temple",
    "type": "blue",
    "cost": {
      "wood": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 4,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      63
    ],
    "freeIfHas": 22
  },
  "43": {
    "id": 43,
    "age": 2,
    "name": "Statue",
    "type": "blue",
    "cost": {
      "clay": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 4,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      62
    ],
    "freeIfHas": 21
  },
  "44": {
    "id": 44,
    "age": 2,
    "name": "Courthouse",
    "type": "blue",
    "cost": {
      "wood": 2,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 5,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "45": {
    "id": 45,
    "age": 2,
    "name": "Aqueduct",
    "type": "blue",
    "cost": {
      "stone": 3
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 5,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 23
  },
  "46": {
    "id": 46,
    "age": 2,
    "name": "Rostrum",
    "type": "blue",
    "cost": {
      "stone": 1,
      "wood": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 4,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      65
    ]
  },
  "47": {
    "id": 47,
    "age": 3,
    "name": "Circus",
    "type": "red",
    "cost": {
      "clay": 2,
      "stone": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 2,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 33
  },
  "48": {
    "id": 48,
    "age": 3,
    "name": "Arsenal",
    "type": "red",
    "cost": {
      "clay": 3,
      "wood": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 3,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "49": {
    "id": 49,
    "age": 3,
    "name": "Siege Workshop",
    "type": "red",
    "cost": {
      "wood": 3,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 2,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 32
  },
  "50": {
    "id": 50,
    "age": 3,
    "name": "Fortifications",
    "type": "red",
    "cost": {
      "stone": 2,
      "clay": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 2,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 11
  },
  "51": {
    "id": 51,
    "age": 3,
    "name": "Pretorium",
    "type": "red",
    "cost": {
      "coins": 8
    },
    "resources": {},
    "resourceChoice": [],
    "military": 3,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "52": {
    "id": 52,
    "age": 3,
    "name": "Academy",
    "type": "green",
    "cost": {
      "stone": 1,
      "wood": 1,
      "glass": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": 3,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "53": {
    "id": 53,
    "age": 3,
    "name": "University",
    "type": "green",
    "cost": {
      "clay": 1,
      "glass": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 2,
    "coins": 0,
    "scientificSymbol": 1,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 34
  },
  "54": {
    "id": 54,
    "age": 3,
    "name": "Study",
    "type": "green",
    "cost": {
      "wood": 2,
      "glass": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": 3,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "55": {
    "id": 55,
    "age": 3,
    "name": "Observatory",
    "type": "green",
    "cost": {
      "stone": 1,
      "papyrus": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 2,
    "coins": 0,
    "scientificSymbol": 1,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 35
  },
  "56": {
    "id": 56,
    "age": 3,
    "name": "Arena",
    "type": "yellow",
    "cost": {
      "clay": 1,
      "stone": 1,
      "wood": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 2,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 38
  },
  "57": {
    "id": 57,
    "age": 3,
    "name": "Chamber Of Commerce",
    "type": "yellow",
    "cost": {
      "papyrus": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": {
      "type": "grey",
      "coins": 3
    },
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "58": {
    "id": 58,
    "age": 3,
    "name": "Port",
    "type": "yellow",
    "cost": {
      "wood": 1,
      "glass": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": {
      "type": "brown",
      "coins": 2
    },
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "59": {
    "id": 59,
    "age": 3,
    "name": "Lighthouse",
    "type": "yellow",
    "cost": {
      "clay": 2,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": {
      "type": "yellow",
      "coins": 1
    },
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 17
  },
  "60": {
    "id": 60,
    "age": 3,
    "name": "Armory",
    "type": "yellow",
    "cost": {
      "stone": 2,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": {
      "type": "red",
      "coins": 1
    },
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "61": {
    "id": 61,
    "age": 3,
    "name": "Palace",
    "type": "blue",
    "cost": {
      "clay": 1,
      "stone": 1,
      "wood": 1,
      "glass": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 7,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "62": {
    "id": 62,
    "age": 3,
    "name": "Gardens",
    "type": "blue",
    "cost": {
      "clay": 2,
      "wood": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 6,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 43
  },
  "63": {
    "id": 63,
    "age": 3,
    "name": "Pantheon",
    "type": "blue",
    "cost": {
      "clay": 1,
      "wood": 1,
      "papyrus": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 6,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 42
  },
  "64": {
    "id": 64,
    "age": 3,
    "name": "Town Hall",
    "type": "blue",
    "cost": {
      "stone": 3,
      "wood": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 7,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "65": {
    "id": 65,
    "age": 3,
    "name": "Senate",
    "type": "blue",
    "cost": {
      "clay": 2,
      "stone": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 5,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 46
  },
  "66": {
    "id": 66,
    "age": 3,
    "name": "Obelisk",
    "type": "blue",
    "cost": {
      "stone": 2,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 5,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "67": {
    "id": 67,
    "age": 4,
    "name": "Merchants Guild",
    "type": "purple",
    "cost": {
      "clay": 1,
      "wood": 1,
      "glass": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": [
      "yellow"
    ]
  },
  "68": {
    "id": 68,
    "age": 4,
    "name": "Shipowners Guild",
    "type": "purple",
    "cost": {
      "clay": 1,
      "stone": 1,
      "glass": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": [
      "brown",
      "grey"
    ]
  },
  "69": {
    "id": 69,
    "age": 4,
    "name": "Builders Guild",
    "type": "purple",
    "cost": {
      "stone": 2,
      "clay": 1,
      "wood": 1,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": true,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "70": {
    "id": 70,
    "age": 4,
    "name": "Magistrates Guild",
    "type": "purple",
    "cost": {
      "wood": 2,
      "clay": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": [
      "blue"
    ]
  },
  "71": {
    "id": 71,
    "age": 4,
    "name": "Scientists Guild",
    "type": "purple",
    "cost": {
      "clay": 2,
      "wood": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": [
      "green"
    ]
  },
  "72": {
    "id": 72,
    "age": 4,
    "name": "Moneylenders Guild",
    "type": "purple",
    "cost": {
      "stone": 2,
      "wood": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": true,
    "guildRewardBuildingTypes": null
  },
  "73": {
    "id": 73,
    "age": 4,
    "name": "Tacticians Guild",
    "type": "purple",
    "cost": {
      "stone": 2,
      "clay": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": [
      "red"
    ]
  }
};

// Pyramid Row Layouts for Ages 1, 2, 3
export const AGE_LAYOUTS = {
  1: [
    { cols: [5, 7], faceUp: true },
    { cols: [4, 6, 8], faceUp: false },
    { cols: [3, 5, 7, 9], faceUp: true },
    { cols: [2, 4, 6, 8, 10], faceUp: false },
    { cols: [1, 3, 5, 7, 9, 11], faceUp: true }
  ],
  2: [
    { cols: [1, 3, 5, 7, 9, 11], faceUp: true },
    { cols: [2, 4, 6, 8, 10], faceUp: false },
    { cols: [3, 5, 7, 9], faceUp: true },
    { cols: [4, 6, 8], faceUp: false },
    { cols: [5, 7], faceUp: true }
  ],
  3: [
    { cols: [5, 7], faceUp: true },
    { cols: [4, 6, 8], faceUp: false },
    { cols: [3, 5, 7, 9], faceUp: true },
    { cols: [4, 8], faceUp: false },
    { cols: [3, 5, 7, 9], faceUp: true },
    { cols: [4, 6, 8], faceUp: false },
    { cols: [5, 7], faceUp: true }
  ]
};
