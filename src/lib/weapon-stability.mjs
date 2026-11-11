// Exact, documented display mappings. Never inspect image tabs or invent a threshold.
export function weaponStability(range){
 if(!range||!range.source||!Number.isFinite(range.minimum)||!Number.isFinite(range.maximum)||range.minimum>range.maximum)return {classification:'unknown'};
 if(range.minimum===range.maximum)return {classification:'stable'};
 const category=range.officialRangeCategory;
 if(category==='defaultdmg'&&range.minimum===27&&range.maximum===33)return {classification:'normal',rule:'wiki-default-27-33'};
 if(category==='highdmg'&&range.minimum===0&&range.maximum===60)return {classification:'unstable',rule:'wiki-high-0-60'};
 return {classification:'unknown'};
}
