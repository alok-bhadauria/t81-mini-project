import re
from spellchecker import SpellChecker
from app.core.exceptions import AppException

spell = SpellChecker()

MAX_INPUT_LENGTH = 1000

_COMMON_TYPO_PATTERNS = re.compile(r"(.)\1{2,}")


def _is_likely_name_or_unknown(word: str) -> bool:
    if not spell.known([word]):
        candidates = spell.candidates(word) or set()
        if not candidates:
            return True
        if len(word) >= 4 and not _COMMON_TYPO_PATTERNS.search(word):
            return True
    return False


def _correct_word_token(word: str) -> str:
    if len(word) <= 1:
        return word
    if word.isupper() or word.isnumeric():
        return word
    if spell.known([word]):
        return word
    if _is_likely_name_or_unknown(word):
        return word

    reduced = re.sub(r"(.)\1{2,}", r"\1\1", word)
    if reduced != word:
        corr = spell.correction(reduced)
        if corr and spell.known([corr]):
            return corr

    corr = spell.correction(word)
    if corr and corr != word and spell.known([corr]):
        return corr

    return word


def _spellcheck_string(text: str) -> str:
    def replace_match(match):
        word = match.group(0)

        if word.istitle() and len(word) > 1:
            return word

        is_upper = word.isupper()
        corrected = _correct_word_token(word.lower() if not is_upper else word)

        if is_upper:
            return corrected.upper()
        return corrected

    return re.sub(r"\b[A-Za-z]+\b", replace_match, text)


def clean_text(raw_text: str) -> str:
    if not isinstance(raw_text, str) or not raw_text.strip():
        raise AppException("Input text must be a non-empty string.", 400)

    truncated = raw_text[:MAX_INPUT_LENGTH]
    return _spellcheck_string(truncated)
