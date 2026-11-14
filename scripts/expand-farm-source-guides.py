"""Merge reviewed VNCollector line ranges; no network or legacy catalog import."""
import json,hashlib
from pathlib import Path
base=Path('content-sources/farm/import')
pages=json.loads((base/'source-extracts.json').read_text())['pages']
items=json.loads(Path('src/content/farm/catalog-v2.generated.json').read_text())['items']
overrides=json.loads((base/'guide-overrides.json').read_text())
count=0

def add(ids,suffix,paths):
 global count
 page=next(p for p in pages if p['url'].endswith(suffix))
 lines=page['text'].splitlines();digest=hashlib.sha256(page['text'].encode()).hexdigest()
 for id in ids:
  item=next(i for i in items if i['id']==id)
  if item['wikiUrl'] in overrides: continue # preserve completed guides
  route=next((r for r in item['acquisitionRoutes'] if r['method'] in ['Quest','Merge']),None)
  if not route: route=next((r for r in item['acquisitionRoutes'] if r['id']=='wiki-location'),None)
  if not route: raise ValueError('No appropriate retained route '+id)
  output=[]
  for n,(label,steps) in enumerate(paths):
   out=[]
   for k,(title,text,nums) in enumerate(steps):
    assert all(0<l<=len(lines) and lines[l-1].strip() for l in nums)
    out.append(dict(id=f'source-{n+1}-{k+1}',title=title,text=text,sources=[page['url']],evidence=[dict(sourceUrl=page['url'],lines=nums,sourceTextHash=digest)]))
   output.append(dict(id=f'vncollector-{n+1}',label=label,coverage='source_walkthrough',verificationStatus='verified',steps=out))
  overrides[item['wikiUrl']]={'routes':{route['id']:output}};count+=1

add(['chaorrupter-unlocked-free-player'],'/chaos/cu', [('Free Player',[
 ('Chaos War','Đến Chaos War Merge tại /join chaoswar; chọn phiên bản Free Player.',[2,3,6]),
 ('Farm tại Screen 15','Thu thập Chaos Eye ×250 và Chaos Tentacle ×250 từ các monsters ở Screen 15 của /join chaoswar.',[7,8]),
 ('Merge','Dùng hai nguyên liệu trên để merge Chaorrupter Unlocked (Free Player) tại Chaos War Merge.',[6,7,8])])])
add(['burning-sword-of-doom'],'/evil/nsod/bsod',[('Forging the Burning Sword of Doom',[
 ('Nhận Quest','Gặp Alina ở /join lavarockshore hoặc /join lavarockbay, nhận Forging the Burning Sword of Doom; cần Necrotic Sword of Doom ×1.',[3,4]),
 ('Scroll / Scale','Chuẩn bị Scroll of Scorched Steel ×99 từ SpellCraft. Lấy Akriloth\'s Scale ×1500 từ Ultra Akriloth ở /join gravestrike HOẶC Sepulchuroth ở /join shadowstrike.',[5,6]),
 ('Flame / Core','Lấy Flame Heart ×1 từ Smoldur ở /join ashfallcamp và Molten Core ×150 từ monsters ở /join battleundere.',[7,8]),
 ('Volcanic Essence','Nhận Volcanic Essence ×10 từ The Molten Heart tại Alina ở /join lavarockshore hoặc /join lavarockbay, rồi hoàn thành Forging the Burning Sword of Doom.',[3,9])])])
add(['dark-lord'],'/others/more-classes-guide/dark-lord-dl-class-guide-seasonal',[('May the Fourth',[
 ('Mở khóa','Class Seasonal trong sự kiện May the Fourth tháng 5. Hoàn thành questline tại /join murdermoon, mở Murder Moon Merge.',[2,3,4]),
 ('Cyber Crystal','Lấy Cyber Crystal ×66 từ Too Dangerous to be Left Alive!: đánh Tempest Soldier tại /join murdermoon.',[5]),
 ('Boss drops','Lấy S Ring ×15 và Fifth Lord\'s Filtrinator ×15 từ Fifth Sepulchure tại /join murdermoon; Dark Helmet ×1 và Dotty ×15 từ Zorba the Bakk tại /join zorbaspalace.',[6,7]),
 ('Merge Class','Mua Gold Voucher 25k ×4 ở Murder Moon Merge, dùng cùng các nguyên liệu đã thu thập để merge Dark Lord.',[4,8])])])
add(['necrotic-sword-of-the-abyss'],'/evil/nsod/nsoa',[('Void Highlord Merge',[
 ('Điều kiện','Cần Level 95 và Necrotic Sword of Doom. Mở Void Highlord Merge Shop tại Tercessuinotlim.',[3,4]),
 ('Nguyên liệu','Chuẩn bị Necrotic Sword of Doom ×1, Roentgenium of Nulgath ×2, Void Crystal A ×1 và Void Crystal B ×1.',[5,6,7,8]),
 ('Merge / Buy Back','Merge Necrotic Sword of the Abyss; có thể dùng Buy Back để nhận lại Necrotic Sword of Doom gốc.',[4,9])])])
add(['legion-dragonblade-of-nulgath'],'/legion/other-legion-theme-items/legion-dragonblade-of-nulgath',[('Undead Legion Merge',[
 ('Điều kiện','Cần là thành viên Legion và sở hữu DragonBlade of Nulgath.',[4,5]),
 ('Legion Token','Farm Legion Token ×5,000. Đến Dage the Evil tại /join underworld, mở Undead Legion Merge Shop.',[7,8]),
 ('Merge / Buy Back','Dùng Legion Token ×5,000 cùng DragonBlade of Nulgath gốc để merge; có thể lấy lại bản gốc bằng Buy Back.',[9,10])])])
# A shared Quest is attached only to explicitly listed rewards, not every item in a similarly named set.
add(['void-shogun-armor','void-shogun-helm','void-shogun-katana','void-shogun-katanas-on-your-hip','void-shogun-mask','void-shogun-masked-helm','void-shogun-naginata','mini-void-shogun','mini-void-shogun-battlepet'],'/nation/vss/void-shogun',[('Void Shogun Farming Quest',[
 ('Mở khóa','Hoàn thành mở khóa Tercessuinotlim và Shogun of Shadows đến /join heiwavalley. Cần Rank 10 Rep Yokai và Voucher of Nulgath (non-mem).',[2,4,5,6,8]),
 ('Void Monk of Nulgath','Farm Void Voucher ×500 từ Void monsters tại /join quibblehunt; merge Void Monk of Nulgath ở Quibble\'s Void Hunt Shop.',[7]),
 ('Nhận Quest / Reagents','Gặp Void Shogun ở /join heiwavalley, nhận Void Shogun Farming Quest. Chuẩn bị Unidentified 13 ×1 và Blood Gem of the Archfiend ×7.',[9,13,14]),
 ('Monster drops','Lấy DaiTengu Blade of Wind ×1 từ Dai Tengu ở /join hachiko; ShadowStone Rune ×1 từ Shadowstone Support ở /join necrocavern; Orochi\'s Shadow ×1 từ Orochi ở /join shogunwar.',[12,15,16]),
 ('Chọn phần thưởng','Hoàn thành Quest và chọn item muốn nhận. Dual Void Shogun Katanas là phần thưởng chắc chắn; không cần làm 11 lần để nhận chỉ một item trong danh sách lựa chọn.',list(range(17,30)))])])
add(['void-spartan','void-spartan-blade','void-spartan-blade-and-shield','void-spartan-helm','void-spartan-helm-and-scarf','void-spartan-shielded-cape','void-spartan-spear','void-spartan-spear-and-shield'],'/nation/vss/void-spartan',[('Void Spartan',[
 ('Mở khóa','Cần Level 20 và hoàn thành mở khóa Tercessuinotlim; nhận Void Spartan từ Zee tại /join tercessuinotlim.',[5,6,7,8]),
 ('Nulgath reagents','Chuẩn bị Unidentified 13 ×1, Blood Gem of the Archfiend ×5 và Gem of Nulgath ×10.',[11,12,13]),
 ('Fiend Cloak / Jasper','Mua Fiend Cloak of Nulgath ×1 tại Nulgath Shop ở Tercessuinotlim với 500,000 Gold. Lấy Zee\'s Red Jasper ×1 từ Flame Soldier ở /join embersea (2%).',[14,15]),
 ('Chọn phần thưởng','Hoàn thành Void Spartan và chọn item tương ứng. Hướng dẫn nói 11 lần cho toàn bộ danh sách, không phải yêu cầu 11 lần cho mỗi item.',list(range(16,28)))])])
# Quest reward families must not mix Tools For the Job with Corrupted Touch.
for ids,quest,nums in [(['void-warlock'],'Tools For the Job',list(range(4,18))),(['void-warlock-cape','void-warlock-helm','void-warlock-hood','void-warlock-horns','void-warlock-tendrils-cape'],'Corrupted Touch',list(range(18,34)))]:
 tools=quest=='Tools For the Job'
 add(ids,'/nation/vss/void-warlock',[(quest,[
 ('Enchanted Nulgath Nation House','Cần sở hữu Enchanted Nulgath Nation House để nhận Quest '+quest+'.',[2,nums[0]]),
 ('Reagents','Chuẩn bị '+('Tainted Gem ×100, Unidentified 13 ×2, Blood Gem of the Archfiend ×90 và Voucher of Nulgath (non-mem) ×1.' if tools else 'Unidentified 13 ×1, Tainted Gem ×75, Gem of Nulgath ×100, Nulgath\'s Approval ×1,000, Diamond of Nulgath ×75 và Voucher of Nulgath (mem) ×1.'),list(range(6,10)) if tools else list(range(20,26))),
 ('Winter Diamond','Lấy Brittney\'s Winter Diamond ×1 từ Aisha\'s Drake tại /join northlands.',[10 if tools else 26]),
 ('Chọn item','Hoàn thành '+quest+' và chọn đúng item muốn nhận; sáu lượt được đề cập là để thu thập toàn bộ sáu phần thưởng của Quest.',list(range(11,18)) if tools else list(range(27,34)))])])
(base/'guide-overrides.json').write_text(json.dumps(overrides,ensure_ascii=False,indent=2)+'\n')
print('Added reviewed source walkthroughs:',count)
