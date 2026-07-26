from pathlib import Path

import fitz
from docx import Document as DocxDocument
from loguru import logger


class DocumentLoader:
    @staticmethod
    def load_pdf(path: str | Path) -> str:
        logger.debug(f"Loading PDF: {path}")
        doc = fitz.open(str(path))
        text = "\n".join([page.get_text() for page in doc])
        doc.close()
        return text

    @staticmethod
    def load_docx(path: str | Path) -> str:
        logger.debug(f"Loading DOCX: {path}")
        doc = DocxDocument(str(path))
        text = "\n".join([p.text for p in doc.paragraphs if p.text])
        return text

    @staticmethod
    def load_txt(path: str | Path) -> str:
        logger.debug(f"Loading TXT: {path}")
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    def load(self, path: str | Path) -> str:
        path = Path(path)
        ext = path.suffix.lower()

        loaders = {
            ".pdf": self.load_pdf,
            ".docx": self.load_docx,
            ".txt": self.load_txt,
        }

        loader = loaders.get(ext)
        if not loader:
            raise ValueError(f"Unsupported file type: {ext}")

        return loader(path)
