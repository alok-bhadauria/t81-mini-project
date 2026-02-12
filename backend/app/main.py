from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.core.input_handler import InputHandler
from app.core.text_processor import TextProcessor
from app.core.linguistic_engine import LinguisticEngine

# Initialize the API app.
app = FastAPI(title="SignFusion API", version="0.1.0")

# Enable CORS so the frontend (running on a different port) can talk to us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins (for development only).
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc).
    allow_headers=["*"], # Allows all headers.
)

# Define what valid input looks like (must have text, is_audio is optional).
class SignRequest(BaseModel):
    text: str
    is_audio: bool = False

# Define what our response will look like (so frontend knows what to expect).
class SignResponse(BaseModel):
    original: str
    gloss: list[str]
    emotion: str

@app.get("/")
def read_root():
    # Simple check to see if server is online.
    return {"message": "SignFusion API is running."}

@app.post("/process", response_model=SignResponse)
def process_content(request: SignRequest):
    # This is the main function that runs the whole pipeline.
    try:
        # Step 1: Handle the raw input (convert audio if needed).
        raw_text = InputHandler.process_input(request.text, request.is_audio)
        
        # Step 2: Clean and normalize the text.
        normalized_text = TextProcessor.normalize_text(raw_text)
        
        # Step 3: Run linguistic analysis to get gestures and emotion.
        result = LinguisticEngine.process_sentence(normalized_text)
        
        # Return the structured result to the frontend.
        return SignResponse(
            original=raw_text,
            gloss=result["asl_tokens"],
            emotion=result["emotion_id"]
        )
        
    except Exception as e:
        # If something goes wrong, tell the user what happened.
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 8000.
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
