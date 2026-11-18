from pathlib import Path
from collections import defaultdict, Counter
from csv import DictWriter
import json, re, shutil, unicodedata
from datetime import datetime

OUT=Path(__file__).resolve().parent
SRC=OUT/'FARMING_ITEM_GUIDE_SOURCE.txt'
lines=SRC.read_text(encoding='utf-8').splitlines()
chapters=[]
for i,line in enumerate(lines,1):
 m=re.match(r'^(II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII)\. (.+)$',line.strip())
 if m:
  chapters.append({'section':m.group(1),'heading':m.group(2),'start':i,'end':len(lines)})
for idx,ch in enumerate(chapters[:-1]): ch['end']=chapters[idx+1]['start']-1
assert len(chapters)==12

groups={
 'Good':('good','GOOD'), 'Evil':('evil','EVIL'),'Chaos':('chaos','CHAOS'),
 'Museum':('awe','AWE / MUSEUM'),'Forge':('blacksmithing','BLACKSMITHING / FORGE'),
 'Nation':('nation','NATION'),'Legion':('legion','LEGION'),
 'Dragonkin':('dragonkin','DRAGONKIN'),'Elemental':('elemental','ELEMENTAL'),
 'Hollowborn':('hollowborn','HOLLOWBORN'),
 'Debris & Astravian':('debris-astravian','DEBRIS & ASTRAVIAN'),
 'Other Items':('other-items','OTHER ITEMS (chưa gán phe)')
}

# Grounded output goals: chapter headings and explicit named rewards.
# (line number, exact display label, kind). kind describes source grouping; never an implied Wiki item type.
data={
'Good':[
(343,'Blinding Light of Destiny','weapon'),(487,'Blinding Bow of Destiny','weapon'),(506,'Blinding Blade of Destiny','weapon'),(526,'Blinding Scythe of Destiny','weapon'),
(592,'Ascended Light of Destiny','weapon'),(595,'Dual Blinding Light of Destiny','weapon'),(602,'Sanctified Light of Destiny','weapon'),(609,'Obsidian Light of Destiny','weapon'),
(644,'ArchPaladin','class'),(732,"King's Echo",'class'),(801,'LightCaster','class'),(836,'Celestial of Mysteries','set'),(879,'Lord of Order','class'),(967,'Silver Exalted Paladin','set'),(970,'Gold Exalted Paladin','set')],
'Evil':[
(1013,'Necrotic Sword of Doom','weapon'),(1216,"Sepulchure's DoomKnight Armor",'armor'),(1507,"Sepulchure's Original Helm",'helm'),(1543,'Verus DoomKnight','class'),
(1660,'ShadowReaper Of Doom','weapon'),(1661,'Twin Blades of Doom','weapon'),(1662,'SkullStaff of Doom','weapon'),
(1669,'Corrupt ShadowReaper of Doom','weapon'),(1670,'Corrupt Twin Blades of Doom','weapon'),(1671,'Corrupt Skullstaff of Doom','weapon'),
(1679,'Unreal ShadowReaper of Doom','weapon'),(1680,'Unreal Twin Blades of Doom','weapon'),(1681,'Unreal Skullstaff of Doom','weapon'),
(1688,"Vordred's Armor",'armor'),(1772,'Lich','class'),(1801,'Fabled Doomknight','set'),(1815,'Fabled Doom Blade','weapon'),
(1820,'Arch DoomKnight','set'),(1872,'Doom Metal Necro','class'),(1896,'ShadowScythe General','class'),(1909,'DeathKnight Lord','class')],
'Chaos':[(1932,'Original Drakath Armor','armor'),(1971,'Chaorrupter Unlocked','weapon'),(1989,'Drakath the Eternal','set'),(2023,'Titan Drakath','set'),(2110,'Ouroboros Warlock','set')],
'Museum':[(2138,'Blade of Awe','weapon'),(2174,'Armor of Awe','armor'),(2174,'Helm of Awe','helm'),(2174,'Cape of Awe','cape'),(2206,'Awescended Omni Set','set')],
'Forge':[(2331,'Polished Blinding Light of Destiny','weapon'),(2354,'Toxic Plague Spear','weapon'),(2363,'Burning Phoenix Blade','weapon'),(2372,"O-dokuro's Blight",'weapon'),(2381,'Polished Manslayer','weapon'),(2390,'Cursed DoomBlade','weapon'),(2394,"Reborn Sepulchure's Helm",'helm'),(2404,"Balor's Resurgence Blade",'weapon'),(2404,"Balor's Resurgence Blades",'weapon')],
'Nation':[
(3453,'Void Highlord','class'),(3649,'ArchFiend DoomLord','set'),(3750,'DragonBlade of Nulgath','weapon'),
(3783,'Void Paladin','set'),(3783,'Cyber Void Paladin','set'),(3836,'Void Light of Destiny','weapon'),(3845,'Cyber Void Light of Destiny','weapon'),
(3847,'Void Shogun','set'),(3880,'Void Warlock','set'),(3880,'Void Destroyer','set'),(4153,'Celestial ArchFiend','set'),(4018,'Infernal ArchFiend','set'),
(4165,'Evolved Blood Orb Set','set'),(4205,'Evolved Hex Orb Set','set'),(4271,'Evolved Shadow Orb Set','set'),(4337,'Evolved Primal Orb','pet'),(4337,'Evolved Void Orb Pet','pet'),
(4398,'Enchanted Nulgath Nation House','house'),(4426,'Juggernaut Items of Nulgath','collection'),
(4453,'Dual Dragonbone Axe of Nulgath','weapon'),(4468,'Dual Tainted Claymore of Nulgath','weapon'),(4480,'Dual Purified Claymore of Destiny','weapon'),
(4494,'Combat Soulreaper of Nulgath','weapon'),(4510,'Dual Manslayer of Taro','weapon'),(4526,'Dual Champion Blade of Nulgath','weapon'),(4542,'Sword of Nulgath','pet'),
(4574,'Void Avenger Scythe','weapon'),(4600,'ArchFiend','class'),(4624,'ArchFiend Warlord Set','set'),(4701,'Archfiend DeathLord','set'),(4775,'Gemstone of Nulgath','pet'),
(4819,"Taro's Prismatic Manslayer",'weapon'),(4845,'Unstable Betrayal Blade','weapon'),(4870,"Nulgath's Oathbreaker",'weapon'),
(4904,'Blood Ranger Set','set'),(4904,'Storm Knight Set','set'),(4966,'Ancient Shogun Set','set'),(5017,"Nation Yulgath's Inn House",'house'),
(5031,'Elite Void Set','set'),(5053,"Fiend's Creed Blade",'weapon-group'),(5063,'Wretched Vertebrae','weapon'),(5067,'Wrought Ironblood Armblade','weapon-group'),
(5071,'Void Warmonger Gauntlet','weapon'),(5075,'Warlord of Nulgath Blade','weapon-group'),(5075,'Sin of the Warlord Cleaver','weapon-group'),
(5075,'Void Warmonger Armaments','set'),(5086,'Fiendish Zweihander','weapon-group')],
'Legion':[(5303,'Legion Revenant','class'),(5489,'Yami no Ronin','class'),(5578,'Sin of the Undying','weapon'),(5609,'Head of the Legion Beast','helm'),(5720,'Legion Bonfire Set','set'),
(5874,'Legion DragonBlade of Nulgath','weapon'),(5930,'Caladbolg','weapon'),(5930,'Dual Caladbolgs','weapon'),(5950,'Hraesvelgr','weapon'),(5950,'Dual Hraesvelgr','weapon'),(5950,'Hraesvelgr Shield','weapon'),(5969,'Underworld Tribute Gear','collection')],
'Dragonkin':[(6024,'Dragon of Time','class'),(6120,"Fire Champion’s Armor",'armor'),(6155,"Dark Dragon Slayer's Halberd",'weapon'),(6182,'Enchanted Yokai Dragonslayer','weapon'),(6204,'Dragonslayer General','class'),(6217,'DragonSoul Shinobi','class'),(6217,'Shadow Dragon Shinobi','class')],
'Elemental':[(6237,'ArchMage','class'),(6441,'Elemental Warrior','class-family'),(6460,'Malgor the ShadowLord','set'),(6527,'Mystical Devotee of Mana','set'),(6549,'Kathool Adept','class'),(6621,'StoneCrusher','class'),(6635,'Scion of Flames','class'),(6689,'Blaze Binder','class'),(6709,'Frostval Barbarian','class'),(6730,'Frost SpiritReaver','class')],
'Hollowborn':[(6779,'Hollowborn Vindicator','class'),(6823,'Hollowborn Paladin','set'),(6922,'Hollowborn DoomKnight','set'),(7076,'Hollowborn Envoy of Chaos','set'),(7213,'Hollowborn Archfiend','set'),(7405,'Hollowborn Lich King','set'),
(7663,"Hollowborn DragonSlayer's Blade",'weapon'),(7667,"Hollowborn Reaper's Daggers",'weapon'),(7667,"Hollowborn Reaper's Kama",'weapon'),(7667,"Hollowborn Reaper's Kamas",'weapon'),
(7673,"Hollowborn Reaper's Minion",'pet'),(7678,"Hollowborn Reaper's Scythe",'weapon'),(7685,'Hollowborn Oblivion Blade','weapon'),(7738,"Lazure's Awakened Skull",'pet'),(7781,'Hollowborn Frost King & Queen Set','set')],
'Debris & Astravian':[(7834,'Arcana Invoker','class'),(8161,'Higure','weapon'),(8161,'Astravian Corsair','set')],
'Other Items':[(8226,'Celestial Pirate Commander','set'),(8226,'Polly Roger','pet'),(8251,'Aureate Shield Aegis','armor'),(8270,'Martial Artist','class'),
(8755,'Scarlet Sorceress','class'),(8762,'Evolved Leprechaun','class'),(8772,'Unundead Goat','class'),(8787,'Dark Lord','class'),
(8797,'Naval Commander','class'),(8804,'Vampire Lord','class'),(8814,'Chrono Assassin','class'),(8823,"Heroic Titan's Greatsword",'weapon'),
(8837,'Headless Pumpkin Set','set'),(8854,'Fortitude + Hubris','weapon-group'),(8878,'Golden Blade of Fate','weapon')]
}

# Named direct quest rewards and subordinate item sets explicitly present in source.
# These are source-backed target candidates, NOT a claim that all variants are fully enumerated.
data['Good'].extend([
(848,'Archangel of Mysteries','set'),(864,'Archangel of Mysteries Companion','pet')])
data['Nation'].extend([
(3940,'Void Spartan','set'),(3970,'Void Beetle General','set'),(3970,'Void Beetle Warlord','set'),
(3895,'Void Warlock Scythe','weapon'),(3896,'Void Warlock Staff','weapon'),(3897,'Void Warlock Overfiend Blade','weapon'),
(3898,'Void Warlock Overfiend Blade Pet','pet'),(3899,'Void Warlock Crown','helm'),
(3911,'Void Warlock Helm','helm'),(3912,'Void Warlock Hood','helm'),
(3913,'Void Warlock Cape','cape'),(3914,'Void Warlock Tendrils Cape','cape'),
(3915,'Void Warlock Tendrils','item'),(3916,'Void Warlock Horns','helm')])
data['Legion'].extend([
(5794,'Legion Soul Devourer','item'),(5801,'Dual Legion Soul Devourers','weapon'),(5809,'Undead Spawn Minion','pet'),
(5816,'Legion Forge Spawn','item'),(5824,'Legion Forge Visor','helm'),(5832,'Legion Infinite Flames','item'),
(5840,'Legion Spawn Runes','item'),(5848,'Legion Bonfire Altar','house')])
data['Hollowborn'].extend([
(6900,'Hollowborn Shadow of Fate','weapon'),(6909,'Classic Hollowborn Paladin Armor','armor'),(6915,'Dual Hollowborn Shadows of Fate','weapon'),
(6965,'Classic Hollowborn Doomknight','armor'),(6981,"Hollowborn Empress' Blade",'weapon'),
(7283,'Hollowborn Legacy of Nulgath','set'),(7306,'Hollowborn Metamorphosis of Nulgath','set'),
(7350,'Hollowborn Hex of Nulgath','armor'),(7365,'Hollowborn Blood of Nulgath','armor'),
(7383,'Hollowborn Fiend of Nulgath','armor'),(7400,'Hollowborn Shadow of Nulgath','armor'),
(7474,'Altar Of the Hollowborn Caladbolg','house'),(7493,'Lesser Hollowborn Caladbolg','weapon'),
(7506,'Hollowborn Caladbolg','weapon'),(7507,'Dual Hollowborn Caladbolgs','weapon')])

# Inspect chapter index, all direct chapters and support topics, distinct from item target rows.
index=[]
for ch in chapters:
 headings=[(i,x.strip()) for i,x in enumerate(lines,1) if ch['start'] <= i <= ch['end'] and re.match(r'^\d+\. ',x.strip())]
 for k,(i,title) in enumerate(headings):
  next_line=headings[k+1][0]-1 if k+1<len(headings) else ch['end']
  index.append({'group':groups[ch['heading']][1], 'group_id':groups[ch['heading']][0],
                'guide_title':re.sub(r'^\d+\.\s*','',title), 'start_line':i, 'end_line':next_line,
                'source_chapter':ch['section']+'. '+ch['heading']})

rows=[]
for ch in chapters:
 group=ch['heading'];id,label=groups[group]
 for line,name,typ in data[group]:
  assert ch['start'] <= line <= ch['end'],(group,line)
  raw=lines[line-1].strip()
  def norm(v): return re.sub(r'[^\w]+','',unicodedata.normalize('NFKC',v).lower().replace('’',"'")).casefold()
  check=norm(name) in norm(raw)
  if not check: print('REVIEW MISMATCH',group,line,name,'\n',raw[:100])
  rows.append({'group_id':id,'group':label,'name':name,'record_kind':typ,
               'source_line':line,'source_chapter':ch['section']+'. '+ch['heading'],
               'evidence_text':raw[:300], 'evidence_match':'exact_in_line' if check else 'needs_review',
               'scope': ('related_reference_needs_confirmation' if group=='Good' and line in (592,595,602,609) else 'guide_output_or_named_set'),
               'implementation_note':'expand actual members from in-section rewards before creating separate canonical items' if typ in ('set','collection','weapon-group','class-family') else ''})

# Supplementary guide-only chapter entries intentionally not item targets.
for entry in index:
 entry['is_equipment_record']=False

# Optional reward excerpts: candidates from explicitly marked Rewards lines, NOT auto-verified items.
reward_lines=[]
for i,raw in enumerate(lines,1):
    if i<chapters[0]['start']:continue
    if not re.search(r'(?i)^\s*Rewards?\s*:',raw):continue
    ch=next((c for c in chapters if c['start']<=i<=c['end']),None)
    if not ch:continue
    last_guide=next((x for x in reversed(index) if x['group_id']==groups[ch['heading']][0] and x['start_line']<=i<=x['end_line']),None)
    excerpt=[raw.strip()]
    if re.search(r'(?i)quest dạng chọn|rớt ngẫu nhiên|tất cả đều|phần thưởng',raw):
        for j in range(i,min(i+17,len(lines))):
            t=lines[j].strip()
            if not t or t.startswith(('◆','→')) or re.search(r'(?i)^note:|^quest |^để hoàn thành',t):break
            if len(t)<180:excerpt.append(t)
    reward_lines.append({'group':groups[ch['heading']][1], 'source_line':i,
                         'parent_guide':last_guide['guide_title'] if last_guide else '',
                         'excerpt':' | '.join(excerpt)[:1300],
                         'status':'REVIEW_REWARD_CANDIDATES; materials/house items must be distinguished'})
with (OUT/'reward_blocks_to_review.csv').open('w',newline='',encoding='utf-8-sig') as f:
    w=DictWriter(f, fieldnames=list(reward_lines[0])); w.writeheader();w.writerows(reward_lines)

# Goal/difficulty list is a cross-cutting index and must not be treated as faction membership.
meta={'source_file':'FARMING_ITEM_GUIDE_SOURCE.txt','source_lines':len(lines),
      'coverage':'Named guide goals + curated explicit named subgoals ONLY; not an exhaustive list of every individual set reward.',
      'source_of_group':'chapter II–XIII; I. Farming List is cross-cutting and excluded',
      'canonical_item_status':'needs exact Wiki/item identity check; do not trust set label as a standalone item',
      'source_priority':'guide headings for group, wiki for technical identity and methods; no inferred faction from names',
      'other_items':'Ungrouped chapter in source; never invent a faction identity',
      'group_aliases':{'Museum':'AWE','Forge':'BLACKSMITHING'},
      'generated_at':'2026-11-14'}

(OUT/'faction_goals.json').write_text(json.dumps({'meta':meta,'chapters':chapters,'goals':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
with (OUT/'faction_goals.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
with (OUT/'guide_sections.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=DictWriter(f,fieldnames=list(index[0]));w.writeheader();w.writerows(index)
by=defaultdict(list)
for row in rows:by[row['group']].append(row)
with (OUT/'FACTION_LIST.md').open('w',encoding='utf8') as f:
 f.write('# AQW — DANH MỤC FARM THEO CHƯƠNG CỦA GUIDE\n\n')
 f.write('Nguồn: `FARMING_ITEM_GUIDE_SOURCE.txt` do người dùng cung cấp, 9.212 dòng. Danh mục này bao gồm **mục tiêu farm được nêu rõ** và những phần thưởng/nhóm có tên rõ ràng, **không phải danh sách đầy đủ tất cả item trong mọi set**. Mỗi dòng dẫn tới số dòng nguồn.\n\n')
 f.write('**Quan trọng:** `set`, `collection`, `class-family` và `weapon-group` chỉ là nhóm mục tiêu. Codex phải đọc phần Reward/Quest cụ thể và xác minh Wiki trước khi tạo từng canonical item; không tạo item giả mang tên set. `Other Items` không phải phe; để vào nhóm tạm theo chapter.\n\n')
 f.write('| Nhóm từ guide | Số mục tiêu đã lọc | Phạm vi dòng nguồn |\n|---|---:|---|\n')
 for c in chapters:
  label=groups[c['heading']][1]
  f.write(f'| {label} | {len(by[label])} | {c["start"]}–{c["end"]} |\n')
 f.write('\n')
 for c in chapters:
  label=groups[c['heading']][1]
  f.write(f'## {label}\n\n')
  for r in by[label]:
   suffix=' — *nhóm/set cần mở rộng*' if r['record_kind'] in ('set','collection','weapon-group','class-family') else ''
   warn=' **[cần kiểm tra tên tại dòng nguồn]**' if r['evidence_match']!='exact_in_line' else ''
   f.write(f'- **{r["name"]}** ({r["record_kind"]}, dòng {r["source_line"]}){suffix}{warn}\n')
  f.write('\n')
 f.write('## Không tự động gán phe\n\n- `I. Farming List`, `Goals List`, `Daily/Weekly/Monthly Farming List` chỉ là danh sách theo độ khó/thời gian, không phải phân phe.\n- `Tercessuinotlim`, `Nulgath’s resources Farming Guide`, `Legion Token Guide`, `Joining the Legion`, `Blacksmithing Enhancement`, `NPC Friendship` là hệ thống/đầu việc hỗ trợ, không mặc định là một trang bị cụ thể.\n- Các tên chỉ được nhắc là **nguyên liệu** hoặc **điều kiện tiên quyết** trong một chương không tự trở thành trang bị của nhóm đó. Ví dụ: Blade of Awe được dẫn trong nhiều quest nhưng mục gốc thuộc Museum/AWE.\n- Item chỉ có ở Wiki/Ultra Boss và không được guide phân nhóm: không được ép gán phe; ghi `sourceFaction=unverified` rồi yêu cầu dữ liệu curated bổ sung.\n')
print('rows',len(rows),'guide sections',len(index),'reward blocks',len(reward_lines))
print('match',Counter(x['evidence_match'] for x in rows))
for k in [groups[c['heading']][1] for c in chapters]:print(k,len(by[k]))
