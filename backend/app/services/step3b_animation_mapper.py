from typing import Dict, Any, List

SENTIMENT_MAP: Dict[str, str] = {
    "HAPPY": "sa001",
    "SAD": "sa002",
    "NEUTRAL": "sa003",
    "ANGRY": "sa004",
    "SURPRISED": "sa005",
    "FEAR": "sa006",
    "DISGUST": "sa007",
    "EXCITED": "sa008",
    "BORED": "sa009",
    "CONFUSED": "sa010"
}

GESTURE_MAP: Dict[str, str] = {
    "YESTERDAY": "ga045", "TODAY": "ga046", "TOMORROW": "ga047",
    "NOW": "ga048", "LATER": "ga049", "MORNING": "ga050",
    "AFTERNOON": "ga051", "EVENING": "ga052", "NIGHT": "ga053", "SOON": "ga054",
    
    "WHO": "ga101", "WHAT": "ga102", "WHERE": "ga103",
    "WHEN": "ga104", "WHY": "ga105", "HOW": "ga106", "WHICH": "ga107",
    
    "NOT": "ga201", "NO": "ga202", "NEVER": "ga203", 
    "NONE": "ga204", "NOTHING": "ga205",
    
    "RUN": "ga301", "WALK": "ga302", "EAT": "ga303", "DRINK": "ga304",
    "SLEEP": "ga305", "WORK": "ga306", "PLAY": "ga307", "HELP": "ga308",
    "FAST": "ga309", "SLOW": "ga310", "GOOD": "ga311", "BAD": "ga312",
    "BEAUTIFUL": "ga313", "UGLY": "ga314", "HAPPY": "ga315", "SAD": "ga316",
    
    "I": "ga401", "YOU": "ga402", "HE": "ga403", 
    "SHE": "ga404", "WE": "ga405", "THEY": "ga406"
}

def get_sentiment_animation_id(emotion_id: str) -> str:
    return SENTIMENT_MAP.get(emotion_id.upper(), "sa003")

def get_gesture_animation_ids(asl_tokens: List[str]) -> List[str]:
    animation_ids: List[str] = []
    
    for token in asl_tokens:
        clean_token = token.replace("G_", "").upper()
        if clean_token in GESTURE_MAP:
            animation_ids.append(GESTURE_MAP[clean_token])
        else:
            for char in clean_token:
                if char.isalpha():
                    animation_ids.append(f"gaLET_{char}")
                elif char.isdigit():
                    animation_ids.append(f"gaNUM_{char}")
                    
    return animation_ids

def map_animations(nlp_data: Dict[str, Any], asl_data: Dict[str, Any]) -> Dict[str, Any]:
    emotion_id = nlp_data.get("emotion_id", "NEUTRAL")
    sa_id = get_sentiment_animation_id(emotion_id)
    
    asl_sequence_str = asl_data.get("asl_grammar_output", "")
    asl_tokens = asl_sequence_str.split() if asl_sequence_str else []
    
    animation_sequence: List[Dict[str, Any]] = []
    all_ga_ids: List[str] = []
    
    for token in asl_tokens:
        token_ga_ids = get_gesture_animation_ids([token])
        animation_sequence.append({
            "word": token,
            "gesture_ids": token_ga_ids
        })
        all_ga_ids.extend(token_ga_ids)
    
    return {
        "sentiment_animation_id": sa_id,
        "gesture_animation_ids": all_ga_ids,
        "animation_sequence": animation_sequence
    }
