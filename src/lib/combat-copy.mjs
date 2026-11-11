// Only explanation text is edited. Official names and sourceNotes stay intact.
const reviewed={
 "The first stack of Safeguard blocks up to 50,000 damage, and the second stack blocks up to 100,000 damage.":"Safeguard: stack đầu chặn tối đa 50.000 sát thương; stack thứ hai chặn tối đa 100.000.",
 "Applies Purged to the player that have 4 stacks of Purging Flames on them, removing all effects applied by themselves and from their allies.":"Đủ 4 stack Purging Flames: nhận Purged, xóa hiệu ứng do bản thân và đồng đội áp dụng.",
 "Applies Purification to all players, a DoT that grows stronger with each tick and reducing Outgoing Damage and Crit Chance by 30% for 12 seconds, doesn't refresh.":"Purification: DoT mạnh dần mỗi tick; giảm sát thương gây ra và tỷ lệ chí mạng 30% trong 12 giây, không làm mới thời hạn.",
 "While Do Dawn is active, applies these auras to Darkon in the following order, but only one per every use of the skill: Re, Mi, Fa, So, La, and Ti. Each aura increases his Crit Damage by an additional 100%. If Ti is active, Do Dusk is applied, increasing his Crit Damage by 50,000%.":"Khi có Do Dawn, mỗi lần dùng skill tiến một mốc: Re → Mi → Fa → So → La → Ti. Mỗi aura tăng thêm 100% sát thương chí mạng. Khi đã có Ti, nhận Do Dusk tăng sát thương chí mạng 50.000%.",
 "While Recitative is active, applies Seed Planted to the player for 8 seconds, removing any stacks of Realm of the Arcana. If Seed Planted is active, applies Grown to the player, increasing their Crit Chance by 1000 but reducing their Crit Damage by 1000% for 8 seconds. If Grown is active, applies Harvested to the player, a fatal DoT.":"Recitative: nhận Seed Planted trong 8 giây và xóa stack Realm of the Arcana. Nếu đã có Seed Planted, nhận Grown: tăng Crit Chance 1000, giảm sát thương chí mạng 1000% trong 8 giây. Nếu đã có Grown, nhận Harvested gây DoT tử vong.",
 "Applies Aria, which reduces Darkon's Crit Damage and outgoing damage to 0 after C Major fades and increases his incoming damage by 200% after B Major fades.":"Aria: khi C Major hết, sát thương chí mạng và sát thương gây ra của Darkon về 0; khi B Major hết, sát thương nhận vào tăng 200%.",
 "Heals Darkon to 90% of his max HP, can't be Decayed.":"Hồi Darkon lên 90% HP tối đa; Decay không ngăn được lần hồi máu này.",
 "Applies Vendetta to the player that used Focus on Gramiel for 45 seconds, stacks to 5.":"Người dùng Focus lên Gramiel nhận Vendetta trong 45 giây, tối đa 5 stack.",
 "Applies Death's Door to all players that have the Vendetta effect on them for 60 seconds.":"Người đang có Vendetta nhận Death's Door trong 60 giây.",
 "Instant Death to all players that have 5 stacks of Vendetta on them.":"Người có 5 stack Vendetta nhận Instant Death.",
 "The first stack of Grace Shattered reduces Damage Resistance and Physical Resistance by 25%, and the second stack reduces the respective effect by 2500%.":"Grace Shattered: stack đầu giảm kháng sát thương và kháng vật lý 25%; stack thứ hai giảm các chỉ số này 2500%.",
 "Applies Drowsy to all players, decreasing haste, hit chance, crit chance, damage dealt, and increasing damage taken by 15%, stacking indefinitely and lasting 15 seconds.":"Drowsy: giảm Haste, tỷ lệ trúng, tỷ lệ chí mạng, sát thương gây ra và tăng sát thương nhận vào 15%; cộng dồn không giới hạn, tồn tại 15 giây.",
};
export function translateCombatText(text){return reviewed[text]||text
 .replace(/^(?:Wiki ghi|Theo Wiki|Nguồn cho biết)[,:\s]*/i,'')
 .replace(/(?:Wiki không ghi con số cụ thể\.|Rất lớn; Wiki không ghi con số cụ thể\.)/g,'Chưa xác minh giá trị sát thương.')
 .replace(/While (.+?) is active,/g,'Khi $1 đang hoạt động,')
 .replace(/When (.+?) is active on (.+?),/g,'Khi $1 đang có trên $2,')
 .replace(/If (.+?) is not active,/g,'Nếu không có $1,').replace(/If (.+?) is active,/g,'Nếu có $1,')
 .replace(/Applies /gi,'Áp ').replace(/Either applies /gi,'Áp ngẫu nhiên ')
 .replace(/to all players/g,'lên toàn đội').replace(/to the player|to players|to target/g,'lên người chơi')
 .replace(/to itself|to self/g,'lên bản thân').replace(/to (Kolr|Darkon|Gramiel|Grace Crystal|Kala)/g,'lên $1')
 .replace(/incoming physical and magical damage/gi,'sát thương vật lý và phép nhận vào')
 .replace(/outgoing physical and magical damage/gi,'sát thương vật lý và phép gây ra')
 .replace(/incoming physical, magical, and all damage taken/gi,'sát thương vật lý, phép và tổng sát thương nhận vào')
 .replace(/outgoing physical damage/gi,'sát thương vật lý gây ra').replace(/outgoing magical damage|outgoing magic damage/gi,'sát thương phép gây ra')
 .replace(/incoming damage|damage taken/gi,'sát thương nhận vào').replace(/outgoing damage|damage dealt/gi,'sát thương gây ra')
 .replace(/incoming healing|Healing Intake/gi,'hồi máu nhận vào')
 .replace(/Crit Damage/gi,'sát thương chí mạng').replace(/Crit Chance/gi,'tỷ lệ chí mạng').replace(/Hit Chance/gi,'tỷ lệ trúng')
 .replace(/Damage Resistance/g,'kháng sát thương').replace(/Physical Resistance/g,'kháng vật lý').replace(/Magic Resistance/g,'kháng phép')
 .replace(/mana costs?/gi,'tiêu hao Mana').replace(/increasing /gi,'tăng ').replace(/reducing |decreasing /gi,'giảm ')
 .replace(/\bby /g,'').replace(/for (\d+) seconds?/g,'trong $1 giây').replace(/(\d+) seconds?\b/g,'$1 giây')
 .replace(/stacks indefinitely|stacking indefinitely/gi,'cộng dồn không giới hạn').replace(/stacks to (\d+)/g,'cộng dồn tối đa $1')
 .replace(/stacks for each player hit|stacks each player hit|stacks per player hit/gi,'cộng dồn theo số người trúng')
 .replace(/stacks\./g,'cộng dồn.').replace(/stacking /g,'cộng dồn ').replace(/, stacks/g,', cộng dồn')
 .replace(/Ignores focus\.?/gi,'Bỏ qua Focus.').replace(/ignoring focus/gi,'bỏ qua Focus')
 .replace(/Always crits\.?/gi,'Luôn chí mạng.').replace(/Cannot crit\.|never crits\./gi,'Không thể chí mạng.')
 .replace(/Cannot miss\.?|Can't miss\.?|Always hits\.?/gi,'Luôn trúng.')
 .replace(/Used once when /g,'Dùng một lần khi ').replace(/Used once at the beginning of the fight,/g,'Dùng một lần khi mở trận,')
 .replace(/Used at the start of combat\./g,'Dùng khi mở trận.').replace(/Used at /g,'Dùng tại ')
 .replace(/remaining HP|Remaining HP/g,'HP còn lại').replace(/Used after (.+?) is used (three|four) times\./g,(_,s,n)=>`Dùng sau ${s} kích hoạt ${n==='three'?3:4} lần.`)
 .replace(/Charges for (\d+) giây\.?/g,'Niệm trong $1 giây.').replace(/, then uses /g,', sau đó dùng ')
 .replace(/(.+?) is used after (.+?) charges for (\d+) giây\.?/g,'$1 kích hoạt sau khi $2 niệm $3 giây.')
 .replace(/(.+?) is used after (.+?) is used for (\d+) giây\.?/g,'$1 kích hoạt sau $2 $3 giây.')
 .replace(/(.+?) is used directly after (.+?) finishes charging\./g,'$1 kích hoạt ngay khi $2 niệm xong.')
 .replace(/Only hits players in the glowing zone\./g,'Chỉ đánh người còn trong vùng sáng.')
 .replace(/a DoT dealing damage based on the player's max HP/g,'DoT theo HP tối đa của người chơi')
 .replace(/a DoT that deals damage based on the player's missing HP percentage/g,'DoT theo tỷ lệ HP người chơi đã mất')
 .replace(/a DoT that deals damage after (\d+) giây/g,'DoT gây sát thương sau $1 giây')
 .replace(/a fatal DoT|a Lethal DoT|an HoT|a HoT/gi,m=>/HoT/i.test(m)?'hiệu ứng hồi máu theo thời gian':'DoT gây tử vong')
 .replace(/, doesn't refresh/g,', không làm mới thời hạn').replace(/stunning them/g,'gây Stun')
 .replace(/and inflicting them with a DoT/g,'và áp DoT')
 .replace(/and removes /g,'và xóa ').replace(/removes all /gi,'xóa toàn bộ ').replace(/Removes /g,'Xóa ')
 .replace(/effects applied from players/g,'hiệu ứng do người chơi áp dụng')
 .replace(/effects applied by themselves and from their allies/g,'hiệu ứng do bản thân và đồng đội áp dụng')
 .replace(/causing skills to be guaranteed crits/g,'khiến kỹ năng luôn chí mạng')
 .replace(/blocking all damage taken/g,'chặn toàn bộ sát thương nhận vào')
 .replace(/each instance of damage that the player deals to (?:Gramiel|Grace Crystal)|each instance of damage that the player deals/g,'mỗi lần người chơi gây sát thương')
 .replace(/reflects (\d+) damage back to them|to reflect (\d+) damage back to them/g,(_,a,b)=>`phản ${a||b} sát thương về người đánh`)
 .replace(/a DoT that stacks/g,'DoT cộng dồn').replace(/healing it for /g,'hồi ').replace(/of its max HP \(before modifiers\) over /g,'HP tối đa (trước modifier) trong ')
 .replace(/before Crit Damage modifiers|before sát thương chí mạng modifiers/g,'trước hệ số sát thương chí mạng')
 .replace(/\band /g,'và ').replace(/\bor /g,'hoặc ');
}
