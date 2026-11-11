import{ChallengeDirectory,ChallengeDetail,challenges}from'./ChallengeCodex';import type{RouteViewProps}from'../route-views';
export function Dungeons(){return <ChallengeDirectory kind="dungeon"/>;}
export function Others(){return <ChallengeDirectory kind="other"/>;}
export function Detail({slug}:RouteViewProps){const c=challenges.find(c=>c.id===slug);return c?<ChallengeDetail key={c.id} summary={c}/>:null;}
