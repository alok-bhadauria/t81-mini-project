import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
import re
from spellchecker import SpellChecker
from fastapi.concurrency import run_in_threadpool
import logging
from app.schemas.internal import NLPResult, TokenData
from app.core.exceptions import AppException
from app.core.nlp_loader import nlp

logger = logging.getLogger(__name__)

try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon', quiet=True)

sia = SentimentIntensityAnalyzer()
spell = SpellChecker()

class NLPService:
    def _correct_word_token(self, word: str) -> str:
        if (word.isupper() and len(word) > 1) or word.isnumeric():
            return word
        if spell.known([word]):
            return word
            
        corr1 = spell.correction(word)
        if corr1 and corr1 != word and spell.known([corr1]):
            return corr1
            
        reduced_3 = re.sub(r"(.)\1{2,}", r"\1", word)
        corr2 = spell.correction(reduced_3)
        if corr2 and spell.known([corr2]):
            return corr2
            
        reduced_2 = re.sub(r"(.)\1+", r"\1", word)
        corr3 = spell.correction(reduced_2)
        if corr3 and spell.known([corr3]):
            return corr3
            
        return corr1 if corr1 else word

    def _spellcheck_string(self, text: str) -> str:
        def replace_match(match):
            word = match.group(0)
            is_title = word.istitle()
            is_upper = word.isupper()
            
            corr = self._correct_word_token(word.lower() if not is_upper else word)
            
            if is_title:
                return corr.capitalize()
            elif is_upper:
                return corr.upper()
            return corr
            
        return re.sub(r"\b[A-Za-z]+\b", replace_match, text)

    def _sync_process(self, raw_text: str) -> NLPResult:
        if not isinstance(raw_text, str) or not raw_text.strip():
            raw_text = "ERROR"
            
        clean_text = self._spellcheck_string(raw_text)
        if nlp is None:
            raise AppException("NLP service unavailable", 503)
        doc = nlp(clean_text)
        sentiment = sia.polarity_scores(clean_text)
        compound_score = sentiment.get("compound", 0.0)
        
        if compound_score >= 0.05:
            overall_emotion = "HAPPY"
        elif compound_score <= -0.05:
            overall_emotion = "SAD"
        else:
            overall_emotion = "NEUTRAL"
            
        all_tokens = []
        sentences = []
        for sent in doc.sents:
            sent_tokens = []
            for token in sent:
                if not token.is_punct and not token.is_space:
                    all_tokens.append(token.text)
                    token_data = TokenData(
                        text=token.text,
                        lemma=token.lemma_,
                        pos=token.pos_,
                        dep=token.dep_,
                        is_stop=token.is_stop
                    )
                    sent_tokens.append(token_data)
            if sent_tokens:
                sentences.append(sent_tokens)
            
        return NLPResult(
            processed_text=" ".join(all_tokens),
            sentences=sentences,
            emotion_id=overall_emotion
        )
        
    async def process(self, text: str) -> NLPResult:
        logger.info(f"NLPService: Analyzing input text: {text[:50]}... length: {len(text)}")
        return await run_in_threadpool(self._sync_process, text)
