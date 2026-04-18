import spacy
import logging

logger = logging.getLogger(__name__)

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    logger.warning("SpaCy model 'en_core_web_sm' is missing. NLP operations will fail during runtime.")
    nlp = None
