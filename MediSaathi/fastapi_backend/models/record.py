from pydantic import BaseModel


class AnalyzeRecordRequest(BaseModel):
    record_id: str


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRecordRequest(BaseModel):
    record_id: str
    question: str
    history: list[ChatMessage] | None = None
