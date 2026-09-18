import { DATA } from './data.js';

const wait = (ms=35)=>new Promise(r=>setTimeout(r,ms));
const num=v=>Number(v||0);
export const money=v=>`S/ ${num(v).toLocaleString('es-PE',{minimumFractionDigits:1,maximumFractionDigits:1})} M`;
const pct=(a,b)=>b?Math.round((a/b*100)*10)/10:0;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
const words=s=>norm(s).split(/\s+/).filter(Boolean);

const profileById=id=>DATA.profiles.find(x=>x.id===id)||DATA.profiles[0];
const personById=id=>DATA.people.find(x=>x.id===id);
const unitById=id=>DATA.orgUnits.find(x=>x.id===id);
const centerByCode=code=>DATA.costCenters.find(x=>x.code===code);

function childrenOf(id){ return DATA.orgUnits.filter(x=>x.parentId===id); }
function descendantIds(id){
  const out=[],q=[id];
  while(q.length){ const x=q.shift(); if(x!==id) out.push(x); childrenOf(x).forEach(c=>q.push(c.id)); }
  return out;
}
function ancestors(id){
  const out=[]; let cur=unitById(id);
  while(cur?.parentId){ cur=unitById(cur.parentId); if(cur) out.unshift(cur); }
  return out;
}
function rootOf(id){ let cur=unitById(id); while(cur?.parentId) cur=unitById(cur.parentId); return cur; }

export function accessibleUnitIds(profile){
  if(profile.role==='admin'||profile.role==='director') return DATA.orgUnits.map(x=>x.id);
  if(profile.role==='office_head'){
    const root=DATA.orgUnits.find(x=>x.name==='OFICINA DE PLANEAMIENTO Y PRESUPUESTO');
    return root?[root.id,...descendantIds(root.id)]:[];
  }
  if(profile.role==='staff') return profile.scopeUnitId?[profile.scopeUnitId]:[];
  if(profile.scopeUnitId) return [profile.scopeUnitId,...descendantIds(profile.scopeUnitId)];
  return [];
}
export function accessiblePeople(profile){
  if(profile.role==='admin'||profile.role==='director') return DATA.people.filter(p=>p.inScope);
  if(profile.role==='staff') return DATA.people.filter(p=>p.id===profile.personId);
  const ids=new Set(accessibleUnitIds(profile));
  return DATA.people.filter(p=>p.inScope&&ids.has(p.unitId));
}
export function visibleCostCenters(profile){
  if(['admin','director','office_head'].includes(profile.role)) return DATA.costCenters;
  const units=accessibleUnitIds(profile).map(unitById).filter(Boolean);
  const codes=[...new Set(units.map(x=>x.costCenter).filter(Boolean))];
  if(!codes.length) return [];
  return DATA.costCenters.filter(c=>codes.some(code=>c.code===code||c.code.startsWith(code+'.')));
}
function aggregateBudget(rows){
  const keys=['pia','pim','certified','committed','accrued','paid','projected'];
  const o={}; for(const k of keys)o[k]=rows.reduce((a,x)=>a+num(x[k]),0);
  o.execution=pct(o.accrued,o.pim); o.certification=pct(o.certified,o.pim); o.payment=pct(o.paid,o.pim);
  return o;
}
function canSeePerson(profile,personId){
  if(profile.role==='admin'||profile.role==='director')return true;
  if(profile.role==='staff')return profile.personId===personId;
  return accessiblePeople(profile).some(p=>p.id===personId);
}
function attendanceForPeople(ids,month='2026-09'){
  const set=new Set(ids); return DATA.attendance.filter(a=>set.has(a.personId)&&a.date.startsWith(month));
}
function attendanceSummary(rows){
  const counts={Puntual:0,Tardanza:0,Permiso:0,Comisión:0,Inasistencia:0};
  rows.forEach(r=>counts[r.status]=(counts[r.status]||0)+1);
  const total=rows.length||1;
  return {...counts,total,punctuality:Math.round((counts.Puntual/total*100)*10)/10,lateMinutes:rows.reduce((a,x)=>a+num(x.lateMinutes),0)};
}
function unitPeople(unitId,includeDesc=true){
  const ids=new Set([unitId,...(includeDesc?descendantIds(unitId):[])]);
  return DATA.people.filter(p=>p.inScope&&ids.has(p.unitId));
}
function unitBudget(unit){
  if(!unit?.costCenter)return {rows:[],totals:aggregateBudget([])};
  const rows=DATA.costCenters.filter(c=>c.code===unit.costCenter||c.code.startsWith(unit.costCenter+'.'));
  return {rows,totals:aggregateBudget(rows)};
}

export async function getBootstrap(profileId){
  await wait(); const profile=profileById(profileId);
  const ids=new Set(accessibleUnitIds(profile)); return {profile,meta:DATA.meta,units:DATA.orgUnits.filter(x=>ids.has(x.id)),people:accessiblePeople(profile),costCenters:visibleCostCenters(profile),alerts:DATA.alerts};
}
export async function getDashboard(profileId){
  await wait(); const profile=profileById(profileId),people=accessiblePeople(profile),centers=visibleCostCenters(profile),budget=aggregateBudget(centers);
  const tasks=people.flatMap(p=>p.tasks.map(t=>({...t,personId:p.id,person:p.name,unit:p.unit})));
  const att=attendanceForPeople(people.map(x=>x.id),'2026-09');
  const attSum=attendanceSummary(att);
  const docs=DATA.documents.filter(d=>people.some(p=>p.id===d.personId));
  return {profile,people,centers,budget,tasks,attendance:attSum,documents:docs,
    criticalTasks:tasks.filter(t=>t.priority==='Alta'&&t.status!=='En revisión'),
    delayedDocs:docs.filter(d=>['Borrador','En revisión'].includes(d.status)),
    investments:DATA.investments,alerts:DATA.alerts,processes:DATA.processes};
}
export async function getOrganization(profileId){
  await wait(); const profile=profileById(profileId); let ids=new Set(accessibleUnitIds(profile));
  if(profile.role==='admin'||profile.role==='director') ids=new Set(DATA.orgUnits.map(x=>x.id));
  const units=DATA.orgUnits.filter(x=>ids.has(x.id));
  return {profile,units,people:accessiblePeople(profile)};
}
export async function getUnitDetail(profileId,unitId){
  await wait(); const profile=profileById(profileId); const allowed=new Set(accessibleUnitIds(profile));
  if(!allowed.has(unitId)&&!['admin','director'].includes(profile.role)) throw new Error('El perfil activo no tiene acceso a esta unidad.');
  const unit=unitById(unitId); if(!unit)throw new Error('Unidad no encontrada.');
  const people=unitPeople(unitId,true),direct=unitPeople(unitId,false),att=attendanceForPeople(people.map(x=>x.id),'2026-09');
  const b=unitBudget(unit),tasks=people.flatMap(p=>p.tasks.map(t=>({...t,personId:p.id,person:p.name,unit:p.unit})));
  return {unit,ancestors:ancestors(unitId),children:childrenOf(unitId),responsible:personById(unit.responsibleId),people,directPeople:direct,attendance:attendanceSummary(att),budget:b,tasks};
}
export async function getPersonDetail(profileId,personId,month='2026-09'){
  await wait(); const profile=profileById(profileId); if(!canSeePerson(profile,personId))throw new Error('El perfil activo no tiene acceso a esta persona.');
  const person=personById(personId); if(!person)throw new Error('Servidor no encontrado.');
  const att=DATA.attendance.filter(a=>a.personId===personId&&a.date.startsWith(month));
  const docs=DATA.documents.filter(d=>d.personId===personId).sort((a,b)=>b.date.localeCompare(a.date));
  const supervisor=person.supervisorId?personById(person.supervisorId):null;
  const directReports=DATA.people.filter(p=>p.supervisorId===personId);
  return {person,attendance:att,attendanceSummary:attendanceSummary(att),documents:docs,supervisor,directReports,unit:unitById(person.unitId)};
}
export async function getAttendance(profileId,{unitId=null,personId=null,month='2026-09'}={}){
  await wait(); const profile=profileById(profileId); let people=accessiblePeople(profile);
  if(unitId){ const ids=new Set([unitId,...descendantIds(unitId)]); people=people.filter(p=>ids.has(p.unitId)); }
  if(personId) people=people.filter(p=>p.id===personId);
  const rows=attendanceForPeople(people.map(x=>x.id),month);
  const summaries=people.map(p=>({person:p,summary:attendanceSummary(rows.filter(a=>a.personId===p.id))}));
  const byDate={}; for(const r of rows){byDate[r.date] ||= [];byDate[r.date].push(r)}
  return {profile,people,rows,summaries,byDate,summary:attendanceSummary(rows),month,schedule:DATA.meta.attendanceSchedule,updated:DATA.meta.attendanceUpdated};
}
export async function getBudget(profileId){ await wait(); const profile=profileById(profileId),rows=visibleCostCenters(profile); return {profile,rows,totals:aggregateBudget(rows),monthly:DATA.budgetMonthly,candidates:DATA.budgetCandidates,updated:DATA.meta.budgetUpdated}; }

function candidateUsable(source){return Math.max(0,Math.min(num(source.available),num(source.pim)-num(source.projected)-num(source.restricted)-num(source.critical)));}
export async function simulateBudget({sourceId,destinationId,amount}){
  await wait(100);const source=DATA.budgetCandidates.find(x=>x.id===sourceId),destination=DATA.investments.find(x=>x.id===destinationId),amt=Math.max(0,num(amount));
  if(!source||!destination||!amt)throw new Error('Complete origen, destino y monto.');
  const usable=candidateUsable(source),ratio=usable?amt/usable:999;let classification='NO VIABLE',level='danger',reason='El monto supera la disponibilidad potencial o existe una restricción.';
  if(source.classifier==='2.1.1'){reason='El origen corresponde a retribuciones y complementos en efectivo. El crédito se mantiene restringido salvo supuesto excepcional aplicable y validado.'}
  else if(amt<=usable&&usable>0){classification=ratio>.8?'VIABLE CONDICIONADO':'POTENCIALMENTE VIABLE';level=ratio>.8?'warning':'success';reason=ratio>.8?'Utiliza una proporción alta del margen evaluable y exige validación reforzada.':'Puede pasar a validación técnica sin afectar las obligaciones modeladas.'}
  else if(amt<=num(source.available)&&source.available>0){classification='REQUIERE REVISIÓN';level='warning';reason='Está dentro del saldo preliminar, pero excede el margen después de reservas, obligaciones y criticidad.'}
  const afterGap=Math.max(0,num(destination.gap)-amt);
  return {source,destination,amount:amt,usable,classification,level,reason,before:{sourcePim:source.pim,destinationPim:destination.pim,gap:destination.gap,risk:destination.risk},after:{sourcePim:Math.max(0,source.pim-amt),destinationPim:destination.pim+amt,gap:afterGap,risk:afterGap===0&&destination.risk==='Alto'?'Medio':destination.risk},checks:[
    {label:'Saldo preliminar evaluable',ok:amt<=source.available,value:money(source.available)},
    {label:'Margen después de reservas y obligaciones',ok:amt<=usable,value:money(usable)},
    {label:'Restricción por clasificador',ok:source.classifier!=='2.1.1',value:`${source.classifier} · ${source.classification}`},
    {label:'Prioridad del destino',ok:['Crítica','Alta'].includes(destination.priority),value:destination.priority},
    {label:'Validación OPP',ok:false,value:'Requerida antes de formalizar'},
    {label:'Registro oficial',ok:false,value:'La simulación no modifica SIAF-SP'}
  ]};
}

export async function getInvestments(){await wait();return {items:DATA.investments,updated:DATA.meta.investmentsUpdated};}
export async function getProcurements(){await wait();return {items:DATA.procurements,stages:DATA.procurementStages};}
export async function getExpedients(){await wait();return {items:DATA.expedients,updated:DATA.meta.sgduntUpdated};}
export async function getAssets(){await wait();return DATA.assets;}
export async function getProcesses(){await wait();return DATA.processes;}
export async function getNorms(){await wait();return DATA.norms;}

function tokenScore(query,text){
  const q=words(query).filter(x=>x.length>2),t=new Set(words(text)); if(!q.length)return 0;
  return q.reduce((a,w)=>a+(t.has(w)?2:[...t].some(x=>x.startsWith(w)||w.startsWith(x))?1:0),0)/q.length;
}
function bestUnit(query){
  const q=norm(query); let exact=DATA.orgUnits.find(u=>q.includes(norm(u.name))); if(exact)return exact;
  return DATA.orgUnits.map(u=>({u,s:tokenScore(query,u.name)})).sort((a,b)=>b.s-a.s)[0]?.s>=1?DATA.orgUnits.map(u=>({u,s:tokenScore(query,u.name)})).sort((a,b)=>b.s-a.s)[0].u:null;
}
function bestPerson(query,allowed=null){
  const pool=allowed||DATA.people;const ranked=pool.map(p=>({p,s:tokenScore(query,p.name)})).sort((a,b)=>b.s-a.s);return ranked[0]?.s>=1.25?ranked[0].p:null;
}
function bestCenter(query){
  const q=norm(query);const code=DATA.costCenters.find(c=>q.includes(norm(c.code)));if(code)return code;
  const ranked=DATA.costCenters.map(c=>({c,s:tokenScore(query,`${c.code} ${c.name}`)})).sort((a,b)=>b.s-a.s);return ranked[0]?.s>=1.2?ranked[0].c:null;
}
function extractAmount(q){
  const m=String(q).replace(/,/g,'.').match(/(?:S\/\.?\s*)?(\d+(?:\.\d+)?)\s*(MIL|MILLON|MILLONES|M)?/i);if(!m)return null;let v=Number(m[1]);const u=(m[2]||'').toUpperCase();if(u==='MIL')v/=1000;return v;
}
function dashboardBase(title,subtitle){return {title,subtitle,kpis:[],chart:null,table:null,explanation:'',recommendations:[]};}
function sourceCuts(){return [`Presupuesto ${DATA.meta.budgetUpdated}`,`Asistencia ${DATA.meta.attendanceUpdated}`,`SGDUNT ${DATA.meta.sgduntUpdated}`,`Inversiones ${DATA.meta.investmentsUpdated}`,`GdR ${DATA.meta.gdrUpdated}`];}
function action(label,route,filters={}){return {label,route,filters};}
function response(title,body,{metrics=[],recommendations=[],sources=sourceCuts(),action:act=null,dashboard=null,level='info'}={}){return {title,body,metrics,recommendations,sources,action:act,dashboard,level};}

function procedureExplanation(topic){
  const q=norm(topic);
  if(q.includes('MODIFIC')||q.includes('PRESUP')||q.includes('MOVER')||q.includes('REASIGN')) return 'La plataforma separa simulación, validación y registro oficial. Primero identifica el crédito, obligaciones, restricciones, fuente/rubro, clasificación y efecto sobre POI/inversiones; luego OPP valida el escenario y solo después corresponde el procedimiento formal y el registro en el aplicativo oficial. La IA no ejecuta por sí sola una modificación.';
  if(q.includes('CONTRAT')||q.includes('ABASTEC')) return 'La secuencia se muestra como necesidad → requerimiento → certificación → contratación → contrato u orden → ejecución → conformidad → devengado, porque cada hito genera condiciones y evidencias distintas. El sistema permite detectar en qué punto se detiene la cadena sin sustituir los registros oficiales.';
  if(q.includes('ASIST')||q.includes('TARDAN')) return 'La asistencia se organiza por jornada, marcación, incidencia y justificación. El jefe puede revisar el detalle diario de su equipo; las incidencias no se convierten automáticamente en sanciones ni en calificación de rendimiento.';
  if(q.includes('GDR')||q.includes('RENDIMIENTO')) return 'Las metas GdR se utilizan como productos y compromisos de seguimiento, no como equivalentes de toda la función del puesto. El sistema vincula meta, tarea y evidencia, pero la calificación sigue el procedimiento y actores del Subsistema de Gestión del Rendimiento.';
  if(q.includes('SGD')||q.includes('DOCUMENT')||q.includes('EXPEDIENT')) return 'SGDUNT conserva el registro formal que le corresponde. La plataforma añade ruta esperada, responsable, plazo, relación con proceso y alertas; si la ruta real difiere de la configurada, genera una alerta para revisión humana.';
  if(q.includes('INVERSION')) return 'El seguimiento de inversiones cruza avance físico, financiero, temporal, contractual, hitos y brecha. Una diferencia entre porcentajes es una señal de análisis, no una conclusión automática; debe explicarse con valorizaciones, contratos, cronograma y programación presupuestal.';
  return 'El procedimiento se modela como una secuencia de responsabilidades, reglas, evidencias y autorizaciones. La automatización se limita a tareas que no sustituyen la competencia ni el juicio de la autoridad responsable.';
}

export async function askAssistant({profileId,query,route='dashboard',context={}}){
  await wait(160); const profile=profileById(profileId),people=accessiblePeople(profile),q=String(query||''),nq=norm(q);
  if((nq.includes('LLEVAME')||nq.includes('LLEVAME')||nq.includes('IR A ESO')||nq.includes('MUESTRAME ESO'))&&context?.lastAction){
    return response('Navegación preparada','Puedo llevarlo directamente al punto analizado y conservar el filtro aplicado.',{action:context.lastAction,dashboard:context.lastDashboard||null,recommendations:['Abra el detalle y continúe preguntando desde ese contexto.']});
  }
  const person=bestPerson(q,people),unit=bestUnit(q),center=bestCenter(q),amount=extractAmount(q);
  if((nq.includes('POR QUE')||nq.includes('PORQUE')||nq.includes('PROCEDIMIENTO'))){
    const text=procedureExplanation(q+' '+route);
    const d=dashboardBase('Explicación del procedimiento','Secuencia, control y puntos de intervención humana');
    d.kpis=[{label:'Ámbito',value:unit?.name||route},{label:'Control',value:'Trazable'},{label:'Automatización',value:'Condicionada'},{label:'Decisión',value:'Humana'}];d.explanation=text;d.recommendations=['Abrir la normativa relacionada','Revisar el flujo y las evidencias exigidas'];
    return response('Por qué el procedimiento se modela así',text,{metrics:d.kpis,recommendations:d.recommendations,action:action('Ver flujo y reglas','procesos',{topic:route}),dashboard:d});
  }
  if(nq.includes('ASIST')||nq.includes('TARDAN')||nq.includes('INASIST')){
    const targetPeople=person?[person]:unit?unitPeople(unit.id,true).filter(p=>people.some(a=>a.id===p.id)):people;const rows=attendanceForPeople(targetPeople.map(x=>x.id),'2026-09'),sum=attendanceSummary(rows);
    const d=dashboardBase(person?`Asistencia · ${person.name}`:unit?`Asistencia · ${unit.name}`:'Asistencia del ámbito','Septiembre 2026 · jornada general 07:00–14:45');
    d.kpis=[{label:'Puntualidad',value:`${sum.punctuality}%`},{label:'Tardanzas',value:String(sum.Tardanza)},{label:'Inasistencias',value:String(sum.Inasistencia)},{label:'Minutos tarde',value:String(sum.lateMinutes)}];
    d.chart={type:'attendance',items:targetPeople.slice(0,12).map(p=>{const s=attendanceSummary(rows.filter(a=>a.personId===p.id));return {label:p.name,value:s.punctuality,late:s.Tardanza};})};
    d.explanation='El detalle diario permite abrir cada fecha y verificar hora de ingreso, salida e incidencia registrada. La asistencia se mantiene separada de la calificación automática del desempeño.';
    const act=action(person?'Abrir calendario del servidor':'Abrir módulo de asistencia','asistencia',{personId:person?.id||null,unitId:unit?.id||null,month:'2026-09'});
    return response('Asistencia y permanencia',d.explanation,{metrics:d.kpis,recommendations:['Revisar las tardanzas recurrentes','Abrir el calendario día por día','Cruzar con permisos antes de interpretar una incidencia'],action:act,dashboard:d});
  }
  if(nq.includes('META')||nq.includes('GDR')||nq.includes('TAREA')||nq.includes('RESPONSABIL')){
    const target=person||null;if(target){const open=target.tasks.filter(t=>t.status!=='En revisión');const d=dashboardBase(`Trabajo y metas · ${target.name}`,`${target.position} · ${target.unit}`);d.kpis=[{label:'Avance GdR',value:`${target.gdrProgress}%`},{label:'Metas',value:String(target.tasks.length)},{label:'Pendientes',value:String(open.length)},{label:'Puntualidad',value:`${target.attendanceSummary.punctuality}%`}];d.table={headers:['Meta / producto','Peso','Avance','Evidencia'],rows:target.tasks.map(t=>[t.title,`${t.weight||'—'}%`,`${t.progress}%`,t.evidence])};d.explanation='Las responsabilidades mostradas provienen de las metas y productos consignados en GdR; no se asume que representen el 100 % de las funciones del puesto.';return response(`Situación de ${target.name}`,d.explanation,{metrics:d.kpis,recommendations:['Abrir su mesa de trabajo','Revisar evidencia pendiente y plazo'],action:action('Abrir servidor','persona',{personId:target.id,tab:'resumen'}),dashboard:d});}
    const d=dashboardBase('Carga operativa del ámbito','Metas y productos de Gestión del Rendimiento');const tasks=people.flatMap(p=>p.tasks.map(t=>({...t,person:p.name})));d.kpis=[{label:'Servidores',value:String(people.length)},{label:'Metas',value:String(tasks.length)},{label:'Alta prioridad',value:String(tasks.filter(t=>t.priority==='Alta').length)},{label:'En revisión',value:String(tasks.filter(t=>t.status==='En revisión').length)}];d.table={headers:['Servidor','Meta / producto','Avance'],rows:tasks.slice(0,10).map(t=>[t.person,t.title,`${t.progress}%`])};d.explanation='El sistema puede bajar desde la carga agregada hasta cada servidor, meta, evidencia y fecha.';return response('Trabajo y metas del ámbito',d.explanation,{metrics:d.kpis,action:action('Abrir Gantt y tareas','gantt',{}),dashboard:d});
  }
  if(nq.includes('MOVER')||nq.includes('REASIGN')||nq.includes('MODIFIC')||nq.includes('QUE PASA SI')){
    const amt=amount||0.30;const candidates=DATA.budgetCandidates.filter(c=>candidateUsable(c)>0).sort((a,b)=>candidateUsable(b)-candidateUsable(a)).slice(0,4);const d=dashboardBase(`Escenario what-if · ${money(amt)}`,'Análisis previo, sin modificar registros oficiales');d.kpis=[{label:'Monto',value:money(amt)},{label:'Orígenes evaluables',value:String(candidates.length)},{label:'Créditos restringidos',value:String(DATA.budgetCandidates.filter(c=>c.classifier==='2.1.1').length)},{label:'Registro oficial',value:'Sin cambios'}];d.table={headers:['Origen','Clasificador','Margen evaluable','Riesgo'],rows:candidates.map(c=>[c.label,c.classifier,money(candidateUsable(c)),c.risk])};d.explanation=procedureExplanation('modificación presupuestaria');d.recommendations=['Simular cada origen contra una inversión priorizada','Revisar obligaciones y fuente/rubro','Solicitar validación de OPP antes de formalizar'];return response('Simulación de movimiento presupuestal',d.explanation,{metrics:d.kpis,recommendations:d.recommendations,action:action('Abrir simulador','presupuesto',{amount:amt}),dashboard:d,level:'warning'});
  }
  if(nq.includes('PRESUP')||nq.includes('PIM')||nq.includes('DEVENG')||nq.includes('EJECUCION')||center||unit){
    let rows;if(center)rows=[center];else if(unit)rows=unitBudget(unit).rows;else rows=visibleCostCenters(profile);const totals=aggregateBudget(rows),exec=totals.execution;const lows=[...rows].sort((a,b)=>a.execution-b.execution).slice(0,8);const title=center?`${center.code} · ${center.name}`:unit?unit.name:'Presupuesto del ámbito';const d=dashboardBase(`Ejecución presupuestal · ${title}`,`Corte ${DATA.meta.budgetUpdated}`);d.kpis=[{label:'PIA',value:money(totals.pia)},{label:'PIM',value:money(totals.pim)},{label:'Devengado',value:money(totals.accrued)},{label:'Ejecución',value:`${exec}%`}];d.chart={type:'bars',items:lows.map(c=>({label:c.code,value:c.execution,name:c.name}))};d.table={headers:['Centro de costo','PIM','Devengado','Ejecución','Riesgo'],rows:lows.map(c=>[`${c.code} ${c.name}`,money(c.pim),money(c.accrued),`${c.execution}%`,c.risk])};d.explanation='La ejecución se interpreta junto con certificaciones, compromisos, obligaciones proyectadas, contratación, POI e inversiones. Un saldo no ejecutado no se considera automáticamente disponible.';d.recommendations=['Revisar los centros con menor proyección de cierre','Cruzar saldos con requerimientos y contratos','Simular alternativas solo sobre montos potencialmente evaluables'];return response('Ejecución presupuestal',d.explanation,{metrics:d.kpis,recommendations:d.recommendations,action:action('Abrir presupuesto','presupuesto',{unitId:unit?.id||null,centerCode:center?.code||null}),dashboard:d,level:exec<65?'warning':'info'});
  }
  if(nq.includes('INVERSION')||nq.includes('PROYECTO')||nq.includes('FISIC')||nq.includes('FINANCI')){
    const invs=DATA.investments,high=invs.filter(i=>i.risk==='Alto'),gap=invs.reduce((a,i)=>a+num(i.gap),0);const d=dashboardBase('Cartera de inversiones','Avance físico, financiero, contractual y temporal');d.kpis=[{label:'Inversiones',value:String(invs.length)},{label:'Riesgo alto',value:String(high.length)},{label:'Brecha',value:money(gap)},{label:'Corte',value:DATA.meta.investmentsUpdated}];d.chart={type:'multi',items:invs.map(i=>({label:i.id,physical:i.physical,financial:i.financial,time:i.time}))};d.table={headers:['Inversión','Físico','Financiero','Temporal','Riesgo'],rows:invs.map(i=>[i.name,`${i.physical}%`,`${i.financial}%`,`${i.time}%`,i.risk])};d.explanation='Las desviaciones se usan como señal de análisis; deben explicarse con hitos, valorizaciones, cronograma y obligaciones.';return response('Seguimiento de inversiones',d.explanation,{metrics:d.kpis,recommendations:['Priorizar inversiones con riesgo alto','Revisar brechas antes de mover recursos'],action:action('Abrir inversiones','inversiones',{}),dashboard:d});
  }
  if(nq.includes('CONTRAT')||nq.includes('ABASTEC')||nq.includes('REQUER')){
    const items=DATA.procurements;const risk=items.filter(x=>x.risk!=='Bajo');const d=dashboardBase('Abastecimiento y contratación','Cadena desde la necesidad hasta el devengado');d.kpis=[{label:'Procesos visibles',value:String(items.length)},{label:'Con riesgo',value:String(risk.length)},{label:'Monto visible',value:money(items.reduce((a,x)=>a+num(x.amount),0))},{label:'Conformidades',value:String(DATA.procurementStages.find(x=>x.name==='Conformidad')?.count||0)}];d.table={headers:['Código','Objeto','Etapa','Riesgo'],rows:items.map(x=>[x.id,x.item,x.stage,x.risk])};d.explanation=procedureExplanation('abastecimiento contratación');return response('Cadena de abastecimiento',d.explanation,{metrics:d.kpis,recommendations:['Revisar procesos de riesgo alto','Identificar conformidades que bloquean devengado'],action:action('Abrir abastecimiento','abastecimiento',{}),dashboard:d});
  }
  if(nq.includes('EXPED')||nq.includes('SGD')||nq.includes('DOCUMENT')){
    const bad=DATA.expedients.filter(e=>!e.routeOk||e.days>=e.sla);const d=dashboardBase('Gestión documentaria','Ruta real, ruta esperada, plazo y responsable');d.kpis=[{label:'Expedientes',value:String(DATA.expedients.length)},{label:'Con alerta',value:String(bad.length)},{label:'Ruta inconsistente',value:String(DATA.expedients.filter(e=>!e.routeOk).length)},{label:'Corte',value:DATA.meta.sgduntUpdated}];d.table={headers:['Expediente','Asunto','Ubicación','Estado'],rows:DATA.expedients.map(e=>[e.id,e.subject,e.current,e.status])};d.explanation=procedureExplanation('SGDUNT documentos');return response('Seguimiento documentario',d.explanation,{metrics:d.kpis,recommendations:['Revisar rutas inconsistentes','Atender expedientes con plazo vencido'],action:action('Abrir SGDUNT','documentos',{}),dashboard:d});
  }
  const dash=dashboardBase('Panorama del ámbito',profile.scope);const people2=accessiblePeople(profile),centers=visibleCostCenters(profile),b=aggregateBudget(centers),att=attendanceSummary(attendanceForPeople(people2.map(p=>p.id),'2026-09'));dash.kpis=[{label:'Servidores',value:String(people2.length)},{label:'PIM visible',value:money(b.pim)},{label:'Ejecución',value:`${b.execution}%`},{label:'Puntualidad',value:`${att.punctuality}%`}];dash.explanation='Puedo cruzar personas, metas, asistencia, presupuesto, inversiones, expedientes, contrataciones y procesos dentro del ámbito autorizado.';dash.recommendations=['Pregunte por una unidad, persona o centro de costo','Pida un dashboard visual o una explicación del procedimiento'];return response('Análisis contextual',dash.explanation,{metrics:dash.kpis,recommendations:dash.recommendations,dashboard:dash});
}

export async function searchAll(query,profileId){
  await wait();const profile=profileById(profileId),q=String(query||'').trim();if(!q)return[];const out=[],people=accessiblePeople(profile),unitIds=new Set(accessibleUnitIds(profile));
  people.map(p=>({p,s:tokenScore(q,`${p.name} ${p.position} ${p.unit} ${p.tags.join(' ')} ${p.tasks.map(t=>t.title).join(' ')}`)})).filter(x=>x.s>.7).sort((a,b)=>b.s-a.s).slice(0,8).forEach(x=>out.push({type:'Servidor',title:x.p.name,subtitle:`${x.p.position} · ${x.p.unit}`,route:'persona',filters:{personId:x.p.id}}));
  DATA.orgUnits.filter(u=>unitIds.has(u.id)).map(u=>({u,s:tokenScore(q,`${u.name} ${u.responsibleName} ${u.topFunctions.join(' ')}`)})).filter(x=>x.s>.7).sort((a,b)=>b.s-a.s).slice(0,6).forEach(x=>out.push({type:'Organización',title:x.u.name,subtitle:`Responsable: ${x.u.responsibleName}`,route:'organizacion',filters:{unitId:x.u.id}}));
  visibleCostCenters(profile).map(c=>({c,s:tokenScore(q,`${c.code} ${c.name}`)})).filter(x=>x.s>.8).sort((a,b)=>b.s-a.s).slice(0,6).forEach(x=>out.push({type:'Centro de costo',title:`${x.c.code} · ${x.c.name}`,subtitle:`PIM ${money(x.c.pim)} · ejecución ${x.c.execution}%`,route:'presupuesto',filters:{centerCode:x.c.code}}));
  DATA.expedients.filter(e=>tokenScore(q,`${e.id} ${e.subject} ${e.origin} ${e.current}`)>.8).slice(0,5).forEach(e=>out.push({type:'Expediente',title:`Exp. ${e.id}`,subtitle:e.subject,route:'documentos',filters:{expedientId:e.id}}));
  return out.slice(0,18);
}

export {DATA,profileById,personById,unitById,childrenOf,descendantIds,ancestors,rootOf,attendanceSummary,unitBudget,aggregateBudget};
