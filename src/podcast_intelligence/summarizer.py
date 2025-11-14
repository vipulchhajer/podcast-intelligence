"""Podcast transcript summarization using Ollama."""

import json
from pathlib import Path
from typing import Optional

import httpx
from rich.console import Console
from rich.panel import Panel

console = Console()


class PodcastSummarizer:
    """Summarize podcast transcripts using local LLM via Ollama."""
    
    def __init__(
        self,
        model: str = "llama3.2",
        ollama_host: str = "http://localhost:11434",
        num_ctx: int = 32768
    ):
        """
        Initialize the summarizer.
        
        Args:
            model: Ollama model name
            ollama_host: Ollama API endpoint
            num_ctx: Context window size (tokens). Default 32768 (~24k words)
                    Llama 3.2 supports up to 131072 tokens.
        """
        self.model = model
        self.ollama_host = ollama_host
        self.num_ctx = num_ctx
        console.print(f"🤖 Initializing summarizer with model: [bold blue]{model}[/bold blue]")
        console.print(f"   Context window: [dim]{num_ctx:,} tokens (~{int(num_ctx * 0.75):,} words)[/dim]")
    
    def _call_ollama(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Call Ollama API to generate text.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt for context
        
        Returns:
            Generated text response
        """
        url = f"{self.ollama_host}/api/generate"
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_ctx": self.num_ctx
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        try:
            with httpx.Client(timeout=300.0) as client:  # 5 min timeout
                response = client.post(url, json=payload)
                response.raise_for_status()
                result = response.json()
                return result["response"].strip()
        except httpx.HTTPError as e:
            console.print(f"[red]✗ Error calling Ollama: {e}[/red]")
            raise
    
    def summarize(
        self, 
        transcript_text: str,
        podcast_name: Optional[str] = None,
        episode_title: Optional[str] = None,
        host: Optional[str] = None,
        published_date: Optional[str] = None
    ) -> dict:
        """
        Generate a comprehensive summary of a podcast transcript.
        
        Args:
            transcript_text: Full transcript text
            podcast_name: Name of the podcast
            episode_title: Title of the episode
            host: Host name(s)
            published_date: Publication date
        
        Returns:
            Dictionary with summary, key themes, quotes, and insights
        """
        console.print("\n🧠 [bold cyan]Generating summary...[/bold cyan]")
        
        # Truncate if too long (Llama 3.2 can handle ~98k words, but we'll cap at 40k for safety)
        words = transcript_text.split()
        if len(words) > 40000:
            console.print(f"[yellow]⚠ Transcript is very long ({len(words)} words). Using first 40,000 words.[/yellow]")
            transcript_text = " ".join(words[:40000])
        else:
            console.print(f"[dim]📄 Transcript length: {len(words):,} words (within model capacity)[/dim]")
        
        summary_data = {}
        
        # Store metadata
        if podcast_name or episode_title or host or published_date:
            summary_data["metadata"] = {
                "podcast": podcast_name or "Unknown",
                "episode": episode_title or "Unknown",
                "host": host or "Unknown",
                "date": published_date or "Unknown"
            }
        
        # Build metadata header for prompts
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
        
        # 1. Executive Summary
        console.print("  📝 Creating executive summary...")
        summary_prompt = f"""You are analyzing a complete podcast transcript. {metadata_header}Write a concise 2-3 paragraph executive summary.

CRITICAL INSTRUCTIONS FOR ACCURACY:
- Summarize only what was ACTUALLY discussed in the conversation
- Do NOT add information, interpretations, or conclusions not present in the transcript
- Stick to the facts and main points from the conversation

Start your summary by clearly identifying the podcast, episode, host, and date (if provided above), then capture the main topic and key points discussed.

COMPLETE TRANSCRIPT:
{transcript_text}

Executive Summary:"""
        
        summary_data["executive_summary"] = self._call_ollama(summary_prompt)
        
        # 2. Key Themes
        console.print("  🎯 Extracting key themes...")
        themes_prompt = f"""You are analyzing a complete podcast transcript. Identify 3-8 key themes or topics discussed in this episode.

CRITICAL INSTRUCTIONS FOR ACCURACY:
- Only identify themes that are ACTUALLY discussed in the transcript
- Base your themes on what was EXPLICITLY said, not on assumptions
- Use specific examples or quotes from the conversation to support each theme
- Do NOT invent themes that sound related but weren't actually discussed

Focus on the most important and recurring themes throughout the conversation.

FORMATTING REQUIREMENTS:
- Number each theme (1., 2., 3., etc.)
- Add a blank line between each theme for readability
- Format as: **Theme Title**: Brief explanation

Example format:
1. **Theme Title Here**: Explanation of the theme with context from the conversation.

2. **Another Theme**: Explanation with specific examples.

COMPLETE TRANSCRIPT:
{transcript_text}

Key Themes (3-8):"""
        
        summary_data["key_themes"] = self._call_ollama(themes_prompt)
        
        # 3. Notable Quotes
        console.print("  💬 Finding notable quotes...")
        quotes_prompt = f"""You are analyzing a complete podcast transcript. Extract up to 10 of the most insightful, memorable, or impactful quotes from this transcript.

CRITICAL INSTRUCTIONS FOR ACCURACY:
- Extract ONLY quotes that appear VERBATIM in the transcript
- Do NOT paraphrase, summarize, or modify the quotes in any way
- Copy the EXACT words from the transcript
- If you're unsure about the exact wording, do not include that quote

Focus on quotes that:
- Sparked a longer or deeper discussion
- Represent key insights or turning points in the conversation
- Are particularly memorable or thought-provoking

FORMATTING REQUIREMENTS:
- Number each quote (1., 2., 3., etc.)
- Add a blank line between each quote for readability
- Format as: Quote in quotation marks, followed by context on a new line

Example format:
1. "The exact quote word-for-word from the transcript."
   Context: What was being discussed, who said it, and why it mattered.

2. "Another exact quote from the conversation."
   Context: The situation and significance of this quote.

COMPLETE TRANSCRIPT:
{transcript_text}

Notable Quotes (up to 10):"""
        
        summary_data["notable_quotes"] = self._call_ollama(quotes_prompt)
        
        # 4. Actionable Insights
        console.print("  💡 Generating actionable insights...")
        insights_prompt = f"""You are analyzing a complete podcast transcript. Extract 4-10 actionable takeaways or insights that a listener could implement in their life.

CRITICAL INSTRUCTIONS FOR ACCURACY:
- Only extract insights that are EXPLICITLY mentioned or clearly implied in the transcript
- Do NOT invent, embellish, or add your own interpretations
- If a specific technique, phrase, or practice is mentioned, quote it EXACTLY as said
- When describing how to do something, use the EXACT language and steps from the conversation
- If you're unsure about a detail, skip that insight rather than guessing
- Verify each insight against the transcript before including it

FORMATTING REQUIREMENTS:
- Number each insight (1., 2., 3., etc.)
- Add a blank line between each insight for readability
- Format as: **Insight Title**: Explanation with actionable steps

Focus on insights that fall into these categories (but don't limit yourself to only these):

1. **Behaviors & Routines**: Daily habits, rituals, or practices someone could adopt
2. **Mindset Shifts**: Ways to reframe thoughts, feelings, or beliefs
3. **Specific Actions**: Concrete steps or actions someone could take immediately or over time
4. **Joy & Distinction**: Actions or behaviors that bring joy, fulfillment, or make someone stand out
5. **Communication Skills**: Examples of skillfully navigating conversations or interactions with others
6. **Decision-Making Frameworks**: Mental models or frameworks for making better decisions
7. **Relationship Practices**: Ways to improve connections with others
8. **Self-Awareness Techniques**: Methods for better understanding oneself
9. **Emotional Regulation**: Techniques for managing stress, anxiety, or difficult emotions
10. **Productivity Systems**: Time management or workflow strategies mentioned
11. **Learning Methods**: Ways to learn or develop new skills more effectively
12. **Physical Practices**: Body-based practices (breathing, movement, posture) that affect mental state
13. **Boundary Setting**: How to set healthy boundaries in work or relationships
14. **Creativity Techniques**: Methods to enhance creative thinking or problem-solving
15. **Discomfort Practice**: Ways to intentionally practice being uncomfortable for growth

For each insight:
- Be ACCURATE to what was actually said in the conversation
- Be specific (avoid vague advice like "be more mindful")
- Include the context from the conversation that led to this insight
- Make it actionable (something you can actually DO)
- If a specific technique, practice, or framework is named, include its EXACT name and how to do it

COMPLETE TRANSCRIPT:
{transcript_text}

Actionable Insights (4-10):"""
        
        summary_data["actionable_insights"] = self._call_ollama(insights_prompt)
        
        console.print("✓ [green]Summary generation complete![/green]\n")
        
        return summary_data
    
    def save_summary(self, summary_data: dict, output_dir: Path) -> Path:
        """
        Save summary to files (JSON and formatted text).
        
        Args:
            summary_data: Summary dictionary
            output_dir: Directory to save summary files
        
        Returns:
            Path to the text summary file
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save JSON
        json_path = output_dir / "summary.json"
        json_path.write_text(json.dumps(summary_data, indent=2))
        console.print(f"💾 Saved summary JSON: [green]{json_path}[/green]")
        
        # Save formatted text
        text_path = output_dir / "summary.txt"
        formatted_text = self._format_summary_text(summary_data)
        text_path.write_text(formatted_text)
        console.print(f"💾 Saved formatted summary: [green]{text_path}[/green]")
        
        return text_path
    
    def _format_summary_text(self, summary_data: dict) -> str:
        """Format summary data as readable text."""
        sections = []
        
        sections.append("=" * 80)
        sections.append("PODCAST SUMMARY")
        sections.append("=" * 80)
        sections.append("")
        
        # Add metadata if available
        if "metadata" in summary_data:
            meta = summary_data["metadata"]
            sections.append("EPISODE INFORMATION")
            sections.append("-" * 80)
            sections.append(f"Podcast: {meta.get('podcast', 'Unknown')}")
            sections.append(f"Episode: {meta.get('episode', 'Unknown')}")
            sections.append(f"Host: {meta.get('host', 'Unknown')}")
            sections.append(f"Date: {meta.get('date', 'Unknown')}")
            sections.append("")
        
        if "executive_summary" in summary_data:
            sections.append("EXECUTIVE SUMMARY")
            sections.append("-" * 80)
            sections.append(summary_data["executive_summary"])
            sections.append("")
        
        if "key_themes" in summary_data:
            sections.append("KEY THEMES")
            sections.append("-" * 80)
            sections.append(summary_data["key_themes"])
            sections.append("")
        
        if "notable_quotes" in summary_data:
            sections.append("NOTABLE QUOTES")
            sections.append("-" * 80)
            sections.append(summary_data["notable_quotes"])
            sections.append("")
        
        if "actionable_insights" in summary_data:
            sections.append("ACTIONABLE INSIGHTS")
            sections.append("-" * 80)
            sections.append(summary_data["actionable_insights"])
            sections.append("")
        
        sections.append("=" * 80)
        
        return "\n".join(sections)
    
    def display_summary(self, summary_data: dict):
        """Display summary in a nice format in the terminal."""
        # Display metadata first
        if "metadata" in summary_data:
            meta = summary_data["metadata"]
            metadata_text = f"""📻 Podcast: {meta.get('podcast', 'Unknown')}
📝 Episode: {meta.get('episode', 'Unknown')}
🎙️ Host: {meta.get('host', 'Unknown')}
📅 Date: {meta.get('date', 'Unknown')}"""
            console.print(Panel(
                metadata_text,
                title="[bold white]Episode Information[/bold white]",
                border_style="white"
            ))
            console.print()
        
        if "executive_summary" in summary_data:
            console.print(Panel(
                summary_data["executive_summary"],
                title="[bold cyan]📝 Executive Summary[/bold cyan]",
                border_style="cyan"
            ))
            console.print()
        
        if "key_themes" in summary_data:
            console.print(Panel(
                summary_data["key_themes"],
                title="[bold yellow]🎯 Key Themes[/bold yellow]",
                border_style="yellow"
            ))
            console.print()
        
        if "notable_quotes" in summary_data:
            console.print(Panel(
                summary_data["notable_quotes"],
                title="[bold green]💬 Notable Quotes[/bold green]",
                border_style="green"
            ))
            console.print()
        
        if "actionable_insights" in summary_data:
            console.print(Panel(
                summary_data["actionable_insights"],
                title="[bold magenta]💡 Actionable Insights[/bold magenta]",
                border_style="magenta"
            ))


if __name__ == "__main__":
    # Simple test
    console.print(Panel.fit(
        "🤖 Testing Summarizer",
        title="[bold blue]Summarizer Test[/bold blue]",
        border_style="cyan"
    ))
    
    test_transcript = """
    Welcome to the podcast. Today we're discussing mindfulness and meditation.
    
    Research shows that regular meditation can reduce stress by up to 40%. 
    Our guest, Dr. Sarah Johnson, explains: "Meditation rewires the brain's 
    stress response. Just 10 minutes a day can make a significant difference."
    
    We covered three main topics:
    1. The science behind meditation
    2. Practical techniques for beginners
    3. Common obstacles and how to overcome them
    
    Key takeaway: Start small. Even 5 minutes counts. Consistency matters more than duration.
    """
    
    summarizer = PodcastSummarizer()
    
    try:
        summary = summarizer.summarize(
            test_transcript,
            podcast_name="Mindfulness Matters Podcast",
            episode_title="Introduction to Meditation with Dr. Sarah Johnson",
            host="John Smith",
            published_date="November 13, 2025"
        )
        summarizer.display_summary(summary)
        
        # Save to test output
        test_output = Path("output") / "summarizer_test"
        summarizer.save_summary(summary, test_output)
        
        console.print("\n[bold green]✓ Summarizer test complete![/bold green]")
    except Exception as e:
        console.print(f"[red]✗ Test failed: {e}[/red]")

