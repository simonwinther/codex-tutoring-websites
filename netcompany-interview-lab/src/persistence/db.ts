import Dexie, { type Table } from 'dexie';
import type { LearningData } from '../domain/types';
import { learningSchema } from './schema';
export class LabDatabase extends Dexie { profiles!:Table<{id:string;data:LearningData},string>; constructor(name='netcompany-interview-lab'){super(name);this.version(1).stores({profiles:'id'});} }
export const db=new LabDatabase();
export async function readData(){const row=await db.profiles.get('main');return row?learningSchema.parse(row.data):undefined;}
export async function writeData(data:LearningData,expected:number){await db.transaction('rw',db.profiles,async()=>{const current=await db.profiles.get('main');if(current&&current.data.revision!==expected)throw new Error('Another tab changed this learning profile. Export this tab’s work, then reload to choose the saved version.');await db.profiles.put({id:'main',data});});}
export async function replaceData(data:LearningData){await db.profiles.put({id:'main',data});}
export const exportData=(data:LearningData)=>JSON.stringify({format:'netcompany-interview-lab',schemaVersion:1,exportedAt:new Date().toISOString(),data},null,2);
