from config import get_settings


settings = get_settings()


class ChromaIncidentStore:
    def __init__(self) -> None:
        self.enabled = True
        try:
            from chromadb import HttpClient
            from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

            self.client = HttpClient(host=settings.chroma_host, port=settings.chroma_port)
            self.collection = self.client.get_or_create_collection(
                name="incidents",
                embedding_function=DefaultEmbeddingFunction(),
            )
        except Exception:
            self.enabled = False
            self.client = None
            self.collection = None

    def search(self, query: str, user_id: str, limit: int = 3) -> list[dict]:
        if not self.enabled:
            return []
        try:
            result = self.collection.query(query_texts=[query], n_results=limit, where={"user_id": user_id})
            docs = result.get("documents", [[]])[0]
            metas = result.get("metadatas", [[]])[0]
            return [{"summary": doc, **meta} for doc, meta in zip(docs, metas)]
        except Exception:
            return []

    def add(self, incident_id: str, user_id: str, summary: str, metadata: dict) -> None:
        if not self.enabled:
            return
        try:
            self.collection.add(ids=[incident_id], documents=[summary], metadatas=[{"user_id": user_id, **metadata}])
        except Exception:
            return
