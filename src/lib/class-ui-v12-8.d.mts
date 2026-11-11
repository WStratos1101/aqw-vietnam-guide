import type{AqwClass,ClassSkill,ClassCombo}from'../types/classes';
export function calendarCategory(profile:AqwClass,membership:{classId:string;year?:number|null}[]):string|undefined;
export function calendarOrder(profiles:AqwClass[],membership:{classId:string;year?:number|null}[]):AqwClass[];
export function alternativeChoices<T extends {classId:string;verificationStatus:string;usageStatus:string;variantType:string;variantName:string;imagePath:string}>(variants:T[],classId:string,name:string):T[];
export function selectedComboContent(combos:ClassCombo[],active:ClassCombo):ClassCombo;
export function targetEffects(skill:ClassSkill):{targets:string[];text:string;name?:string}[];
