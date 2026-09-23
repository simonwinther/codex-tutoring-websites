"""Structural provenance validation; does not claim to automatically verify scientific truth."""
import hashlib,json,pathlib,struct
ROOT=pathlib.Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/'data'/f'{name}.json').read_text())
papers=read('papers');figures=read('figures');concepts=read('concepts');inventory=read('inventory');relationships=read('relationships')
ids={p['id'] for p in papers}; inv={p['id']:p for p in inventory}; errors=[]; sources=0
assert len(ids)==len(papers),'Duplicate paper IDs'
def require(ok,message):
 if not ok: errors.append(message)
def references(value,paper,context):
 global sources
 if isinstance(value,dict):
  if 'source' in value:
   s=value['source'];sources+=1;require(isinstance(s.get('page'),int) and 1<=s['page']<=inv[paper]['pages'],f'{context}: invalid source page {s}');require(bool(s.get('label')),f'{context}: missing source label')
  for k,v in value.items():references(v,paper,f'{context}.{k}')
 elif isinstance(value,list):
  for i,v in enumerate(value):references(v,paper,f'{context}[{i}]')
for p in papers:
 id=p['id'];require(id in inv,f'Missing inventory entry: {id}');references(p,id,id)
 require(len(p['questions'])==8,f'{id}: expected 8 questions')
 require([sum(q['level']==k for q in p['questions']) for k in ['Basic','Method','Reasoning']]==[3,3,2],f'{id}: question-level counts')
 for key in ['problem','core','training','inference','novelty','results','limitations','stages']:require(bool(p.get(key)),f'{id}: missing {key}')
 fs=[f for f in figures if f['paper']==id];require(2<=len(fs)<=4,f'{id}: expected 2–4 visuals');require(sum(f['main'] for f in fs)==1,f'{id}: exactly one main visual required')
 for f in fs:
  require(f['sourcePdf']==p['filename'],f'{id}: source filename mismatch');require(1<=f['page']<=inv[id]['pages'],f'{id}: figure page invalid');require(f['sourceHash']==inv[id]['sha256'],f'{id}: stale crop source')
  image=ROOT/'public'/f['file'];vector=ROOT/'public'/f['vector'];require(image.exists() and vector.exists(),f'{id}: missing crop assets')
  if image.exists():
   data=image.read_bytes();require(data[:8]==b'\x89PNG\r\n\x1a\n',f'{image}: PNG signature');w,h=struct.unpack('>II',data[16:24]);bounds=f['bounds'];ratio=(bounds[2]-bounds[0])/(bounds[3]-bounds[1]);require(w>=850,f'{image}: insufficient resolution');require(abs(w/h-ratio)<.02,f'{image}: changed aspect ratio')
 for r in p['results']:
  require(isinstance(r['before'],(int,float)) and isinstance(r['after'],(int,float)),f'{id}: nonnumeric result')
  require(r['direction'] in ['up','down'] and bool(r['dataset']) and bool(r['baseline']),f'{id}: incomplete result context')
for i in inventory:
 path=ROOT/'public'/i['pdf'];require(path.exists(),f'Missing PDF {path}')
 if path.exists():require(hashlib.sha256(path.read_bytes()).hexdigest()==i['sha256'],f'{path}: source copy changed')
 require(i['curated']==(i['id'] in ids),f'{i["id"]}: discovery and curation disagree')
for c in concepts:
 require(bool(c['uses']),f'{c["id"]}: no paper uses')
 for u in c['uses']:require(u['paper'] in ids,f'{c["id"]}: unknown paper');references(u,u['paper'],c['id'])
for edge in relationships:
 require(edge['a'] in ids and edge['b'] in ids,'Unknown relationship endpoint');require(len(edge['sources'])==2,'Relationship needs evidence from both papers')
 for s in edge['sources']:require(1<=s['page']<=inv[s['paper']]['pages'],'Relationship page invalid')
if errors:raise SystemExit('\n'.join(errors))
print(f'Validated {len(papers)} reviewed papers / {len(inventory)} discovered PDFs, {len(figures)} high-resolution crops, {len(concepts)} concepts, {len(relationships)} sourced relationships, and {sources} source references.')
print('Semantic verification is a human/editorial task. See SOURCE_REVIEW.md for the recorded scope and qualifications.')
