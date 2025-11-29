"""Groq API integration for transcription and summarization."""

import httpx
import asyncio
import re
from pathlib import Path
from typing import Optional
from groq import Groq, RateLimitError

from config import settings


class GroqService:
    """Service for interacting with Groq API."""
    
    def __init__(self):
        """Initialize Groq client."""
        self.client = Groq(api_key=settings.groq_api_key)
        self.transcription_model = settings.transcription_model
        self.summarization_model = settings.summarization_model
    
    def _parse_wait_time_from_error(self, error_message: str) -> int:
        """
        Parse wait time from Groq rate limit error message.
        
        Example: "Please try again in 1m59.5s" -> 119 seconds
        Example: "Please try again in 30s" -> 30 seconds
        """
        # Try to find pattern like "1m59.5s" or "30s"
        match = re.search(r'try again in (\d+)m(\d+(?:\.\d+)?)s', error_message)
        if match:
            minutes = int(match.group(1))
            seconds = float(match.group(2))
            return int(minutes * 60 + seconds) + 5  # Add 5s buffer
        
        # Try pattern like "30s" or "45.5s"
        match = re.search(r'try again in (\d+(?:\.\d+)?)s', error_message)
        if match:
            return int(float(match.group(1))) + 5  # Add 5s buffer
        
        # Default fallback
        return 120  # 2 minutes default
    
    async def _retry_on_rate_limit(self, func, *args, max_retries=3, **kwargs):
        """
        Retry a function call with intelligent wait on rate limit errors.
        Parses the exact wait time from Groq's error message.
        
        Args:
            func: Function to call
            max_retries: Maximum number of retry attempts
            *args, **kwargs: Arguments to pass to function
        
        Returns:
            Result from function call
        """
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except RateLimitError as e:
                error_msg = str(e)
                
                if attempt < max_retries - 1:
                    # Parse wait time from error message
                    wait_time = self._parse_wait_time_from_error(error_msg)
                    
                    print(f"⚠️  Rate limit hit: {error_msg}")
                    print(f"⏳ Waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                    
                    await asyncio.sleep(wait_time)
                else:
                    print(f"❌ Rate limit error after {max_retries} attempts: {error_msg}")
                    raise Exception(f"Rate limit exceeded after {max_retries} retries. Please try again later. ({error_msg})")
            except Exception as e:
                # For other errors, don't retry
                error_type = type(e).__name__
                print(f"❌ API error ({error_type}): {str(e)}")
                raise
        
        # Should never reach here
        raise Exception("Retry logic failed unexpectedly")
    
    async def transcribe_audio(self, audio_file_path: Path) -> dict:
        """
        Transcribe audio file using Groq's Whisper API with retry logic.
        
        Args:
            audio_file_path: Path to audio file
        
        Returns:
            Dictionary with transcript text and metadata
        """
        try:
            # Use retry logic for transcription
            transcription = await self._retry_on_rate_limit(
                self._transcribe_with_sdk,
                audio_file_path
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
    
    def _transcribe_with_sdk(self, audio_file_path: Path):
        """Internal method to transcribe with SDK (for retry wrapper)."""
        with open(audio_file_path, "rb") as audio_file:
            return self.client.audio.transcriptions.create(
                file=audio_file,
                model=self.transcription_model,
                response_format="verbose_json"
            )
    
    async def _transcribe_with_http(self, audio_file_path: Path) -> dict:
        """Fallback transcription using direct HTTP API call with retry logic."""
        url = "https://api.groq.com/openai/v1/audio/transcriptions"
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
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
                        
                        # Check for rate limit (status code 429)
                        if response.status_code == 429:
                            error_data = response.json()
                            error_msg = error_data.get("error", {}).get("message", str(response.text))
                            
                            if attempt < max_retries - 1:
                                wait_time = self._parse_wait_time_from_error(error_msg)
                                print(f"⚠️  HTTP Rate limit hit: {error_msg}")
                                print(f"⏳ Waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                                await asyncio.sleep(wait_time)
                                continue
                            else:
                                raise Exception(f"Rate limit exceeded after {max_retries} retries: {error_msg}")
                        
                        response.raise_for_status()
                        result = response.json()
                        
                        return {
                            "text": result.get("text", ""),
                            "segments": result.get("segments", []),
                            "language": result.get("language", "en"),
                            "duration": result.get("duration", None)
                        }
            
            except httpx.HTTPStatusError as e:
                if e.response.status_code != 429:
                    # Non-rate-limit error, don't retry
                    raise
                # Rate limit error will be caught in the next iteration
    
    def _estimate_tokens(self, text: str) -> int:
        """
        Estimate token count for text.
        Rough estimate: 1 token ≈ 0.75 words (or 4 characters)
        """
        # Use character-based estimate (more accurate for long text)
        return len(text) // 4
    
    def _chunk_transcript(self, transcript: str, max_tokens: int = 24000) -> list[str]:
        """
        Split transcript into chunks that fit within token limit.
        Optimized for Groq Pay-As-You-Go tier (115k tokens/min).
        
        Args:
            transcript: Full transcript text
            max_tokens: Maximum tokens per chunk (default 24000 for paid tier)
        
        Returns:
            List of transcript chunks
        """
        estimated_tokens = self._estimate_tokens(transcript)
        
        # If under limit, return as-is
        if estimated_tokens <= max_tokens:
            return [transcript]
        
        # Split into chunks
        words = transcript.split()
        chunk_size = int(max_tokens * 0.75)  # Convert tokens to approximate words
        chunks = []
        
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
        
        print(f"📊 Split transcript into {len(chunks)} chunks (estimated {estimated_tokens} tokens)")
        return chunks
    
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
        Handles long transcripts by chunking if needed.
        
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
        
        summary_data = {}
        
        # Store metadata
        summary_data["metadata"] = {
            "podcast": podcast_name or "Unknown",
            "episode": episode_title or "Unknown",
            "host": host or "Unknown",
            "date": published_date or "Unknown",
            "prompt_version": "3.6"  # Optimized for Groq paid tier
        }
        
        # Check if transcript needs chunking
        # Paid tier: 115k tokens/min, so we can handle much larger transcripts
        estimated_tokens = self._estimate_tokens(transcript_text)
        print(f"📊 Transcript estimated at {estimated_tokens} tokens")
        
        if estimated_tokens > 24000:
            print(f"⚠️  Transcript too large, using chunked summarization")
            
            # 1. Executive Summary (from chunks)
            summary_data["executive_summary"] = await self._generate_section_chunked(
                transcript_text,
                metadata_header,
                self._get_executive_summary_prompt()
            )
            
            # 2. Key Themes (from chunks)
            summary_data["key_themes"] = await self._generate_section_chunked(
                transcript_text,
                metadata_header,
                self._get_key_themes_prompt()
            )
            
            # 3. Notable Quotes (from chunks)
            summary_data["notable_quotes"] = await self._generate_section_chunked(
                transcript_text,
                metadata_header,
                self._get_notable_quotes_prompt()
            )
            
            # 4. Actionable Insights (from chunks)
            summary_data["actionable_insights"] = await self._generate_section_chunked(
                transcript_text,
                metadata_header,
                self._get_actionable_insights_prompt()
            )
        else:
            # Standard processing for normal-sized transcripts
            print(f"✓ Transcript size OK, using standard summarization")
            
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
        """Generate a single summary section with retry logic."""
        prompt = f"{prompt_template}\n\nCOMPLETE TRANSCRIPT:\n{transcript}\n\n"
        
        chat_completion = await self._retry_on_rate_limit(
            self.client.chat.completions.create,
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
    
    async def _generate_section_chunked(
        self,
        transcript: str,
        metadata: str,
        prompt_template: str
    ) -> str:
        """
        Generate summary section from a large transcript by chunking.
        Summarizes each chunk, then combines the summaries.
        """
        # Split transcript into manageable chunks
        chunks = self._chunk_transcript(transcript, max_tokens=8000)
        
        if len(chunks) == 1:
            # If only one chunk, use standard method
            return await self._generate_section(chunks[0], metadata, prompt_template)
        
        print(f"🔄 Processing {len(chunks)} chunks for this section...")
        
        # Step 1: Summarize each chunk
        chunk_summaries = []
        for i, chunk in enumerate(chunks, 1):
            print(f"  📝 Processing chunk {i}/{len(chunks)}...")
            
            chunk_prompt = f"{prompt_template}\n\nTRANSCRIPT CHUNK {i}/{len(chunks)}:\n{chunk}\n\n"
            
            chat_completion = await self._retry_on_rate_limit(
                self.client.chat.completions.create,
                messages=[
                    {
                        "role": "system",
                        "content": f"You are analyzing a podcast transcript. {metadata}This is part {i} of {len(chunks)}."
                    },
                    {
                        "role": "user",
                        "content": chunk_prompt
                    }
                ],
                model=self.summarization_model,
                temperature=0.3,
                max_tokens=2048,
            )
            
            chunk_summary = chat_completion.choices[0].message.content.strip()
            chunk_summaries.append(chunk_summary)
            
            # No delay needed with paid tier (115k tokens/min limit)
        
        print(f"  ✓ All chunks processed, combining results...")
        
        # Step 2: Combine chunk summaries into final summary
        combined_text = "\n\n---\n\n".join(chunk_summaries)
        
        combine_prompt = f"""I have summarized a long podcast transcript in {len(chunks)} parts. 
Now combine these partial summaries into a single, cohesive final summary.

IMPORTANT:
- Merge overlapping or duplicate points
- Maintain the structure from the original prompt
- Keep the most important and unique insights
- Remove redundancy while preserving all key information

{prompt_template}

PARTIAL SUMMARIES TO COMBINE:
{combined_text}

Provide the final combined summary:"""
        
        final_completion = await self._retry_on_rate_limit(
            self.client.chat.completions.create,
            messages=[
                {
                    "role": "system",
                    "content": f"You are combining partial summaries into a final cohesive summary. {metadata}"
                },
                {
                    "role": "user",
                    "content": combine_prompt
                }
            ],
            model=self.summarization_model,
            temperature=0.3,
            max_tokens=3072,  # Allow more tokens for combined output
        )
        
        return final_completion.choices[0].message.content.strip()
    
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

