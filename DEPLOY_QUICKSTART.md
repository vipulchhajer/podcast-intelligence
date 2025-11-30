# 🚀 Quick Deployment Guide (5 Minutes)

## Prerequisites
- GitHub account
- Groq API key ([console.groq.com](https://console.groq.com))

---

## Step 1: Prepare App (2 minutes)

```bash
# Run the preparation script
chmod +x deploy-prep.sh
./deploy-prep.sh
```

This installs security packages and checks your setup.

---

## Step 2: Push to GitHub (1 minute)

```bash
git add .
git commit -m "Ready for deployment with security"
git push origin main
```

---

## Step 3: Deploy to Railway (2 minutes)

### **Backend:**

1. Go to [railway.app](https://railway.app) → Sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repo → Click **"Deploy"**
4. After deploy, click **"Variables"** tab
5. Add these variables:
   ```
   GROQ_API_KEY=your-actual-groq-key
   SECRET_KEY=any-random-string-here
   CORS_ORIGINS=*
   ```
6. Copy the generated URL (like `https://xxx.railway.app`)

### **Frontend:**

1. In the same project, click **"New Service"** → **"GitHub Repo"**
2. Select your repo again
3. Click **Settings** → Set:
   - **Root Directory**: `/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx vite preview --host 0.0.0.0 --port $PORT`
4. Click **"Variables"** tab
5. Add:
   ```
   VITE_API_URL=https://your-backend-url-from-step-1.railway.app
   ```
6. Deploy!

---

## Step 4: Update Backend CORS

1. Go back to **backend service**
2. Update `CORS_ORIGINS` to your frontend URL:
   ```
   CORS_ORIGINS=https://your-frontend-url.railway.app
   ```
3. Save (auto-redeploys)

---

## ✅ Done!

Visit your frontend URL and test:
- [ ] Add a podcast
- [ ] Process an episode
- [ ] View summary

**Share the URL with friends!** 🎉

---

## 🔒 Security Features Active

✅ **Rate Limiting**: 10 podcasts/hour, 20 episodes/hour  
✅ **Episode Limits**: 3-hour max duration  
✅ **Daily Cap**: 50 episodes/day  
✅ **Free Tier**: Railway sleeps when idle  

**Your bill is protected!** 💰

---

## 💡 Tips for Friends

Tell your friends:
- "It's free to use!"
- "Add your favorite podcasts and get AI summaries"
- "Works best on mobile browsers"
- "If it's slow, it's waking up from sleep (30-second wait)"

---

## 🆘 Troubleshooting

**"CORS error" in browser:**
- Update `CORS_ORIGINS` in backend to include your frontend URL

**"App is slow to load":**
- Railway free tier sleeps after inactivity
- First request takes ~30 seconds to wake up
- Upgrade to hobby plan ($5/month) for always-on

**"Groq API error":**
- Check API key in Railway variables
- Check Groq console for usage limits

---

## 📚 Full Documentation

For detailed explanations, see `DEPLOYMENT_GUIDE.md`

