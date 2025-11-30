#!/bin/bash

echo "🔒 Preparing app for deployment..."
echo ""

# Install security package
echo "1️⃣  Installing rate limiting package..."
cd backend
source venv/bin/activate
pip install slowapi==0.1.9
echo "✅ Rate limiting installed"
echo ""

# Check .env file
echo "2️⃣  Checking environment variables..."
if [ ! -f .env ]; then
    echo "❌ No .env file found!"
    echo "Creating .env template..."
    cat > .env << 'EOF'
# Required
GROQ_API_KEY=your-groq-api-key-here
SECRET_KEY=change-this-to-random-string

# Optional - Set a passcode for friends (leave empty to disable)
APP_PASSCODE=

# Safety limits
MAX_EPISODE_DURATION_MINUTES=180
MAX_EPISODES_PER_DAY=50

# Database
DATABASE_URL=sqlite+aiosqlite:///./podcast_app.db

# CORS (update after deployment)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# LLM Settings
LLM_PROVIDER=groq
TRANSCRIPTION_MODEL=whisper-large-v3
SUMMARIZATION_MODEL=llama-3.3-70b-versatile
CONTEXT_WINDOW=32768
EOF
    echo "✅ Created .env template - Please update with your API keys"
else
    echo "✅ .env file exists"
fi
echo ""

# Test that app runs
echo "3️⃣  Testing app starts correctly..."
python main.py &
BACKEND_PID=$!
sleep 3

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
    kill $BACKEND_PID
else
    echo "❌ Backend failed to start - check errors above"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ App is ready for deployment!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 Next steps:"
echo "1. Read DEPLOYMENT_GUIDE.md"
echo "2. Push code to GitHub"
echo "3. Deploy to Railway"
echo ""

