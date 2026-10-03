# AzCloth Deployment Guide

This document outlines the exact steps and configurations needed to deploy AzCloth to production using **Render (Backend)** and **Vercel (Frontend)**.

## 1. Backend (Render)
The backend is a Django + Django REST Framework application. It is configured to run behind Gunicorn, connecting to the existing Supabase PostgreSQL via the Transaction Pooler (port 6543).

### Render Web Service Configuration
- **Environment**: Python
- **Root Directory**: `.` (Root of the repository)
- **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
- **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
- **Region**: Frankfurt (EU Central) or Ireland (EU West) to minimize latency to Supabase (eu-west-1).

### Required Environment Variables (Render)
Make sure to add these in the Render dashboard:
* `SECRET_KEY`: A secure random string.
* `DEBUG`: `False`
* `ALLOWED_HOSTS`: `api.azcloth.store,azcloth.store,www.azcloth.store`
* `DATABASE_URL`: Your Supabase transaction pooler URL
* `CORS_ALLOWED_ORIGINS`: `https://azcloth.store,https://www.azcloth.store`
* `CSRF_TRUSTED_ORIGINS`: `https://azcloth.store,https://www.azcloth.store`
* `AUTH_COOKIE_SECURE`: `True`
* `SECURE_SSL_REDIRECT`: `True`
* `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
* `RESEND_API_KEY`: Your Resend "Sending access" API key (see Email Setup below).
* `DEFAULT_FROM_EMAIL`: `noreply@azcloth.store` (or your verified subdomain, e.g. `noreply@mail.azcloth.store`)


### Migrations
You can run migrations via the Render Dashboard's "Shell" tab, or by adding `python manage.py migrate && ` to the start of the build or start command.
*Manual command:* `python manage.py migrate`

### Email Setup (Resend)

Transactional email is sent via [Resend](https://resend.com) over HTTPS (port 443). SMTP is not used.

**Step-by-step:**

1. **Create a Resend account** at https://resend.com/signup.
2. **Verify your sending domain.**
   - Go to **Resend dashboard → Domains → Add Domain**.
   - Resend recommends verifying a subdomain (e.g. `mail.azcloth.store`) to protect deliverability of your root domain.
   - Add exactly the DNS records shown in the Resend dashboard. They typically include:
     - An **MX record** on the send subdomain.
     - An **SPF TXT record** on the send subdomain.
     - A **DKIM TXT record** at `resend._domainkey.<your-subdomain>`.
   - Wait for domain status to show **Verified** before proceeding.
3. **Create an API key.**
   - Go to https://resend.com/api-keys → **Create API Key**.
   - Choose **"Sending access"** permission only (not full access).
4. **Set `RESEND_API_KEY` on Render.**
   - In the Render dashboard, go to your web service → **Environment** → add `RESEND_API_KEY = re_...`.
   - Also set `DEFAULT_FROM_EMAIL = noreply@mail.azcloth.store` (use the subdomain you verified).
5. **Deploy** (merge to `main` and push — Render auto-deploys).
6. **Verify:** Register a test account with a real email address. Check that the OTP arrives and that the sender shows as your verified domain.

**Optional: DMARC**
Add a TXT record `_dmarc.azcloth.store` with value `v=DMARC1; p=none; rua=mailto:YOUREMAIL@azcloth.store` using an address you actually read. Start with `p=none` (monitor only).


### Media Storage Limitations
**CRITICAL NOTE**: Render provides an ephemeral file system. Uploaded product images/media stored in the local `media/` folder will be **lost** upon every new deployment or server restart. 
If AzCloth genuinely requires persistent user-uploaded images, it is highly recommended to migrate to an external object storage like AWS S3 or Cloudinary. For now, the existing local architecture is preserved, but expect media loss on Render without a persistent disk (which requires Render's paid plan and a "Background Worker" / "Persistent Disk" setup).

---

## 2. Frontend (Vercel)
The frontend is a React application built with Vite and Tailwind CSS.

### Vercel Project Configuration
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Required Environment Variables (Vercel)
* `VITE_API_URL`: `https://api.azcloth.store`

*(A `vercel.json` file is already included in the `frontend/` directory to handle SPA rewrites to `index.html`.)*

---

## 3. Domain & DNS Configuration

We will point the frontend to `azcloth.store` and the backend to `api.azcloth.store`.

### Vercel (azcloth.store)
In your Vercel project, add the domain `azcloth.store` and `www.azcloth.store`. Vercel will provide IP addresses or CNAMEs.
* **Type:** `A` 
* **Name:** `@` (Root)
* **Value:** *(Provided by Vercel, typically `76.76.21.21`)*

* **Type:** `CNAME`
* **Name:** `www`
* **Value:** `cname.vercel-dns.com`

### Render (api.azcloth.store)
In your Render web service, add the custom domain `api.azcloth.store`.
* **Type:** `CNAME`
* **Name:** `api`
* **Value:** *(Provided by Render, e.g., `your-app-name.onrender.com`)*
