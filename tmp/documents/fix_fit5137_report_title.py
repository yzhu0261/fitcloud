from pathlib import Path

from docx import Document
from docx.oxml.ns import qn


REPORT = Path(r"C:\Users\77015\Monash\fit5137\A3\Comp\FIT5137_A3_Report.docx")

doc = Document(REPORT)
title_style = doc.styles["Title"]
p_pr = title_style.element.get_or_add_pPr()
p_bdr = p_pr.find(qn("w:pBdr"))
if p_bdr is not None:
    p_pr.remove(p_bdr)

for paragraph in doc.paragraphs:
    if paragraph.style.name == "Title":
        direct_p_pr = paragraph._p.get_or_add_pPr()
        direct_p_bdr = direct_p_pr.find(qn("w:pBdr"))
        if direct_p_bdr is not None:
            direct_p_pr.remove(direct_p_bdr)

doc.save(REPORT)
print(REPORT)
