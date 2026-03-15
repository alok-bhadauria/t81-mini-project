from typing import Dict, Any, List, Set

def translate_to_asl(nlp_data: Dict[str, Any]) -> Dict[str, Any]:
    pos_to_ignore: Set[str] = {"DET", "ADP", "AUX", "PUNCT", "CCONJ", "SCONJ", "PART"}
    time_lemmas: Set[str] = {
        "yesterday", "today", "tomorrow", "now", "later", 
        "morning", "afternoon", "evening", "night", "soon",
        "past", "future", "always", "never", "sometimes", "week", "month", "year"
    }
    wh_words: Set[str] = {"who", "what", "where", "when", "why", "how", "which"}
    negation_words: Set[str] = {"not", "no", "never", "none", "nothing", "nobody", "nowhere", "neither"}
    
    final_asl_sequence: List[str] = []
    
    for sent in nlp_data.get("sentences_data", []):
        time_tokens: List[str] = []
        core_tokens: List[str] = []
        wh_tokens: List[str] = []
        neg_tokens: List[str] = []
        
        tokens = sent.get("tokens", [])
        idx = 0
        
        while idx < len(tokens):
            token = tokens[idx]
            pos = token.get("pos", "")
            lemma = token.get("lemma", "").upper()
            
            is_neg = lemma.lower() in negation_words
            is_wh = lemma.lower() in wh_words
            
            if (pos in pos_to_ignore or token.get("is_stop", False)) and pos != "PRON" and pos != "NUM" and not is_neg and not is_wh and not lemma.isnumeric():
                idx += 1
                continue
                
            if is_neg:
                neg_tokens.append(lemma)
            elif is_wh:
                wh_tokens.append(lemma)
            elif lemma.lower() in time_lemmas:
                time_tokens.append(lemma)
            elif lemma.isnumeric():
                core_tokens.append(lemma)
            else:
                if pos == "ADJ" and (idx + 1 < len(tokens)) and tokens[idx + 1].get("pos") in {"NOUN", "PROPN"}:
                    next_lemma = tokens[idx + 1].get("lemma", "").upper()
                    core_tokens.append(next_lemma)
                    core_tokens.append(lemma)
                    idx += 1
                else:
                    core_tokens.append(lemma)
            
            idx += 1
            
        final_asl_sequence.extend(time_tokens + core_tokens + neg_tokens + wh_tokens)
        
    gesture_sequence = [f"G_{token}" for token in final_asl_sequence]
    
    return {
        "asl_grammar_output": " ".join(final_asl_sequence),
        "gesture_sequence": gesture_sequence
    }
