import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from fastapi.concurrency import run_in_threadpool
import logging
from app.schemas.internal import NLPResult, TokenData
from app.core.exceptions import AppException
from app.core.nlp_loader import nlp
from app.core.text_cleaner import clean_text

logger = logging.getLogger(__name__)

try:
    nltk.data.find("sentiment/vader_lexicon.zip")
except LookupError:
    nltk.download("vader_lexicon", quiet=True)

sia = SentimentIntensityAnalyzer()


class NLPService:
    def _sync_process(self, raw_text: str) -> NLPResult:
        text = clean_text(raw_text)

        if nlp is None:
            raise AppException("NLP service unavailable", 503)

        doc = nlp(text)
        sentiment = sia.polarity_scores(text)
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
                    sent_tokens.append(
                        TokenData(
                            text=token.text,
                            lemma=token.lemma_,
                            pos=token.pos_,
                            dep=token.dep_,
                            is_stop=token.is_stop,
                        )
                    )
            if sent_tokens:
                sentences.append(sent_tokens)

        return NLPResult(
            processed_text=" ".join(all_tokens),
            sentences=sentences,
            emotion_id=overall_emotion,
        )

    async def process(self, raw_text: str) -> NLPResult:
        logger.info(f"NLPService: Processing text of length {len(raw_text)}.")
        return await run_in_threadpool(self._sync_process, raw_text)
