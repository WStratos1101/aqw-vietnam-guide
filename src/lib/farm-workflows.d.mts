import type { FarmTask, FarmV2RouteData, FarmMode, FarmTime } from "../types/farm-v2";
export function workflowTasks(route: FarmV2RouteData, registry: { quests: Record<string, FarmTask> }, modeId?: string, optionId?: string): FarmTask[];
export function sumMaterials(tasks: FarmTask[]): FarmTask["rows"];
export function voidHighlordMix(dailyRuns: number): {dailyRuns: number; exchanges: number; insignia: number; weeklyCompletions: number; roentgenium: number; excess: number};

export function usesInsignia(task: FarmTask): boolean;
export function materialTasksForMode(tasks: FarmTask[], modeId?: string): FarmTask[];
export function materialFarmMaps(row: FarmTask["rows"][number], tasks: FarmTask[], modeId?: string): string[];
export function distinctFarmText(values: string[], alreadyShown?: (string | null | undefined)[]): string[];
export function mainWorkflowTasks(route: FarmV2RouteData, registry: { quests: Record<string,FarmTask> }, modeId?: string, optionId?: string): FarmTask[];
export function finalReceiptTasks(route: FarmV2RouteData, registry: { quests: Record<string,FarmTask> }, mode?: FarmMode): FarmTask[];
export function farmTimeLabel(time?: FarmTime): string | null;
