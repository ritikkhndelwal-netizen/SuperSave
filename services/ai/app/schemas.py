from typing import List, Optional, Dict, Any
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
    embed_url: Optional[str] = None

class Chapter(BaseModel):
    timestamp: str
    seconds: int
    title: str
    summary: str

class CodeSnippet(BaseModel):
    language: str
    title: str
    code: str
    timestamp: Optional[str] = None

class VisualInsights(BaseModel):
    on_screen_text: List[str] = []
    diagrams_or_slides: List[str] = []
    tools_or_ui_shown: List[str] = []
    objects_or_ingredients: List[str] = []

class DetectedResource(BaseModel):
    name: str
    type: str  # "github" | "book" | "tool" | "website" | "article"
    reference: str

class DetectedProduct(BaseModel):
    brand: str
    name: str
    category: str

class FactOrClaim(BaseModel):
    claim: str
    verification_note: str

class DeepMetadata(BaseModel):
    tags: List[str] = []
    keywords: List[str] = []
    technologies: List[str] = []
    people: List[str] = []
    brands: List[str] = []
    locations: List[str] = []

class SummaryDetail(BaseModel):
    executive: str
    tldr: str

class ExtractRequest(BaseModel):
    source_url: str = Field(min_length=1)
    mode: str = "video_lowres"  # "video_lowres" | "audio_fast" | "auto"

class ExtractResponse(BaseModel):
    title: str
    content_type: str = "general"  # "code_tutorial" | "recipe" | "fitness" | "review" | "lecture" | "podcast" | "general"
    category: str
    subcategory: Optional[str] = None
    summary: str
    summary_detail: Optional[SummaryDetail] = None
    notes: str
    tags: List[str] = []
    key_takeaways: List[str] = []
    chapters: List[Chapter] = []
    visual_insights: Optional[VisualInsights] = None
    code_snippets: List[CodeSnippet] = []
    detected_resources: List[DetectedResource] = []
    detected_products: List[DetectedProduct] = []
    facts_and_claims: List[FactOrClaim] = []
    metadata: Optional[DeepMetadata] = None
    action_items: List[str] = []
    thumbnail: Optional[str] = None
    duration: Optional[str] = None
    source: Optional[str] = None
    embed_url: Optional[str] = None

class SearchSource(BaseModel):
    title: str
    url: str

class QARequest(BaseModel):
    question: str = Field(min_length=1)
    context: str = Field(min_length=1)
    search_mode: str = "note_only"  # "note_only" | "note_and_web"

class QAResponse(BaseModel):
    answer: str
    search_mode: str = "note_only"
    sources: List[SearchSource] = []

class TranslateRequest(BaseModel):
    text: str = Field(min_length=1)
    target_language: str = "English"

class TranslateResponse(BaseModel):
    translated_text: str
    target_language: str
