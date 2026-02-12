import re

class TextProcessor:
    # This class cleans up the text so it's ready for analysis (Step 2 & 3 in flow).
    
    @staticmethod
    def normalize_text(text: str) -> str:
        # First, let's make everything lowercase so 'Hello' and 'hello' are treated the same.
        text = text.lower()
        
        # Next, we expand things like "I'm" to "I am" for better clarity.
        text = TextProcessor._expand_contractions(text)
        
        # Finally, remove weird symbols that aren't useful for translation.
        text = TextProcessor._remove_symbols(text)
        
        # Return the clean, stripped text.
        return text.strip()

    @staticmethod
    def _expand_contractions(text: str) -> str:
        # A simple dictionary to map common contractions to full words.
        contractions = {
            "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is",
            "we're": "we are", "they're": "they are", "it's": "it is",
            "can't": "cannot", "don't": "do not", "won't": "will not",
            "isn't": "is not", "aren't": "are not", "didn't": "did not"
        }
        
        # Check each word; if it's in our list, replace it.
        words = text.split()
        return " ".join([contractions.get(word, word) for word in words])

    @staticmethod
    def _remove_symbols(text: str) -> str:
        # We keep letters, numbers, spaces, and the question mark '?' for context.
        return re.sub(r'[^a-z0-9\s?]', '', text)
