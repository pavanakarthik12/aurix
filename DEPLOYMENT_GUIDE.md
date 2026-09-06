# AURIX DEPLOYMENT GUIDE

## Prerequisites

Before deploying, ensure you have:
- [ ] Groq API Key (get from https://console.groq.com/)
- [ ] PostgreSQL database provisioned (Vercel Postgres, Supabase, or Railway)
- [ ] Backend hosting platform account (Railway, Render, or Google Cloud Run)
- [ ] Vercel account for frontend hosting
- [ ] Git repository clean (no exposed secrets)

---

## STEP 1: Security - Rotate API Keys

**CRITICAL**: The Groq API key in `backend/.env` was exposed. You MUST:

1. Go to https://console.groq.com/
2. Delete the old API key
3. Create a new API key
4. **DO NOT** commit the new key to git

---

## STEP 2: Deploy Backend

### Option A: Railway (Recommended)

1. **Create Railway Account**: https://railway.app/

2. **Create New Project**:
   ```
   railway login
   railway init
   ```

3. **Add PostgreSQL**:
   - Click "+ New" → "Database" → "PostgreSQL"
   - Copy the `DATABASE_URL` from Railway dashboard

4. **Set Environment Variables** in Railway dashboard:
   ```
   GROQ_API_KEY=your-new-groq-api-key-here
   GROQ_API_BASE=https://api.groq.com/openai/v1
   GROQ_MODEL=llama-3.3-70b-versatile
   DATABASE_URL=postgresql+asyncpg://... (from Railway Postgres)
   SECRET_KEY=generate-random-secure-string-here
   UPLOAD_FOLDER=./uploads
   CHROMA_DB_PATH=./data/chromadb
   LOG_LEVEL=INFO
   CORS_ORIGINS=http://localhost:3000,https://your-app-name.vercel.app
   ```

5. **Deploy Backend**:
   ```
   cd backend
   railway up
   ```

6. **Run Migrations**:
   ```
   railway run alembic upgrade head
   ```

7. **Get Backend URL**: Copy from Railway dashboard (e.g., `https://aurix-backend.railway.app`)

### Option B: Render

1. Create new Web Service
2. Connect your GitHub repository
3. Set Build Command: `cd backend && pip install -r requirements.txt`
4. Set Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as Railway above)
6. Deploy

### Option C: Google Cloud Run

1. Build Docker image:
   ```dockerfile
   FROM python:3.12-slim
   WORKDIR /app
   COPY backend/requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY backend/ .
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
   ```

2. Deploy:
   ```
   gcloud builds submit --tag gcr.io/PROJECT_ID/aurix-backend
   gcloud run deploy aurix-backend --image gcr.io/PROJECT_ID/aurix-backend --platform managed
   ```

---

## STEP 3: Deploy Frontend to Vercel

1. **Install Vercel CLI**:
   ```
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```
   vercel login
   ```

3. **Set Environment Variables in Vercel Dashboard**:
   
   Go to your project → Settings → Environment Variables:
   
   **Production:**
   ```
   NEXT_PUBLIC_AI_PROVIDER=backend
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
   NEXT_PUBLIC_OCR_PROVIDER=tesseract
   NEXT_PUBLIC_CHUNK_SIZE=512
   NEXT_PUBLIC_CHUNK_OVERLAP=64
   ```
   
   **Preview (optional):**
   ```
   NEXT_PUBLIC_API_URL=https://your-staging-backend-url.railway.app
   ```

4. **Deploy**:
   ```
   vercel --prod
   ```

5. **Update CORS in Backend**:
   - Go back to Railway/Render dashboard
   - Update `CORS_ORIGINS` to include your Vercel URL:
     ```
     CORS_ORIGINS=https://your-app-name.vercel.app,https://your-app-name-git-main.vercel.app
     ```

---

## STEP 4: Database Setup

1. **Run Migrations** (if not done already):
   ```
   # On Railway:
   railway run alembic upgrade head
   
   # On Render:
   # SSH into your web service or use console
   alembic upgrade head
   ```

2. **Verify Database Connection**:
   Visit: `https://your-backend-url.railway.app/health`
   
   Should see:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "groq": "connected"
   }
   ```

---

## STEP 5: Test Production Deployment

### Backend Health Check
```bash
curl https://your-backend-url.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "service": "Aurix API",
  "backend": "healthy",
  "database": "connected",
  "groq": "connected"
}
```

### Frontend Test
1. Visit: `https://your-app-name.vercel.app`
2. Check browser console for errors
3. Try adding a manual expense
4. Test AI Advisor chat
5. Upload a receipt (OCR test)

### Common Issues

**"Failed to fetch" errors:**
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify CORS includes your Vercel domain
- Check backend is running: visit `/health` endpoint

**Database errors:**
- Verify `DATABASE_URL` is correct
- Check migrations ran: `alembic upgrade head`
- Ensure database allows connections from Railway/Render IP

**AI not working:**
- Verify `GROQ_API_KEY` is set in backend
- Check logs for authentication errors
- Test manually: `curl -X POST https://your-backend/api/v1/ai/chat -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"test"}]}'`

---

## STEP 6: Monitoring & Logging

### Backend Logs
**Railway:**
```
railway logs
```

**Render:**
- View logs in dashboard → Logs tab

### Frontend Logs
**Vercel:**
- Go to Deployment → Logs
- Or use: `vercel logs`

### Set Up Error Tracking (Optional but Recommended)
1. **Sentry**:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

2. **LogRocket**:
   ```bash
   npm install logrocket
   ```

---

## STEP 7: Custom Domain (Optional)

### Add Custom Domain to Vercel
1. Go to Project Settings → Domains
2. Add your domain (e.g., `aurix.yourcompany.com`)
3. Update DNS records as instructed
4. Update environment variables with new domain

### Add Custom Domain to Backend
1. **Railway**: Domains → Generate Domain or add custom
2. **Render**: Settings → Custom Domain
3. Update `CORS_ORIGINS` and `NEXT_PUBLIC_API_URL`

---

## POST-DEPLOYMENT CHECKLIST

- [ ] Backend `/health` endpoint returns HTTP 200
- [ ] Frontend loads without console errors
- [ ] Can create transactions manually
- [ ] AI Advisor responds to queries
- [ ] OCR extracts text from receipts
- [ ] Database persists data across restarts
- [ ] CORS configured correctly (no CORS errors in browser)
- [ ] All secrets secured (not in git, only in hosting dashboards)
- [ ] Error monitoring enabled
- [ ] Backup strategy in place for database

---

## ROLLBACK PROCEDURE

If deployment fails:

1. **Vercel**:
   ```
   vercel rollback
   ```

2. **Railway**:
   - Go to Deployments → Click previous successful deployment → "Redeploy"

3. **Database**:
   ```
   alembic downgrade -1  # Rollback one migration
   ```

---

## COST ESTIMATES

### Free Tier (MVP)
- **Vercel**: Free (Hobby plan)
- **Railway**: $5/month (500 hours)
- **PostgreSQL**: Included with Railway or use Supabase free tier
- **Groq API**: Free tier (rate limits apply)
- **Total**: ~$5-10/month

### Production Scale
- **Vercel**: $20/month (Pro plan)
- **Railway**: $20-50/month (scalable)
- **PostgreSQL**: $15-30/month (managed)
- **Groq API**: Pay-as-you-go (estimate $20-100/month depending on usage)
- **Total**: ~$75-200/month

---

## TROUBLESHOOTING

### Issue: "Module not found" errors
**Solution**: Clear Next.js cache
```bash
rm -rf .next
npm run build
```

### Issue: Database connection refused
**Solution**: 
1. Check `DATABASE_URL` format: `postgresql+asyncpg://user:pass@host:port/db`
2. Ensure database accepts connections from backend host IP
3. Verify migrations ran

### Issue: CORS errors in browser
**Solution**:
1. Check `CORS_ORIGINS` in backend includes frontend URL
2. Restart backend after changing CORS settings
3. Clear browser cache

### Issue: Environment variables not updating
**Solution**:
1. **Vercel**: Redeploy after changing env vars
2. **Railway**: Restart service after changing env vars
3. Clear `.next` folder and rebuild

---

## NEXT STEPS

1. Set up automated backups for PostgreSQL
2. Implement rate limiting on backend
3. Add monitoring dashboards (Grafana, Datadog)
4. Set up CI/CD pipeline (GitHub Actions)
5. Implement feature flags for gradual rollouts
6. Add end-to-end tests
7. Set up staging environment

---

## SUPPORT

If you encounter issues:
1. Check backend logs: `railway logs` or Render dashboard
2. Check frontend logs: `vercel logs`
3. Review `PRODUCTION_AUDIT.md` for known issues
4. Check health endpoint: `/health`

---

**Deployment Status**: Ready for production deployment after completing this guide.
