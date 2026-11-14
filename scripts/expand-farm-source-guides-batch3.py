import runpy,json
from pathlib import Path
m=runpy.run_path('scripts/expand-farm-source-guides-batch2.py');add=m['add']
add(['arch-doomknight'],'/evil/adk',[('Ancient Doomknight',[
 ('Mở khóa','Cần Rank 7 Rep Evil, hoàn thành 13 Lords of Chaos và storyline /join shadowvault. Nhận các Quest của Ancient Doomknight tại /join shadowvault.',[6,8,9,10]),
 ('Gathering Power','Thu thập Undead Energy ×1,800 ở Screen 1 /join battleunderb; Human Souls ×500 tại Screen 13–14 /join noxustower; Dragon Energy ×600 tại Screen 5 /join lair.',[13,14,15,16]),
 ('Death\'s Door','Lấy Death\'s Power ×1 và Souls of the Dead ×400 từ Death tại /join shadowattack.',[17,18,19]),
 ('Chaotic Lords · 1','Lấy Escherion\'s Helm ×1 từ Escherion; Legendary Sword of Dragon Control ×1 từ Vath ở /join stalagbite; Hanzamune Dragon Koi Blade ×1 từ Kitsune; Wolfwing Armor ×1 từ Wolfwing; One-Eyed Doll Breaker ×1 từ Kimberly ở /join palooza.',list(range(20,26))),
 ('Chaotic Lords · 2','Lấy Ledgermayne Armor ×1; Tibicenas Armor ×1 ở /join djinn; Soul of Chaos Armor ×1 từ Khasaanda ở /join dreamnexus; Chaos Lionfang Armor ×1 ở /join stormtemple; Shorn Chaos King Crown ×1 từ Alteon ở /join swordhavenfalls.',list(range(26,31))),
 ('Chaotic Lords · 3','Lấy Xiang\'s Chaos ×1 ở /join mirrorportal; Drakath\'s Sword ×1 từ Champion of Chaos tại /join ultradrakath; Chaorrupted Hourglass ×1 từ Iadoa ở /join timespace; Chaotic Power ×13 từ các Chaos Lords đã nêu.',list(range(31,35))),
 ('A Means to an End · Reagents','Lấy Ultimate Darkness Gem ×50 từ quái ở Screen 2 /join shadowfallwar; Undead Energy ×2,000 từ Screen 1 /join battleunderb; (Necro) Scroll of Dark Arts ×2 từ Ultra Vordred tại /join epicvordred.',[35,36,37,38]),
 ('A Means to an End · Bosses','Lấy Doom Heart ×1 từ Ultra Sepulchure ở /join sepulchurebattle; Dread Knight Cleaver ×1 từ Dark Sepulchure ở /join sepulchure; Reaper\'s Soul ×1 từ Reaper ở /join thevoid; Desolich\'s Undead Eye ×2 từ Desolich. Hoàn thành A Means to an End.',[35,39,40,41,42])])])
# Primary Class and Cold Hearted cosmetics are different reward scopes.
common=[
 ('Điều kiện Seasonal','Hoàn thành storyline /join icedungeon trong Frostval tháng 12 để mở các Quest cho Envoy of Kyanos. Class và map nhận Class không tự là Seasonal, nhưng có điều kiện mở khóa từ nội dung Seasonal.',[2,5]),
 ('Cryomancer / Frost Sigil','Lấy Cryomancer với Glacera Ice Token ×84 từ Syrrus tại /join northstar; cần Karok Storyline từ /join frozentower. Daily nhận 18 token với Member HOẶC 12 token với Non-Member, chỉ chọn một Quest. Mua Frost Sigil từ Abel\'s Shop ở /join icedungeon.',[6,7]),
 ('Scythe / Mage / Slayer','Cần Fallen Scythe of Vengeance: Flames of Courage ×25 từ Flame of Courage của Karok ở /join frozenruins và Karok\'s Glaceran Gem ×1 từ Karok the Fallen ở /join northstar. Lấy IceBreaker Mage và FrostSlayer từ Enfield ở /join iceplane cho Quest thứ hai.',[8,9,10,11]),
 ('Envoy of Kyanos · I / II','Icy Token I ×75 từ Basic Ingredients (15 lượt, mỗi lượt hạ 10 Frozen Banshees, 10 Frozen Undead, 10 Ice Symbiote). Icy Token II ×45 từ Cool Flavor (15 lượt, mỗi lượt 10 Spirits of Ice, 10 ice Crystals, 10 Frigid Spirits).',[12,13,14]),
 ('Envoy of Kyanos · III / IV','Icy Token III ×30 từ Chilled to Perfection (15 lượt, mỗi lượt 5 Living Ice, 5 Crystalized, 5 Frozen Demons). Icy Token IV ×15 từ Icing on the Cake (15 lượt đánh Glace, Abel, Kyanos). Merge Envoy of Kyanos, gặp Abel ở /join icedungeon.',[12,15,16,18]),
 ('Cold Hearted','Mỗi lượt: Ice Needle ×30 từ monsters ở /join icestormarena trừ Icy Wind/Frost Spirit; Northern Crown ×1 từ Jon S\'Nooooooo ở /join snowmore; Ice Diamond ×3 từ Trade for the Ice Diamond của King Coal, đánh Snow Golem /join mountfrost. Làm 9 lượt để có Ice-Ninth ×9.',[19,20,21,22,23]),
 ('Cold Blooded','Mỗi lượt: Glacial Crystal ×100 từ Super-Charged Karok ở /join cryowar; Ice Spike ×20 và Ice Splinter ×20 từ monsters ở /join frozenlair trừ Lich Lord; Sapphire Orb ×2 từ Legion Lich Lord qua NPC Challenge. Làm 15 lượt để có Glaceran Attunement ×15; cần team cho boss.',[28,29,30,31,32]),
 ('Ice See You','Giao Ice-Ninth ×9 và Glaceran Attunement ×15 để hoàn thành Ice See You, nhận Frost SpiritReaver Class.',[36,37])]
add(['frost-spiritreaver-class'],'/others/fsr',[('Ice See You',common)])
add(['frost-spiritreaver-s-cloak','frost-spiritreaver-s-hair','frost-spiritreaver-s-locks'],'/others/fsr',[('Cold Hearted · Cosmetic',[
 ('Mở khóa Cold Hearted','Cần Frost Sigil (Abel\'s Shop ở /join icedungeon, yêu cầu Cryomancer) và Fallen Scythe of Vengeance. Đây là tuyến nhận cosmetic từ Cold Hearted, không phải Quest nhận Class cuối.',[6,8,18,19]),
 ('Nguyên liệu','Ice Needle ×30 từ monsters /join icestormarena trừ Icy Wind/Frost Spirit; Northern Crown ×1 từ Jon S\'Nooooooo /join snowmore; Ice Diamond ×3 từ Trade for the Ice Diamond của King Coal, đánh Snow Golem /join mountfrost.',[21,22,23]),
 ('Chọn cosmetic','Hoàn thành Cold Hearted và chọn Frost SpiritReaver\'s Locks, Hair hoặc Cloak tương ứng. Không cần ép đủ 9 lượt của tuyến Class để nhận riêng một cosmetic.',[24,25,26,27])])])
# Hollowborn alternative with rare prerequisite remains explicitly separate.
add(['hollowborn-oblivion-blade'],'/hollowborn/hbob',[
 ('Summoning and Stuff',[
 ('Mở khóa','Gặp Lae tại Tercessuinotlim; cần Level 80, Voucher of Nulgath (non-mem) và hoàn thành The 13 Lords of Chaos Saga.',[7,8,9,10]),
 ('Reagents','Nhận Summoning and Stuff; cần Unidentified 13 ×1, Diamond of Nulgath ×500, Archfiend\'s Favor ×1,000 và Blood Gem of the Archfiend ×50.',[14,16,17,18,19]),
 ('Unidentified 25 / Boss drops','Lấy Unidentified 25 ×1 từ The Assistant (1%, 100,000 Gold/lượt) HOẶC mua 15,000,000 Gold tại Swindle\'s Ripoff Emporium. Lấy Diabolical Minion\'s Seed ×1 từ Diabolical Warlord /join lostruinswar; 4th Dimension Gem ×1 từ Bring the Pain /join blackholesun; Celestial Seal ×1 từ Blessed Dragon /join goldenarena; Death\'s Power ×1 từ Death /join shadowattack.',[20,21,22,23,24]),
 ('Fresh Soul / Unidentified 36','Lấy Fresh Soul ×350 và Unidentified 36 ×1 từ Let\'s Make a Deal của Lae, đánh Inquisitor ở /join citadel.',[25,26]),
 ('ArchFiend Enchanted Orbs','Merge ArchFiend Enchanted Orbs ×1 ở ArchFiend Warlord Merge của Lae: Unidentified 36 ×1, Unidentified 25 ×1, Unidentified 13 ×1, Diamond of Nulgath ×150, Fresh Soul ×100, Blood Gem of the Archfiend ×10, Voucher of Nulgath (non-mem) ×1. Đây là công thức phụ, tách khỏi nguyên liệu Quest.',list(range(27,35))),
 ('Hoàn thành Quest','Dùng các nguyên liệu của Summoning and Stuff để nhận Hollowborn Oblivion Blade.',[1,12,14])]),
 ('Nhánh yêu cầu weapon Rare',[
 ('Điều kiện riêng','Ngoài Level 80, Voucher of Nulgath (non-mem), hoàn thành 13 Lords of Chaos và gặp Lae, nhánh này cần Oblivion Blade of Nulgath HOẶC bản Dual đã Rare. Không phải tuyến mặc định cho người chưa có weapon này.',[7,8,9,10,35,36]),
 ('Nguyên liệu nhánh','Chuẩn bị Unidentified 25 ×1, Death\'s Power ×1, Law of Conservation of Energy ×1 từ Tonitru /join thunderfang, Fresh Soul ×100, Unidentified 36 ×1 và ArchFiend Enchanted Orbs ×1. Tên Quest của nhánh này chưa có trong snapshot hướng dẫn, không tự đặt tên.',list(range(37,43)))])])
Path('content-sources/farm/import/guide-overrides.json').write_text(json.dumps(add.__globals__['overrides'],ensure_ascii=False,indent=2)+'\n')
print('Reviewed source guide items:',len(add.__globals__['overrides']))
