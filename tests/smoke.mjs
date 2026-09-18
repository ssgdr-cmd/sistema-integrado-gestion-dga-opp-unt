import assert from 'node:assert/strict';
import {
  DATA,getBootstrap,getDashboard,getOrganization,getUnitDetail,getPersonDetail,getAttendance,getBudget,
  simulateBudget,askAssistant,searchAll
} from '../assets/js/api.js';
import {centerModel,recommendFunding,transferScenario,personTemplates,procedureMap,reportCatalog,NORMATIVE_RULES} from '../assets/js/model.js';

assert.equal(DATA.costCenters.length,70,'Se esperan 70 centros de costo POI/CEPLAN');
assert.equal(DATA.orgUnits.length,33,'Se esperan 33 nodos orgánicos DGA–OPP');
assert.ok(DATA.people.length>=124,'Debe existir cobertura funcional basada en GdR DGA–OPP');
assert.ok(DATA.profiles.some(p=>p.role==='admin'));
assert.ok(DATA.profiles.some(p=>p.role==='director'));
assert.ok(DATA.profiles.some(p=>p.role==='office_head'));
assert.ok(DATA.profiles.some(p=>p.role==='unit_head'));
assert.ok(DATA.profiles.some(p=>p.role==='area_head'));
assert.ok(DATA.profiles.some(p=>p.role==='subarea_head'));
assert.ok(DATA.attendance.length>5000,'Debe existir detalle de asistencia por día');

const admin=await getBootstrap('USR-ADMIN');
assert.equal(admin.units.length,33);
assert.ok(admin.people.length>=124);
assert.equal(admin.costCenters.length,70);

const director=DATA.profiles.find(p=>p.role==='director');
const dirOrg=await getOrganization(director.id);
assert.equal(dirOrg.units.length,33,'Director puede recorrer DGA y OPP en la vista integral configurada');
assert.ok(dirOrg.people.some(p=>p.unit==='OFICINA DE PLANEAMIENTO Y PRESUPUESTO'));

const opp=DATA.profiles.find(p=>p.role==='office_head');
const oppOrg=await getOrganization(opp.id);
assert.ok(oppOrg.units.some(u=>/PRESUPUESTO/.test(u.name)));
assert.ok(oppOrg.units.some(u=>/PLANEAMIENTO/.test(u.name)));
assert.ok(oppOrg.units.some(u=>/MODERNIZACIÓN/.test(u.name)));
assert.ok(oppOrg.units.some(u=>/ESTADÍSTICA/.test(u.name)));
assert.ok(oppOrg.units.some(u=>/FORMULADORA/.test(u.name)));

const rhNode=DATA.orgUnits.find(u=>u.name==='UNIDAD DE RECURSOS HUMANOS');
assert.ok(rhNode?.responsibleId);
const rhProfile=DATA.profiles.find(p=>p.personId===rhNode.responsibleId);
const rhDetail=await getUnitDetail(rhProfile.id,rhNode.id);
assert.ok(rhDetail.children.length>=6);
assert.ok(rhDetail.people.length>20);

const victor=DATA.people.find(p=>p.name.toUpperCase().includes('AVALOS CRUZ VICTOR EDUARDO'));
assert.ok(victor);
const victorProfile=DATA.profiles.find(p=>p.personId===victor.id);
const vp=await getPersonDetail(victorProfile.id,victor.id,'2026-09');
assert.ok(vp.person.tasks.length>0);
assert.ok(vp.attendance.length>=18);
assert.ok(personTemplates(vp.person).length>=5,'La mesa de trabajo debe tener plantillas por función');

const att=await getAttendance(rhProfile.id,{unitId:rhNode.id,month:'2026-09'});
assert.ok(att.people.length>20);
assert.ok(att.summary.total>100);

const budget=await getBudget(director.id);
assert.equal(budget.rows.length,70);
const c=centerModel('1.10.06');
assert.ok(c && c.classifiers.length>=3 && c.activities.length>=3);
assert.ok(c.evaluable>=0);
const recommendations=recommendFunding(.30,'1.10.04');
assert.ok(recommendations.length>10);
assert.ok(recommendations[0].score>=recommendations.at(-1).score);
const transfer=transferScenario(recommendations[0].code,'1.10.04',Math.min(.10,recommendations[0].available));
assert.ok(transfer && transfer.procedure.length>=6 && Array.isArray(transfer.norms));

const sim=await simulateBudget({sourceId:'BC-01',destinationId:'INV-001',amount:.2});
assert.ok(sim.classification);

const ai1=await askAssistant({profileId:director.id,query:'¿Cómo va la ejecución presupuestal en Recursos Humanos?',route:'dashboard'});
assert.equal(ai1.title,'Ejecución presupuestal');
assert.ok(ai1.dashboard?.kpis?.length>=4);
const ai2=await askAssistant({profileId:director.id,query:'¿Qué pasa si muevo S/ 300 mil a una inversión crítica?',route:'presupuesto'});
assert.ok(ai2.dashboard);
const ai3=await askAssistant({profileId:director.id,query:'¿Por qué el procedimiento presupuestal se hace así?',route:'presupuesto'});
assert.ok(/simulación|procedimiento/i.test(ai3.body));

const results=await searchAll('Victor Eduardo Avalos',director.id);
assert.ok(results.some(r=>r.type==='Servidor'));
const dashboard=await getDashboard(director.id);
assert.ok(dashboard.people.length>=124);
assert.ok(dashboard.attendance.punctuality>0);

assert.ok(reportCatalog().length>=7);
assert.ok(procedureMap('presupuesto').steps.length>=7);
assert.ok(NORMATIVE_RULES.some(n=>/1440/.test(n.title)));
assert.ok(NORMATIVE_RULES.some(n=>/0007-2026/.test(n.title)));

console.log('Smoke tests v4: OK');
