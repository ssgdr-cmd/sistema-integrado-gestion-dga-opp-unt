import http from 'node:http';
import { URL } from 'node:url';
import {
  getBootstrap,getDashboard,getOrganization,getUnitDetail,getPersonDetail,getAttendance,getBudget,simulateBudget,
  getInvestments,getProcurements,getExpedients,getAssets,getProcesses,getNorms,askAssistant,searchAll
} from '../assets/js/api.js';
import { centerModel,recommendFunding,transferScenario,reportCatalog,personTemplates,procedureMap } from '../assets/js/model.js';

const PORT=Number(process.env.PORT||8787);
const send=(res,status,body)=>{res.writeHead(status,{
  'Content-Type':'application/json; charset=utf-8',
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'Content-Type, Authorization',
  'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
  'Cache-Control':'no-store'
});res.end(JSON.stringify(body));};
const readBody=req=>new Promise((resolve,reject)=>{let data='';req.on('data',c=>data+=c);req.on('end',()=>{try{resolve(data?JSON.parse(data):{})}catch(e){reject(e)}});req.on('error',reject)});

const server=http.createServer(async(req,res)=>{
  if(req.method==='OPTIONS') return send(res,204,{});
  try{
    const url=new URL(req.url,`http://${req.headers.host}`),path=url.pathname,profileId=url.searchParams.get('profileId')||'USR-ADMIN';
    if(path==='/api/v1/health') return send(res,200,{status:'ok',service:'sig-dga-opp-api-v4',timestamp:new Date().toISOString()});
    if(path==='/api/v1/bootstrap'&&req.method==='GET') return send(res,200,await getBootstrap(profileId));
    if(path==='/api/v1/dashboard'&&req.method==='GET') return send(res,200,await getDashboard(profileId));
    if(path==='/api/v1/organization'&&req.method==='GET') return send(res,200,await getOrganization(profileId));
    if(path==='/api/v1/unit'&&req.method==='GET') return send(res,200,await getUnitDetail(profileId,url.searchParams.get('unitId')));
    if(path==='/api/v1/person'&&req.method==='GET') return send(res,200,await getPersonDetail(profileId,url.searchParams.get('personId'),url.searchParams.get('month')||'2026-09'));
    if(path==='/api/v1/attendance'&&req.method==='GET') return send(res,200,await getAttendance(profileId,{unitId:url.searchParams.get('unitId')||null,personId:url.searchParams.get('personId')||null,month:url.searchParams.get('month')||'2026-09'}));
    if(path==='/api/v1/budget'&&req.method==='GET') return send(res,200,await getBudget(profileId));
    if(path==='/api/v1/cost-centers'&&req.method==='GET'){const b=await getBudget(profileId);return send(res,200,{items:b.rows,totals:b.totals,updated:b.updated});}
    if(path==='/api/v1/cost-center'&&req.method==='GET'){
      const code=url.searchParams.get('code');
      const b=await getBudget(profileId);
      if(!b.rows.some(x=>x.code===code)) return send(res,403,{error:'Centro de costo fuera del ámbito autorizado'});
      const model=centerModel(code);
      return model?send(res,200,model):send(res,404,{error:'Centro de costo no encontrado'});
    }
    if(path==='/api/v1/budget/recommend-funding'&&req.method==='POST'){
      const input=await readBody(req); const amount=Number(input.amount||0), targetCode=input.targetCode||null;
      const b=await getBudget(input.profileId||profileId), allowed=new Set(b.rows.map(x=>x.code));
      const items=recommendFunding(amount,targetCode).filter(x=>allowed.has(x.code));
      return send(res,200,{amount,targetCode,items,notice:'Ranking analítico sujeto a validación presupuestaria y procedimiento formal.'});
    }
    if(path==='/api/v1/budget/transfer-scenario'&&req.method==='POST'){
      const input=await readBody(req); const b=await getBudget(input.profileId||profileId), allowed=new Set(b.rows.map(x=>x.code));
      if(!allowed.has(input.sourceCode)||!allowed.has(input.destinationCode)) return send(res,403,{error:'Origen o destino fuera del ámbito autorizado'});
      const scenario=transferScenario(input.sourceCode,input.destinationCode,input.amount);
      return scenario?send(res,200,scenario):send(res,400,{error:'No se pudo construir el escenario'});
    }
    if(path==='/api/v1/reports'&&req.method==='GET') return send(res,200,{items:reportCatalog()});
    if(path==='/api/v1/templates'&&req.method==='GET'){
      const p=(await getBootstrap(profileId)).people.find(x=>x.id===url.searchParams.get('personId'));
      if(!p) return send(res,404,{error:'Servidor no encontrado o fuera de ámbito'});
      return send(res,200,{items:personTemplates(p)});
    }
    if(path==='/api/v1/procedure'&&req.method==='GET') return send(res,200,procedureMap(url.searchParams.get('topic')||'general'));
    if(path==='/api/v1/investments'&&req.method==='GET') return send(res,200,await getInvestments());
    if(path==='/api/v1/procurements'&&req.method==='GET') return send(res,200,await getProcurements());
    if(path==='/api/v1/expedients'&&req.method==='GET') return send(res,200,await getExpedients());
    if(path==='/api/v1/assets'&&req.method==='GET') return send(res,200,await getAssets());
    if(path==='/api/v1/processes'&&req.method==='GET') return send(res,200,await getProcesses());
    if(path==='/api/v1/norms'&&req.method==='GET') return send(res,200,await getNorms());
    if(path==='/api/v1/search'&&req.method==='GET') return send(res,200,await searchAll(url.searchParams.get('q')||'',profileId));
    if(path==='/api/v1/budget/simulate'&&req.method==='POST') return send(res,200,await simulateBudget(await readBody(req)));
    if(path==='/api/v1/assistant/query'&&req.method==='POST'){
      const input=await readBody(req);
      return send(res,200,await askAssistant({profileId:input.profileId||profileId,query:input.query||'',route:input.route||'dashboard',context:input.context||{}}));
    }
    return send(res,404,{error:'Endpoint no encontrado'});
  }catch(error){return send(res,400,{error:error.message||'Solicitud inválida'});}
});
server.listen(PORT,()=>console.log(`SIG DGA–OPP API v4 escuchando en http://localhost:${PORT}`));
