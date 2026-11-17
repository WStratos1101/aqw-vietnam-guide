import { materialId } from '../../lib/material-requirements.mjs';
import { materialConditionText, materialTableHeaders } from '../../lib/farm-material-table.mjs';
import type { FarmTask } from '../../types/farm-v2';

type Row = FarmTask['rows'][number];
export type MaterialTableEntry = { row: Row; maps: string[]; conditions: string[][] };
export function FarmMaterialTable({ entries, label, onMaterial }: {
  entries: MaterialTableEntry[];
  label: string;
  onMaterial: (id: string, row: Row) => void;
}) {
  const hasConditions = entries.some(entry => entry.conditions.some(path => path.length));
  return <div className="fv32-table-scroll" role="region" tabIndex={0} aria-label={label}>
    <table className="fv32-material-table" data-columns={hasConditions ? 4 : 3}>
      <thead><tr>{materialTableHeaders(hasConditions).map(header => <th key={header} scope="col">{header}</th>)}</tr></thead>
      <tbody>{entries.map(({ row, maps, conditions }) => <tr key={row.itemId || row.name}>
        <td><button type="button" className="fv2-linkbutton" onClick={() => onMaterial(row.itemId || materialId(row.name), row)}>{row.name}</button></td>
        <td>{row.quantity?.toLocaleString('vi-VN') ?? '—'}</td>
        <td>{maps.length ? maps.map(map => <div key={map}>{map}</div>) : '—'}</td>
        {hasConditions && <td>{materialConditionText(conditions)}</td>}
      </tr>)}</tbody>
    </table>
  </div>;
}
