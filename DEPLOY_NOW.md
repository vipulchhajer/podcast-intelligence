# 🚀 Deploy Your App NOW (10 Minutes)

Follow these exact steps to get a public URL for your friends.

---

## ✅ **Prerequisites (Already Done!)**

- [x] Code pushed to GitHub ✅
- [x] Security features added ✅
- [x] Email capture ready ✅

---

## 📱 **Step 1: Sign Up for Railway (2 minutes)**

1. Go to **https://railway.app**
2. Click **"Login"** (top right)
3. Click **"Login with GitHub"**
4. Authorize Railway to access your repos
5. ✅ You're in!

---

## 🔧 **Step 2: Deploy Backend (3 minutes)**

1. **Click "New Project"**
2. **Select "Deploy from GitHub repo"**
3. **Choose:** `podcast-intelligence` (or whatever your repo is named)
4. Railway will detect it's a Python app and start building!

### **Configure Backend Service:**

1. **Click the deployed service** (will show logs)
2. **Click "Settings" tab**
3. **Set Root Directory:**
   - Find "Root Directory"
   - Enter: `/backend`
   - Click "Update"

4. **Click "Variables" tab**
5. **Add these environment variables** (click "+ New Variable" for each):

```
GROQ_API_KEY=your-groq-api-key-from-console.groq.com
SECRET_KEY=any-random-string-here-just-type-anything
DATABASE_URL=sqlite+aiosqlite:///./podcast_app.db
CORS_ORIGINS=*
LLM_PROVIDER=groq
TRANSCRIPTION_MODEL=whisper-large-v3
SUMMARIZATION_MODEL=llama-3.3-70b-versatile
```

6. **Click "Deploy" or wait for auto-deploy**

7. **Copy the backend URL:**
   - Click "Settings" → find "Public Networking"  
   - Click "Generate Domain"
   - Copy the URL (like `https://your-app.up.railway.app`)

---

## 🎨 **Step 3: Deploy Frontend (3 minutes)**

1. **Go back to your Railway project dashboard**
2. **Click "+ New"** → **"GitHub Repo"**
3. **Select the SAME repo** (podcast-intelligence)
4. Railway will start deploying again

### **Configure Frontend Service:**

1. **Click the new service**
2. **Click "Settings" tab**
3. **Set Root Directory:**
   - Enter: `/frontend`
   - Update

4. **Set Build & Start Commands:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx vite preview --host 0.0.0.0 --port $PORT`

5. **Click "Variables" tab**
6. **Add ONE variable:**

```
VITE_API_URL=https://your-backend-url.railway.app
```
(Paste the backend URL from Step 2)

7. **Click "Settings" → "Public Networking"**
8. **Click "Generate Domain"**
9. **Copy the frontend URL** (like `https://your-frontend.up.railway.app`)

---

## 🔄 **Step 4: Update CORS (1 minute)**

1. **Go back to Backend service**
2. **Click "Variables"**
3. **Update CORS_ORIGINS:**

```
CORS_ORIGINS=https://your-frontend-url.railway.app
```

4. **Save** (will auto-redeploy in ~30 seconds)

---

## ✅ **Step 5: Test Your App! (2 minutes)**

1. **Open your frontend URL** in a browser
2. **You should see:**
   - Email capture modal appears ✅
   - Submit your email (test it!)
   - Navigate to "Podcasts"
   - Try adding a podcast

3. **If you get CORS error:**
   - Double-check `CORS_ORIGINS` in backend variables
   - Make sure it matches your frontend URL exactly

4. **If backend is slow to wake up:**
   - First request takes ~30 seconds (Railway free tier sleeps when idle)
   - Subsequent requests are fast

---

## 🎉 **You're Live!**

**Your app is now accessible worldwide at:**
```
https://your-frontend.railway.app
```

**Share this URL with your 5-6 friends!**

---

## 📧 **What Friends Will See:**

1. Email capture modal on first visit
2. Can skip if they want
3. Full-featured podcast app
4. AI summaries for any episode they process

---

## 💰 **Cost (Railway Free Tier)**

- **$5 credit/month** (free)
- **Sleeps after 30 min of inactivity**
- **Wakes up automatically** on first request (~30s delay)
- **Perfect for 5-6 friends!**

For always-on service: Upgrade to Hobby plan ($5/month)

---

## 🆘 **Troubleshooting**

### **Frontend shows blank page:**
- Check browser console (F12) for errors
- Verify `VITE_API_URL` is set correctly
- Make sure backend is deployed first

### **CORS error:**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Fix:** Update backend's `CORS_ORIGINS` to include your frontend URL

### **Backend "Application failed to start":**
- Check Railway logs for errors
- Verify `GROQ_API_KEY` is set
- Make sure `requirements.txt` is in `/backend`

### **504 Gateway Timeout:**
- Backend is waking up from sleep (wait 30s)
- Or backend crashed (check Railway logs)

---

## 🎯 **After Deployment**

### **Share with friends:**

```
Hey! My podcast AI app is live:
https://your-frontend.railway.app

Try it out and let me know what you think!

Note: First load might be slow (30s) - it's waking up from sleep.
After that, it's fast!
```

### **Monitor usage:**
- **Railway Dashboard:** https://railway.app/dashboard
- **Groq API Usage:** https://console.groq.com
- **Collected Emails:** `sqlite3 podcast_app.db "SELECT * FROM email_captures;"`

---

## 📝 **Railway Project Structure**

You'll have **TWO services** in one project:

```
📦 podcast-intelligence (Project)
├── 🐍 backend (Service 1)
│   └── Root: /backend
│   └── URL: https://backend-xxx.railway.app
│
└── ⚛️ frontend (Service 2)
    └── Root: /frontend  
    └── URL: https://frontend-xxx.railway.app
```

---

## 🚀 **Quick Reference**

| What | Where |
|------|-------|
| **Railway Dashboard** | https://railway.app/dashboard |
| **Your Backend** | https://backend-xxx.railway.app |
| **Your Frontend** | https://frontend-xxx.railway.app |
| **Share This URL** | Frontend URL |
| **Backend Logs** | Railway → Backend service → "View Logs" |
| **Groq Usage** | https://console.groq.com |

---

## ⏱️ **Timeline:**

- Step 1 (Sign up): **2 minutes**
- Step 2 (Backend): **3 minutes**
- Step 3 (Frontend): **3 minutes**  
- Step 4 (CORS): **1 minute**
- Step 5 (Test): **2 minutes**

**Total: ~10 minutes to a public URL!** 🎉

---

**Ready? Go to https://railway.app and follow the steps above!** 🚀

Once you have your frontend URL, **share it with your friends** and you're done!

