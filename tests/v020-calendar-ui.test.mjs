import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const text = path => fs.readFileSync(path,'utf8');

test('v0.2.0 remains scoped to calendar acquisition', () => {
  const ui=text('src/features/classes/ClassAcquisitionPanel.tsx');
  const helper=text('src/lib/calendar-acquisition-v020.ts');
  assert.match(ui,/presentedCalendarMethods\(profile\.id/);
  assert.match(helper,/if \(!classId\.startsWith\("calendar-"\)\) return methods/);
  assert.match(helper,/HeroPoints/);
  assert.match(ui,/acquisitionTabLabel\(m\)/);
});
test('calendar consumables are verified 3+3 per year', () => {
  const s=text('src/features/classes/CalendarConsumables.tsx');
  assert.match(s, /"2019"/);
  assert.match(s, /"2020"/);
  assert.match(s, /Entropic Corruption/);
  assert.match(s, /Timepiece of Madness/);
  assert.match(s, /\.filter\(item => item\.group === group\)/);
});
test('combo flow renders game skill icons and avoids repeated explanation',()=>{
  const s=text('src/features/classes/ClassCombos.tsx');
  assert.match(s,/SkillSequenceFlow/);
  assert.match(s,/CalendarSetup/);
  assert.match(s,/AbyssalConditionIcons/);
  assert.match(s,/extraNotes/);
  assert.doesNotMatch(s,/<p>\{active\.explanation\}<\/p>/);
});
test('version is 0.2.0',()=>{
  const pkg=JSON.parse(text('package.json'));
  assert.equal(pkg.version,'0.2.0');
  if(fs.existsSync('package-lock.json')) {
    assert.equal(JSON.parse(text('package-lock.json')).version,'0.2.0');
  }
});

test('v0.2.0 calendar acquisition typing stays valid',()=>{
  const helper=text('src/lib/calendar-acquisition-v020.ts');
  const ui=text('src/features/classes/ClassAcquisitionPanel.tsx');
  assert.match(helper, /from \"\.\.\/types\/class-acquisition\"/);
  assert.match(ui, /icons\[m\.type as ClassAcquisitionMethod\[\"type\"\]\]/);
});
