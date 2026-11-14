"""Reviewed continuation of source-line walkthroughs; rerunnable and additive."""
import runpy,json
from pathlib import Path
m=runpy.run_path('scripts/expand-farm-source-guides.py');add=m['add']
add(['necrotic-blade-of-doom'],'/evil/nsod/nbod',[
 ('Void Essentia · Drop',[
 ('Chuẩn bị','Cần Necrotic Sword of Doom ×1 và Void Aura ×750. Merge cuối tại Braeus\' Merge Shop ở /join shadowfall.',[3,4,5]),
 ('Void Essentia','Đánh FlibbitiestGibbet tại /join voidflibbi để lấy Void Essentia ×1 (4%). Boss có thể one-shot; cần đội hình phù hợp.',[6,7]),
 ('Merge','Dùng Necrotic Sword of Doom ×1, Void Aura ×750 và Void Essentia ×1 tại Braeus\' Merge Shop.',[3,4,5,6])]),
 ('Void Essentia · Merge',[
 ('Chuẩn bị','Cần Necrotic Sword of Doom ×1 và Void Aura ×750 cho công thức cuối.',[3,4,5]),
 ('Nguyên liệu phụ','Lấy Void Essence ×25 từ FlibbitiestGibbet ở /join voidflibbi (100%), chuẩn bị thêm Void Aura ×75 và 750,000 Gold.',[7,8]),
 ('Merge Void Essentia','Tại Void Merge Shop ở /join thevoid, dùng Void Essence ×25, Void Aura ×75 và 750,000 Gold để merge Void Essentia ×1. Đây là công thức phụ, tách với Void Aura ×750 của bước cuối.',[8]),
 ('Merge weapon','Dùng Necrotic Sword of Doom ×1, Void Aura ×750 và Void Essentia ×1 tại Braeus\' Merge Shop ở /join shadowfall.',[3,4,5,6])])])
add(['necrotic-blade-of-the-underworld'],'/evil/nsod/nbou',[('Quest · Underworld',[
 ('Mở khóa','Cần Level 95, Necrotic Sword of Doom và Underworld Blade of DOOM (drop từ Dage the Evil ở /join dage).',[4,5,6,7]),
 ('Legion materials','Chuẩn bị Legion Token ×25,000 và Soul Sand ×7; lấy Beast Soul ×25 từ The Beast ở /join sevencircleswar.',[9,10,11]),
 ('Dage Insignia','Chuẩn bị Dage the Evil Insignia ×5 để hoàn thành Quest. Hướng dẫn mô tả tuyến này theo chu kỳ tuần.',[3,12])])])
add(['lightcaster-class'],'/good/lc',[('LightCaster Class',[
 ('Điều kiện','Cần Level 80. Evolved LightCaster (Armor) có giá 1,000 ACs và dùng để lấy LightMage.',[6,7]),
 ('Celestial story','Hoàn thành Aranx\'s Quests đến Celestial Realm at War và các Quest tại /join celestialrealm, /join lostruins, /join lostruinswar.',[9,10]),
 ('Burning Blade / Spirits','Lấy Burning Blade từ Diabolical Warlord ở Screen 7 /join lostruinswar (1%). Lấy Trapped Spirits ×500 từ Fallen Knight hoặc Infernal Knight tại Screen 4 /join celestialrealm hoặc /join lostruinswar; hoàn thành Guardian of Spirits\' Blade.',[13,14,15]),
 ('Scythe / Lance','Làm Avatar of Death\'s Scythe và Spear of Time cùng lúc: Energy of Death ×500 từ Underworld Hound, Captured Time ×500 từ Infernal Imp ở Screen 5–6 /join lostruinswar.',[16,17]),
 ('Celestial Arena','Hoàn thành các Quest của Aranx tại /join celestialarena. Sau Battle Fallen Abezeth!, nhận FINAL FIGHT! để đánh Aranx, lấy Champion Sash ×20; merge Burning Blade Of Abezeth với 1,500,000 Gold tại Ramiel\'s Celestial Champion Shop.',[18,19,20,21]),
 ('LightMage','Gặp Aranx ở /join celestialrealm: mua Evolved LightCaster Armor 1,000 ACs (không bán lại), lấy LightMage Class Token A rồi đổi LightMage. Đây là cùng Armor đã nêu trong điều kiện, không cần mua lần hai.',[23,24,25,26]),
 ('LightCaster Class Quest','Cho LightMage nhận ít nhất 1 Class Point; giữ Class cùng Guardian of Spirits\' Blade, Avatar Of Death\'s Scythe, Lance of Time, Burning Blade và Burning Blade Of Abezeth trong inventory để mở LightCaster Class.',[27,28]),
 ('Aranx\'s Pure Light','Nhận lại FINAL FIGHT! để đánh Aranx ở /join celestialarena, lấy Aranx\'s Pure Light ×1 (10%). Quay về Aranx ở /join celestialrealm để trả LightCaster Class.',[29,30])])])
add(['celestial-pirate-commander'],'/others/cpc',[('Sailor of the Celestial Skies',[
 ('Seasonal / Quest','Trong TLAPD tháng 9, đến /join pirates, đi trái tới Screen 16 và nhận Sailor of the Celestial Skies từ Barnaby.',[3,4]),
 ('Orb / Rumors','Sapphire Orb ×5 từ Legion Lich Lord ở /join frozenlair (NPC Legion Lich King → Challenge; cần team). Rumors of a Celestial Commander ×5 từ Diabolical Warlord ở /join lostruinswar.',[6,7]),
 ('Journal Pages','Chuẩn bị Starlit Journal Page 1 Scraps ×10 từ Animus Ice ở /join iceplane; Page 2 Scraps ×10 từ Ivoliss ở /join ivoliss; Page 3 Scraps ×10 từ Nightbane ở /join voidnightbane; Page 4 Scraps ×10 từ Ultra SN.O.W ở /join extinction. Nightbane có thể one-shot.',[8,9,10,11]),
 ('Map / Coffer','Lấy Map of the Celestial Seas ×1 từ Empowered Prime ở /join starsinc và Coffer of the Stars ×1 từ Archfiend DragonLord ở /join underlair (cần team). Hoàn thành Sailor of the Celestial Skies; 12 lượt được nêu là cho toàn bộ set, không phải yêu cầu riêng của item này.',[5,12,13])])])
# Google Docs lines are retained plain-text evidence, not a claim that embedded content was read.
doc='/document/d/1yPGo5Qa6hS70jy8AIHhUUnosSknAY9N_qH6m1NETIEA/edit'
add(['crimson-face-plate-of-nulgath','crimson-plate-of-nulgath','dragonfire-of-nulgath'],doc,[('Twisted Items of Nulgath',[
 ('Truy cập Quest','Có thể mở Quest của Sword of Nulgath qua pet của mình hoặc người chơi khác; không cần trang bị pet. Nhận Twisted Items of Nulgath.',[5335,5338,5339]),
 ('Totem / Rune','Mỗi item cần Totem of Nulgath ×3 và Skull Warrior Rune ×1; Rune drop từ Skull Warrior ở /join evilwarnul.',[4422]),
 ('Chọn item','Hoàn thành Twisted Items of Nulgath để nhận Crimson Plate of Nulgath, Crimson Face Plate of Nulgath hoặc DragonFire of Nulgath theo lựa chọn cần farm. Mỗi món là một lượt riêng, không gộp cả ba phần thưởng thành một lượt.',[4422])])])
add(['evolved-blood-of-nulgath'],doc,[('Flow like Blood',[
 ('Điều kiện','Hoàn thành mở khóa Tercessuinotlim; cần Rank 10 Rustbucket (Protosartorium Parts ở /join crashsite), Evolved Blood Orb và Platinum Coin of Nulgath: 2500 từ Nulgath ở /join tercessuinotlim.',[4894,4896,4897,4898,4899]),
 ('Evolved Blood Orb','Merge Evolved Blood Orb Pet ở Dirtlicker\'s Shop /join archportal: Nulgath\'s Approval ×200, Totem of Nulgath ×10, Diamond of Nulgath ×30, Voucher of Nulgath (non-mem) ×1 và Unidentified 13 ×3.',[4886,4887,4888,4889,4890,4891]),
 ('Reagents / Crimson Plate','Chuẩn bị Unidentified 13 ×3, Blood Gem of the Archfiend ×20 và Crimson Plate of Nulgath ×1 từ Twisted Items of Nulgath.',[4902,4903,4904,4905]),
 ('Unidentified 23','Lấy Unidentified 23 ×1: làm The Assistant của Swindle Bilk tại /join tercessuinotlim (1%, tốn War-Torn Memorabilia mua 100,000 Gold) HOẶC mua 15,000,000 Gold tại Swindle\'s Ripoff Emporium.',[4906,4907,4908]),
 ('Phần thưởng cuối','Lấy Dimensional Champion of Nulgath ×1 từ Juggernaut Items of Nulgath và 1v1 PvP Trophy ×10 từ Victory Most Honorable ở /join doomarena (daily). Hoàn thành Flow like Blood; yêu cầu này khác với Quest nâng cấp Empowered.',[4894,4909,4910])])])
add(['evolved-shadow-of-nulgath'],doc,[('Reborn in the Dark Side',[
 ('Điều kiện','Cần Rank 10 Bard (mua tại Mythsong Rep Shop /join mythsong, Rank 4 Mythsong), Evolved Shadow Orb và Platinum Coin of Nulgath: 2500 mua từ Nulgath tại /join tercessuinotlim.',[5018,5020,5021,5022]),
 ('Reagents','Chuẩn bị Unidentified 13 ×3, Voucher of Nulgath (mem) ×1 và Nulgath\'s Approval ×1.',[5025,5026,5027,5028]),
 ('Unidentified 25','Lấy Unidentified 25 ×1: The Assistant của Swindle Bilk tại /join tercessuinotlim (1%, mỗi lượt cần War-Torn Memorabilia 100,000 Gold) HOẶC mua 15,000,000 Gold tại Swindle\'s Ripoff Emporium.',[5029,5030,5031]),
 ('Blade / Fiend Token','Chuẩn bị Behemoth Blade of Shadow ×1; mua Fiend Token ×30, mỗi token 100,000 Gold, ở ArchFiend Merge Shop của Oblivion tại /join tercessuinotlim.',[5032,5033]),
 ('Azure Starblade','Merge Azure Starblade ×1 tại BattleCon Gear /join arena với DeadMog LED ×25 từ Deadmoglinster HOẶC BattleCon Souvenir Gear. Hoàn thành Reborn in the Dark Side; không áp dụng hướng dẫn này cho các Quest variant Rare/Shadow khi chưa đối chiếu điều kiện riêng.',[5018,5034])])])
# Save the shared globals modified by add().
overrides=add.__globals__['overrides']
Path('content-sources/farm/import/guide-overrides.json').write_text(json.dumps(overrides,ensure_ascii=False,indent=2)+'\n')
print('Reviewed guide override items:',len(overrides))
