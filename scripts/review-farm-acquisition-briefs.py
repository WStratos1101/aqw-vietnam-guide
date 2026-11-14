"""Review retained ambiguous header formats without modifying baseline recipes/routes."""
import json,hashlib
from pathlib import Path
base=Path('content-sources/farm/import')
rs=json.loads((base/'wiki-records.json').read_text())+json.loads((base/'detail-wiki-records.json').read_text())
c=json.loads(Path('src/content/farm/catalog-v2.generated.json').read_text())['items']
review={
 'bright-knight-armor':('Merge','Merge tại Bright Knight (Shop) ở Alteon Battle HOẶC Sepulchure Battle: Seal of Light ×50, Seal of Darkness ×50 và 1,000,000 Gold.',['Merge the following:','Seal of Light x50','Seal of Darkness x50','1,000,000 Gold']),
 'crag-bamboozle':('Shop / Quest','Mua với 5,000 ACs tại Nulgath (Shop), Enchanted Nulgath Nation House hoặc Tercessuinotlim; cách khác là phần thưởng Assistance of Nulgath. Pet không thể bán lại. Điều kiện riêng của Quest cần được đối chiếu thêm.',['5,000 AC',"Reward from the 'Assistance of Nulgath' quest",'Sellback: N/A (Cannot be sold)']),
 'dark-dragon-slayer-s-halberd':('Merge','Merge tại Streamwar Merge, Timestream War. Công thức ghi Green Dragon Slayer\'s Halberd, Prismatic Seams ×1,000, Willpower ×70, Garish Remnant ×70 và Gold Voucher 500k ×20. Snapshot không ghi số lượng cho Green Dragon Slayer\'s Halberd; chưa tự gán số lượng.',['Location: Streamwar Merge - Timestream War',"Green Dragon Slayer's Halberd",'Prismatic Seams x1,000','Willpower x70','Garish Remnant x70','Gold Voucher 500k x20']),
 'dual-champion-blade-of-nulgath':('Quest','Phần thưởng Quest: Combat Style: Champion of Nulgath; địa điểm được liệt kê là Enchanted Nulgath Nation House và Tercessuinotlim. Item có Rare Rarity; không coi vị trí này là bảo đảm còn nhận được hiện tại.',["Price: N/A (Reward from the 'Combat Style: Champion of Nulgath quest)",'Rarity: Rare Rarity']),
 'golden-hanzo-void':('Merge','Merge Golden Hanzo Void: Dark Crystal Shard ×45, Diamond of Nulgath ×75, Nulgath\'s Approval ×50, Tainted Gem ×45, Voucher of Nulgath (non-mem) ×1 và 100,000 Gold. Nơi nhận có Nulgath Diamond Shop; các địa điểm khác vẫn được giữ trong thông tin item.',['Merge the following:','Dark Crystal Shard x45','Diamond of Nulgath x75',"Nulgath's Approval x50",'Tainted Gem x45','Voucher of Nulgath (non-mem) x1','100,000 Gold']),
 'legion-soul-devourer':('Merge','Merge tại Vulcar\'s Merge, Underworld: Soul Sand ×2 và 200,000 Gold.', ["Location: Vulcar's Merge - Underworld",'Soul Sand x2','200,000 Gold']),
 'scythe-of-scourge':('Merge','Merge tại Doom Merge (1), Necropolis: DoomSquire Weapon Kit ×1, Pernicious Palladium of Doom ×1, Undead Energy ×10, Dark Spirit Orb ×10 và Corrupt Spirit Orb ×2.',['Location: Doom Merge (1) - Necropolis','Merge the following','DoomSquire Weapon Kit x1','Pernicious Palladium of Doom x1','Undead Energy x10','Dark Spirit Orb x10','Corrupt Spirit Orb x2']),
 'undead-spawn-minion':('Merge','Merge tại Vulcar\'s Merge, Underworld: Soul Sand ×3 và 300,000 Gold.',["Location: Vulcar's Merge - Underworld",'Soul Sand x3','300,000 Gold'])}
output={}
for id,(kind,text,quotes) in review.items():
 item=next(i for i in c if i['id']==id);r=next(r for r in rs if r['wikiUrl']==item['wikiUrl'])
 assert all(q in r['text'] for q in quotes),id
 output[id]=dict(source=r['wikiUrl'],sourceTextHash=hashlib.sha256(r['text'].encode()).hexdigest(),sourceQuotes=quotes,kind=kind,text=text,reviewedAt='2026-11-14',status='verified',scope='Acquisition method only; not a full walkthrough or proof of current availability')
(base/'acquisition-brief-overrides.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
print('Reviewed acquisition headers:',len(output))
