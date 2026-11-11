import type{ClassAcquisition,ClassAcquisitionMethod}from'../types/class-acquisition';import type{ClassCombo}from'../types/classes';
export function acquisitionLabel(method:ClassAcquisitionMethod):string;
export function acquisitionSummary(record?:ClassAcquisition):string;
export function difficultyTier(profile:{id:string;difficulty?:string},record?:ClassAcquisition):{tier:string;status:string;basis:string};
export function comboFlow(combo:ClassCombo):{id:string;label:string;sequences:number[][];sourceText:string;stopCondition?:string;kind:string}[];
