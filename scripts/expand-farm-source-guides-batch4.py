import runpy,json
from pathlib import Path
m=runpy.run_path('scripts/expand-farm-source-guides-batch3.py');add=m['add']
common=[
 ('Reagents','Chuẩn bị Diamond of Nulgath ×40, Dark Crystal Shard ×40, Gem of Nulgath ×20, Tainted Gem ×40 và Totem of Nulgath ×1.',[4,6,7,8,9,10]),
 ('Emblem / Void Aura','Lấy Emblem of Nulgath ×3 từ Nation Recruits: Seal Your Fate của Tharanak Hrii tại /join shadowblast. Cần các Quest trước và Nation Round 4 Medal; đánh Screen 16–17. Chuẩn bị Void Aura ×6.',[11,12])]
add(['void-light-of-destiny'],'/nation/vss/void-light-of-destiny',[
 ('Sacrifice · BLoD', [('Blinding Light of Destiny','Chọn Sacrifice (BLoD Version); chuẩn bị Blinding Light of Destiny ×1. Đây là lựa chọn thay thế cho Ascended Light of Destiny, không yêu cầu cả hai.',[3,5])]+common+[('Hoàn thành Sacrifice','Giao nguyên liệu cho Sacrifice (BLoD Version) để nhận Void Light of Destiny.',[3,13])]),
 ('Sacrifice · ALoD', [('Ascended Light of Destiny','Chọn Sacrifice (ALoD Version); chuẩn bị Ascended Light of Destiny ×1. Đây là lựa chọn thay thế cho Blinding Light of Destiny, không yêu cầu cả hai.',[3,5])]+common+[('Hoàn thành Sacrifice','Giao nguyên liệu cho Sacrifice (ALoD Version) để nhận Void Light of Destiny.',[3,13])])])
add(['dark-dragon-slayer-s-halberd'],'/dragonkin/ddsh',[('Streamwar Merge',[
 ('Storyline','Hoàn thành ShadowFlame Onslaught và Alliance of Crowns. Thu thập các nguyên liệu cho tuyến Streamwar Merge.',[4,5]),
 ('Prismatic Seams','Tổng tuyến cần Prismatic Seams ×1,250 từ Timestream Medals hoặc Mega Timestream Medals tại /join streamwar: 250 cho Green Dragon Slayer\'s Halberd và 1,000 cho công thức cuối.',[7,18]),
 ('Willpower / Garish Remnant','Cần Willpower ×70 từ Em-pathetic Connection của Brentan ở /join ruinedcrown: Mana Residue ×8 từ Frenzied Mana, Mage\'s Blood Sample ×8 từ Mana-Burdened Mage, Warlic\'s Favor ×1 từ Calamitous Warlic mỗi lượt. Garish Remnant ×70 từ Janitorial Duties của Gravelyn ở /join timekeep: Gar\'s Resignation Letter ×1 từ Mal-formed Gar, Mumbler Drool ×8 và Locust Wings ×8 mỗi lượt.',list(range(8,17))),
 ('Green Dragon Slayer\'s Halberd','Chuẩn bị Gold Voucher 500k ×24 cho toàn tuyến (12,000,000 Gold). Trước tiên merge Green Dragon Slayer\'s Halberd ở Streamwar Merge: Prismatic Seams ×250 và Gold Voucher 500k ×4.',[16,18]),
 ('Merge Dark Halberd','Dùng Green Dragon Slayer\'s Halberd cùng phần nguyên liệu còn lại của tuyến để merge Dark Dragon Slayer\'s Halberd. Công thức cuối tách riêng với công thức Green ở bước trước.',[18,19])])])
# Keep source evidence incomplete where the source itself omits the Quest name.
o=add.__globals__['overrides']
p=o['https://aqwwiki.wikidot.com/hollowborn-oblivion-blade']['routes']['wiki-location'][1]
p['coverage']='source_notes';p['missingFields']=['Exact alternative Quest name absent from source text']
Path('content-sources/farm/import/guide-overrides.json').write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
print('Reviewed source guide items:',len(o))
