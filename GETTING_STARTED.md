# 🚀 Getting Started - For Developers

This guide will help you get the web app running locally.

## Prerequisites

- **Python 3.11+** - Check: `python3 --version`
- **Node.js 18+** - Check: `node --version`
- **Groq API Key** - Get one free at [console.groq.com](https://console.groq.com)

## Option 1: Automated Setup (Recommended)

```bash
# From the podcast-app directory
./setup.sh
```

This script will:
1. Create Python virtual environment
2. Install all dependencies
3. Set up configuration files
4. Prompt you to add your API key

## Option 2: Manual Setup

### Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
nano .env
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# (Optional) Configure API URL
echo "VITE_API_URL=http://localhost:8000" > .env
```

## Starting the App

### Option A: Two Terminals (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option B: Single Command (Quick Start)

```bash
# From the podcast-app directory
./start.sh
```

## Accessing the App

Once both servers are running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Testing the Setup

1. Open http://localhost:5173
2. Click "Get Started" or go to "Podcasts"
3. Add a test podcast:
   ```
   https://feeds.libsyn.com/570160/rss
   ```
4. Click on the podcast to see episodes
5. Click "Process" on any episode
6. Wait for processing (status will update)
7. View the summary when complete

## Troubleshooting

### Backend won't start

**Error: "No module named 'fastapi'"**
```bash
# Make sure you're in the virtual environment
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

**Error: "Groq API key not found"**
```bash
# Check that .env file exists and has the key
cat backend/.env
# Should show: GROQ_API_KEY=your_key_here
```

**Error: "Port 8000 already in use"**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

### Frontend won't start

**Error: "Cannot find module"**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Error: "Connection refused"**
- Make sure backend is running first
- Check that backend is at http://localhost:8000
- Try visiting http://localhost:8000/health

### Processing fails

**Check Groq API quota:**
- Visit https://console.groq.com
- Check "Usage" section
- Free tier limits: 30 requests/min

**Check backend logs:**
- Look at the terminal running the backend
- Should see transcription/summarization progress
- Any errors will be displayed there

## Development Tips

### Hot Reload

- **Frontend**: Changes auto-reload (Vite HMR)
- **Backend**: Restart manually after code changes

### Viewing Logs

- **Backend**: Logs appear in terminal
- **Frontend**: Check browser console (F12)

### Database

- SQLite database: `backend/podcast_app.db`
- View with: `sqlite3 backend/podcast_app.db`
- Reset database: `rm backend/podcast_app.db` (restart backend)

### API Testing

Use the built-in Swagger UI:
1. Open http://localhost:8000/docs
2. Click "Try it out" on any endpoint
3. Test API calls directly

## Next Steps

Once everything is working:

1. **Add more podcasts** - Test with different RSS feeds
2. **Process multiple episodes** - See how batching works
3. **Check the summaries** - Verify quality
4. **Read WEB_APP_README.md** - Learn about deployment

## Getting Help

If you're stuck:
1. Check the error messages carefully
2. Make sure all prerequisites are installed
3. Verify API keys are correct
4. Try the automated setup script
5. Check backend and frontend logs

## Quick Commands Reference

```bash
# Start backend
cd backend && source venv/bin/activate && python main.py

# Start frontend
cd frontend && npm run dev

# Install new Python package
cd backend && source venv/bin/activate && pip install package-name

# Install new NPM package
cd frontend && npm install package-name

# Reset database
rm backend/podcast_app.db

# View API docs
open http://localhost:8000/docs

# View frontend
open http://localhost:5173
```

---

**Ready?** Run `./setup.sh` and let's go! 🚀





