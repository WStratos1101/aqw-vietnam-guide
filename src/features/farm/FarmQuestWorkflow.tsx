import { useEffect, useId, useRef, useState } from "react";
import registryData from "../../content/farm/quest-workflows.generated.json";
import materialData from "../../content/farm/material-sources.generated.json";
import manualData from "../../../content-sources/farm/material-guides.json";
import { materialId, materialLeaves } from "../../lib/material-requirements.mjs";
import { sumMaterials, workflowTasks, voidHighlordMix } from "../../lib/farm-workflows.mjs";
import type { FarmTask, FarmV2RouteData, FarmAcquisitionBrief } from "../../types/farm-v2";

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
    for(const task of tasks){const key=task.quest?task.source+":"+task.quest:task.title+":"+task.npc+":"+task.map+JSON.stringify(task.rows.map(row=>[row.name,row.quantity,row.monster,row.map]));if(!unique.has(key))unique.set(key,task);}
    return [id,{...profile,tasks:[...unique.values()]}];
  })) as Record<string,Profile>;
const keyFor = (row: Row) => row.itemId || materialId(row.name);
const friendly = (text: string) => text.replace(/AND\/OR/g, "các phương án thay thế").replace(/(?:Wiki )?snapshot/gi, "nguồn Wiki");

function MaterialTable({ rows, onMaterial }: { rows: Row[]; onMaterial: MaterialClick }) {
  rows = rows.map(row=>{
    if(row.map)return row;
    const sources=profiles[keyFor(row)]?.tasks || [];
    const maps=[...new Set(sources.flatMap(task=>task.bossId&&task.map?[task.map]:task.quest?[]:task.rows.filter(input=>input.name===row.name&&input.monster&&input.map).map(input=>input.map!)))];
    return maps.length===1?{...row,map:maps[0]}:row;
  });
  const maps = [...new Set(rows.map(row => row.map || ""))];
  return <>{maps.map(map => <div key={map}>
    {map && <h5>{map}</h5>}
    <div className="fv32-table-scroll" role="region" tabIndex={0} aria-label={map ? `Nguyên liệu tại ${map}` : "Nguyên liệu Quest"}>
      <table><thead><tr><th>Tên nguyên liệu</th><th>Số lượng</th><th>Map farm</th></tr></thead>
        <tbody>{rows.filter(row => (row.map || "") === map).map(row => <tr key={keyFor(row)}>
          <td><button type="button" className="fv2-linkbutton" onClick={() => onMaterial(keyFor(row),row)}>{row.name}</button></td>
          <td>{row.quantity?.toLocaleString("vi-VN") ?? "—"}</td><td>{row.map || "—"}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>)}</>;
}

function QuestBody({ task, onMaterial }: { task: FarmTask; onMaterial: MaterialClick }) {
  return <section className="fv32-facts">
    <h4>{task.quest || task.title}</h4>
    {!!task.preconditions?.length && <div className="fv32-quest-conditions"><b>Điều kiện nhận Quest</b>
      <ul>{task.preconditions.map((condition, i) => <li key={i}>{friendly(condition)}</li>)}</ul>
    </div>}
    {!!task.ownedItems?.length && <div><b>Trang bị cần sở hữu (không tiêu hao):</b> {task.ownedItems.map(item => <button type="button" className="fv2-linkbutton" key={item.wikiUrl} onClick={()=>onMaterial(materialId(item.name))}>{item.name}</button>)}</div>}
    {task.npc && <p><b>NPC:</b> {task.npc}</p>}
    {task.location && <p><b>Nơi nhận:</b> {task.location}</p>}
    {!task.map && task.acceptanceMaps?.map(map=><p key={map}><code>{map}</code></p>)}
    {task.map && <p><code>{task.map}</code></p>}
    {task.purchase && <p><b>Giá:</b> {task.purchase.amount.toLocaleString("vi-VN")} {task.purchase.currency}</p>}
    {task.numberOfRuns != null && <p><b>Số lần hoàn thành:</b> {task.numberOfRuns}. Bảng dưới tính cho mỗi lượt.</p>}
    {task.repeatability && <p><b>Giới hạn:</b> {task.repeatability.startsWith("weekly") ? "Mỗi tuần" : task.repeatability.startsWith("daily") ? "Mỗi ngày" : friendly(task.repeatability)}</p>}
    <MaterialTable rows={task.rows} onMaterial={(id,row)=>onMaterial(id,row?{...row,quantity:row.quantity==null?null:row.quantity*(task.numberOfRuns || 1)}:undefined)} />
    {task.reward && <p><b>Phần thưởng:</b> {task.reward}</p>}
    {!!task.rewardChoices?.length && <details><summary>Chọn một phần thưởng</summary><ul>{task.rewardChoices.map((reward, i) => <li key={i}>{reward.name} ×{reward.quantity}</li>)}</ul></details>}
    {!!task.randomChoiceRewards?.length && <p>Nhận ngẫu nhiên một trong: {task.randomChoiceRewards.map(reward => `${reward.name} ×${reward.quantity}`).join("; ")}</p>}
    {!!task.randomRewards?.length && <p>Có thể nhận thêm: {task.randomRewards.map(reward => `${reward.name} ×${reward.quantity}`).join("; ")}</p>}
    {task.destination && <p>Mở {task.destination.map}, chọn {task.destination.shop} để nhận {task.destination.item}.</p>}
  </section>;
}

export function useFarmWorkflow(route: FarmV2RouteData, focus: WorkflowFocus) {
  let mode = route.farmModes?.find(mode => mode.id === focus.modeId) || route.farmModes?.[0];
  let tasks = workflowTasks(route, registry, mode?.id, focus.optionId);
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
  const finish = mode?.finishingTasks?.length ? mode.finishingTasks : route.completionTasks || (route.farmTasks || []).filter(task => !task.quest && !grouped.has(task.id));
  const operations=tasks.flatMap(task=>registry.operationGroups?.[task.id] || []);
  const materials = mode?.materials || sumMaterials([...tasks,...operations, ...finish]);
  const fallback = materialLeaves(route.materialTree);
  return { mode, tasks, finish, materials: materials.length ? materials : fallback };
}

export function FarmWorkflowSummary({ route, focus, onNavigate, brief }: { route: FarmV2RouteData; focus: WorkflowFocus; onNavigate: (focus: WorkflowFocus) => void; brief?: FarmAcquisitionBrief }) {
  const { mode, tasks, finish, materials } = useFarmWorkflow(route, focus);
  const actions = [...tasks.flatMap(task => [
    ...(registry.operationGroups?.[task.id] || []).map(operation=>({task:operation,quest:false})),
    ...(mode?.finishingBeforeQuestId===task.id ? finish.map(operation=>({task:operation,quest:false})) : []),
    {task,quest:true},
  ]), ...(!mode?.finishingBeforeQuestId ? finish.map(task => ({ task, quest: false })) : [])];
  return <div className="fv2-method">
    <h3>Cách nhận</h3>
    {route.method==="Reputation" && route.description && <p>{friendly(route.description)}</p>}
    {!tasks.length && route.questReward && <p>Quest: {route.questReward}</p>}
    {route.purchase && <p>Giá: {route.purchase.amount.toLocaleString("en-US")} {route.purchase.currency}</p>}
    {(route.farmModes?.length || 0)>1 && <div className="fv32-route-picker" role="group" aria-label="Phương án farm">{route.farmModes!.map(option=><button type="button" key={option.id} aria-pressed={mode?.id===option.id} onClick={()=>onNavigate({modeId:option.id})}>{option.label}</button>)}</div>}
    {!!route.farmModes?.length && <p>{mode?.label}</p>}
    {actions.length ? <ol className="fv32-workflow-summary">{actions.map(({task,quest}) => <li key={task.id}>
      {quest ? <button type="button" className="fv2-linkbutton" onClick={() => onNavigate({ ...focus, questId: task.id, materialId: undefined })}>{task.quest}</button> : <b>{task.title || task.reward || route.location}</b>}
      {task.npc && <span> · {task.npc}</span>}{task.location && <span> · {task.location}</span>}{!task.map && task.acceptanceMaps?.map(map=><code key={map}>{map} </code>)}{task.map && <code> {task.map}</code>}
      {task.numberOfRuns != null && <span> · {task.numberOfRuns} lần</span>}
    </li>)}</ol> : <>
      {route.location && <p>{route.method}: {route.location}</p>}
      {route.npc && <p>NPC: {route.npc}</p>}{route.dropSource && <p>Quái drop: {route.dropSource}</p>}
      {route.mapCommand && <p><code>{route.mapCommand}</code></p>}
      {route.purchase && <p>Giá: {route.purchase.amount.toLocaleString("vi-VN")} {route.purchase.currency}</p>}
    </>}
    {!!route.questOptions?.length && <ul>{route.questOptions.map(option => <li key={option.questId}>
      <button type="button" className="fv2-linkbutton" onClick={() => onNavigate({ ...focus, optionId: option.questId, questId: option.questId, materialId: undefined })}>{option.name}</button>
    </li>)}</ul>}
    {!!materials.length && <details><summary>Nguyên liệu cần chuẩn bị</summary><ul>{materials.map(row => <li key={keyFor(row)}>
      <button type="button" className="fv2-linkbutton" onClick={() => onNavigate({ ...focus, materialId: keyFor(row), questId: undefined })}>{row.name}</button> ×{row.quantity?.toLocaleString("vi-VN") ?? "—"}
    </li>)}</ul></details>}
  </div>;
}

function MaterialBody({ row, modeId, plan, totalKnown, onMaterial }: { row: Row; modeId?: string; plan?: FarmTask[]; totalKnown?: boolean; onMaterial: MaterialClick }) {
  const profile = profiles[keyFor(row)];
  const [selected, setSelected] = useState(modeId === "insignia" ? Math.max(0, profile?.tasks?.findIndex(task => !task.quest) || 0) : 0);
  const task = profile?.tasks?.[selected] || profile?.tasks?.[0];
  const output = [...(task?.fixedRewards || []),...(task?.rewardChoices || [])].find(reward=>reward.name===row.name);
  const escapedName=row.name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const perTurn=output?.quantity || task?.rewardQuantity || Number(task?.reward?.match(new RegExp(escapedName+"\\s*[×x](\\d+)"))?.[1]) || null;
  const planned=plan?.find(operation=>operation.source===task?.source&&operation.title===row.name)?.numberOfRuns;
  const runs=planned ?? (perTurn&&row.quantity!=null?Math.ceil(row.quantity/perTurn):task?.numberOfRuns);
  const effective=task?{...task,numberOfRuns:runs}:null;
  return <div className="fv32-material-body">
    <h4>{row.name}</h4><p><b>{row.usage==="owned"?"Cần sở hữu (không tiêu hao):":totalKnown?"Tổng số lượng cần chuẩn bị:":"Số lượng trong các bước đã ghi nhận:"}</b> {row.quantity?.toLocaleString("vi-VN") ?? "Số lượng phụ thuộc phương án nhận"}</p>
    {profile && <p><b>Cách nhận:</b> {friendly(profile.method)}</p>}
    {(profile?.tasks?.length || 0) > 1 && <div className="fv32-route-picker" role="group" aria-label="Nguồn nguyên liệu">
      {profile.tasks.map((option,index) => <button type="button" key={option.id+index} aria-pressed={selected===index} onClick={() => setSelected(index)}>{option.quest || option.title || "Merge"}</button>)}
    </div>}
    {task ? <>
      {task.bossId && <p><a href={`/ultra-boss/${task.bossId}`}>{task.bossName}</a></p>}
      {task.rows.filter(input => input.name === row.name && input.monster).map((input,index) => <div key={index}>
        <p><b>Monster:</b> {input.monster}</p>{input.map && <p><code>{input.map}</code></p>}
        {input.requiredQuest && <p>Cần nhận Quest: {input.requiredQuest}</p>}
      </div>)}
      {task.rewardChoices?.some(reward=>reward.name===row.name) && <p>Chọn phần thưởng <b>{row.name}</b> khi trả Quest.</p>}
      <QuestBody task={task.quest ? effective! : {...effective!,rows:task.rows.filter(input=>input.name!==row.name)}} onMaterial={onMaterial} />
      {runs && runs>1 && task.rows.length>0 && <details><summary>Tổng nguyên liệu cho {runs} lượt</summary><MaterialTable rows={sumMaterials([effective!])} onMaterial={onMaterial}/></details>}
    </> : <>
      {row.monster && <p><b>Monster:</b> {row.monster}</p>}{row.map && <p><code>{row.map}</code></p>}
      {row.sourceDetails?.map((source,index) => <div key={index}><p>{source.monster}</p>{source.mapJoin && <code>{source.mapJoin}</code>}</div>)}
      {(registry.materialLinks?.[keyFor(row)] || row.source) && <p><a href={registry.materialLinks?.[keyFor(row)] || row.source} target="_blank" rel="noreferrer">Xem trên AQW Wiki</a></p>}
    </>}
  </div>;
}

export function FarmQuestWorkflow({ route, focus, onNavigate, materialsOnly=false, itemId=route.id }: { route: FarmV2RouteData; focus: WorkflowFocus; onNavigate: (focus: WorkflowFocus) => void; materialsOnly?: boolean; itemId?: string }) {
  const { mode, tasks, finish, materials } = useFarmWorkflow(route, focus);
  const quest = tasks.find(task => task.id === focus.questId) || tasks[0];
  const [extra, setExtra] = useState<Record<string, Row>>({});
  useEffect(()=>setExtra({}),[mode?.id,focus.optionId,focus.dailyRuns]);
  const owned: Row[]=tasks.flatMap(task=>(task.ownedItems || []).map(item=>({name:item.name,itemId:materialId(item.name),quantity:1,usage:"owned" as const,source:item.wikiUrl})));
  const allMaterials = [...materials,...owned, ...Object.values(extra)].filter((row,index,rows) => rows.findIndex(other=>keyFor(other)===keyFor(row))===index);
  const selectedMaterial = allMaterials.find(row => keyFor(row) === focus.materialId) || allMaterials[0];
  const keyboardSelection=useRef(false);
  const questRef = useRef<HTMLDivElement>(null), materialRef = useRef<HTMLDivElement>(null), id = useId();
  const progressKey=`aqw:farm-quest:${itemId}:${route.id}:${mode?.id || "standard"}:${focus.optionId || "primary"}`;
  const [completed,setCompleted]=useState<string[]>([]);
  useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem(progressKey)||"[]");setCompleted(Array.isArray(stored)?stored:[]);}catch{setCompleted([]);}},[progressKey]);
  const selectMaterial: MaterialClick = (material, suggested) => {
    if (!allMaterials.some(row => keyFor(row)===material)) {
      const found = suggested || [...tasks,...finish,...Object.values(profiles).flatMap(profile => profile.tasks || [])].flatMap(task=>task.rows).find(row=>keyFor(row)===material);
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
    {insignias.map((source,index)=><aside className="fv32-insignia-sources" key={index}>
      <a href={`/ultra-boss/${source.bossId}`}>{source.bossName || "Ultra Boss Codex"}</a><p>{source.name} ×{source.quantity} · {source.perQuest} mỗi lượt Quest · {source.questCompletions} lượt</p>
      {source.quest && <p>Quest: {source.quest}</p>}{source.npc && <p>NPC: {source.npc}</p>}
      <p><code>{source.map}</code> · {source.repeatability === "daily" ? "Daily" : "Weekly"}</p>
      {"exchangeInput" in source && <p>Đổi {source.exchangeInput} Insignia → {source.exchangeOutput} nguyên liệu, {source.exchanges} lượt.</p>}
    </aside>)}
    {mode?.notes?.map((note,index)=><p key={index}>{note}</p>)}
    {route.mixRule && mode?.id==="insignia" && <label>Kết hợp Quest thường: <input type="number" min={0} max={15} step={1} aria-label="Số lượt Void HighLord's Challenge" value={focus.dailyRuns ?? 0} onChange={event=>{
      const daily=Number(event.target.value);if(Number.isInteger(daily)&&daily>=0&&daily<=15)onNavigate({...focus,dailyRuns:daily,questId:undefined,materialId:undefined});
    }}/></label>}
    {!materialsOnly && <section aria-label="Quy trình Quest"><h3>{tasks.length?"1. Quy trình Quest":"Cách nhận"}</h3>
      {tasks.length>1 && <div className="fv31-step-numbers" role="tablist" aria-label="Các Quest" onKeyDown={event=>{
        if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
        event.preventDefault(); const at=tasks.findIndex(task=>task.id===quest.id);
        const next=event.key==="Home"?0:event.key==="End"?tasks.length-1:(at+(event.key==="ArrowRight"?1:-1)+tasks.length)%tasks.length;
        keyboardSelection.current=true;
        onNavigate({...focus,questId:tasks[next].id,materialId:undefined});
        event.currentTarget.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
      }}>{tasks.map((task,index)=><button type="button" role="tab" key={task.id} id={`${id}-q-${index}`} aria-controls={id+"-quest"} aria-selected={quest?.id===task.id} tabIndex={quest?.id===task.id?0:-1}
        title={task.quest || ""} aria-label={`Quest ${index+1}: ${task.quest}`} onClick={()=>onNavigate({...focus,questId:task.id,materialId:undefined})}>{index+1}</button>)}</div>}
      <div ref={questRef} tabIndex={-1} id={id+"-quest"} className="fv31-step-content" role="region" aria-label="Quest đang chọn">
        {mode?.finishingBeforeQuestId===quest?.id && finish.map(task=><QuestBody key={task.id} task={task} onMaterial={selectMaterial}/>)}
        {(registry.operationGroups?.[quest?.id] || []).map(task=><QuestBody key={task.id} task={task} onMaterial={selectMaterial}/>)}
        {quest && <QuestBody task={quest} onMaterial={selectMaterial}/>}
        {quest && <label className="fv31-step-complete"><input type="checkbox" checked={completed.includes(quest.id)} onChange={()=>{
          const next=completed.includes(quest.id)?completed.filter(id=>id!==quest.id):[...completed,quest.id];setCompleted(next);
          try{localStorage.setItem(progressKey,JSON.stringify(next));}catch{/* Progress stays in this tab when storage is unavailable. */}
        }}/>Đã hoàn thành Quest này</label>}
        {(!quest || quest.id===tasks.at(-1)?.id) && !mode?.finishingBeforeQuestId && finish.map(task=><QuestBody key={task.id} task={task} onMaterial={selectMaterial}/>)}
        {!quest && !finish.length && <><p>{route.location}</p>{route.mapCommand && <code>{route.mapCommand}</code>}<MaterialTable rows={materialLeaves(route.materialTree)} onMaterial={selectMaterial}/></>}
      </div>
    </section>}
    {!!allMaterials.length && <section aria-label="Hướng dẫn Farm nguyên liệu"><h3>2. Hướng dẫn Farm nguyên liệu</h3>
      <div className="fv32-route-picker" role="group" aria-label="Chọn nguyên liệu">{allMaterials.map(row=><button type="button" key={keyFor(row)} aria-pressed={selectedMaterial && keyFor(selectedMaterial)===keyFor(row)} onClick={()=>selectMaterial(keyFor(row))}>{row.name}</button>)}</div>
      <div ref={materialRef} tabIndex={-1} role="region" aria-label="Nguyên liệu đang chọn">{selectedMaterial && <MaterialBody key={keyFor(selectedMaterial)+mode?.id} row={selectedMaterial} totalKnown={route.materialTotalsComplete} modeId={mode?.id} plan={mode?.finishingTasks} onMaterial={selectMaterial}/>}</div>
    </section>}
  </div>;
}
