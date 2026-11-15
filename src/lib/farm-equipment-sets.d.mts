import type { FarmV2Item } from "../types/farm-v2";
export type FarmEquipmentSet={id:string;name:string;memberIds:string[];sourceChapter:string;variantOf?:string;sourceUrls:string[]};
export function equipmentSetMembers(set:FarmEquipmentSet,items:FarmV2Item[]):FarmV2Item[];
export function farmSetItemHref(item:FarmV2Item):string;
export function validateEquipmentSets(sets:FarmEquipmentSet[],items:FarmV2Item[]):string[];
