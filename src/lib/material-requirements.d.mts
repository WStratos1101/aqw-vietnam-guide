export interface MaterialItem {kind:'item';itemId:string;name:string;quantity:number;source?:string;path?:string}
export interface MaterialGroup {kind:'allOf'|'anyOf';requirements:MaterialNode[];requiredChoices?:number}
export type MaterialNode=MaterialItem|MaterialGroup;
export type MaterialSelections=Record<string,number[]>;
export function materialId(name:string):string;
export function item(name:string,quantity?:number,source?:string):MaterialItem;
export function parseExpression(tokens:(MaterialItem|string)[]):MaterialNode;
export function materialLeaves(node:MaterialNode|null|undefined):MaterialItem[];
export function requiredMaterials(node:MaterialNode|null|undefined):MaterialItem[];
export function validateMaterials(node:MaterialNode|null|undefined,path?:string):string[];
export function parseMaterialLines(text:string,source?:string):{confidenceStatus:string;tree:MaterialNode|null;reason?:string};
export function selectedMaterials(tree:MaterialNode|null|undefined,selections?:MaterialSelections,path?:string):MaterialItem[];
export function materialProgress(tree:MaterialNode|null|undefined,selections?:MaterialSelections,done?:string[]):{total:number;done:number};
