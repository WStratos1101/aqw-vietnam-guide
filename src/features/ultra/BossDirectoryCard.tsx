import {bossPresentation} from '../../lib/boss-names';
import type{CSSProperties}from'react';
import {ArrowRight,MapPin} from 'lucide-react';
import {Asset} from './Asset';
import {challengeLabels,type ChallengeCategory} from '../../content/ultra/categories';
export interface BossDirectoryEntry {id:string;name:string;href:string;image:string;category:ChallengeCategory;location?:string;unlock?:string;reward?:string}
export function BossDirectoryCard({entry:e}:{entry:BossDirectoryEntry}){const theme=bossPresentation(e.id);return <a className="ultra-boss-card" href={e.href} style={theme?{"--boss-accent-dark":theme.dark,"--boss-accent-light":theme.light}as CSSProperties:undefined}><div className="ultra-card-art"><Asset id={e.image} label={e.name}/><span>{challengeLabels[e.category]}</span></div><div className="ultra-card-copy"><h2>{e.name}</h2>{e.location&&<p><MapPin size={14}/>{e.location}</p>}{e.unlock&&<p className="ultra-card-access">{e.unlock}</p>}{e.reward&&<p className="ultra-card-reward">{e.reward}</p>}<span className="ultra-card-action">Xem hướng dẫn <ArrowRight size={18}/></span></div></a>;}
