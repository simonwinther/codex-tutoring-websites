"""Discover source PDFs; extract text, inventory, and reviewed high-resolution crops.
Run from any directory: python scripts/extract.py [--source PATH] [--text-only]
Bounds are PDF points, top-left origin. Physical PDF pages are 1-indexed.
"""
import argparse, hashlib, json, pathlib, shutil
import pymupdf as fitz
ROOT = pathlib.Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser(); p.add_argument('--source', type=pathlib.Path, default=ROOT.parent/'ECCV26Papers'); p.add_argument('--text-only', action='store_true'); args=p.parse_args()
manifest=json.loads((ROOT/'data/figure-crops.json').read_text()) if (ROOT/'data/figure-crops.json').exists() else []
inventory=[]; figures=[]
for source in sorted(f for f in args.source.rglob('*') if f.is_file() and f.suffix.lower()=='.pdf'):
    doc=fitz.open(source); digest=hashlib.sha256(source.read_bytes()).hexdigest()
    textdir=ROOT/'data/extracted'; textdir.mkdir(parents=True,exist_ok=True)
    (textdir/(source.stem+'.txt')).write_text('\n\n'.join(f'=== PDF PAGE {i+1} ===\n{page.get_text(sort=True)}' for i,page in enumerate(doc)))
    records=[r for r in manifest if r['sourcePdf']==source.name]
    identity=records[0]['paper'] if records else source.stem
    folder=ROOT/'public/paper-assets'/identity;folder.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(source,folder/'source.pdf')
    inventory.append({'id':identity,'filename':source.name,'pages':len(doc),'sha256':digest,'pdf':f'paper-assets/{identity}/source.pdf','curated':bool(records),'titleCandidate':doc[0].get_text(sort=True).split('\n\n')[0].strip()})
    for r in records:
        page=doc[r['page']-1]; clip=fitz.Rect(r['bounds'])
        assert page.rect.contains(clip),r
        # Render vector and embedded content together: figures contain both text and raster panels.
        # Standalone embedded images would omit labels, arrows and legends.
        filename=f"{r['id']}.png"
        if not args.text_only:
            pix=page.get_pixmap(matrix=fitz.Matrix(5,5),clip=clip,alpha=False)
            pix.save(folder/filename)
            vector=fitz.open(); q=vector.new_page(width=clip.width,height=clip.height)
            q.show_pdf_page(q.rect,doc,r['page']-1,clip=clip)
            vector.save(folder/f"{r['id']}.pdf",garbage=4,deflate=True)
        caption=''
        for b in page.get_text('blocks'):
            if b[6]==0 and b[4].startswith(r['captionPrefix']): caption=' '.join(b[4].split());break
        if not caption: raise ValueError(f'Caption not found: {r}')
        figures.append({**r,'caption':caption,'file':f'paper-assets/{identity}/{filename}','vector':f"paper-assets/{identity}/{r['id']}.pdf",'dpi':360,'sourceHash':digest})
    print(f'{source.name}: {len(doc)} pages, {len(records)} curated visuals')
(ROOT/'data/inventory.json').write_text(json.dumps(inventory,indent=2)+'\n')
(ROOT/'data/figures.json').write_text(json.dumps(figures,indent=2)+'\n')
print(f'Discovered {len(inventory)} PDFs. Uncurated files are retained in the inventory; no explanations are invented.')
