import type { FarmTask } from '../types/farm-v2';
export function materialQuestConditions(row: FarmTask['rows'][number], tasks?: FarmTask[]): string[][];
export function materialConditionText(paths: string[][]): string;
export function materialTableHeaders(hasConditions: boolean): string[];
export function materialTableMaps(row: FarmTask['rows'][number], tasks: FarmTask[], modeId?: string): string[];
