export const equipmentFilters:{id:string;label:string}[];
export function equipmentCategory(value:unknown):string;
export function equipmentCategoryLabel(value:string):string;
export function selectEquipment<T extends {id:string;category:string}>(routes:T[],filter:string,selectedId?:string):{choices:T[];selected:T|undefined};
