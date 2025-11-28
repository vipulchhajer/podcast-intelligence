# 🎙️ Podcast Intelligence - Web App

AI-powered podcast transcription and summarization using Groq API.

## ✨ Features

- **🚀 Fast Transcription**: Powered by Groq's Whisper API
- **🤖 Smart Summaries**: AI-generated summaries with key themes, quotes, and insights
- **📱 Beautiful UI**: Modern, responsive web interface
- **💰 Nearly Free**: Uses Groq's generous free tier

---

## 🏗️ Architecture

### Backend (FastAPI)
- REST API for podcast management
- Groq API integration for transcription & summarization
- SQLite database for episode tracking
- Background processing for long-running tasks

### Frontend (React + Vite)
- Modern single-page application
- Tailwind CSS for styling
- Real-time status updates

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Python 3.11+
- Node.js 18+
- Groq API key (free at [groq.com](https://groq.com))

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Run the server
python main.py
# Server will start at http://localhost:8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
# Frontend will start at http://localhost:5173
```

### 3. Open the App

Visit `http://localhost:5173` in your browser!

---

## 📖 Usage Guide

### Step 1: Add a Podcast

1. Go to "Podcasts" page
2. Paste an RSS feed URL (e.g., `https://feeds.libsyn.com/570160/rss`)
3. Click "Add Podcast"

### Step 2: Process Episodes

1. Click on a podcast to see its episodes
2. Click "Process" on any episode
3. Wait for processing to complete (status updates automatically)

### Step 3: View Summaries

1. Go to "My Episodes"
2. Click on a completed episode
3. View summary, key themes, quotes, and transcript

---

## 🔧 Configuration

### Backend (.env)

```bash
# Required
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your-secret-key-change-this

# Optional
DATABASE_URL=sqlite+aiosqlite:///./podcast_app.db
STORAGE_PATH=./storage
LLM_PROVIDER=groq
TRANSCRIPTION_MODEL=whisper-large-v3
SUMMARIZATION_MODEL=llama-3.2-90b-text-preview
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:8000
```

---

## 🌐 Deployment

### Option 1: Railway (Recommended)

**Backend:**
1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repo, set root directory to `backend/`
4. Add environment variables (GROQ_API_KEY, SECRET_KEY)
5. Railway will auto-detect Python and deploy

**Frontend:**
1. Build: `cd frontend && npm run build`
2. Deploy to Vercel: `npx vercel --prod`
3. Set VITE_API_URL to your Railway backend URL

**Cost:** ~$5-20/month (Railway) + $0 (Vercel)

### Option 2: Render

**Backend:**
1. Create account at [render.com](https://render.com)
2. "New Web Service" → Connect repo
3. Set root directory: `backend/`
4. Build command: `pip install -r requirements.txt`
5. Start command: `python main.py`
6. Add environment variables

**Frontend:**
1. "New Static Site" → Connect repo
2. Set root directory: `frontend/`
3. Build command: `npm run build`
4. Publish directory: `dist`

**Cost:** $7-25/month (Render) for backend, $0 for frontend

### Option 3: VPS (DigitalOcean, Hetzner)

See `DEPLOYMENT.md` for detailed instructions.

**Cost:** $5-10/month

---

## 💰 Cost Breakdown

### With Groq Free Tier:
- **Hosting**: $5-20/month (Railway/Render)
- **API**: $0 (within free tier limits)
- **Total**: **~$5-20/month** for unlimited friends

### If You Exceed Free Tier:
- Groq: ~$0.50/episode
- 100 episodes/month: ~$50 API costs
- **Total**: ~$55-70/month

### Comparison to Local:
- Local (your current setup): $0/month, but friends need Macs
- Cloud: $5-70/month, works for everyone on any device

---

## 🔐 Getting a Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free)
3. Go to "API Keys"
4. Create new key
5. Copy and paste into `.env` file

---

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.11+)
- Verify GROQ_API_KEY is set in `.env`
- Check if port 8000 is available

### Frontend can't connect to backend
- Verify backend is running at http://localhost:8000
- Check CORS settings in `backend/config.py`
- Try `VITE_API_URL=http://localhost:8000` in frontend `.env`

### Processing fails
- Check Groq API key is valid
- Verify you have available API quota
- Check backend logs for errors

---

## 📝 API Documentation

Once backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🤝 For Your Friends

### What they need to know:
1. **Nothing!** Just send them the URL
2. They can access from phone, tablet, any computer
3. It just works - no setup required

### Sharing the app:
1. Deploy to Railway/Render (one-time setup)
2. Send them the URL (e.g., `https://your-app.vercel.app`)
3. That's it!

---

## 🎯 Switching from Groq to Together AI

If you hit Groq's rate limits, switching is easy:

1. Get Together AI API key from [together.ai](https://together.ai)
2. Update backend `.env`:
   ```bash
   LLM_PROVIDER=together
   TOGETHER_API_KEY=your_together_key_here
   ```
3. Restart backend

That's it! No code changes needed.

---

## 📊 Features vs Local CLI

| Feature | Local CLI | Web App |
|---------|-----------|---------|
| Processing | ✅ Fast (local) | ✅ Fast (Groq) |
| Setup | ❌ 30 min | ✅ 5 min for you, 0 min for friends |
| Access | ❌ Mac only | ✅ Any device |
| Sharing | ❌ Can't share | ✅ Just send URL |
| Cost | ✅ $0 | ⚠️ ~$5-20/month |
| Privacy | ✅ 100% local | ⚠️ Goes through Groq |

---

## 🛠️ Development

### Running tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Code structure
```
podcast-app/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Configuration
│   ├── models.py            # Database models
│   ├── database.py          # DB connection
│   └── services/
│       └── groq_service.py  # Groq API client
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main component
│   │   ├── api/client.js    # API client
│   │   └── pages/           # Page components
│   └── package.json
└── README.md
```

---

## 📚 Next Steps

- [ ] Add user authentication
- [ ] Add search functionality
- [ ] Add batch processing
- [ ] Add email notifications
- [ ] Add podcast recommendations

---

## 🎉 You're Done!

Questions? Issues? Just ping me!

Made with ❤️ using Groq, FastAPI, and React

