def extract_text_from_document(file_metadata: dict) -> str:
    if file_metadata and file_metadata.get("text"):
        return file_metadata["text"]
    return ""
