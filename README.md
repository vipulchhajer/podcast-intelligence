# 🎙️ Podcast Intelligence

Local, private podcast transcription and AI-powered summarization for Apple Silicon.

> **⚠️ QUICK START REMINDER**: Every new terminal session, run:
> ```bash
> cd ~/myprojects/podcast-app && source .venv/bin/activate
> ```
> Look for `(podcast-intelligence)` in your prompt to confirm it's active!

## 🌟 Features

- **100% Local & Private** - All processing on your M3 Pro, no cloud services
- **Automatic Transcription** - Using Whisper (MLX-optimized for Apple Silicon)
- **AI Summarization** - Extract key themes, quotes, and actionable insights
- **Multi-Podcast Support** - Organize episodes by podcast automatically
- **Smart Storage** - Duplicate detection prevents re-downloading

## 📋 Prerequisites

- **macOS** with Apple Silicon (M1/M2/M3)
- **Python 3.11+**
- **Homebrew** (for installing dependencies)

## 🚀 Quick Start

### 1. Install System Dependencies

```bash
# Install ffmpeg for audio processing
brew install ffmpeg

# Install Ollama for local LLM
brew install ollama

# Install uv for Python package management (optional but recommended)
brew install uv
```

### 2. Clone and Setup

```bash
cd ~/myprojects/podcast-app

# Install Python dependencies
uv sync
# OR if you prefer pip:
# pip install -e .
```

### 3. Start Ollama Server

```bash
# Start Ollama in the background
ollama serve &

# Pull the Llama 3.2 model (first time only, ~2GB download)
ollama pull llama3.2
```

### 4. Activate Virtual Environment

```bash
source .venv/bin/activate
```

### 5. Run Your First Command!

```bash
# IMPORTANT: Activate virtual environment (EVERY NEW TERMINAL SESSION)
cd ~/myprojects/podcast-app
source .venv/bin/activate

# You'll see this prompt when active:
# (podcast-intelligence) ~/myprojects/podcast-app$

# Make the CLI executable (first time only)
chmod +x podcast

# Now you can run commands:
./podcast list "https://feeds.libsyn.com/570160/rss"
./podcast process "https://feeds.libsyn.com/570160/rss" 0
```

> **🔴 IMPORTANT**: You must run `source .venv/bin/activate` every time you open a new terminal. Look for `(podcast-intelligence)` in your prompt to confirm it's active!

## 📖 Usage

### Main Commands

```bash
# Show all available commands
./podcast commands

# Show usage examples
./podcast examples

# Show setup instructions
./podcast setup

# Get help for any command
./podcast --help
./podcast process --help
```

### Common Workflows

#### 1. **Explore a Podcast**
```bash
# List the first 20 episodes
./podcast list "https://feeds.libsyn.com/570160/rss"

# List more episodes
./podcast list "https://feeds.libsyn.com/570160/rss" --limit 50
```

#### 2. **Process an Episode** (Download → Transcribe → Summarize)
```bash
# Latest episode
./podcast process "https://feeds.libsyn.com/570160/rss" 0

# Specific episode (e.g., episode #5)
./podcast process "https://feeds.libsyn.com/570160/rss" 5
```

**What it does:**
1. Downloads the audio (MP3)
2. Transcribes using Whisper (~10 min for 80 min episode)
3. Generates AI summary with:
   - Executive summary
   - 3-8 key themes
   - Up to 10 notable quotes
   - 4-10 actionable insights
4. Saves everything to: `output/episodes/[podcast-slug]/[episode-slug]/`

#### 3. **Re-Summarize an Episode**
If you update the summarization prompts, you can re-generate summaries without re-transcribing:

```bash
./podcast resummarize output/episodes/10-happier-with-dan-harris/2025-10-22-how-to-perform-under-pressurewith-both-peace-and-c
```

## 📁 Output Structure

```
output/
└── episodes/
    └── [podcast-slug]/
        └── [date]-[episode-slug]/
            ├── audio.mp3           # Original audio
            ├── transcript.txt      # Plain text transcript
            ├── transcript.json     # Detailed transcript with timestamps
            ├── summary.txt         # Formatted summary
            ├── summary.json        # Structured summary data
            └── metadata.json       # Episode metadata
```

## ⚙️ Configuration

### Increase Context Window (for very long episodes)

The default context window is 32,768 tokens (~24,000 words). To process longer episodes:

Edit `scripts/download_and_transcribe.py` and change:
```python
summarizer = PodcastSummarizer(num_ctx=65536)  # ~49k words
# Or maximum:
summarizer = PodcastSummarizer(num_ctx=131072)  # ~98k words
```

### Customize Summarization

Edit `src/podcast_intelligence/summarizer.py` to modify:
- Number of themes/quotes/insights
- Categories for actionable insights
- Prompt instructions

## 🐛 Troubleshooting

### "ollama not found" or "connection refused"

Ollama server isn't running. Start it:
```bash
ollama serve &
```

### "ModuleNotFoundError"

Virtual environment not activated:
```bash
source .venv/bin/activate
```

### "ffmpeg not found"

Install ffmpeg:
```bash
brew install ffmpeg
```

### Episode already processed

Delete the episode folder to re-process:
```bash
rm -rf output/episodes/[podcast-slug]/[episode-slug]
```

### Transcription is slow

This is normal! Transcribing an 80-minute episode takes ~8-12 minutes on M3 Pro. Whisper is running locally and is very accurate.

### Summary seems inaccurate

Try re-summarizing with the latest prompts:
```bash
./podcast resummarize [episode-directory]
```

## 🔐 Privacy & Data

- ✅ **All data stays on your machine**
- ✅ **No external API calls** (Ollama runs locally)
- ✅ **No telemetry or tracking**
- ✅ **Transcripts never uploaded**

## 🎯 What Gets Extracted

### Executive Summary
- Podcast name, episode, host, date
- 2-3 paragraph overview of main discussion

### Key Themes (3-8)
- Most important recurring topics
- Supported by examples from the conversation

### Notable Quotes (up to 10)
- Exact quotes from the transcript
- Context about why each quote matters
- Focus on quotes that sparked deeper discussion

### Actionable Insights (4-10)
Practical takeaways in 15 categories:
1. Behaviors & Routines
2. Mindset Shifts
3. Specific Actions
4. Joy & Distinction
5. Communication Skills
6. Decision-Making Frameworks
7. Relationship Practices
8. Self-Awareness Techniques
9. Emotional Regulation
10. Productivity Systems
11. Learning Methods
12. Physical Practices
13. Boundary Setting
14. Creativity Techniques
15. Discomfort Practice

## 💡 Tips

- **First run takes longer** - Models need to download (~3.5GB total)
- **Keep Ollama running** - Start it once per session with `ollama serve &`
- **Use virtual environment** - Always activate with `source .venv/bin/activate`
- **Check storage** - Transcripts and audio can use significant space
- **Browse episodes first** - Use `podcast list` before processing

## 🛠️ Development

```bash
# Project structure
podcast-app/
├── podcast              # Main CLI entry point (USE THIS!)
├── src/
│   └── podcast_intelligence/
│       ├── transcriber.py    # Whisper transcription
│       ├── summarizer.py     # Ollama summarization
│       ├── rss_parser.py     # RSS feed parsing
│       ├── downloader.py     # Audio download
│       └── storage.py        # File organization
├── scripts/             # Individual scripts (don't call directly)
├── output/             # All processed episodes
└── PROGRESS.md         # Development progress log
```

## 📝 Environment Checklist

**⚠️ EVERY TIME YOU OPEN A NEW TERMINAL, YOU MUST:**

```bash
cd ~/myprojects/podcast-app
source .venv/bin/activate  # ← REQUIRED! Look for (podcast-intelligence) in prompt
```

Before processing episodes, also ensure:
- ✅ Ollama server is running (`ollama serve &`)
- ✅ You have enough disk space (~100MB per episode)
- ✅ You're connected to internet (for first-time model downloads)

## 🎓 For Beginners

**New to terminal/Python?** Here's what each step means:

1. **`brew install X`** - Downloads and installs software on macOS
2. **`source .venv/bin/activate`** - **Enters a sandboxed Python environment** (MUST DO EVERY NEW TERMINAL!)
   - This makes the podcast app's libraries available
   - Without this, Python won't find Whisper, Ollama, etc.
   - You only need to run it ONCE per terminal session
3. **`./podcast`** - Runs the main command (the `./` means "in this directory")
4. **`&`** - Runs a command in the background so you can keep using the terminal

**When you see this prompt:**
```
(podcast-intelligence) ~/myprojects/podcast-app$
```
You're ready to run commands! The `(podcast-intelligence)` means the virtual environment is active.

**If you DON'T see `(podcast-intelligence)`:**
```
~/myprojects/podcast-app$  # ← Missing (podcast-intelligence)
```
You forgot to activate! Run: `source .venv/bin/activate`

## 📚 Resources

- [MLX Whisper Documentation](https://github.com/ml-explore/mlx-examples/tree/main/whisper)
- [Ollama Documentation](https://ollama.ai/docs)
- [10% Happier Podcast](https://www.tenpercent.com/podcast)

## 🤝 Need Help?

Run these commands for guidance:
```bash
./podcast commands    # List all commands
./podcast examples    # Show usage examples  
./podcast setup       # Show setup instructions
./podcast --help      # Detailed help
```

---

Made with 🎧 for mindful podcast listening
