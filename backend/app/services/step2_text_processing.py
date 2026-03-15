from typing import Dict, Any, List
import spacy
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon', quiet=True)

sia = SentimentIntensityAnalyzer()

import re
from spellchecker import SpellChecker

spell = SpellChecker()

def _correct_word_token(word: str) -> str:
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

def _spellcheck_string(text: str) -> str:
    def replace_match(match):
        word = match.group(0)
        is_title = word.istitle()
        is_upper = word.isupper()
        
        corr = _correct_word_token(word.lower() if not is_upper else word)
        
        if is_title:
            return corr.capitalize()
        elif is_upper:
            return corr.upper()
        return corr
        
    return re.sub(r"\b[A-Za-z]+\b", replace_match, text)

def process_text_pipeline(raw_text: str) -> Dict[str, Any]:
    if not isinstance(raw_text, str) or not raw_text.strip():
        raw_text = "ERROR"
        
    clean_text = _spellcheck_string(raw_text)
        
    doc = nlp(clean_text)
    sentiment = sia.polarity_scores(clean_text)
    compound_score = sentiment.get("compound", 0.0)
    
    if compound_score >= 0.05:
        overall_emotion = "HAPPY"
    elif compound_score <= -0.05:
        overall_emotion = "SAD"
    else:
        overall_emotion = "NEUTRAL"
        
    processed_sentences: List[Dict[str, Any]] = []
    
    for sent in doc.sents:
        sent_data: Dict[str, Any] = {
            "original": sent.text,
            "tokens": []
        }
        for token in sent:
            if not token.is_punct and not token.is_space:
                sent_data["tokens"].append({
                    "text": token.text,
                    "lemma": token.lemma_,
                    "pos": token.pos_,
                    "tag": token.tag_,
                    "dep": token.dep_,
                    "is_stop": token.is_stop
                })
        processed_sentences.append(sent_data)
        
    all_tokens = [tok["text"] for s in processed_sentences for tok in s.get("tokens", [])]
        
    return {
        "processed_text": " ".join(all_tokens),
        "sentences_data": processed_sentences,
        "emotion_id": overall_emotion,
        "tokens": all_tokens,
        "sentiment_scores": sentiment,
        "spacy_doc": doc
    }
