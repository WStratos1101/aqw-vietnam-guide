/** Merge display duplicates for an identical named quest, without summing ingredients. */
const normalize = (value) => String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
export function distinctMaterialQuestChoices(tasks) {
  const seen = new Map();
  const score = (task) => (task.rows?.length || 0) * 5 + (task.preconditions?.length || 0) * 2 +
    (task.requirements?.length || 0) + (task.ownedItems?.length || 0) * 2 +
    ['npc','map','location','repeatability','reward','source','bossId'].filter(key=>Boolean(task[key])).length +
    (task.fixedRewards?.length || 0) + (task.rewardChoices?.length || 0);
  tasks.forEach((task, index) => {
    // Never collapse distinct shop/drop alternatives: only exact quest names.
    const key = task.quest ? `quest:${normalize(task.quest)}` : `other:${index}`;
    const existing = seen.get(key);
    if (!existing || score(task) > score(existing)) seen.set(key, task);
  });
  return [...seen.values()];
}

/** Verified fallback recipe for an imported material without a complete workflow. */
export function verifiedMaterialQuest(name) {
  if (normalize(name) !== 'purified undead dragon essence') return null;
  return {
    quest: "I'm Gonna Let It Shine",
    npc: 'Stellaria',
    map: '/join techfortress',
    prerequisites: ['Overwhelmed Axe và Blinding Light of Destiny (Axe) phải có trong inventory'],
    ingredients: [
      { name:'Purification Orb', quantity:10, map:'/join doomwood', source:'Undead Paladin' },
      { name:'Rainbow Moonstone', quantity:5, map:'/join earthstorm', source:"Dr’Rader’s Trade for the Rainbow Moonstone quest" },
      { name:"Desolich’s Dark Horn", quantity:3, map:'/join desolich', source:'Desolich' },
    ],
    quantityPerTurn:1,
    url:'https://aqwwiki.wikidot.com/stellaria-s-quests',
  };
}
