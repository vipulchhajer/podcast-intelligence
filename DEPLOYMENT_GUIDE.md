# 🚀 Deployment Guide - Podcast Intelligence App

This guide will walk you through deploying your podcast app to share with friends, with built-in security and cost protection.

---

## 🛡️ Security Features Added

Before deploying, I've added these protections:

### 1. **Rate Limiting** ✅
- **Add Podcast**: Max 10 per hour per IP
- **Process Episode**: Max 20 per hour per IP
- **Purpose**: Prevents spam and bot abuse

### 2. **Passcode Protection** ✅ (Optional)
- Simple passcode that friends can use
- No complex authentication needed for MVP
- Easy to share with trusted users

### 3. **API Usage Limits** ✅
- Max 3-hour episodes (prevents huge files)
- Max 50 episodes per day
- Protects your Groq API bill

---

## 📋 Pre-Deployment Checklist

### **1. Install Rate Limiting Package**

```bash
cd backend
source venv/bin/activate
pip install slowapi==0.1.9
```

### **2. Update Your `.env` File**

Add these lines to `backend/.env`:

```bash
# Optional: Set a passcode for friends (leave empty to disable)
APP_PASSCODE=your-secret-passcode-here

# Production CORS (update after deploying)
CORS_ORIGINS=https://your-app.railway.app,https://your-frontend.railway.app

# Safety limits
MAX_EPISODE_DURATION_MINUTES=180
MAX_EPISODES_PER_DAY=50
```

---

## 🚂 Deployment to Railway (Recommended)

### **Why Railway?**
- ✅ Free tier: $5 credit/month
- ✅ Easy deployment from GitHub
- ✅ Auto-deploys on git push
- ✅ Free SSL certificates
- ✅ Simple environment variables

---

## **Step-by-Step Deployment:**

### **1. Create GitHub Repository**

```bash
# In your project root
git add .
git commit -m "Ready for deployment"

# Create repo on GitHub (if not done already)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/podcast-app.git
git push -u origin main
```

### **2. Sign Up for Railway**

1. Go to [railway.app](https://railway.app)
2. Click "Sign up with GitHub"
3. Authorize Railway to access your repos

### **3. Deploy Backend**

1. **Click "New Project"** → "Deploy from GitHub repo"
2. **Select** your `podcast-app` repository
3. **Configure service:**
   - Name: `podcast-backend`
   - Root Directory: `/backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python main.py`

4. **Add Environment Variables** (Settings → Variables):
   ```
   GROQ_API_KEY=your-groq-api-key-here
   SECRET_KEY=your-random-secret-key-here
   TOGETHER_API_KEY=
   LLM_PROVIDER=groq
   DATABASE_URL=sqlite+aiosqlite:///./podcast_app.db
   CORS_ORIGINS=*
   APP_PASSCODE=friends-only-2024
   TRANSCRIPTION_MODEL=whisper-large-v3
   SUMMARIZATION_MODEL=llama-3.3-70b-versatile
   ```

5. **Deploy** - Railway will automatically deploy
6. **Copy the URL** - Something like `https://podcast-backend.railway.app`

### **4. Deploy Frontend**

1. **Create another service** in the same project
2. **Deploy from GitHub repo** (same repo)
3. **Configure service:**
   - Name: `podcast-frontend`
   - Root Directory: `/frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview`

4. **Add Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```

5. **Deploy** - Railway will build and deploy
6. **Copy the URL** - Something like `https://podcast-frontend.railway.app`

### **5. Update CORS**

1. Go back to **backend environment variables**
2. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://your-frontend-url.railway.app
   ```
3. Redeploy backend

---

## 🔐 How Friends Access Your App

### **Option A: With Passcode Protection**

1. Share the URL: `https://your-frontend-url.railway.app`
2. Share the passcode: `friends-only-2024`
3. They need to add the passcode in the app (you'll need to add a UI for this)

### **Option B: Without Passcode (Simpler for MVP)**

1. Remove `APP_PASSCODE` from Railway environment variables
2. Share the URL directly
3. **Risk**: Anyone with the URL can access
4. **Mitigation**: Rate limiting still protects from spam

**For friends & family, I recommend Option B** (no passcode) since rate limiting is enough protection.

---

## 💰 Cost Protection Built-In

### **Rate Limits:**
- 10 podcasts/hour per IP
- 20 episodes/hour per IP
- Prevents accidental or malicious spam

### **Usage Limits:**
- Max 3-hour episodes
- Max 50 episodes/day
- Prevents huge API bills

### **Groq Free Tier:**
- 30 requests/minute
- Should be plenty for friends & family
- Monitor at [console.groq.com](https://console.groq.com)

### **Railway Free Tier:**
- $5 credit/month
- Enough for ~20-30 episodes/month
- Sleeps after 30 minutes of inactivity (wakes on request)

---

## 🔍 Monitoring Your Usage

### **1. Groq API Usage**
- Dashboard: [console.groq.com](https://console.groq.com)
- Check daily requests
- Set up email alerts (optional)

### **2. Railway Usage**
- Dashboard: [railway.app/dashboard](https://railway.app/dashboard)
- Monitor credit usage
- Set spending limits in settings

### **3. Rate Limit Logs**
- Check Railway logs for "Rate limit exceeded" messages
- Indicates someone hit the limit

---

## 🚨 What If Something Goes Wrong?

### **Too Many Requests (Rate Limited)**
```
Error: 429 Too Many Requests
Solution: Wait an hour, or increase limits in main.py
```

### **High Groq Bill**
```
Check: Groq console for usage
Solution: Lower MAX_EPISODES_PER_DAY in config
```

### **Railway Out of Credit**
```
Check: Railway dashboard
Solution: Add $5/month, or reduce usage
```

### **App Down/Crashed**
```
Check: Railway logs for errors
Solution: Redeploy or check environment variables
```

---

## 🎯 Simpler Alternative: Share Locally

If you don't want to deploy yet, you can share locally:

### **Option: Tailscale/ngrok**

1. **Install ngrok**: `brew install ngrok`
2. **Run app locally**: `./start.sh`
3. **Expose via ngrok**:
   ```bash
   ngrok http 5173
   ```
4. **Share the ngrok URL** with friends
5. **Free for testing**, but sessions expire

---

## ✅ Post-Deployment Checklist

After deploying:

- [ ] Test adding a podcast
- [ ] Test processing an episode
- [ ] Check Railway logs for errors
- [ ] Monitor Groq usage after first day
- [ ] Share URL with 2-3 friends first (beta test)
- [ ] Collect feedback
- [ ] Scale up if needed

---

## 📊 Expected Costs (Friends & Family MVP)

**Assumptions**: 5 friends, 10 episodes/week

| Service | Free Tier | Expected Cost |
|---------|-----------|---------------|
| Railway | $5/month credit | $0 (under limit) |
| Groq API | 30 req/min free | $0 (under limit) |
| **Total** | | **$0/month** |

**When to upgrade**: 10+ active users, 50+ episodes/week

---

## 🆘 Need Help?

**Common Issues:**

1. **"Module not found" error**: Run `pip install -r requirements.txt`
2. **CORS error**: Update `CORS_ORIGINS` in Railway
3. **Database error**: Railway auto-creates SQLite (no setup needed)
4. **Groq API error**: Check API key in environment variables

---

## 🎉 You're Ready!

Your app is production-ready with:
- ✅ Rate limiting (spam protection)
- ✅ Cost limits (bill protection)
- ✅ Modern UI (professional look)
- ✅ Error handling (user-friendly messages)
- ✅ Free hosting (Railway)

**Go deploy and share with friends!** 🚀

