import chromadb
from chromadb.config import Settings as ChromaSettings
from loguru import logger

from app.core.config import settings as app_settings


class VectorStore:
    _instance = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def client(self):
        if self._client is None:
            logger.info(f"Initializing ChromaDB at {app_settings.CHROMA_DB_PATH}")
            self._client = chromadb.PersistentClient(
                path=app_settings.CHROMA_DB_PATH,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
        return self._client

    def get_or_create_collection(self, name: str = "documents"):
        try:
            return self.client.get_collection(name)
        except ValueError:
            logger.info(f"Creating collection: {name}")
            return self.client.create_collection(name)

    def add_document(self, collection_name: str, chunks: list[str], embeddings: list[list[float]], metadata: list[dict] | None = None):
        collection = self.get_or_create_collection(collection_name)
        ids = [f"{collection_name}-{i}" for i in range(len(chunks))]
        metadatas = metadata or [{"source": collection_name}] * len(chunks)

        collection.add(embeddings=embeddings, documents=chunks, metadatas=metadatas, ids=ids)
        logger.info(f"Added {len(chunks)} chunks to collection '{collection_name}'")

    def search(self, collection_name: str, query_embedding: list[float], top_k: int = 5):
        collection = self.get_or_create_collection(collection_name)
        results = collection.query(query_embeddings=[query_embedding], n_results=top_k)
        return results
