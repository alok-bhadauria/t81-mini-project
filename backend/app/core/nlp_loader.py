import spacy
import logging

logger = logging.getLogger(__name__)

try:
    nlp = spacy.load("en_core_web_sm")
    logger.info("SpaCy model 'en_core_web_sm' loaded successfully.")
except OSError:
    nlp = None
