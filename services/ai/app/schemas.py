from typing import List, Optional
from pydantic import BaseModel, Field

class FastMetadataRequest(BaseModel):
    source_url: str = Field(min_length=1)

class FastMetadataResponse(BaseModel):
    title: str
    author: Optional[str] = None
    thumbnail: Optional[str] = None
    category: str = "General"
    duration: Optional[str] = None
    source: str = "Web"

class ExtractRequest(BaseModel):
    source_url: str = Field(min_length=1)
    mode: str = "video_lowres"  # "video_lowres" | "audio_fast" | "auto"

class ExtractResponse(BaseModel):
    title: str
    category: str
    summary: str
    notes: str
    tags: List[str] = []
    key_takeaways: List[str] = []
    thumbnail: Optional[str] = None
    duration: Optional[str] = None
    source: Optional[str] = None

class QARequest(BaseModel):
    question: str = Field(min_length=1)
    context: str = Field(min_length=1)

class QAResponse(BaseModel):
    answer: str
