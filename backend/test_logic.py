from app.core.text_processor import TextProcessor

def test_janitor():
    print("--- Testing Phase 1: The Janitor (Text Processor) ---")
    
    test_cases = [
        ("I'm happy today!!!", "i am happy today"),
        ("Where are you going?", "where are you going?"),
        ("Don't do that.", "do not do that"),
        ("It's a wonderful day.", "it is a wonderful day")
    ]
    
    for input_text, expected in test_cases:
        result = TextProcessor.normalize_text(input_text)
        status = "✅ PASS" if result == expected else f"❌ FAIL (Got: {result})"
        print(f"Input:    '{input_text}'\nOutput:   '{result}'\nExpected: '{expected}'\nStatus:   {status}\n")

from app.core.linguistic_engine import LinguisticEngine

def test_translator():
    print("\n--- Testing Phase 2: The Translator (Linguistic Engine) ---")
    
    test_cases = [
        ("i am happy today", ["TODAY", "I", "AM", "HAPPY"], "E1"),
        ("where are you", ["WHERE", "ARE", "YOU"], "E6"),
        ("i am sad", ["I", "AM", "SAD"], "E2"),
        ("tomorrow i go", ["TOMORROW", "I", "GO"], "E0") # Neutral logic if no emotion keyword
    ]

    for text, expected_tokens, expected_emotion in test_cases:
        result = LinguisticEngine.process_sentence(text)
        
        tokens_match = result["asl_tokens"] == expected_tokens
        emotion_match = result["emotion_id"] == expected_emotion
        
        status = "✅ PASS" if tokens_match and emotion_match else "❌ FAIL"
        if not tokens_match: status += f" (Tokens: {result['asl_tokens']})"
        if not emotion_match: status += f" (Emotion: {result['emotion_id']})"
        
        print(f"Input: '{text}'\nTokens: {result['asl_tokens']}\nEmotion: {result['emotion_id']}\nStatus: {status}\n")

if __name__ == "__main__":
    test_janitor()
    test_translator()
