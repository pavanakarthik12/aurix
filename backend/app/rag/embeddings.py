from sentence_transformers import SentenceTransformer
from loguru import logger


class EmbeddingGenerator:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load_model(self):
        if self._model is None:
            logger.info("Loading embedding model: BAAI/bge-base-en-v1.5")
            self._model = SentenceTransformer("BAAI/bge-base-en-v1.5")
            logger.info("Embedding model loaded")
        return self._model

    def generate(self, texts: list[str]) -> list[list[float]]:
        model = self._load_model()
        embeddings = model.encode(texts, normalize_embeddings=True)
        logger.debug(f"Generated {len(embeddings)} embeddings")
        return [emb.tolist() for emb in embeddings]

    def generate_single(self, text: str) -> list[float]:
        return self.generate([text])[0]
