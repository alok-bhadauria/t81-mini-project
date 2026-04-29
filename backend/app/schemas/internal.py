from pydantic import BaseModel
from typing import List

class TokenData(BaseModel):
    text: str
    lemma: str
    pos: str
    dep: str
    is_stop: bool

class NLPResult(BaseModel):
    processed_text: str
    sentences: List[List[TokenData]]
    emotion_id: str

class TranslationResult(BaseModel):
    asl_grammar_output: str
    asl_tokens: List[str]
