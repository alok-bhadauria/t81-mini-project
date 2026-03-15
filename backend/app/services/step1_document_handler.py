from typing import Optional, Dict, Any

def extract_text_from_document(file_metadata: Optional[Dict[str, Any]]) -> str:
    if not file_metadata:
        return ""
        
    extracted_text = file_metadata.get("text", "")
    
    if not isinstance(extracted_text, str):
        return str(extracted_text)
        
    return extracted_text.strip()
