import logging
from typing import Set, List
from app.schemas.internal import NLPResult, TranslationResult

logger = logging.getLogger(__name__)

class TranslationService:
    def __init__(self):
        self.pos_to_ignore: Set[str] = {"DET", "ADP", "AUX", "PUNCT", "CCONJ", "SCONJ", "PART"}
        self.time_lemmas: Set[str] = {
            "yesterday", "today", "tomorrow", "now", "later", 
            "morning", "afternoon", "evening", "night", "soon",
            "past", "future", "always", "never", "sometimes", "week", "month", "year"
        }
        self.wh_words: Set[str] = {"who", "what", "where", "when", "why", "how", "which"}
        self.negation_words: Set[str] = {"not", "no", "never", "none", "nothing", "nobody", "nowhere", "neither"}

    def translate(self, nlp_data: NLPResult) -> TranslationResult:
        logger.info("TranslationService: Initiating exact ASL token translation engine")
        final_asl_sequence: List[str] = []
        
        for sent_tokens in nlp_data.sentences:
            time_tokens: List[str] = []
            core_tokens: List[str] = []
            wh_tokens: List[str] = []
            neg_tokens: List[str] = []
            
            idx = 0
            while idx < len(sent_tokens):
                token = sent_tokens[idx]
                pos = token.pos
                lemma = token.lemma.upper()
                
                is_neg = lemma.lower() in self.negation_words
                is_wh = lemma.lower() in self.wh_words
                
                if (pos in self.pos_to_ignore or token.is_stop) and pos != "PRON" and pos != "NUM" and not is_neg and not is_wh and not lemma.isnumeric():
                    idx += 1
                    continue
                    
                if is_neg:
                    neg_tokens.append(lemma)
                elif is_wh:
                    wh_tokens.append(lemma)
                elif lemma.lower() in self.time_lemmas:
                    time_tokens.append(lemma)
                elif lemma.isnumeric():
                    core_tokens.append(lemma)
                else:
                    if pos == "ADJ" and (idx + 1 < len(sent_tokens)) and sent_tokens[idx + 1].pos in {"NOUN", "PROPN"}:
                        next_lemma = sent_tokens[idx + 1].lemma.upper()
                        core_tokens.append(next_lemma)
                        core_tokens.append(lemma)
                        idx += 1
                    else:
                        core_tokens.append(lemma)
                
                idx += 1
                
            final_asl_sequence.extend(time_tokens + core_tokens + neg_tokens + wh_tokens)
            
        if not final_asl_sequence:
            final_asl_sequence = ["NONE"]
            
        return TranslationResult(
            asl_grammar_output=" ".join(final_asl_sequence),
            asl_tokens=final_asl_sequence
        )
