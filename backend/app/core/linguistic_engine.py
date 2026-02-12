from typing import List, Dict, Any

class LinguisticEngine:
    # This class does the heavy lifting: ASL grammar conversation and identifying emotions.
    
    @staticmethod
    def process_sentence(text: str) -> Dict[str, Any]:
        # 1. Linguistic Analysis: Breakdown the sentence (Subject, Verb, Object).
        # Placeholder for spaCy integration.
        
        # 2. ASL Transformation: Reorder words to match ASL structure (Time-Topic-Comment).
        asl_tokens = LinguisticEngine._apply_asl_rules(text)
        
        # 3. Emotion Analysis: Detect if the user is happy, sad, asking a question, etc.
        emotion_id = LinguisticEngine._analyze_emotion(text)
        
        # Return all the data needed for the frontend animation.
        return {
            "original_text": text,
            "asl_tokens": asl_tokens,
            "emotion_id": emotion_id
        }

    @staticmethod
    def _apply_asl_rules(text: str) -> List[str]:
        # Basic Rule: Time First.
        # We look for time words and move them to the front.
        time_words = {"today", "tomorrow", "yesterday", "now", "later", "morning", "night"}
        words = text.split()
        
        # simple logic: if a time word exists, pluck it out and put it first.
        # In a real engine, we'd use POS tagging (spaCy) to find time markers accurately.
        found_time = [w for w in words if w in time_words]
        remaining = [w for w in words if w not in time_words]
        
        # ASL Structure: [Time] + [Subject-Object-Verb] (Simplified for now as just remaining words)
        # We also uppercase everything as ASL glosses are standardly uppercase.
        ordered_words = found_time + remaining
        
        return [w.upper() for w in ordered_words]

    @staticmethod
    def _analyze_emotion(text: str) -> str:
        # Simple keyword detection for basic emotions.
        text = text.lower()
        if any(w in text for w in ["happy", "excited", "good", "great", "love"]):
            return "E1" # Happy
        if any(w in text for w in ["sad", "sorry", "bad", "cry", "miss"]):
            return "E2" # Sad
        if "?" in text or any(w in text for w in ["where", "what", "who", "when", "why"]):
            return "E6" # Question (Eyebrows squeezed/raised)
            
        return "E0" # Neutral
