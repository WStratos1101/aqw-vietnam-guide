export function eligibleBossRecommendations<T extends {id:string;href:string}>(entries:T[],currentSlug:string):T[];
export function chooseBossRecommendations<T extends {id:string;href:string}>(entries:T[],currentSlug:string,random?:()=>number):T[];
