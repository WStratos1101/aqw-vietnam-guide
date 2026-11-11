import {bossNameMappings} from '../../lib/boss-names';
import data from "./bosses.json";
import recovery from './recovery.json';
import manifest from "./assets.json";
import type { GameAsset, UltraBoss } from "../../types/ultra";
const overrides=recovery.routeOverrides as Record<string,unknown[]>;
export const ultraBosses = [...data,...recovery.bosses].map(b=>({...b,...(b.slug==='ultra-drago'?{name:bossNameMappings['ultra-drago'].displayName,subtitle:bossNameMappings['ultra-drago'].displayName,nameMapping:bossNameMappings['ultra-drago']} : {}),equipmentRoutes:[...(overrides[b.slug]||[]),...b.equipmentRoutes.filter(r=>!(overrides[b.slug]||[]).some(x=>(x as {itemName:string}).itemName===r.itemName))]})) as UltraBoss[];
export const ultraAssets = manifest as GameAsset[];
export const findBoss = (slug: string) =>
  ultraBosses.find((boss) => boss.slug === slug);
export const findAsset = (id: string) =>
  ultraAssets.find((asset) => asset.id === id);
