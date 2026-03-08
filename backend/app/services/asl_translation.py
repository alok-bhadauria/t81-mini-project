def translate_to_asl(nlp_data: dict) -> dict:
    stop_words = ["is", "am", "are", "was", "were", "be", "being", "been", "a", "an", "the", "to", "of", "in", "on", "at"]
    time_words = ["yesterday", "today", "tomorrow", "now", "later", "morning", "afternoon", "evening", "night", "soon"]
    
    asl_tokens = []
    
    for word in nlp_data["tokens"]:
        if word not in stop_words:
            asl_tokens.append(word.upper())
            
    time_tokens = [t for t in asl_tokens if t.lower() in time_words]
    other_tokens = [t for t in asl_tokens if t.lower() not in time_words]
    
    final_asl_sequence = time_tokens + other_tokens
    
    gesture_sequence = [f"G_{token}" for token in final_asl_sequence]
    
    return {
        "asl_grammar_output": " ".join(final_asl_sequence),
        "gesture_sequence": gesture_sequence
    }
