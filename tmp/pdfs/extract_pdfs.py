import sys

from pypdf import PdfReader

sys.stdout.reconfigure(encoding="utf-8", errors="replace")


for path in sys.argv[1:]:
    print(f"\n===== FILE: {path} =====")
    reader = PdfReader(path)
    for index, page in enumerate(reader.pages, 1):
        print(f"\n--- PAGE {index} ---\n{page.extract_text() or ''}")
