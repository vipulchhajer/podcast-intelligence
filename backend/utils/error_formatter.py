"""
Human-friendly error message formatter.
Converts technical API errors into user-friendly messages.
"""

import re


def format_error_for_user(error_message: str) -> str:
    """
    Convert technical error messages into human-friendly ones.
    
    Args:
        error_message: Raw error from API or system
    
    Returns:
        User-friendly error message
    """
    if not error_message:
        return "An unexpected error occurred. Please try again."
    
    error_lower = error_message.lower()
    
    # 1. Rate Limit - Transcription (Whisper)
    if "rate limit" in error_lower and "whisper" in error_lower:
        # Try to extract wait time
        wait_match = re.search(r'try again in (\d+)m(\d+(?:\.\d+)?)s', error_message)
        if wait_match:
            minutes = int(wait_match.group(1))
            seconds = int(float(wait_match.group(2)))
            wait_time = f"{minutes} minute{'s' if minutes != 1 else ''}" if minutes > 0 else f"{seconds} seconds"
            return f"You've hit your hourly transcription limit. The system will automatically retry in {wait_time}. No action needed!"
        else:
            return "You've hit your hourly transcription limit. The system will automatically retry when the limit resets. No action needed!"
    
    # 2. Rate Limit - Summarization (Llama)
    if "rate limit" in error_lower and ("llama" in error_lower or "token" in error_lower):
        wait_match = re.search(r'try again in (\d+(?:\.\d+)?)s', error_message)
        if wait_match:
            seconds = int(float(wait_match.group(1)))
            return f"Processing too fast! The system will automatically retry in {seconds} seconds. No action needed!"
        else:
            return "Processing limit reached. The system will automatically retry shortly. No action needed!"
    
    # 3. File Too Large
    if "file" in error_lower and ("large" in error_lower or "size" in error_lower or "limit" in error_lower):
        return "This audio file is too large. The system will automatically compress it and try again."
    
    # 4. Invalid Audio Format
    if "format" in error_lower or "codec" in error_lower or "invalid audio" in error_lower:
        return "This audio format isn't supported. Please use MP3, WAV, or M4A files."
    
    # 5. Network/Connection Errors
    if any(word in error_lower for word in ["network", "connection", "timeout", "timed out", "unreachable"]):
        return "Connection issue detected. The system will automatically retry. Check your internet connection."
    
    # 6. API Key Issues
    if "api key" in error_lower or "authentication" in error_lower or "unauthorized" in error_lower:
        return "API authentication issue. Please contact support - this is a configuration problem."
    
    # 7. Disk Space
    if "disk" in error_lower or "storage" in error_lower or "no space" in error_lower:
        return "Server storage is full. Please contact support to free up space."
    
    # 8. Missing Episode/Podcast
    if "not found" in error_lower and ("episode" in error_lower or "podcast" in error_lower):
        return "This episode is no longer available in the podcast feed. It may have been removed by the publisher."
    
    # 9. Download Failed
    if "download" in error_lower and ("failed" in error_lower or "error" in error_lower):
        return "Failed to download the audio file. The podcast URL may be broken or the file may have been removed."
    
    # 10. Generic Rate Limit (catch-all)
    if "rate limit" in error_lower or "too many requests" in error_lower:
        return "You're processing episodes too quickly. The system will automatically retry. Just wait a moment!"
    
    # 11. Transcription Failed (Generic)
    if "transcription" in error_lower or "transcribe" in error_lower:
        return "Failed to transcribe the audio. The file may be corrupt or in an unsupported format. Try downloading the episode again."
    
    # 12. Summarization Failed (Generic)
    if "summar" in error_lower:
        return "Failed to generate summary. The transcript may be too complex. Try processing the episode again."
    
    # Default: Keep it simple if we don't recognize the error
    # But remove technical junk like error codes, JSON, org IDs
    cleaned = re.sub(r'Error code: \d+\s*-\s*', '', error_message)
    cleaned = re.sub(r'\{[^}]*\}', '', cleaned)  # Remove JSON
    cleaned = re.sub(r'org_[a-zA-Z0-9]+', '', cleaned)  # Remove org IDs
    cleaned = re.sub(r'service tier `[^`]+`', '', cleaned)  # Remove service tier
    cleaned = cleaned.strip()
    
    # If it's still too long (>200 chars), truncate with a helpful message
    if len(cleaned) > 200:
        return f"{cleaned[:200]}... The system will automatically retry. If this persists, please contact support."
    
    return cleaned if cleaned else "An unexpected error occurred. The system will automatically retry."


def format_error_with_action(error_message: str, action: str = "retry") -> dict:
    """
    Format error with suggested action.
    
    Args:
        error_message: Raw error message
        action: Suggested action (retry, contact_support, wait, etc.)
    
    Returns:
        Dict with friendly_message and suggested_action
    """
    friendly = format_error_for_user(error_message)
    
    # Determine action based on error type
    if "automatically retry" in friendly.lower():
        suggested_action = "wait"
    elif "contact support" in friendly.lower():
        suggested_action = "contact_support"
    elif "check your" in friendly.lower():
        suggested_action = "check_settings"
    else:
        suggested_action = action
    
    return {
        "friendly_message": friendly,
        "suggested_action": suggested_action,
        "original_error": error_message  # Keep for debugging
    }

