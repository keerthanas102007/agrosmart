# AgroSmart — Deploy Guide (Free, One-time Setup)

Once deployed → Farmers can access from anywhere, anytime.
No more running commands locally!

---

## STEP 1: GitHub (5 mins)

1. Go to https://github.com → Sign up / Login
2. Create New Repository → Name: `agrosmart`
3. In your project folder, open terminal:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/agrosmart.git
git push -u origin main
```

---

## STEP 2: Railway — MySQL Database (5 mins)

1. Go to https://railway.app → Login with GitHub
2. Click "New Project" → "Provision MySQL"
3. Click on MySQL → "Connect" tab
4. Copy these values:
   - MYSQL_HOST
   - MYSQL_USER
   - MYSQL_PASSWORD
   - MYSQL_DATABASE
   - MYSQL_PORT

5. Click "Query" tab → paste your database.sql content → Run

---

## STEP 3: Render — Backend Deployment (10 mins)

1. Go to https://render.com → Login with GitHub
2. Click "New Web Service"
3. Connect your GitHub repo → select `agrosmart`
4. Settings:
   - Root Directory: `agrosmart-backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add Environment Variables (from Railway values):
   ```
   DB_HOST     = your-railway-host
   DB_USER     = root
   DB_PASSWORD = your-password
   DB_NAME     = railway
   DB_PORT     = your-port
   JWT_SECRET  = smartagriculture_secret_2026
   EMAIL_USER  = keerthanas102007@gmail.com
   EMAIL_PASS  = gfrfopzrwfddrmlc
   FAST2SMS_KEY = YfSSjQsFRL0Ix4ibHGeZht1rP9DgTdqyWMazkt
   PORT        = 5000
   ```
6. Click "Deploy"
7. Copy your Render URL: `https://agrosmart-backend.onrender.com`

---

## STEP 4: Update Frontend API URL

In `.env.production` file:
```
REACT_APP_API_URL=https://agrosmart-backend.onrender.com/api
```

---

## STEP 5: Vercel — Frontend Deployment (5 mins)

1. Go to https://vercel.com → Login with GitHub
2. Click "New Project" → Import `agrosmart` repo
3. Settings:
   - Root Directory: `./` (root, not backend)
   - Framework: Create React App
4. Add Environment Variable:
   ```
   REACT_APP_API_URL = https://agrosmart-backend.onrender.com/api
   ```
5. Click "Deploy"
6. Your URL: `https://agrosmart.vercel.app`

---

## RESULT

Farmers visit: `https://agrosmart.vercel.app`
→ Login / Register → Dashboard
→ Email notification sent automatically ✅
→ Works 24/7 from any device, anywhere ✅
→ No need to run any commands ✅

---

## Free Tier Limits

| Service | Free Plan |
|---------|-----------|
| Railway | $5/month free credit |
| Render  | 750 hours/month (always-on with paid) |
| Vercel  | Unlimited for personal projects |

Note: Render free tier sleeps after 15 mins inactivity.
First request after sleep takes ~30 seconds to wake up.
For 24/7 always-on, upgrade Render to $7/month.
