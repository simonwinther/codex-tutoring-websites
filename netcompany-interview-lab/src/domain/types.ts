export type GradeKind = 'objective' | 'scenario' | 'rubric';
export type ItemType = 'choice' | 'multi' | 'order' | 'match' | 'explain' | 'speak';
export interface Option { id: string; text: string; feedback: string }
export interface Exercise { id: string; module: string; title: string; type: ItemType; grade: GradeKind; prompt: string; assumptions?: string; options: Option[]; answer: string[]; hints: string[]; explanation: string; criteria?: string[]; pairs?: string[] }
export interface Lesson { title: string; paragraphs: string[]; example: string; tryIt: string }
export interface Module { id: string; title: string; short: string; minutes: number; prerequisites: string[]; outcome: string; lessons: Lesson[]; misconceptions: string[]; danish: string; lab: string; sources: string[] }
export interface Attempt { id: string; exerciseId: string; contentVersion: string; response: string[]; text: string; grade: GradeKind; correct: boolean | null; criteria: string[]; confidence: number; hints: number; at: string; review: boolean; reviewedAt?: string }
export interface Attribute { id: string; name: string; type: string; key: boolean; nullable: boolean; unique: boolean }
export type Multiplicity = '0..1' | '1' | '0..*' | '1..*';
export interface Entity { id: string; name: string; concept: string; attributes: Attribute[]; x: number; y: number }
export interface Relationship { id: string; a: string; b: string; atA: Multiplicity; atB: Multiplicity; label: string }
export interface ModelDoc { kind: 'model'; entities: Entity[]; relationships: Relationship[]; assumptions: string; notation: 'uml' | 'er'; submitted: boolean }
export interface WireComponent { id: string; type: string; label: string; span: number; required: boolean; target: string; state: string }
export interface WireScreen { id: string; name: string; components: WireComponent[] }
export interface WireDoc { kind: 'wire'; screens: WireScreen[]; rationale: string; checks: string[] }
export interface ArchComponent { id: string; name: string; role: string; x: number; y: number }
export interface ArchDoc { kind: 'architecture'; components: ArchComponent[]; connections: {id:string;from:string;to:string}[]; rationale: string; scenario: string }
export type Document = ModelDoc | WireDoc | ArchDoc;
export interface Checkpoint { id: string; title: string; at: string; doc: Document }
export interface Requirement { id: string; text: string; category: 'fact' | 'assumption' | 'constraint' | 'question'; priority: string; revision: number }
export interface Trace { id: string; requirement: string; type: string; artifact: string; note: string; reviewedRevision: number }
export interface CaseAttempt { id: string; caseId: string; title: string; mode: 'guided' | 'independent'; revision: number; requirements: Requirement[]; traces: Trace[]; notes: Record<string,string>; delivery: string[]; deferred: string[]; deadline: number; changed: boolean; ended: boolean; referenceSeen: boolean; checks: string[] }
export interface InterviewTurn { beat: number; choice: number; response: string; feedback: string; helpful: boolean }
export interface InterviewAttempt { id: string; caseAttemptId: string; beat: number; turns: InterviewTurn[]; done: boolean; assisted: boolean; summary: string; selfReview: string[]; startedAt: string }
export interface LearningData { schemaVersion: 1; contentVersion: string; revision: number; updatedAt: string; completed: string[]; attempts: Attempt[]; documents: Record<string,Document>; checkpoints: Record<string,Checkpoint[]>; cases: Record<string,CaseAttempt>; interviews: Record<string,InterviewAttempt>; notes: Record<string,string>; resume: string; diagnosticIndex: number; diagnosticDone: boolean; path: string; exposed: string[] }
export interface Finding { id: string; kind: GradeKind; ok: boolean; title: string; why: string; hint: string }
