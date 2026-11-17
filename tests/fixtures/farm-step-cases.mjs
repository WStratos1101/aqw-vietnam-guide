// Reviewed expectations, independent of production step counts and rendered buttons.
// Quest names are checked against hash-pinned raw Wiki HTML by farm-step-sources.test.
export const lrSteps = ['Legion Fealty 1', 'Legion Fealty 2', 'Legion Fealty 3'];
export const stepCases = [
  { itemId: 'apprentice-of-awe', routeId: 'wiki-location', names: ['The Dawn of Lore'] },
  { itemId: 'void-beetle-warlord', routeId: 'wiki-location', names: ['Metamorphosis', 'Still Hungry'] },
  { itemId: 'legion-revenant-class', routeId: 'wiki-location', modeId: 'standard', names: lrSteps },
  { itemId: 'legion-revenant-class', routeId: 'wiki-location', modeId: 'insignia', names: lrSteps },
  { itemId: 'arch-doomknight', routeId: 'wiki-location', names: ['Gathering Power', "Death's Door", 'Chaotic Lords', 'A Means to an End'] },
  { itemId: 'adept-of-awe', routeId: 'wiki-location', names: ['The Dawn of Lore', 'Mystical Magics', 'Science Rules', 'War: What is it Good For?', 'Which Came First, the Dragon or the Dragonoid?', 'Artifact Hunting'] },
];
export const stepSources = [
  { url: 'https://aqwwiki.wikidot.com/legion-revenant-s-quests', file: 'content-sources/class-acquisition/legion-revenant-s-quests.html', hash: 'e8d242c4665174614c00306e9df02121444f9909bbd7eeb2232822144e5ad61a' },
  { url: 'https://aqwwiki.wikidot.com/trissa-s-quests', file: 'content-sources/farm/equipment-sets/wiki/trissa-s-quests.html', hash: 'eedf42da33db6855937efef0a03782fe4fc2e156bac42b88adc9e3d8cb1958a6' },
  { url: 'https://aqwwiki.wikidot.com/ancient-doomknight-s-quests', file: 'content-sources/farm/equipment-sets/wiki/ancient-doomknight-s-quests.html', hash: 'c354f8cc44a1f5a3ac49c08d0ea5f3a776f7b801ec2c8391a0ec880526999190' },
  { url: 'https://aqwwiki.wikidot.com/beetle-general-pet-s-quests', file: 'content-sources/farm/equipment-sets/quest-research/beetle-general-pet-s-quests.html', hash: '8aa1f87ff545b9421eba7fd8c8449b8293e976eac9b3ef8f96e313680a5af39b' },
  { url: 'https://aqwwiki.wikidot.com/beetle-warlord-pet-s-quest', file: 'content-sources/farm/equipment-sets/wiki/beetle-warlord-pet-s-quest.html', hash: '4c1bbe693e84bda8507c1383d45fa78df22357db261a4cb7cf8f0b55e66cb8b2' },
];
