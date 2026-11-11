const aliases={weapon:'weapon',weapons:'weapon','vũ khí':'weapon',armor:'armor',armors:'armor','giáp':'armor',helm:'helm',helms:'helm',helmet:'helm',helmets:'helm','mũ':'helm',cape:'cape',capes:'cape','áo choàng':'cape'};
export const equipmentFilters=[{id:'all',label:'TẤT CẢ'},{id:'weapon',label:'VŨ KHÍ'},{id:'armor',label:'GIÁP'},{id:'helm',label:'MŨ'},{id:'cape',label:'ÁO CHOÀNG'}];
export function equipmentCategory(value){const key=String(value||'unknown').trim().toLocaleLowerCase('vi');return aliases[key]||key;}
export function equipmentCategoryLabel(value){const key=equipmentCategory(value);return equipmentFilters.find(f=>f.id===key)?.label||({pet:'Thú cưng',house:'Nhà',unknown:'Trang bị'}[key])||value;}
export function selectEquipment(routes,filter,selectedId){const choices=routes.filter(r=>filter==='all'||equipmentCategory(r.category)===filter);return {choices,selected:choices.find(r=>r.id===selectedId)||choices[0]};}
