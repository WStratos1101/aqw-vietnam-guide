export function acquisitionLabel(method){
 const location=method.shop?.shopName&&!/chưa xác minh/i.test(method.shop.shopName)?method.shop.shopName:method.merge?.mergeShop&&!/chưa xác minh/i.test(method.merge.mergeShop)?method.merge.mergeShop:method.evidence?.locationText?.[0]||method.shop?.map||method.merge?.map;
 if(method.acquisitionKind==="calendar_code")return method.shop?.price?.amount===0?`0 ACs · ${location||method.variantName}`:`Calendar Code · ${location||method.variantName}`;
 if(method.shop){const p=method.shop.price;const gated=/calendar|book of lore|badge|upgrade|heromart/i.test([location,...(method.evidence?.locationText||[])].join(' '));const free=p.amount===0&&method.detailsStatus==='complete'&&!method.prerequisites.length&&!method.membershipRequirement&&!gated;return `${free?'Free':`${p.amount.toLocaleString('en-US')} ${p.currency==='AC'?'ACs':p.currency}`} · ${location||method.variantName}${method.shop.map&&!String(location).includes(method.shop.map)?' · '+method.shop.map:''}`;}
 if(method.quest)return `Hoàn thành Quest: ${method.quest.questName}`;
 if(method.merge)return `Merge tại: ${location||method.variantName}`;
 if(method.drop)return `Drop: ${method.drop.from||method.drop.monster||method.drop.description||method.variantName}`;
 return method.other?.label||method.variantName;
}
export function acquisitionSummary(record){const methods=record?.methods||[];const current=methods.filter(m=>m.isAvailable!==false);const pool=current.length?current:methods;const labels=[...new Set(pool.map(acquisitionLabel))];return labels.length?(current.length?'':'Legacy · ')+labels[0]+(labels.length>1?` · +${labels.length-1} phương án`:''):'Chưa xác minh phương thức sở hữu';}
export function difficultyTier(profile,record){
 const known=[[/void-highlord|legion-revenant|chaos-avenger|archmage|dragon-of-time|verus-doomknight|arcana-invoker|hollowborn-vindicator/,'Endgame'],[/archpaladin|lord-of-order|lightcaster/,'Lategame'],[/calendar-(timeless|underworld|corrupted)|archivist-of-time/,'Endgame'],[/^calendar-/,'Lategame'],[/^(warrior-|rogue-|mage-|healer-|oracle-|ninja-|berserker-|pirate-)/,'Newbie']];
 const matched=known.find(([pattern])=>pattern.test(profile.id));
 const levels=(record?.methods||[]).map(m=>m.levelRequirement).filter(n=>typeof n==='number');const level=levels.length?Math.min(...levels):null;
 const tier=matched?.[1]||(level>=90?'Endgame':level>=70?'Lategame':level>=30?'Midgame':({'Cơ bản':'Newbie','Cần luyện tập':'Midgame','Nâng cao':'Lategame','Newbie':'Newbie','Midgame':'Midgame','Lategame':'Lategame','Endgame':'Endgame'}[profile.difficulty]||'Midgame'));
 return{tier,status:'editorial',basis:matched?'Phân tầng biên tập theo điều kiện sở hữu và hướng dẫn Class đã lưu; không phải nhãn chính thức của game.':level!==null?`Phân tầng tạm theo Level yêu cầu đã xác minh (${level}); cần tiếp tục rà độ phức tạp rotation.`:'Phân tầng tạm thời; hồ sơ chưa đủ căn cứ để đánh giá toàn bộ độ phức tạp rotation.'};
}
// A cooldown priority is an independent rule, never a sequence inferred from prose.
// Require an explicit instruction and explicit skill priority; numbers in "1 trong 2"
// are not skill slots. Keep conditional or ambiguous instructions as source notes.
function cooldownRule(flow) {
 if(flow.sequences.length) return flow;
 const text=flow.sourceText;
 const cooldown=/(?:sử dụng|dùng)\s+skill\s+mỗi khi\s+(?:CD|hồi chiêu)/i.test(text);
 const priority=text.match(/ưu tiên\s+(?:loop\s+)?skill\s+([1-5])\s+để có\s+Haste buff/i);
 if(!cooldown || !priority || /không|ngoại trừ|trừ\s+[1-5]/i.test(text)) return flow;
 return {...flow,kind:'cooldown',label:'Khi hồi chiêu',prioritySkill:Number(priority[1]),priorityLabel:'Ưu tiên / Haste',afterOpening:/sau khi mở đầu/i.test(text)};
}
export function comboFlow(combo){
 if(combo.flow?.length) return combo.flow.map(cooldownRule);
 const lines=[combo.explanation,...combo.notes].filter(Boolean);const chain=/\b[1-5](?:\s*[-→]\s*[1-5])+\b/g;
 return lines.map((sourceText,i)=>{const sequences=[...sourceText.matchAll(chain)].map(m=>m[0].match(/[1-5]/g).map(Number));const negativeSpam=/không\s+(?:nên\s+|được\s+)?spam|tránh\s+spam/i.test(sourceText);const spam=negativeSpam?null:sourceText.match(/spam\s+(?:skill\s*)?([1-5](?:\s*(?:,|và|and|\/)\s*[1-5])*)/i);if(spam&&!sequences.length)sequences.push(spam[1].match(/[1-5]/g).map(Number));if(i===0&&!sequences.length&&combo.sequence.length)sequences.push(combo.sequence);if(negativeSpam)sequences.length=0;const prefix=sourceText.replace(/^[→◆*\s]+/,'').split(':')[0];const label=prefix.length<65&&sourceText.includes(':')?prefix:/mở đầu|bắt đầu|^start rotation/i.test(sourceText)?'Mở đầu':/spam/i.test(sourceText)?'Spam':/nuke|kết thúc/i.test(sourceText)?'Nuke':/lặp|loop/i.test(sourceText)?'Loop':i===0?combo.title:'Nhịp bổ sung';return{id:combo.id+'-flow-'+i,label,sequences,sourceText,stopCondition:/đến khi|until/i.test(sourceText)?sourceText.match(/(?:đến khi|until)\s+[^.!?\n]+/i)?.[0].split(/\s+thì\s+/)[0]:undefined,kind:negativeSpam?'warning':/spam/i.test(sourceText)?'spam':/lặp|loop/i.test(sourceText)?'loop':'sequence'};}).map(cooldownRule);
}
