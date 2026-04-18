import logging
from app.services.a_nlp_service import NLPService
from app.services.b_translation_service import TranslationService
from app.services.c_animation_service import AnimationService
from app.services.d_output_service import OutputService
from app.db.task_repository import TaskRepository
from app.schemas.text import TextInputResponse

logger = logging.getLogger(__name__)

class PipelineOrchestrator:
    def __init__(self, 
                 repository: TaskRepository,
                 nlp_service: NLPService = None,
                 translation_service: TranslationService = None,
                 animation_service: AnimationService = None,
                 output_service: OutputService = None):
        
        self.repository = repository
        self.nlp = nlp_service or NLPService()
        self.translation = translation_service or TranslationService()
        self.animation = animation_service or AnimationService()
        self.output_handler = output_service or OutputService()

    async def run(self, raw_text: str, user_id: str, input_type: str, file_metadata: dict = None) -> TextInputResponse:
        logger.info(f"Orchestrator: Kicking off rigid AI Translation flow for User: {user_id}")
        
        nlp_result = await self.nlp.process(raw_text)
        
        translation_result = self.translation.translate(nlp_result)
        
        animation_package = self.animation.map(nlp_result.emotion_id, translation_result.asl_tokens)
        
        await self.repository.create_task(
            user_id=user_id,
            input_type=input_type,
            raw_text=raw_text,
            processed_text=nlp_result.processed_text,
            emotion_id=nlp_result.emotion_id,
            asl_grammar_output=translation_result.asl_grammar_output,
            sentiment_animation_id=animation_package["sentiment_animation_id"],
            gesture_animation_ids=animation_package["gesture_animation_ids"],
            animation_sequence=animation_package["animation_sequence"],
            file_metadata=file_metadata
        )
        
        return self.output_handler.format_api_response(
            processed_text=nlp_result.processed_text,
            asl_grammar_output=translation_result.asl_grammar_output,
            sentiment_animation_id=animation_package["sentiment_animation_id"],
            gesture_animation_ids=animation_package["gesture_animation_ids"],
            animation_sequence=animation_package["animation_sequence"]
        )
