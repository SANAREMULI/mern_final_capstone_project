# Deployment Guide

Target setup: **MongoDB Atlas** (database) + **Render** (API) + **Vercel** (client). Any equivalent hosts work.

## 1. Database — MongoDB Atlas
1. Create a free M0 cluster.
2. Create a database user, and allow network access from `0.0.0.0/0` (Render's IPs are dynamic).
3. Copy the connection string, e.g. `mongodb+srv://user:pass@cluster.xxxx.mongodb.net/airport_ticketing`.

## 2. API — Render (Web Service)
| Setting | Value |
|---|---|
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Environment variables:
```
NODE_ENV=production
MONGO_URI=<atlas connection string>
JWT_SECRET=<long random string, e.g. `openssl rand -hex 32`>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://<your-app>.vercel.app
```
After the first deploy, seed demo data once from Render's **Shell** tab with `npm run seed`. Running it again wipes all data.

## 3. Client — Vercel
| Setting | Value |
|---|---|
| Root directory | `client` |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

Environment variable: `VITE_API_URL=https://<your-api>.onrender.com/api`

`client/vercel.json` rewrites every route to `index.html`, so deep links such as `/trips` work after a refresh.

## 4. Post-deploy checklist
- [ ] `GET https://<api>/api/health` returns `{"status":"ok"}`
- [ ] Register, log in and log out on the live site
- [ ] Search → book → choose seat → (admin) confirm → check in → boarding pass
- [ ] Book a full cabin → join waitlist → cancel another ticket → waitlisted passenger gets a ticket
- [ ] Admin dashboard loads; create, edit and cancel a flight
- [ ] No CORS errors in the browser console. If there are any, make sure `CLIENT_URL` exactly matches the Vercel origin (no trailing slash). Separate several origins with commas.
- [ ] Deployed commit matches `main` in the repository

## Troubleshooting
| Symptom | Fix |
|---|---|
| `Origin ... not allowed by CORS` | Add the exact frontend origin to `CLIENT_URL` and redeploy the API |
| First request is slow | Render free tier sleeps when idle, so the first request wakes it |
| `MongoServerSelectionError` | Check Atlas network access and the password in `MONGO_URI` (URL-encode special characters) |
| 404 on page refresh (client) | Make sure `vercel.json` is in `client/` |
