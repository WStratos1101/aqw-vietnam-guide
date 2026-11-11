import {UltraDirectory,UltraDetail} from './UltraBoss';import {findBoss} from '../../content/ultra';import type {RouteViewProps} from '../route-views';
export function Directory(){return <UltraDirectory/>;}
export function Detail({slug}:RouteViewProps){const boss=slug&&findBoss(slug);return boss?<UltraDetail key={boss.id} boss={boss}/>:null;}
