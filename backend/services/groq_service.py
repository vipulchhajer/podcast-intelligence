"""Groq API integration for transcription and summarization."""

import httpx
from pathlib import Path
from typing import Optional
from groq import Groq

from config import settings


class GroqService:
    """Service for interacting with Groq API."""
    
    def __init__(self):
        """Initialize Groq client."""
        self.client = Groq(api_key=settings.groq_api_key)
        self.transcription_model = settings.transcription_model
        self.summarization_model = settings.summarization_model
    
    async def transcribe_audio(self, audio_file_path: Path) -> dict:
        """
        Transcribe audio file using Groq's Whisper API.
        
        Args:
            audio_file_path: Path to audio file
        
        Returns:
            Dictionary with transcript text and metadata
        """
        try:
            with open(audio_file_path, "rb") as audio_file:
                # Groq API expects the file object directly
                transcription = self.client.audio.transcriptions.create(
                    file=audio_file,
                    model=self.transcription_model,
                    response_format="verbose_json"
                )
            
            return {
                "text": transcription.text,
                "segments": getattr(transcription, 'segments', []),
                "language": getattr(transcription, 'language', 'en'),
                "duration": getattr(transcription, 'duration', None)
            }
        except AttributeError as e:
            # If audio attribute doesn't exist, try direct API call
            print(f"⚠️  Groq SDK structure different, trying alternative method...")
            return await self._transcribe_with_http(audio_file_path)
    
    async def _transcribe_with_http(self, audio_file_path: Path) -> dict:
        """Fallback transcription using direct HTTP API call."""
        url = "https://api.groq.com/openai/v1/audio/transcriptions"
        
        with open(audio_file_path, "rb") as audio_file:
            files = {"file": (audio_file_path.name, audio_file, "audio/mpeg")}
            data = {
                "model": self.transcription_model,
                "response_format": "verbose_json"
            }
            headers = {
                "Authorization": f"Bearer {settings.groq_api_key}"
            }
            
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(url, files=files, data=data, headers=headers)
                response.raise_for_status()
                result = response.json()
                
                return {
                    "text": result.get("text", ""),
                    "segments": result.get("segments", []),
                    "language": result.get("language", "en"),
                    "duration": result.get("duration", None)
                }
    
    async def summarize_transcript(
        self,
        transcript_text: str,
        podcast_name: Optional[str] = None,
        episode_title: Optional[str] = None,
        host: Optional[str] = None,
        published_date: Optional[str] = None
    ) -> dict:
        """
        Generate summary from transcript using Groq's LLM API.
        
        Args:
            transcript_text: Full transcript text
            podcast_name: Name of the podcast
            episode_title: Title of the episode
            host: Host name(s)
            published_date: Publication date
        
        Returns:
            Dictionary with summary sections
        """
        # Build metadata header
        metadata_header = ""
        if podcast_name:
            metadata_header += f"Podcast: {podcast_name}\n"
        if episode_title:
            metadata_header += f"Episode: {episode_title}\n"
        if host:
            metadata_header += f"Host: {host}\n"
        if published_date:
            metadata_header += f"Date: {published_date}\n"
        if metadata_header:
            metadata_header += "\n"
        
        # Truncate if too long (safety check)
        words = transcript_text.split()
        if len(words) > 40000:
            transcript_text = " ".join(words[:40000])
        
        summary_data = {}
        
        # Store metadata
        summary_data["metadata"] = {
            "podcast": podcast_name or "Unknown",
            "episode": episode_title or "Unknown",
            "host": host or "Unknown",
            "date": published_date or "Unknown",
            "prompt_version": "3.4"
        }
        
        # 1. Executive Summary
        summary_data["executive_summary"] = await self._generate_section(
            transcript_text,
            metadata_header,
            self._get_executive_summary_prompt()
        )
        
        # 2. Key Themes
        summary_data["key_themes"] = await self._generate_section(
            transcript_text,
            metadata_header,
            self._get_key_themes_prompt()
        )
        
        # 3. Notable Quotes
        summary_data["notable_quotes"] = await self._generate_section(
            transcript_text,
            metadata_header,
            self._get_notable_quotes_prompt()
        )
        
        # 4. Actionable Insights
        summary_data["actionable_insights"] = await self._generate_section(
            transcript_text,
            metadata_header,
            self._get_actionable_insights_prompt()
        )
        
        return summary_data
    
    async def _generate_section(
        self,
        transcript: str,
        metadata: str,
        prompt_template: str
    ) -> str:
        """Generate a single summary section."""
        prompt = f"{prompt_template}\n\nCOMPLETE TRANSCRIPT:\n{transcript}\n\n"
        
        chat_completion = self.client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": f"You are analyzing a podcast transcript. {metadata}"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=self.summarization_model,
            temperature=0.3,
            max_tokens=2048,
        )
        
        return chat_completion.choices[0].message.content.strip()
    
    def _get_executive_summary_prompt(self) -> str:
        """Get executive summary prompt."""
        return """Write a concise, scannable executive summary.

CRITICAL INSTRUCTIONS FOR ACCURACY:
- Summarize only what was ACTUALLY discussed in the conversation
- Do NOT add information, interpretations, or conclusions not present in the transcript
- Stick to the facts and main points from the conversation

FORMATTING REQUIREMENTS:
Start with episode identification, then use a structured format that's easy to scan:

Episode: [Podcast Name - Episode Title]
Host: [Name]
Date: [Date]

Overview: A 2-3 sentence overview of what this episode covers and why it matters.

Key Discussion Points:
• Main point 1 with brief context
• Main point 2 with brief context
• Main point 3 with brief context
(Include 3-6 bullet points covering the core topics discussed)"""
    
    def _get_key_themes_prompt(self) -> str:
        """Get key themes prompt."""
        return """Identify 5-10 key themes or topics discussed in this episode.

CRITICAL INSTRUCTIONS FOR ACCURACY:
- Only identify themes that are ACTUALLY discussed in the transcript
- Base your themes on what was EXPLICITLY said, not on assumptions
- Use specific examples or quotes from the conversation to support each theme
- Do NOT invent themes that sound related but weren't actually discussed

FORMATTING REQUIREMENTS:
- PLAIN TEXT ONLY - No asterisks, no markdown, no bold markers
- Number each theme (1., 2., 3., etc.)
- Add a blank line between each theme for readability
- Format as: Number. Theme Title — Brief explanation

Example format:
1. Vision-Based Selling — Explanation of the theme with context from the conversation.

2. Enterprise Sales Strategy — Explanation with specific examples."""
    
    def _get_notable_quotes_prompt(self) -> str:
        """Get notable quotes prompt."""
        return """Extract 5-15 of the most insightful, memorable, or impactful quotes.

CRITICAL INSTRUCTIONS FOR ACCURACY:
- Extract ONLY quotes that appear VERBATIM in the transcript
- Before including a quote, internally confirm it's an EXACT substring of the transcript
- Do NOT paraphrase, summarize, or modify the quotes in any way
- Include COMPLETE thoughts - don't truncate mid-sentence or use small snippets
- Quotes should be 1-4 sentences long (not just fragments or phrases)

QUALITY FILTER - Every quote must score high (0-5 scale):
For each candidate quote, internally score it on:
- Specificity (0-5): Does it contain concrete examples, numbers, named entities, or frameworks?
- Actionability (0-5): Does it tell how to do/decide something?
- Novelty/Insight (0-5): Is it non-obvious or counterintuitive?

Only include quotes where the average score is ≥ 4.

DO NOT include quotes that are:
- Generic platitudes without examples
- Pure praise or name-dropping without insight
- Simple factual statements or introductions
- Unanswered questions, transitions, or filler

FORMATTING REQUIREMENTS:
- PLAIN TEXT ONLY - No asterisks, no markdown, no bold markers
- Number each quote (1., 2., 3., etc.)
- Add a blank line between each quote for readability
- Format as: Number. "Quote text" — Context explanation (when needed)"""
    
    def _get_actionable_insights_prompt(self) -> str:
        """Get actionable insights prompt."""
        return """Extract 5-10 actionable takeaways or insights that a listener could implement in their life.

CRITICAL INSTRUCTIONS FOR ACCURACY:
- Only extract insights that are EXPLICITLY mentioned or clearly implied in the transcript
- Do NOT invent, embellish, or add your own interpretations
- Do NOT create numbered steps unless the podcast EXPLICITLY outlined those steps
- If a specific technique, phrase, or practice is mentioned, quote it EXACTLY as said

FORMATTING REQUIREMENTS:
- PLAIN TEXT ONLY - No asterisks, no markdown, no bold markers
- Number each insight (1., 2., 3., etc.)
- Add a blank line between each insight for readability
- Format as: Number. Title — Explanation in a single paragraph

Focus on insights that fall into these categories:
1. Behaviors & Routines
2. Mindset Shifts
3. Specific Actions
4. Communication Skills
5. Decision-Making Frameworks
6. Relationship Practices
7. Self-Awareness Techniques
8. Emotional Regulation
9. Productivity Systems
10. Learning Methods"""


# Create singleton instance
groq_service = GroqService()

