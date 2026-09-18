import { DATA } from './data.js';

const N=v=>Number(v||0);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pct=(a,b)=>b?Math.round((a/b*100)*10)/10:0;
const hash=str=>{let h=2166136261;for(const ch of String(str)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return Math.abs(h>>>0)};
const money=v=>`S/ ${N(v).toLocaleString('es-PE',{minimumFractionDigits:1,maximumFractionDigits:1})} M`;
const moneySoles=v=>`S/ ${Math.round(N(v)).toLocaleString('es-PE')}`;
const centerByCode=code=>DATA.costCenters.find(c=>c.code===code);
const personById=id=>DATA.people.find(p=>p.id===id);
const unitById=id=>DATA.orgUnits.find(u=>u.id===id);
const childrenOf=id=>DATA.orgUnits.filter(u=>u.parentId===id);
const descendants=id=>{const out=[],q=[id];while(q.length){const x=q.shift();for(const c of childrenOf(x)){out.push(c.id);q.push(c.id)}}return out};

export const NORMATIVE_RULES=[
  {id:'PRES-1440',topic:'Presupuesto',title:'Decreto Legislativo N.° 1440',summary:'Marco del Sistema Nacional de Presupuesto Público.',effect:'La simulación no equivale a una modificación formal; se evalúan crédito, restricciones, obligaciones, nivel de modificación y competencia.'},
  {id:'PRES-DIR',topic:'Presupuesto',title:'Directiva N.° 0001-2024-EF/50.01, modificada por R.D. N.° 0004-2026-EF/50.01',summary:'Directiva para la Ejecución Presupuestaria y lineamientos 2026 aplicables.',effect:'Modela certificación, compromiso, previsiones, modificaciones y controles previos al registro oficial.'},
  {id:'PRES-CLAS',topic:'Presupuesto',title:'R.D. N.° 0021-2025-EF/50.01',summary:'Aprueba los clasificadores presupuestarios para el Año Fiscal 2026.',effect:'La simulación identifica fuente/rubro y clasificación económica; la estructura formal debe validarse con los clasificadores oficiales vigentes del ejercicio.'},
  {id:'PRES-INV',topic:'Inversiones',title:'R.D. N.° 0007-2026-EF/50.01',summary:'Lineamientos 2026 para modificaciones presupuestarias vinculadas con inversiones y programas.',effect:'Los movimientos sobre inversiones se analizan con reglas específicas antes de cualquier registro.'},
  {id:'CONT-32069',topic:'Contratación',title:'Ley N.° 32069 y Reglamento vigente',summary:'Marco vigente de contrataciones públicas.',effect:'La cadena se representa como necesidad → requerimiento → certificación → contratación → ejecución → conformidad → devengado.'},
  {id:'INV-1252',topic:'Inversiones',title:'Invierte.pe / D. Leg. N.° 1252 y normativa vigente',summary:'Programación Multianual y Gestión de Inversiones.',effect:'Se cruzan CUI, ejecución física, financiera, hitos, contratos y seguimiento de la UEI.'},
  {id:'DIG-1412',topic:'Gobierno digital',title:'Decreto Legislativo N.° 1412',summary:'Ley de Gobierno Digital.',effect:'La plataforma se diseña para interoperar y no duplicar innecesariamente sistemas oficiales.'},
  {id:'DATA-29733',topic:'Datos personales',title:'Ley N.° 29733 y reglamento vigente',summary:'Protección de datos personales.',effect:'La visibilidad jerárquica no implica acceso irrestricto a datos sensibles o reservados.'},
  {id:'GDR-068',topic:'Gestión del Rendimiento',title:'RPE N.° 068-2020-SERVIR-PE',summary:'Subsistema de Gestión del Rendimiento.',effect:'Las metas se usan como productos y compromisos de seguimiento; no sustituyen el procedimiento de evaluación.'}
];

function centerFunding(center){
  const name=center.name.toUpperCase(),code=center.code;
  if(/CEPUNT|CIDUNT|CICEC|POSGRADO|CENTRO DE IDIOMAS|SEGUNDA ESPECIAL/.test(name)) return {source:'Recursos Directamente Recaudados',rubro:'09'};
  if(/INVESTIGACIÓN|INNOVACIÓN|TRANSFERENCIA/.test(name)) return {source:'Recursos Ordinarios / RDR',rubro:'00 / 09'};
  if(code==='1.10.04') return {source:'Recursos Ordinarios / operaciones de inversión',rubro:'00'};
  return {source:'Recursos Ordinarios',rubro:'00'};
}

function classifierRows(center){
  const comp=center.composition||{};
  const pim=N(center.pim);
  return [
    {code:'2.1',name:'Personal y obligaciones sociales',share:N(comp.Personal),pim:pim*N(comp.Personal)/100,restriction:N(comp.Personal)>55?'Alta':'Media'},
    {code:'2.3',name:'Bienes y servicios',share:N(comp['Bienes y servicios']),pim:pim*N(comp['Bienes y servicios'])/100,restriction:'Media'},
    {code:'2.6',name:'Adquisición de activos no financieros / inversiones',share:N(comp.Inversiones),pim:pim*N(comp.Inversiones)/100,restriction:N(comp.Inversiones)>45?'Alta':'Media'},
    {code:'Otros',name:'Otros gastos',share:N(comp.Otros),pim:pim*N(comp.Otros)/100,restriction:'Variable'}
  ].filter(x=>x.share>0.1);
}


function budgetLineRows(center){
  const pim=N(center.pim), comp=center.composition||{}, seed=hash(center.code+'-lines');
  const personal=N(comp.Personal)/100, goods=N(comp['Bienes y servicios'])/100, investment=N(comp.Inversiones)/100, other=N(comp.Otros)/100;
  const isInvestment=center.code==='1.10.04'||investment>.35;
  const specs=[
    {code:'2.1.1',name:'Retribuciones y complementos en efectivo',share:personal*.78,restriction:'Restringido',rule:'Las anulaciones/habilitaciones requieren verificar las restricciones y excepciones del ejercicio fiscal.'},
    {code:'2.1.3',name:'Contribuciones a la seguridad social',share:personal*.16,restriction:'Alta',rule:'Vinculado con obligaciones de personal y aportes; no debe tratarse como saldo libre.'},
    {code:'2.1.9',name:'Otras obligaciones de personal',share:personal*.06,restriction:'Alta',rule:'Debe preservarse la cobertura de obligaciones laborales proyectadas.'},
    {code:'2.3.1',name:'Compra de bienes',share:goods*.34,restriction:'Media',rule:'Revisar CMN, requerimientos, certificaciones, órdenes y necesidades críticas.'},
    {code:'2.3.2',name:'Contratación de servicios',share:goods*.66,restriction:'Media',rule:'Revisar contratos, servicios periódicos, conformidades y previsiones antes de anular.'},
    {code:'2.6.2',name:'Construcción de edificios y estructuras',share:investment*(isInvestment?.48:.18),restriction:'Alta',rule:'Si financia inversiones, aplicar reglas de inversión, contrato, valorizaciones y lineamientos de modificación vigentes.'},
    {code:'2.6.3',name:'Adquisición de vehículos, maquinaria y otros',share:investment*(isInvestment?.32:.52),restriction:'Alta',rule:'Cruzar con inversión/IOARR, proceso contractual y programación física-financiera.'},
    {code:'2.6.8',name:'Otros activos',share:investment*(isInvestment?.20:.30),restriction:'Media',rule:'Verificar finalidad, programación y obligaciones asociadas.'},
    {code:'2.5',name:'Otros gastos',share:other,restriction:'Variable',rule:'Revisar la específica, finalidad y restricción aplicable antes de considerar una modificación.'}
  ].filter(x=>x.share>.002);
  const rateCenter=pct(center.accrued,center.pim)/100;
  return specs.map((x,i)=>{
    const lpim=Math.max(0,pim*x.share);
    const variation=((seed>>(i%16))%9-4)/100;
    const exec=clamp(rateCenter+variation,.10,.98);
    const accrued=lpim*exec;
    const committed=Math.min(lpim,accrued+lpim*(.08+((seed+i)%5)/100));
    const certified=Math.min(lpim,committed+lpim*(.05+((seed+i*3)%4)/100));
    const projected=Math.min(lpim,Math.max(committed,accrued+lpim*(.10+((seed+i*7)%9)/100)));
    const gross=Math.max(0,lpim-projected);
    let movableFactor=x.restriction==='Restringido'?0:x.restriction==='Alta'?.12:x.restriction==='Media'?.38:.28;
    if(x.code==='2.3.2'&&center.risk==='Bajo')movableFactor=.25;
    const evaluable=Math.max(0,gross*movableFactor-lpim*.005);
    return {...x,pim:lpim,certified,committed,accrued,projected,execution:pct(accrued,lpim),gross,evaluable};
  });
}

function centerRestrictionFactor(center){
  const comp=center.composition||{};
  if(center.code==='1.10.06'||N(comp.Personal)>65) return .08;
  if(center.code==='1.10.04'||N(comp.Inversiones)>55) return .28;
  if(center.risk==='Alto') return .35;
  if(center.risk==='Medio') return .52;
  return .72;
}

export function centerModel(code){
  const center=centerByCode(code);if(!center)return null;
  const funding=centerFunding(center),margin=Math.max(0,N(center.pim)-N(center.projected));
  const factor=centerRestrictionFactor(center),reserve=N(center.pim)*(center.risk==='Alto'?.035:center.risk==='Medio'?.022:.015);
  const evaluable=Math.max(0,margin*factor-reserve);
  const apparent=Math.max(0,N(center.pim)-N(center.accrued));
  const obligation=Math.max(0,N(center.projected)-N(center.accrued));
  const seed=hash(center.code);
  const monthly=[];
  const final=N(center.execution);
  const weights=[.06,.12,.19,.28,.38,.49,.60,.73,.86,1];
  ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Proy.'].forEach((m,i)=>monthly.push({m,value:Math.round((i===9?Math.max(final,pct(center.projected,center.pim)):final*weights[i])*10)/10}));
  const poiBase=[
    `Gestionar actividades operativas de ${center.name}`,
    `Atender requerimientos y productos del centro de costo ${center.code}`,
    `Realizar seguimiento físico y financiero de las actividades programadas`,
    `Consolidar evidencias y reportes para el cumplimiento del POI`
  ];
  const activities=poiBase.map((name,i)=>({code:`AOI0000900${String((seed+i)%90000).padStart(5,'0')}`,name,physical:clamp(Math.round(final+(i-1.5)*6),28,98),financial:clamp(Math.round(final+(i%2?5:-4)),20,99),status:i===2&&center.risk==='Alto'?'En riesgo':i===1?'En seguimiento':'En curso'}));
  const restrictions=[];
  if(center.code==='1.10.06'||N(center.composition?.Personal)>60)restrictions.push('Alta concentración en gasto de personal: no tratar el saldo aparente como crédito libre.');
  if(N(center.composition?.Inversiones)>45)restrictions.push('Predominio de gasto de capital/inversiones: aplicar reglas específicas antes de anular o habilitar.');
  if(center.risk==='Alto')restrictions.push('La baja ejecución obliga a revisar primero contratos, cronograma, POI y obligaciones pendientes.');
  restrictions.push('La modificación requiere validación de la Unidad de Presupuesto y el procedimiento formal que corresponda.');
  const budgetLines=budgetLineRows(center);
  return {...center,...funding,apparent,obligation,margin,evaluable,restrictionFactor:factor,classifiers:classifierRows(center),budgetLines,monthly,activities,restrictions};
}

export function recommendFunding(amount,targetCode=null){
  const amt=Math.max(0,N(amount));
  const target=targetCode?centerModel(targetCode):null;
  const targetFunding=target?.source||null;
  return DATA.costCenters.map(c=>centerModel(c.code)).filter(Boolean).filter(c=>c.code!==targetCode&&c.evaluable>0.015).map(c=>{
    const compatibility=!targetFunding||targetFunding===c.source?1:(c.source.includes('Recursos Ordinarios')&&String(targetFunding).includes('Recursos Ordinarios')?.85:.55);
    const coverage=Math.min(1,c.evaluable/Math.max(amt,.001));
    const riskFactor=c.risk==='Bajo'?1:c.risk==='Medio'?.72:.42;
    const line=[...(c.budgetLines||[])].filter(x=>x.evaluable>0).sort((a,b)=>b.evaluable-a.evaluable)[0]||null;
    const lineAvailable=line?line.evaluable:c.evaluable;
    const score=Math.round((coverage*.48+riskFactor*.27+compatibility*.25)*100);
    const impact=c.evaluable>=amt?'Puede cubrir el monto solicitado en el escenario de trabajo.':`Cubriría aproximadamente ${Math.round(c.evaluable/Math.max(amt,.001)*100)}% del requerimiento.`;
    return {code:c.code,name:c.name,available:c.evaluable,score,risk:c.risk,source:c.source,rubro:c.rubro,impact,projected:c.projected,pim:c.pim,execution:c.execution,lineCode:line?.code||null,lineName:line?.name||null,lineAvailable};
  }).sort((a,b)=>b.score-a.score||b.available-a.available);
}

export function transferScenario(sourceCode,destinationCode,amount){
  const source=centerModel(sourceCode),dest=centerModel(destinationCode),amt=Math.max(0,N(amount));
  if(!source||!dest||!amt) return null;
  const viable=amt<=source.evaluable && source.code!==dest.code;
  const sourceAfterPim=Math.max(0,source.pim-amt),destAfterPim=dest.pim+amt;
  const sourceProjectedExec=pct(source.projected,sourceAfterPim),destProjectedExec=pct(dest.projected+Math.min(amt,Math.max(0,dest.pim-dest.projected)+amt*.75),destAfterPim);
  const flags=[];
  if(source.code===dest.code)flags.push('El origen y el destino no pueden ser el mismo centro de costo.');
  if(amt>source.evaluable)flags.push(`El monto excede el margen potencialmente evaluable (${money(source.evaluable)}).`);
  if(source.source!==dest.source)flags.push('La fuente/rubro del origen y destino debe revisarse antes de considerar el escenario compatible.');
  if(source.code==='1.10.06'||source.composition?.Personal>60)flags.push('El origen concentra gasto de personal y presenta restricciones reforzadas.');
  const affectedPoi=source.activities.filter(a=>a.status!=='En curso'||a.financial<70).slice(0,3);
  const sourceLine=[...(source.budgetLines||[])].filter(x=>x.evaluable>0).sort((a,b)=>b.evaluable-a.evaluable)[0]||null;
  const destinationLine=[...(dest.budgetLines||[])].sort((a,b)=>b.pim-a.pim)[0]||null;
  return {source,dest,sourceLine,destinationLine,amount:amt,viable,classification:viable?(flags.length?'VIABLE CONDICIONADO':'POTENCIALMENTE VIABLE'):'NO VIABLE',flags,sourceBefore:{pim:source.pim,projected:source.projected,execution:pct(source.projected,source.pim)},sourceAfter:{pim:sourceAfterPim,projected:source.projected,execution:sourceProjectedExec},destBefore:{pim:dest.pim,projected:dest.projected,execution:pct(dest.projected,dest.pim)},destAfter:{pim:destAfterPim,projected:dest.projected+amt*.75,execution:destProjectedExec},affectedPoi,procedure:[
    'Definir el objetivo y el monto del escenario sin alterar el registro oficial.',
    'Verificar crédito, fuente/rubro, clasificación económica, compromisos, certificaciones y obligaciones futuras.',
    'Evaluar impacto sobre POI, contrataciones, planillas, inversiones y metas físicas del origen.',
    'Validar técnicamente con la Unidad de Presupuesto y, cuando corresponda, con las unidades competentes en inversiones/planeamiento.',
    'Sustentar y tramitar la modificación conforme al nivel y procedimiento aplicable.',
    'Registrar la modificación en el aplicativo oficial únicamente después de la aprobación correspondiente.',
    'La vista centro de costo es una capa gerencial: la nota modificatoria formal se efectúa sobre las estructuras presupuestarias y clasificadores que correspondan, no por el solo hecho de mover un monto entre centros de costo.'
  ],norms:NORMATIVE_RULES.filter(n=>['Presupuesto','Inversiones'].includes(n.topic))};
}

export function personTemplates(person){
  const tags=(person?.tags||[]).join(' ').toUpperCase();
  const base=[
    {id:'informe',name:'Informe técnico',icon:'▤',subject:'Informe sobre [asunto]',body:'Tengo el agrado de dirigirme a usted para informar lo siguiente:\n\nI. ANTECEDENTES\n[Describa los antecedentes verificables.]\n\nII. ANÁLISIS\n[Desarrolle el análisis técnico y normativo.]\n\nIII. CONCLUSIONES\n[Consigne las conclusiones.]\n\nIV. RECOMENDACIONES\n[Consigne las acciones propuestas.]'},
    {id:'oficio',name:'Oficio',icon:'✉',subject:'Remisión de información sobre [asunto]',body:'Es grato dirigirme a usted para saludarlo cordialmente y, a la vez, comunicar/remitir lo siguiente:\n\n[Contenido principal.]\n\nSin otro particular, hago propicia la oportunidad para expresarle los sentimientos de mi especial consideración.'},
    {id:'memorando',name:'Memorando',icon:'▧',subject:'Disposición / coordinación sobre [asunto]',body:'Por medio del presente, se comunica/disponen las acciones siguientes:\n\n[Acción requerida.]\n\nSírvase adoptar las medidas correspondientes dentro del plazo señalado.'},
    {id:'proveido',name:'Proveído',icon:'→',subject:'Derivación para atención',body:'Pase a [unidad/área] para conocimiento, evaluación y atención dentro del ámbito de sus competencias, conforme a la normativa aplicable.'},
    {id:'reporte',name:'Reporte de seguimiento',icon:'▥',subject:'Reporte de seguimiento de [producto/meta]',body:'PERIODO: [periodo]\nRESPONSABLE: [servidor]\nPRODUCTO / META: [producto]\n\n1. AVANCE\n[Detalle.]\n\n2. EVIDENCIAS\n[Relación.]\n\n3. INCIDENCIAS / RIESGOS\n[Detalle.]\n\n4. ACCIONES SIGUIENTES\n[Detalle.]'}
  ];
  if(/PRESUPUEST|CONTAB|TESOR/.test(tags)) base.push({id:'informe-presupuestal',name:'Informe presupuestal',icon:'₴',subject:'Evaluación presupuestaria de [solicitud]',body:'I. OBJETO\nEvaluar la solicitud presupuestaria vinculada a [asunto].\n\nII. SITUACIÓN PRESUPUESTAL\nPIA: [ ]\nPIM: [ ]\nCertificación: [ ]\nCompromiso: [ ]\nDevengado: [ ]\n\nIII. ANÁLISIS\n[Consistencia con clasificadores, fuente/rubro, POI y obligaciones.]\n\nIV. CONCLUSIÓN\n[Resultado de la evaluación.]'});
  if(/ABASTEC|CONTRAT|ALMAC|PATRIMON/.test(tags)) base.push({id:'informe-logistico',name:'Informe logístico',icon:'▣',subject:'Evaluación de requerimiento / contratación',body:'I. REQUERIMIENTO\n[Descripción.]\n\nII. PROGRAMACIÓN / DISPONIBILIDAD\n[CMN/PAC/certificación según corresponda.]\n\nIII. ESTADO DEL PROCEDIMIENTO\n[Detalle.]\n\nIV. RIESGOS Y ACCIONES\n[Detalle.]'});
  if(/INVERSION/.test(tags)) base.push({id:'informe-inversion',name:'Informe de inversión',icon:'◇',subject:'Seguimiento físico-financiero de inversión',body:'CUI: [ ]\nINVERSIÓN: [ ]\n\n1. AVANCE FÍSICO\n[ ]\n2. AVANCE FINANCIERO\n[ ]\n3. HITOS / CONTRATO\n[ ]\n4. RIESGOS\n[ ]\n5. RECOMENDACIONES\n[ ]'});
  return base;
}

export function procedureMap(topic='general'){
  const q=String(topic).toUpperCase();
  if(/PRESUP|MODIFIC|MOVER|REASIGN/.test(q)) return {title:'Modificación presupuestaria',steps:['Necesidad / prioridad','Simulación what-if','Validación de crédito y restricciones','Impacto POI / inversiones / obligaciones','Opinión técnica y sustento','Aprobación competente','Registro en aplicativo oficial','Seguimiento posterior'],norms:NORMATIVE_RULES.filter(n=>n.topic==='Presupuesto'||n.topic==='Inversiones')};
  if(/CONTRAT|ABASTEC/.test(q)) return {title:'Cadena de abastecimiento y contratación',steps:['Necesidad','Programación / CMN','Requerimiento','Certificación','Estrategia / procedimiento','Contrato u orden','Ejecución','Conformidad','Devengado / pago','Cierre'],norms:NORMATIVE_RULES.filter(n=>n.topic==='Contratación')};
  if(/DOCUMENT|SGD|FIRMA/.test(q)) return {title:'Documento y firma',steps:['Elaboración','Revisión técnica','Observación o conformidad','Aprobación','Firma digital cuando corresponda','Registro / derivación en SGDUNT','Seguimiento de ruta','Archivo / evidencia'],norms:NORMATIVE_RULES.filter(n=>n.topic==='Gobierno digital'||n.topic==='Datos personales')};
  return {title:'Flujo institucional',steps:['Ingreso / necesidad','Asignación','Ejecución','Revisión','Aprobación','Evidencia','Seguimiento'],norms:NORMATIVE_RULES};
}

export function reportCatalog(){return [
  {id:'ejecutivo',name:'Reporte ejecutivo DGA–OPP',desc:'Presupuesto, alertas, proyectos, tareas y procesos.'},
  {id:'presupuesto',name:'Ejecución presupuestal por centro de costo',desc:'PIA, PIM, certificación, compromiso, devengado, pago y proyección.'},
  {id:'asistencia',name:'Asistencia y permanencia',desc:'Puntualidad, tardanzas, inasistencias y detalle diario.'},
  {id:'gdr',name:'Seguimiento de metas GdR',desc:'Metas, avance, peso, evidencia, plazo y responsable.'},
  {id:'inversiones',name:'Seguimiento de inversiones',desc:'Físico, financiero, temporal, contractual, brecha e hitos.'},
  {id:'contrataciones',name:'Contrataciones y requerimientos',desc:'Objeto, etapa, monto, riesgo y relación presupuestal.'},
  {id:'documentos',name:'Documentos y expedientes',desc:'Estado, ruta, responsable, plazo y alertas.'}
]}

export {DATA,money,moneySoles,centerByCode,personById,unitById,childrenOf,descendants};
