import { useEffect, useId, useRef, useState } from "react";
import { FarmMaterialTable } from "./FarmMaterialTable";
import { materialQuestConditions, materialTableMaps } from "../../lib/farm-material-table.mjs";
import registryData from "../../content/farm/quest-workflows.generated.json";
import materialData from "../../content/farm/material-sources.generated.json";
import manualData from "../../../content-sources/farm/material-guides.json";
import { materialId, materialLeaves, requiredMaterials } from "../../lib/material-requirements.mjs";
import { sumMaterials, mainWorkflowTasks, finalReceiptTasks, voidHighlordMix, materialTasksForMode, materialFarmMaps, distinctFarmText, reachableMaterialRows } from "../../lib/farm-workflows.mjs";
import type { FarmTask, FarmV2RouteData, FarmAcquisitionBrief, FarmMode } from "../../types/farm-v2";

type Row = FarmTask["rows"][number];
type MaterialClick = (id: string, row?: Row) => void;
type Profile = { name: string; method: string; tasks: FarmTask[]; questIds?: string[] };
export type WorkflowFocus = { questId?: string; materialId?: string; modeId?: string; optionId?: string; dailyRuns?: number };
const registry = registryData as unknown as { quests: Record<string, FarmTask>; materials?: Record<string, Profile>; materialLinks?: Record<string,string>; operationGroups?: Record<string,FarmTask[]> };
const profiles = Object.fromEntries(Object.entries({ ...registry.materials, ...manualData, ...materialData } as unknown as Record<string, Profile>)
  .map(([id,profile])=>{
    const additional=registry.materials?.[id];
    const tasks=[...(profile.tasks || []),...(additional?.questIds?.map(id=>registry.quests[id]).filter(Boolean) || []),...(additional?.tasks || [])];
    const unique=new Map<string,FarmTask>();
    for(const task of tasks){
      const drop= !task.quest && task.rows.length>0 && task.rows.every(row=>row.name===profile.name&&row.monster);
      if(drop && [...unique.values()].some(existing=>!existing.quest && task.rows.every(row=>existing.rows.some(other=>other.name===row.name&&other.monster===row.monster&&(!row.map || other.map===row.map)))))continue;
      const key=task.quest?JSON.stringify([task.source,task.sectionIdentity,task.quest,task.location,task.rows.map(row=>[row.name,row.quantity])]):drop?
        "drop:"+JSON.stringify(task.rows.map(row=>[row.name,row.monster,row.map || null])):
        JSON.stringify([task.title,task.npc,task.map,task.rows.map(row=>[row.name,row.quantity,row.monster,row.map]),task.shop,task.shopAccess,task.purchase]);
      if(!unique.has(key))unique.set(key,task);
    }
    return [id,{...profile,tasks:[...unique.values()]}];
  })) as Record<string,Profile>;
const keyFor = (row: Row) => row.itemId || materialId(row.name);
const friendly = (text: string) => text.replace(/AND\/OR/g, "các phương án thay thế").replace(/(?:Wiki )?snapshot/gi, "nguồn Wiki");

function MaterialTable({ rows, onMaterial, modeId }: { rows: Row[]; onMaterial: MaterialClick; modeId?: string }) {
  const entries = rows.map(row => {
    const tasks = materialTasksForMode(profiles[keyFor(row)]?.tasks || [], modeId);
    return { row: { ...row, itemId: keyFor(row) }, maps: materialTableMaps(row, tasks, modeId), conditions: materialQuestConditions(row, tasks) };
  });
  return <FarmMaterialTable entries={entries} label="Nguyên liệu Quest" onMaterial={onMaterial} />;
}

function QuestBody({ task, onMaterial, modeId, alreadyShown=[] }: { task: FarmTask; onMaterial: MaterialClick; modeId?: string; alreadyShown?: (string | null | undefined)[] }) {
  return <section className="fv32-facts">
    {distinctFarmText([task.quest || task.title || ""], alreadyShown).map(title=><h4 key={title}>{title}</h4>)}
    {!!task.preconditions?.length && <div className="fv32-quest-conditions"><b>Điều kiện nhận Quest</b>
      <ul>{distinctFarmText(task.preconditions).map((condition, i) => <li key={i}>{friendly(condition)}</li>)}</ul>
    </div>}
    {!!task.ownedItems?.length && <div><b>Trang bị cần sở hữu (không tiêu hao):</b> {task.ownedItems.map(item => <button type="button" className="fv2-linkbutton" key={item.wikiUrl} onClick={()=>onMaterial(materialId(item.name))}>{item.name}</button>)}</div>}
    {task.dropSource && <p><b>Monster:</b> {task.dropSource}</p>}
    {task.npc && <p><b>NPC:</b> {task.npc}</p>}
    {task.location && distinctFarmText([task.location],[task.npc,task.map]).length>0 && <p><b>Nơi nhận:</b> {task.location}</p>}
    {!task.map && [...new Set(task.acceptanceMaps || [])].map(map=><p key={map}><code>{map}</code></p>)}
    {task.map && <p><code>{task.map}</code></p>}
    {task.purchase && <><p><b>Cách nhận:</b> Mua</p>{task.shop && <p><b>Shop:</b> {task.shop}</p>}
      {task.shopAccess && <p><b>Mở Shop:</b> {task.shopAccess}</p>}
      <div className="fv32-table-scroll" role="region" tabIndex={0} aria-label="Chi phí mua"><table><thead><tr><th>Giá mỗi món</th><th>Số lượng</th><th>Tổng chi phí</th></tr></thead>
        <tbody><tr><td>{task.purchase.amount.toLocaleString("vi-VN")} {task.purchase.currency}</td><td>{(task.totalRequired ?? 1).toLocaleString("vi-VN")}</td><td>{(task.purchase.amount*(task.totalRequired ?? 1)).toLocaleString("vi-VN")} {task.purchase.currency}</td></tr></tbody></table></div></>}
    {task.numberOfRuns != null && <p><b>Số lần hoàn thành:</b> {task.numberOfRuns}. Bảng dưới tính cho mỗi lượt.</p>}
    {task.repeatability && <p><b>Giới hạn:</b> {task.repeatability.startsWith("weekly") ? "Mỗi tuần" : task.repeatability.startsWith("daily") ? "Mỗi ngày" : friendly(task.repeatability)}</p>}
    <MaterialTable modeId={modeId} rows={task.rows} onMaterial={(id,row)=>onMaterial(id,row?{...row,quantity:row.quantity==null?null:row.quantity*(task.numberOfRuns || 1)}:undefined)} />
    {task.reward && <p><b>Phần thưởng:</b> {task.reward}</p>}
    {!!task.rewardChoices?.length && <details><summary>Chọn một phần thưởng</summary><ul>{task.rewardChoices.map((reward, i) => <li key={i}>{reward.name} ×{reward.quantity}</li>)}</ul></details>}
    {!!task.randomChoiceRewards?.length && <p>Nhận ngẫu nhiên một trong: {task.randomChoiceRewards.map(reward => `${reward.name} ×${reward.quantity}`).join("; ")}</p>}
    {!!task.randomRewards?.length && <p>Có thể nhận thêm: {task.randomRewards.map(reward => `${reward.name} ×${reward.quantity}`).join("; ")}</p>}
    {task.destination && <p>Mở {task.destination.map}, chọn {task.destination.shop} để nhận {task.destination.item}.</p>}
  </section>;
}

export function useFarmWorkflow(route: FarmV2RouteData, focus: WorkflowFocus) {
  let mode = route.farmModes?.find(mode => mode.id === focus.modeId) || route.farmModes?.[0];
  let tasks = mainWorkflowTasks(route, registry, mode?.id, focus.optionId);
  if(route.mixRule && mode?.id==="insignia"){
    const mixed=voidHighlordMix(focus.dailyRuns ?? 0), rule=route.mixRule;
    tasks=[...(mixed.dailyRuns?[{...registry.quests[rule.dailyQuestId],numberOfRuns:mixed.dailyRuns}]:[]),
      ...(mixed.exchanges?[{...registry.quests[rule.weeklyQuestId],numberOfRuns:mixed.weeklyCompletions}]:[])];
    mode={...mode,materials:sumMaterials([...tasks,
      {...registry.quests[rule.weeklyQuestId],rows:rule.remainingMaterials,numberOfRuns:1},
      {...registry.quests[rule.weeklyQuestId],rows:mixed.insignia?[{name:"Nulgath Insignia",itemId:"nulgath-insignia",quantity:mixed.insignia}]:[],numberOfRuns:1}]),
      insignia: mixed.insignia ? {...mode.insignia!,quantity:mixed.insignia,questCompletions:mixed.weeklyCompletions,exchanges:mixed.exchanges,excess:mixed.excess}:undefined,
      finishingTasks:mode.finishingTasks.filter(task=>task.id!=="ultra-nulgath-insignia-exchange"||mixed.exchanges>0).map(task=>task.id==="ultra-nulgath-insignia-exchange"?{...task,numberOfRuns:mixed.exchanges}:task),
      notes:[`Làm Quest thường ${mixed.dailyRuns} lần và đổi Insignia ${mixed.exchanges} lần nhận ${mixed.roentgenium} Roentgenium; dùng 15, dư ${mixed.excess}. Void Crystal A và B vẫn bắt buộc.`]};
  }
  const grouped = new Set((route.operationGroups || []).flatMap(group=>group.tasks.map(task=>task.id)));
  const finishOperations = mode?.finishingTasks?.length ? mode.finishingTasks : route.completionTasks || (route.farmTasks || []).filter(task => !task.quest && !grouped.has(task.id));
  const finish = [...finishOperations,...finalReceiptTasks(route,registry,mode)];
  if(mode?.finishingBeforeQuestId && !tasks.some(task=>task.id===mode?.finishingBeforeQuestId))mode={...mode,finishingBeforeQuestId:undefined};
  const operations=tasks.flatMap(task=>registry.operationGroups?.[task.id] || []);
  const hasAlternatives = String(JSON.stringify(route.materialTree)).includes('"anyOf"');
  const materials = mode?.materials || route.materialPlan?.materials || (hasAlternatives ? requiredMaterials(route.materialTree) : sumMaterials([...tasks,...operations, ...finish]));
  const fallback = route.directMaterials ?? requiredMaterials(route.materialTree);
  return { mode, tasks, finish, materials: materials.length ? materials : fallback };
}

export function FarmWorkflowSummary({ route, focus, onNavigate, brief }: { route: FarmV2RouteData; focus: WorkflowFocus; onNavigate: (focus: WorkflowFocus) => void; brief?: FarmAcquisitionBrief }) {
  const { mode, tasks, finish } = useFarmWorkflow(route, focus);
  const actions = [...tasks.flatMap(task => [
    ...(registry.operationGroups?.[task.id] || []).map(operation=>({task:operation,quest:false})),
    ...(mode?.finishingBeforeQuestId===task.id ? finish.map(operation=>({task:operation,quest:false})) : []),
    {task,quest:true},
  ]), ...(!mode?.finishingBeforeQuestId ? finish.map(task => ({ task, quest: false })) : [])];
  return <div className="fv2-method">
    <h3>Cách nhận</h3>
    {!!route.storyPrerequisites?.length && <details><summary>Điều kiện</summary><ul>{route.storyPrerequisites.map(task=><li key={task.questId}>{task.name}</li>)}</ul></details>}
    {route.purchase && <p>Giá: {route.purchase.amount.toLocaleString("en-US")} {route.purchase.currency}</p>}
    {route.method==="Reputation" && route.description && <p>{friendly(route.description)}</p>}
    {!tasks.length && route.questReward && <p>Quest: {route.questReward}</p>}
    {(route.farmModes?.length || 0)>1 && <div className="fv32-route-picker" role="group" aria-label="Phương án farm">{route.farmModes!.map(option=><button type="button" key={option.id} aria-pressed={mode?.id===option.id} onClick={()=>onNavigate({modeId:option.id})}>{option.label}</button>)}</div>}
    {!!route.farmModes?.length && <p>{mode?.label}</p>}
    {actions.length ? <ol className="fv32-workflow-summary">{actions.map(({task,quest}) => <li key={task.id}>
      {quest ? <button type="button" className="fv2-linkbutton" onClick={() => onNavigate({ ...focus, questId: task.id, materialId: undefined })}>{task.quest}</button> : <b>{task.title || task.reward || route.location}</b>}
      {task.npc && <span> · {task.npc}</span>}{task.location && <span> · {task.location}</span>}{!task.map && [...new Set(task.acceptanceMaps || [])].map(map=><code key={map}>{map} </code>)}{task.map && <code> {task.map}</code>}
      {task.numberOfRuns != null && <span> · {task.numberOfRuns} lần</span>}
    </li>)}</ol> : <>
      {route.location && <p>{route.method}: {route.location}</p>}
      {route.npc && <p>NPC: {route.npc}</p>}{route.dropSource && <p>Quái drop: {route.dropSource}</p>}
      {route.mapCommand && <p><code>{route.mapCommand}</code></p>}
    </>}
    {!!route.questOptions?.length && <ul>{route.questOptions.map(option => <li key={option.questId}>
      <button type="button" className="fv2-linkbutton" onClick={() => onNavigate({ ...focus, optionId: option.questId, questId: option.questId, materialId: undefined })}>{option.name}</button>
    </li>)}</ul>}

  </div>;
}

function MaterialBody({ row, modeId, plan, totalKnown, onMaterial }: { row: Row; modeId?: string; plan?: FarmTask[]; totalKnown?: boolean; onMaterial: MaterialClick }) {
  const profile = profiles[keyFor(row)];
  const availableTasks=materialTasksForMode(profile?.tasks || [], modeId);
  const [selected, setSelected] = useState(modeId === "insignia" ? Math.max(0, availableTasks.findIndex(task => !task.quest)) : 0);
  const task = availableTasks[selected] || availableTasks[0];
  const output = [...(task?.fixedRewards || []),...(task?.rewardChoices || [])].find(reward=>reward.name===row.name);
  const escapedName=row.name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const perTurn=output?.quantity || task?.rewardQuantity || Number(task?.reward?.match(new RegExp(escapedName+"\\s*[×x](\\d+)"))?.[1]) || null;
  const planned=plan?.find(operation=>operation.source===task?.source&&operation.title===row.name)?.numberOfRuns;
  const runs=planned ?? (perTurn&&row.quantity!=null?Math.ceil(row.quantity/perTurn):task?.numberOfRuns);
  const effective=task?{...task,numberOfRuns:task.purchase?undefined:runs,totalRequired:task.purchase?row.quantity ?? undefined:task.totalRequired}:null;
  return <div className="fv32-material-body">
    <h4>{row.name}</h4><p><b>{row.usage==="owned"?"Cần sở hữu (không tiêu hao):":totalKnown?"Tổng số lượng cần chuẩn bị:":"Số lượng trong các bước đã ghi nhận:"}</b> {row.quantity?.toLocaleString("vi-VN") ?? "Số lượng phụ thuộc phương án nhận"}</p>
    {profile && !task?.purchase && <p><b>Cách nhận:</b> {task?.quest ? "Quest" : friendly(profile.method)}</p>}
    {availableTasks.length > 1 && <div className="fv32-route-picker" role="group" aria-label="Nguồn nguyên liệu">
      {availableTasks.map((option,index) => <button type="button" key={option.id+index} aria-pressed={selected===index} onClick={() => setSelected(index)}>{option.quest || option.title || "Merge"}</button>)}
    </div>}
    {task ? <>
      {task.bossId && <p><a href={`/ultra-boss/${task.bossId}`}>{task.bossName}</a></p>}
      {task.rows.filter(input => input.name === row.name && input.monster).map((input,index) => <div key={index}>
        <p><b>Monster:</b> {input.monster}</p>{input.map && <p><code>{input.map}</code></p>}
        {input.requiredQuest && <p>Cần nhận Quest: {input.requiredQuest}</p>}
      </div>)}
      {task.rewardChoices?.some(reward=>reward.name===row.name) && <p>Chọn phần thưởng <b>{row.name}</b> khi trả Quest.</p>}
      <QuestBody modeId={modeId} alreadyShown={[row.name,...task.rows.filter(input=>input.name===row.name).map(input=>input.monster)]} task={task.quest ? effective! : {...effective!,map:task.rows.some(input=>input.name===row.name&&input.map===task.map)?undefined:task.map,rows:task.rows.filter(input=>input.name!==row.name)}} onMaterial={onMaterial} />
      {!task.purchase && runs && runs>1 && task.rows.length>0 && <details><summary>Tổng nguyên liệu cho {runs} lượt</summary><MaterialTable modeId={modeId} rows={sumMaterials([effective!])} onMaterial={onMaterial}/></details>}
    </> : <>
      {row.monster && <p><b>Monster:</b> {row.monster}</p>}{row.map && <p><code>{row.map}</code></p>}
      {distinctFarmText((row.sourceDetails || []).flatMap(source=>[source.monster || "", source.mapJoin || ""]),[row.monster,row.map]).map(text=><p key={text}>{text.startsWith("/join ")?<code>{text}</code>:text}</p>)}
      {(registry.materialLinks?.[keyFor(row)] || row.source) && <p><a href={registry.materialLinks?.[keyFor(row)] || row.source} target="_blank" rel="noreferrer">Xem trên AQW Wiki</a></p>}
    </>}
  </div>;
}

function InsigniaNotes({ mode, finish }: { mode: FarmMode; finish: FarmTask[] }) {
  const exchanges=finish.filter(task=>task.rows.some(row=>/\binsignia\b/i.test(row.name)) && !task.quest);
  if(!exchanges.length)return null;
  return <aside className="fv32-insignia-notes" aria-label="Lưu ý khi farm bằng Insignia">
    {mode.notes?.map(note=><p key={note}>{note}</p>)}
    <div className="fv32-table-scroll" role="region" tabIndex={0} aria-label="Phân bổ Insignia"><table>
      <caption>Phân bổ Insignia</caption><thead><tr><th>Nguyên liệu</th><th>Số lượng nên đổi</th><th>Insignia cần dùng</th></tr></thead>
      <tbody>{exchanges.map(task=>{const runs=task.numberOfRuns??1;return <tr key={task.id}>
        <td>{task.title||task.reward}</td><td>{(task.rewardQuantity??1)*runs} ({runs} lượt)</td>
        <td>{task.rows.filter(row=>/\binsignia\b/i.test(row.name)).map(row=>`${row.name} ×${(row.quantity??0)*runs}`).join("; ")}</td>
      </tr>;})}</tbody>
    </table></div>
  </aside>;
}

function TotalMaterials({rows,onMaterial,modeId}:{rows:Row[];onMaterial:MaterialClick;modeId?:string}) {
  const entries = rows.filter(row=>row.usage!=="owned"&&!row.temporary&&row.role!=="tempQuestItem"&&!/^(?:Gold|ACs?)$/i.test(row.name)).map(row => {
    const tasks = materialTasksForMode(profiles[keyFor(row)]?.tasks || [], modeId);
    return { row: { ...row, itemId: keyFor(row) }, maps: materialTableMaps(row, tasks, modeId), conditions: materialQuestConditions(row, tasks) };
  });
  return <FarmMaterialTable entries={entries} label="Tổng nguyên liệu" onMaterial={onMaterial} />;
}

export function FarmQuestWorkflow({ route, focus, onNavigate, materialsOnly=false, itemId=route.id }: { route: FarmV2RouteData; focus: WorkflowFocus; onNavigate: (focus: WorkflowFocus) => void; materialsOnly?: boolean; itemId?: string }) {
  const { mode, tasks, finish, materials } = useFarmWorkflow(route, focus);
  const [insigniaView,setInsigniaView]=useState("quests");
  const showMaterials=materialsOnly||(mode?.id==="insignia"&&insigniaView==="materials");
  const quest = tasks.find(task => task.id === focus.questId) || tasks[0];
  const [extra, setExtra] = useState<Record<string, Row>>({});
  useEffect(()=>setExtra({}),[route.id,mode?.id,focus.optionId,focus.dailyRuns]);
  const owned: Row[]=tasks.flatMap(task=>(task.ownedItems || []).map(item=>({name:item.name,itemId:materialId(item.name),quantity:1,usage:"owned" as const,source:item.wikiUrl})));
  const option = route.questOptions?.find(option=>option.questId===focus.optionId) || route.questOptions?.[0];
  const direct = option?.directMaterials ?? route.directMaterials ?? materials;
  const guideMaterials = direct.filter((row,index,rows)=>rows.findIndex(other=>keyFor(other)===keyFor(row))===index);
  const reachable = reachableMaterialRows([...guideMaterials,...owned],profiles) as Row[];
  const focusedRow = reachable.find(row=>keyFor(row)===focus.materialId);
  const allMaterials = [...guideMaterials,...owned, ...Object.values(extra).filter(row=>reachable.some(allowed=>keyFor(allowed)===keyFor(row))),...(focusedRow?[focusedRow]:[])].filter((row,index,rows) => rows.findIndex(other=>keyFor(other)===keyFor(row))===index);
  const selectedMaterial = allMaterials.find(row => keyFor(row) === focus.materialId) || allMaterials[0];
  const keyboardSelection=useRef(false);
  const questRef = useRef<HTMLDivElement>(null), materialRef = useRef<HTMLDivElement>(null), id = useId();
  const progressKey=`aqw:farm-quest:${itemId}:${route.id}:${mode?.id || "standard"}:${focus.optionId || "primary"}`;
  const [completed,setCompleted]=useState<string[]>([]);
  useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem(progressKey)||"[]");setCompleted(Array.isArray(stored)?stored:[]);}catch{setCompleted([]);}},[progressKey]);
  const selectMaterial: MaterialClick = (material) => {
    if (!allMaterials.some(row => keyFor(row)===material)) {
      const found = reachable.find(row=>keyFor(row)===material);
      if (found) setExtra(current=>({...current,[material]:found}));
    }
    onNavigate({ ...focus, materialId: material, questId: undefined });
  };
  useEffect(() => {
    const target = focus.materialId ? materialRef.current : focus.questId ? questRef.current : null;
    target?.scrollIntoView?.({ block: "start", behavior: "auto" });
    if(!keyboardSelection.current)target?.focus({ preventScroll: true });
    keyboardSelection.current=false;
  }, [focus.materialId,focus.questId]);
  const insignias = mode?.insignia ? [mode.insignia] : mode?.insignias || [];
  return <div className="fv2-guide fv32-workflow">
    {(route.farmModes?.length || 0)>1 && <div className="fv32-route-picker" role="group" aria-label="Phương án farm">
      {route.farmModes!.map(option=><button type="button" key={option.id} aria-pressed={mode?.id===option.id} onClick={()=>onNavigate({modeId:option.id})}>{option.label}</button>)}
    </div>}
    {!!route.questOptions?.length && <div className="fv32-route-picker" role="group" aria-label="Quest nhận thưởng">
      {route.questOptions.map(option=><button type="button" key={option.questId} aria-pressed={focus.optionId===option.questId} onClick={()=>onNavigate({...focus,optionId:option.questId,questId:option.questId,materialId:undefined})}>{option.name}</button>)}
    </div>}
    {!materialsOnly && mode?.id==="insignia" && <div className="fv32-route-picker" role="group" aria-label="Nội dung Insignia">
      <button type="button" aria-pressed={insigniaView==="quests"} onClick={()=>setInsigniaView("quests")}>Quest farm</button>
      <button type="button" aria-pressed={insigniaView==="materials"} onClick={()=>setInsigniaView("materials")}>Tổng nguyên liệu</button>
    </div>}
    {!showMaterials && insignias.map((source,index)=><aside className="fv32-insignia-sources" key={index}>
      <a href={`/ultra-boss/${source.bossId}`}>{source.bossName || "Ultra Boss Codex"}</a><p>{source.name} ×{source.quantity} · {source.perQuest} mỗi lượt Quest · {source.questCompletions} lượt</p>
      {source.quest && <p>Quest: {source.quest}</p>}{source.npc && <p>NPC: {source.npc}</p>}
      <p><code>{source.map}</code> · {source.repeatability === "daily" ? "Daily" : "Weekly"}</p>
      {"exchangeInput" in source && <p>Đổi {source.exchangeInput} Insignia → {source.exchangeOutput} nguyên liệu, {source.exchanges} lượt.</p>}
    </aside>)}
    {!showMaterials && mode && insignias.length>0 && <InsigniaNotes mode={mode} finish={finish}/>}
    {!showMaterials && route.mixRule && mode?.id==="insignia" && <label>Kết hợp Quest thường: <input type="number" min={0} max={15} step={1} aria-label="Số lượt Void HighLord's Challenge" value={focus.dailyRuns ?? 0} onChange={event=>{
      const daily=Number(event.target.value);if(Number.isInteger(daily)&&daily>=0&&daily<=15)onNavigate({...focus,dailyRuns:daily,questId:undefined,materialId:undefined});
    }}/></label>}
    {!showMaterials && <section aria-label="Quy trình Quest"><h3>{tasks.length?"1. Quy trình Quest":"Cách nhận"}</h3>
      {tasks.length>0 && <div className="fv31-step-numbers" role="tablist" aria-label="Các Quest" onKeyDown={event=>{
        if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
        event.preventDefault(); const at=tasks.findIndex(task=>task.id===quest.id);
        const next=event.key==="Home"?0:event.key==="End"?tasks.length-1:(at+(event.key==="ArrowRight"?1:-1)+tasks.length)%tasks.length;
        keyboardSelection.current=true;
        onNavigate({...focus,questId:tasks[next].id,materialId:undefined});
        event.currentTarget.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
      }}>{tasks.map((task,index)=><button type="button" role="tab" key={task.id} id={`${id}-q-${index}`} aria-controls={id+"-quest"} aria-selected={quest?.id===task.id} tabIndex={quest?.id===task.id?0:-1}
        className={quest?.id===task.id?"active":undefined} title={task.quest || ""} aria-label={`Quest ${index+1}: ${task.quest}`} onClick={()=>onNavigate({...focus,questId:task.id,materialId:undefined})}>{index+1}</button>)}</div>}
      <div ref={questRef} tabIndex={-1} id={id+"-quest"} className="fv31-step-content" role="region" aria-label="Quest đang chọn">
        {mode?.finishingBeforeQuestId && mode.finishingBeforeQuestId===quest?.id && finish.map(task=><section key={task.id} aria-label={task.quest?"Cách nhận cuối":undefined}>{task.quest && <h4>Cách nhận cuối</h4>}<QuestBody modeId={mode?.id} task={task} onMaterial={selectMaterial}/></section>)}
        {(registry.operationGroups?.[quest?.id] || []).map(task=><QuestBody modeId={mode?.id} key={task.id} task={task} onMaterial={selectMaterial}/>)}
        {quest && <QuestBody modeId={mode?.id} task={quest} onMaterial={selectMaterial}/>}
        {quest && <label className="fv31-step-complete"><input type="checkbox" checked={completed.includes(quest.id)} onChange={()=>{
          const next=completed.includes(quest.id)?completed.filter(id=>id!==quest.id):[...completed,quest.id];setCompleted(next);
          try{localStorage.setItem(progressKey,JSON.stringify(next));}catch{/* Progress stays in this tab when storage is unavailable. */}
        }}/>Đã hoàn thành Quest này</label>}
        {(!quest || quest.id===tasks.at(-1)?.id) && !mode?.finishingBeforeQuestId && finish.map(task=><section key={task.id} aria-label={task.quest?"Cách nhận cuối":undefined}>{task.quest && <h4>Cách nhận cuối</h4>}<QuestBody modeId={mode?.id} task={task} onMaterial={selectMaterial}/></section>)}
        {!quest && !finish.length && <><p>{route.location}</p>{route.mapCommand && <code>{route.mapCommand}</code>}<MaterialTable modeId={mode?.id} rows={materialLeaves(route.materialTree)} onMaterial={selectMaterial}/></>}
      </div>
    </section>}
    {showMaterials && <><h3>Nguyên liệu trực tiếp</h3><MaterialTable rows={direct} modeId={mode?.id} onMaterial={selectMaterial}/>
      <h3>Tổng nguyên liệu</h3>{!route.materialTotalsComplete && <p>Tổng nguyên liệu chưa được xác minh đầy đủ; bảng dưới chỉ gồm các bước đã ghi nhận của phương án đang chọn.</p>}
      <TotalMaterials rows={materials} modeId={mode?.id} onMaterial={selectMaterial}/></> }
    {showMaterials && !!route.materialPlan?.equivalentCosts.length && <details><summary>Giá trị quy đổi</summary><ul>{route.materialPlan.equivalentCosts.map(cost=><li key={cost.materialId}>{cost.quantity} {direct.find(row=>keyFor(row)===cost.materialId)?.name||cost.materialId}: {cost.total.toLocaleString("vi-VN")} {cost.currency}. Giá trị tham khảo, không cộng thêm vào Tổng nguyên liệu.</li>)}</ul></details>}
    {showMaterials && !!allMaterials.length && <section aria-label="Hướng dẫn Farm nguyên liệu"><h3>Hướng dẫn Farm nguyên liệu</h3>
      <div className="fv32-route-picker" role="group" aria-label="Chọn nguyên liệu">{guideMaterials.map(row=><button type="button" key={keyFor(row)} aria-pressed={selectedMaterial && keyFor(selectedMaterial)===keyFor(row)} onClick={()=>selectMaterial(keyFor(row))}>{row.name}</button>)}</div>
      <div ref={materialRef} tabIndex={-1} role="region" aria-label="Nguyên liệu đang chọn">{selectedMaterial && <MaterialBody key={keyFor(selectedMaterial)+mode?.id} row={selectedMaterial} totalKnown={route.materialTotalsComplete} modeId={mode?.id} plan={mode?.finishingTasks} onMaterial={selectMaterial}/>}</div>
    </section>}
  </div>;
}
