"""Render the repository documentation to styled HTML, then print via Playwright.

Python-only build dependencies live in .cache/pdf-tools, outside app dependencies:
  python -m pip install --target .cache/pdf-tools markdown pymupdf
  python scripts/build-documentation.py
"""
from pathlib import Path
import html
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / '.cache' / 'pdf-tools'))
import markdown
import pymupdf

DOCS = ROOT / 'docs'
CACHE = ROOT / '.cache' / 'documentation'
CACHE.mkdir(parents=True, exist_ok=True)

CSS = r"""
@page { size: A4; }
* { box-sizing: border-box; }
html { background: #fff; }
body { font: 10.5pt/1.53 'Segoe UI', Arial, sans-serif; color: #202A3D; margin: 0; }
h1,h2,h3,h4 { line-height: 1.23; color: #19376A; break-after: avoid; }
h1 { font-size: 38pt; letter-spacing: -1.2pt; margin: 21mm 0 9mm; max-width: 145mm; }
h2 { font-size: 22pt; margin: 0 0 7mm; padding-top: 5mm; border-top: 3px solid #FCFC30; }
h2.chapter { break-before: page; }
h3 { font-size: 14pt; margin: 7mm 0 3mm; }
h4 { font-size: 11.5pt; }
p { margin: 0 0 3.8mm; orphans: 3; widows: 3; }
a { color: #304BB2; text-decoration: none; overflow-wrap: anywhere; }
strong { font-weight: 650; }
code { font: 8.8pt/1.45 Consolas, monospace; color: #19376A; overflow-wrap: anywhere; }
pre { background: #F1F3F7; border-left: 3px solid #304BB2; padding: 4mm; white-space: pre-wrap; overflow-wrap: anywhere; break-inside: avoid; margin: 5mm 0; }
pre code { font-size: 8.3pt; }
table { border-collapse: collapse; width: 100%; margin: 5mm 0; font-size: 9pt; line-height: 1.4; table-layout: auto; }
thead { display: table-header-group; }
th { background: #19376A; color: white; text-align: left; font-weight: 600; padding: 2.7mm 2.8mm; }
td { padding: 2.6mm 2.8mm; border-bottom: 1px solid #E5E8EE; vertical-align: top; overflow-wrap: anywhere; }
tr:nth-child(even) td { background: #F6F7F9; }
tr { break-inside: avoid; }
ul,ol { padding-left: 6mm; margin: 3mm 0 5mm; }
li { margin-bottom: 2.6mm; orphans: 2; widows: 2; }
blockquote { border-left: 3px solid #304BB2; margin-left: 0; padding-left: 4mm; color: #647086; }
.cover { min-height: 247mm; position: relative; break-after: page; padding-top: 8mm; }
.cover .cover-kicker { color: #304BB2; font-size: 10pt; font-weight: 700; letter-spacing: 1.4pt; }
.cover h2 { border: 0; padding: 0; font-size: 21pt; margin: 0 0 10mm; }
.cover p { max-width: 160mm; }
.cover-mark { width: 26mm; height: 26mm; margin-bottom: 7mm; }
.cover-note { border-left: 4px solid #FCFC30; background: #F6F7F9; padding: 4mm; margin-top: 6mm; font-size: 9pt; }
.toc { break-after: page; }
.toc h2 { border-color: #FCFC30; }
.toc-list { padding: 0; list-style: none; }
.toc-list li { margin: 0; border-bottom: 1px solid #E5E8EE; padding: 1.8mm 0; font-size: 9.3pt; line-height: 1.35; break-inside: avoid; }
.toc-list a { display: flex; justify-content: space-between; align-items: baseline; gap: 6mm; }
.toc-list .page { flex: none; min-width: 8mm; text-align: right; color: #647086; }
.diagram { background: #EEF2FC; border: 1px solid #BDCAE4; border-radius: 3mm; padding: 5mm; margin: 6mm 0; break-inside: avoid; }
.diagram-title { color: #19376A; font-weight: 700; margin-bottom: 4mm; }
.flow { text-align: center; background: #19376A; color: #fff; padding: 3mm; font-size: 10pt; margin: 2mm 0; }
.flow-sub { text-align: center; color: #647086; font-size: 9pt; padding: 3mm 0; }
.diagram-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin: 3mm 0; }
.diagram-grid div { background: #fff; padding: 4mm; border-top: 3px solid #304BB2; }
figure { margin: 8mm 0; text-align: center; break-inside: avoid; }
figure img { display: block; margin: 0 auto; max-width: 100%; object-fit: contain; border: 1px solid #E5E8EE; }
.phone-figure img { width: 82mm; max-height: 180mm; }
.wide-figure img { width: 173mm; max-height: 165mm; }
figcaption { font-size: 9pt; color: #647086; padding-top: 3mm; }
.evidence { background: #F6F7F9; padding: 4mm; margin: 5mm 0; border-left: 3px solid #304BB2; break-inside: avoid; }
.evidence .status { color: #19376A; font-weight: 700; }
.appendix { font-size: 10pt; line-height: 1.45; }
.appendix p { margin-bottom: 3.3mm; }
.appendix h2 { font-size: 17pt; margin-top: 8mm; }
.appendix h2.chapter { font-size: 22pt; margin-top: 0; }
.appendix img { max-width: 100%; max-height: 175mm; }
"""

def convert(source: str) -> str:
    return markdown.markdown(source, extensions=['tables', 'fenced_code', 'sane_lists'])

def build_html(page_map=None):
    page_map = page_map or {}
    source = (DOCS / 'documentacao-completa.md').read_text(encoding='utf-8')
    cover_md, body_md = source.split('<div class="toc-placeholder"></div>', 1)
    cover = convert(cover_md)
    cover = cover.replace('<p><strong>Natureza do produto:', '<p class="cover-note"><strong>Natureza do produto:')
    content = convert(body_md)
    headings = []
    counter = 0

    def heading(match):
        nonlocal counter
        counter += 1
        label = re.sub('<[^>]+>', '', match.group(1))
        anchor = f'chapter-{counter:02}'
        headings.append({'id': anchor, 'title': html.unescape(label)})
        return f'<h2 class="chapter" id="{anchor}">{match.group(1)}</h2>'

    content = re.sub(r'<h2>(.*?)</h2>', heading, content)
    evidence = json.loads((DOCS / 'validacao-documentacao.json').read_text(encoding='utf-8'))
    evidence_html = ''.join(
        '<div class="evidence"><p class="status">' + html.escape(v['nome'] + ': ' + v['resultado']) + '</p><p><code>'
        + html.escape(v['comando']) + '</code></p><p>' + html.escape(v['detalhe']) + '</p></div>'
        for v in evidence['verificacoes']
    )
    content += '<h2 class="chapter" id="evidence">Validação executada em 07/10/2026</h2>' + evidence_html
    content += '<p>' + html.escape(' '.join(evidence['limites'])) + '</p>'
    headings.append({'id': 'evidence', 'title': 'Validação executada em 07/10/2026'})
    for idx, (name, title) in enumerate([
        ('analise-relatorio.md', 'Apêndice A · Análise das 17 seções do relatório'),
        ('inspector.md', 'Apêndice B · Guia original do MVP de crédito PJ'),
        ('design-references.md', 'Apêndice C · Referências e decisões de design'),
    ], 1):
        appendix = (DOCS / name).read_text(encoding='utf-8')
        appendix = re.sub(r'^# .+\n', '', appendix, count=1)
        # Render the original Mermaid source as an image-independent reading aid.
        appendix = appendix.replace('```mermaid', '```text')
        anchor = f'appendix-{idx}'
        headings.append({'id': anchor, 'title': title})
        content += f'<section class="appendix"><h2 class="chapter" id="{anchor}">{title}</h2>' + convert(appendix) + '</section>'
    toc = '<section class="toc"><h2>Sumário</h2><p>Capítulos, validação e documentos de apoio. Links internos disponíveis no PDF.</p><ul class="toc-list">'
    for item in headings:
        toc += f'<li><a href="#{item["id"]}"><span>{html.escape(item["title"])}</span><span class="page">{page_map.get(item["id"], "·")}</span></a></li>'
    toc += '</ul></section>'
    document = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Documentação completa · BB Conceito e Inspetor IA</title><style>' + CSS + '</style></head><body>'
    document += '<section class="cover"><img class="cover-mark" src="../assets/icon.png" alt="Ícone do conceito"><div class="cover-kicker">DOCUMENTAÇÃO DO PROJETO · OUTUBRO DE 2026</div>' + cover + '</section>'
    document += toc + content + '</body></html>'
    (DOCS / 'documentacao-completa.html').write_text(document, encoding='utf-8')
    return headings

PRINT_JS = r"""
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = process.cwd();
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(root, '.cache', 'browsers');
const temp = path.join(root, '.cache', 'tmp');
fs.mkdirSync(temp, {recursive: true});
process.env.TEMP = temp;
process.env.TMP = temp;
process.env.TMPDIR = temp;
const { chromium } = require('@playwright/test');
(async () => {
  console.log('Launching PDF browser');
  const browser = await chromium.launch({ headless: true });
  try {
    console.log('Opening documentation');
    const page = await browser.newPage({viewport: {width: 1100, height: 900}});
    await page.goto(pathToFileURL(path.join(root, 'docs', 'documentacao-completa.html')).href, {waitUntil: 'domcontentloaded', timeout: 30000});
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode())); });
    const layoutIssues = await page.evaluate(() => [...document.querySelectorAll('table, pre, figure, .diagram')].flatMap(el => el.scrollWidth > el.clientWidth + 2 ? [el.tagName + ': ' + el.textContent.slice(0, 70)] : []));
    if (layoutIssues.length) throw new Error('Overflow: ' + JSON.stringify(layoutIssues));
    console.log('Printing documentation');
    await page.pdf({path: path.join(root, '.cache', 'documentation', 'raw.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true, tagged: true, outline: true,
      margin: {top: '18mm', right: '18mm', bottom: '18mm', left: '18mm'}, displayHeaderFooter: true,
      headerTemplate: '<div style="font-family:Arial;font-size:8px;color:#647086;width:100%;margin:0 18mm;border-bottom:1px solid #E5E8EE;padding-bottom:4px">BB · CONCEITO / INSPETOR IA <span style="float:right">DOCUMENTAÇÃO COMPLETA · 07/10/2026</span></div>',
      footerTemplate: '<div style="font-family:Arial;font-size:8px;color:#647086;width:100%;margin:0 18mm;display:flex;justify-content:space-between"><span>Conceito independente · Dados fictícios · Versão documental 1.0</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'});
    console.log(JSON.stringify({printed: true, layoutIssues}));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
"""

def print_pdf():
    script = CACHE / 'print.cjs'
    script.write_text(PRINT_JS, encoding='utf-8')
    subprocess.run(['node', str(script)], cwd=ROOT, check=True)

def read_page_map(headings):
    with pymupdf.open(CACHE / 'raw.pdf') as doc:
        # Internal destinations from the TOC survive Chromium's PDF print.
        links = [link for page in doc for link in page.get_links() if link.get('page', -1) >= 0 and link.get('nameddest')]
        destinations = {link['nameddest']: link['page'] + 1 for link in links}
        if any(heading['id'] not in destinations for heading in headings):
            raise RuntimeError('Missing internal TOC links')
        return {heading['id']: destinations[heading['id']] for heading in headings}

def finalize(headings, page_map):
    with pymupdf.open(CACHE / 'raw.pdf') as doc:
        doc.set_metadata({'title': 'BB · Conceito e Inspetor IA — Documentação completa', 'author': 'Documentação técnica do projeto BB-APP', 'subject': 'Produto, tecnologias, arquitetura, uso, governança e planejamento', 'keywords': 'BB-APP, Expo 57, React Native, TypeScript, Inspetor IA, documentação', 'creator': 'Build documental do projeto'})
        doc.xref_set_key(doc.pdf_catalog(), 'Lang', '(pt-BR)')
        doc.set_toc([[1, 'Capa', 1], [1, 'Sumário', 2]] + [[1, item['title'], page_map[item['id']]] for item in headings])
        pdf_path = DOCS / 'BB-APP-Documentacao-Completa.pdf'
        doc.save(pdf_path, garbage=4, deflate=True)
    with pymupdf.open(pdf_path) as doc:
        texts = [page.get_text() for page in doc]
        total_text = '\n'.join(texts)
        empty = [i + 1 for i, value in enumerate(texts) if len(value.strip()) < 100]
        missing = [item['title'] for item in headings if item['title'] not in re.sub(r'\s+', ' ', total_text)]
        out_of_bounds = []
        for idx, page in enumerate(doc):
            for block in page.get_text('dict')['blocks']:
                for line in block.get('lines', []):
                    for span in line['spans']:
                        x0, y0, x1, y1 = span['bbox']
                        if x0 < -1 or y0 < -1 or x1 > page.rect.width + 1 or y1 > page.rect.height + 1:
                            out_of_bounds.append({'page': idx + 1, 'text': span['text']})
        replacement = total_text.count('\ufffd')
        if empty or missing or replacement or out_of_bounds:
            raise RuntimeError(f'PDF validation failed: empty={empty}, missing={missing}, replacements={replacement}, outOfBounds={out_of_bounds}')
        toc_ok = all(page_map[item['id']] == read_page_map(headings)[item['id']] for item in headings)
        sample_pages = sorted(set([0, 1, 2, page_map['chapter-06'] - 1, page_map['chapter-16'] - 1, page_map['chapter-25'] - 1, page_map['chapter-36'] - 1, page_map['evidence'] - 1, len(doc) - 1]))
        for idx in sample_pages:
            doc[idx].get_pixmap(matrix=pymupdf.Matrix(1.1, 1.1)).save(CACHE / f'page-{idx + 1:03}.png')
        report = {'pages': len(doc), 'bytes': pdf_path.stat().st_size, 'headings': len(headings), 'internalLinks': sum(len(page.get_links()) for page in doc), 'emptyPages': empty, 'missingHeadings': missing, 'replacementCharacters': replacement, 'outOfBoundsText': out_of_bounds, 'tocPageNumbersValidated': toc_ok, 'samplePages': [x + 1 for x in sample_pages]}
        (DOCS / 'validacao-pdf.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        (CACHE / 'extracted.txt').write_text(total_text, encoding='utf-8')
        print(json.dumps(report, ensure_ascii=False))

if __name__ == '__main__':
    headings = build_html()
    print_pdf()
    page_map = read_page_map(headings)
    # TOC page numbers keep a fixed footprint, but check convergence explicitly.
    for _ in range(3):
        build_html(page_map)
        print_pdf()
        next_map = read_page_map(headings)
        if next_map == page_map:
            break
        page_map = next_map
    else:
        raise RuntimeError('TOC pagination did not converge')
    finalize(headings, page_map)
