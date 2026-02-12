from typing import Union

class InputHandler:
    # This class handles the very first step: getting input from the user (text or audio).
    
    @staticmethod
    def process_input(data: Union[str, bytes], is_audio: bool = False) -> str:
        # If the input is audio, we need to convert it to text first.
        if is_audio:
            return InputHandler._convert_speech_to_text(data)
            
        # If it's already text, we just return it as a string.
        return str(data)

    @staticmethod
    def _convert_speech_to_text(audio_data: bytes) -> str:
        # Placeholder: This is where we will later add Whisper or Vosk to listen to audio.
        return "Placeholder text from audio"
