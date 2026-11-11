export interface ClassLoadout {classId:string;name:string;abbreviation:string;roles?:string[];enhancement:string[];instructions:string[];source:string}
export interface TeamClassAssignment {id:string;primaryClass:ClassLoadout;alternativeClasses:ClassLoadout[]}
export interface TacticalStep {id:string;sequence:number;bossSkill:string;taunter:string;zonePlayer:string;notes:string;source:string}
export interface TacticalPhase {id:string;label:string;steps:TacticalStep[]}
