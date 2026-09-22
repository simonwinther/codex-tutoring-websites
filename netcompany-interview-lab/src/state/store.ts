import { create } from 'zustand';
import type { LearningData, Document, CaseAttempt } from '../domain/types';
import { CONTENT_VERSION } from '../content/modules';
import { cases } from '../content/cases';
import { readData, writeData, replaceData } from '../persistence/db';
import { uid } from '../domain/model';
export const emptyData=():LearningData=>({schemaVersion:1,contentVersion:CONTENT_VERSION,revision:0,updatedAt:new Date().toISOString(),completed:[],attempts:[],documents:{},checkpoints:{},cases:{},interviews:{},notes:{},resume:'/diagnostic',diagnosticIndex:0,diagnosticDone:false,path:'deep',exposed:[]});
interface Store {data:LearningData;ready:boolean;status:'loading'|'saved'|'saving'|'error';error:string;mutate:(fn:(d:LearningData)=>void)=>void;load:()=>Promise<void>;retry:()=>void;replace:(d:LearningData)=>Promise<void>;doc:(id:string,doc:Document)=>void;undo:(id:string)=>void;redo:(id:string)=>void;historyTick:number;}
const history=new Map<string,{past:Document[];future:Document[]}>();let timer:ReturnType<typeof setTimeout>|undefined;let savedRevision=0;let chain=Promise.resolve();let blocked=false;
export const useLab=create<Store>((set,get)=>({data:emptyData(),ready:false,status:'loading',error:'',historyTick:0,
load:async()=>{try{const data=await readData();savedRevision=data?.revision??0;set({data:data??emptyData(),ready:true,status:'saved'});}catch(e){blocked=true;set({ready:true,status:'error',error:`Local storage could not be opened. Your work remains in memory; export it before leaving. ${String(e)}`});}},
mutate:fn=>{const d=structuredClone(get().data);fn(d);d.revision++;d.updatedAt=new Date().toISOString();set({data:d,status:blocked?'error':'saving'});if(timer)clearTimeout(timer);if(!blocked)timer=setTimeout(()=>void flush(),350);},
retry:()=>{blocked=false;set({status:'saving',error:''});void flush();},
replace:async d=>{if(timer)clearTimeout(timer);await chain;const next={...d,revision:get().data.revision+1,updatedAt:new Date().toISOString()};await replaceData(next);savedRevision=next.revision;blocked=false;history.clear();set({data:next,status:'saved',error:'',historyTick:get().historyTick+1});},
doc:(id,doc)=>{const prior=get().data.documents[id];if(prior&&JSON.stringify(prior)===JSON.stringify(doc))return;if(prior){const h=history.get(id)??{past:[],future:[]};h.past=[...h.past.slice(-99),structuredClone(prior)];h.future=[];history.set(id,h);}get().mutate(d=>{d.documents[id]=doc});set({historyTick:get().historyTick+1});},
undo:id=>{const h=history.get(id);const prior=h?.past.pop();if(!h||!prior)return;h.future.push(structuredClone(get().data.documents[id]));get().mutate(d=>{d.documents[id]=prior});set({historyTick:get().historyTick+1});},
redo:id=>{const h=history.get(id);const next=h?.future.pop();if(!h||!next)return;h.past.push(structuredClone(get().data.documents[id]));get().mutate(d=>{d.documents[id]=next});set({historyTick:get().historyTick+1});}
}));
export function canUndo(id:string){return !!history.get(id)?.past.length;}
export function canRedo(id:string){return !!history.get(id)?.future.length;}
export function flush(){chain=chain.then(async()=>{if(blocked)return;const data=structuredClone(useLab.getState().data);if(data.revision===savedRevision)return;try{await writeData(data,savedRevision);savedRevision=data.revision;if(useLab.getState().data.revision===data.revision)useLab.setState({status:'saved',error:''});else void flush();}catch(e){blocked=true;useLab.setState({status:'error',error:`Could not save locally. Export your work before leaving. ${String(e)}`});}});return chain;}
export function createCase(caseId:string,mode:'guided'|'independent'):string{const definition=cases.find(c=>c.id===caseId)!;const id=uid();const c:CaseAttempt={id,caseId,title:definition.name,mode,revision:1,requirements:definition.requirements.map((text,i)=>({id:`R${i+1}`,text,category:'fact',priority:'Must',revision:1})),traces:[],notes:{},delivery:definition.tasks.map(t=>t.id),deferred:[],deadline:6,changed:false,ended:false,referenceSeen:false,checks:[]};useLab.getState().mutate(d=>{d.cases[id]=c;d.resume=`/cases/${id}/Goal`});return id;}
export function changeRequirement(id:string){useLab.getState().mutate(d=>{const c=d.cases[id];if(c.changed)return;c.changed=true;c.revision++;for(const r of c.requirements)r.revision=c.revision;c.requirements.push({id:'R-change',text:cases.find(x=>x.id===c.caseId)!.change,category:'constraint',priority:'Must',revision:c.revision});});}
export function referenceLocked(caseId?:string){return Object.values(useLab.getState().data.cases).some(c=>c.mode==='independent'&&!c.ended&&(!caseId||c.caseId===caseId));}
export function download(name:string,text:string){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
