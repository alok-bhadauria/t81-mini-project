import re

def process_text_pipeline(raw_text: str) -> dict:
    sentences = re.split(r'(?<=[.!?]) +', raw_text.strip())
    if not sentences or (len(sentences) == 1 and not sentences[0]):
        sentences = [raw_text.strip()]
        
    processed_sentences = []
    overall_emotion = "NEUTRAL"
    
    happy_words = ["happy", "good", "great", "excellent", "love", "smile", "joy", "excited", "amazing"]
    sad_words = ["sad", "bad", "terrible", "cry", "depressed", "hate", "angry", "mad", "upset"]
    
    happy_count = 0
    sad_count = 0
    
    for sentence in sentences:
        clean_sentence = re.sub(r'[^\w\s]', '', sentence).lower()
        tokens = clean_sentence.split()
        
        for token in tokens:
            if token in happy_words:
                happy_count += 1
            elif token in sad_words:
                sad_count += 1
                
        processed_sentences.append({
            "original": sentence,
            "tokens": tokens
        })
        
    if happy_count > sad_count:
        overall_emotion = "HAPPY"
    elif sad_count > happy_count:
        overall_emotion = "SAD"
        
    all_tokens = [token for s in processed_sentences for token in s["tokens"]]
    
    return {
        "processed_text": " ".join(all_tokens),
        "sentences_data": processed_sentences,
        "emotion_id": overall_emotion,
        "tokens": all_tokens
    }
