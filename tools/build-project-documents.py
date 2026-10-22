"""Build the two Kazakh first-person project documents from their Markdown sources."""
from pathlib import Path
import re
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT

ROOT = Path(__file__).resolve().parents[1]

def create_document(stem, short=False):
    doc = Document()
    section = doc.sections[0]
    section.page_width, section.page_height = Cm(21), Cm(29.7)
    section.top_margin = section.bottom_margin = Cm(1.8)
    section.left_margin = section.right_margin = Cm(2)
    for name in ['Normal', 'Title', 'Heading 1', 'Heading 2']:
        style = doc.styles[name]
        style.font.name = 'Arial'
        style.font.color.rgb = RGBColor(0, 0, 0)
        style.paragraph_format.space_after = Pt(6)
    doc.styles['Normal'].font.size = Pt(10.5 if short else 11)
    doc.styles['Normal'].paragraph_format.line_spacing = 1.08
    doc.styles['Title'].font.size = Pt(23)
    doc.styles['Title'].paragraph_format.space_after = Pt(12)
    doc.styles['Heading 1'].font.size = Pt(14)
    doc.styles['Heading 1'].paragraph_format.space_before = Pt(9)
    doc.styles['Heading 2'].font.size = Pt(12)
    doc.styles['Heading 2'].paragraph_format.space_before = Pt(8)
    doc.core_properties.title = 'Brain Hack'
    doc.core_properties.author = 'Brain Hack'
    doc.core_properties.language = 'kk-KZ'
    lines = (ROOT / 'docs' / (stem + '.md')).read_text(encoding='utf-8').splitlines()
    i = 0
    while i < len(lines):
        text = lines[i].strip()
        if not text:
            i += 1
            continue
        if text == '<!-- pagebreak -->':
            doc.add_page_break()
        elif text.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                row = [part.strip() for part in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', part) for part in row):
                    rows.append(row)
                i += 1
            table = doc.add_table(rows=0, cols=len(rows[0]))
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            table.autofit = False
            widths = {2: [6, 11], 3: [1.4, 6.4, 9.2], 4: [4, 4, 4.5, 4.5], 6: [1, 1.6, 2.1, 3.1, 4.4, 4.8]}[len(rows[0])]
            if rows[0][0] == 'Маршрут':
                widths = [6.4, 3.1, 7.5]
            for col, width in zip(table.columns, widths):
                col.width = Cm(width)
            for index, row in enumerate(rows):
                cells = table.add_row().cells
                for j, (cell, value) in enumerate(zip(cells, row)):
                    cell.width = Cm(widths[j])
                    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
                    cell.text = value
                    tcpr = cell._tc.get_or_add_tcPr()
                    borders = OxmlElement('w:tcBorders')
                    for side in ['top', 'left', 'bottom', 'right']:
                        edge = OxmlElement('w:' + side)
                        for key, val in [('val', 'single'), ('sz', '4'), ('color', 'D9D9D9')]:
                            edge.set(qn('w:' + key), val)
                        borders.append(edge)
                    tcpr.append(borders)
                    shade = OxmlElement('w:shd')
                    shade.set(qn('w:fill'), 'DCEAF1' if index == 0 else ('F4F7F9' if index % 2 == 0 else 'FFFFFF'))
                    tcpr.append(shade)
                    margins = OxmlElement('w:tcMar')
                    for side in ['top', 'bottom', 'left', 'right']:
                        edge = OxmlElement('w:' + side)
                        edge.set(qn('w:w'), '80')
                        edge.set(qn('w:type'), 'dxa')
                        margins.append(edge)
                    tcpr.append(margins)
                    for p in cell.paragraphs:
                        p.paragraph_format.space_after = Pt(2)
                        p.paragraph_format.space_before = Pt(2)
                        for run in p.runs:
                            run.font.size = Pt(10)
                            run.bold = index == 0
                trpr = table.rows[-1]._tr.get_or_add_trPr()
                trpr.append(OxmlElement('w:cantSplit'))
                if index == 0:
                    trpr.append(OxmlElement('w:tblHeader'))
            doc.add_paragraph().paragraph_format.space_after = Pt(0)
            continue
        elif text.startswith('# '):
            doc.add_paragraph(text[2:], style='Title')
        elif text.startswith('## '):
            doc.add_paragraph(text[3:], style='Heading 1')
        elif text.startswith('### '):
            doc.add_paragraph(text[4:], style='Heading 2')
        else:
            doc.add_paragraph(text)
        i += 1
    # Explicitly tag text as Kazakh without changing the first-person wording.
    for root in [doc.styles.element, doc._element]:
        for border in list(root.iter(qn('w:pBdr'))):
            border.getparent().remove(border)
    for paragraph in doc.paragraphs:
        for run in paragraph.runs:
            lang = OxmlElement('w:lang')
            lang.set(qn('w:val'), 'kk-KZ')
            run._r.get_or_add_rPr().append(lang)
    destination = ROOT / 'docs' / (stem + '.docx')
    doc.save(destination)
    print(destination)

create_document('brain-hack-solutions')
create_document('brain-hack-implementation', short=True)
