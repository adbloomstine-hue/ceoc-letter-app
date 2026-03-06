# CEOC Letter Generator

A web application for the California Employee Ownership Coalition that allows employees to generate signed advocacy letters to their California Assembly Member and State Senator.

## Features

- **Public Form** — Fill in your details, auto-find your representatives, sign digitally, and download a PDF letter
- **Representative Lookup** — US Census geocoding + GeoJSON point-in-polygon for both Assembly and Senate districts
- **Live Letter Preview** — See your letter update in real time as you fill in the form
- **PDF Generation** — Professional CEOC letterhead PDF with digital signature
- **Admin Dashboard** — Password-protected admin panel with stats, filtering, and bulk PDF export

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **PDF Generation:** html-pdf-node
- **Geocoding:** US Census Bureau API (free, no key needed)
- **District Lookup:** @turf/boolean-point-in-polygon + GeoJSON boundary files
- **Signature:** signature_pad

## Local Development

```bash
# Install all dependencies
npm run install:all

# Start dev (frontend + backend concurrently)
npm run dev
```

- App: http://localhost:5173
- Admin: http://localhost:5173/admin
- API: http://localhost:3001

## Environment Variables

Create `server/.env`:

```
PORT=3001
ADMIN_PASSWORD=your-password
SESSION_SECRET=your-secret
PDF_PATH=./storage/pdfs
```

## Project Structure

```
client/              React frontend (Vite)
server/              Express backend
  data/              GeoJSON district boundary files
  routes/            API route handlers
  services/          DB, PDF generator, rep lookup, geoData
  templates/         Letter HTML template
  storage/pdfs/      Generated PDF files
```

## DEPLOY TO RAILWAY (app runs 24/7, no terminal needed)

Before deploying:
- Make sure `server/data/assembly.geojson` and `server/data/senate.geojson` exist
- These files commit to GitHub automatically with the rest of the code

**Step 1: Push to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
```

Create a new repo on github.com and push to it.

**Step 2: Deploy on Railway**
- Go to railway.app, sign up or log in
- New Project > Deploy from GitHub repo > select your repo
- Railway reads railway.toml and builds automatically

**Step 3: Set environment variables in Railway**

Go to your service > Variables tab > add:

```
NODE_ENV = production
ADMIN_PASSWORD = (choose a strong password)
SESSION_SECRET = (any long random string)
CLIENT_URL = https://your-app-name.up.railway.app
```

Find the URL in Railway > Settings > Domains.

**Step 4: Add persistent storage**

Go to your service > Volumes tab > Add Volume. Set mount path: `/app/storage`

Then add two more variables:

```
DB_PATH = /app/storage/letters.db
PDF_PATH = /app/storage/pdfs
```

**Step 5: Redeploy**

Go to Deployments tab > click the latest > Redeploy. Wait ~2 minutes for the build.

**Step 6: Done!**

Your app is live at the Railway URL. Admin panel is at: `your-url.up.railway.app/admin`

Every future `git push` auto-redeploys — no terminal ever needed again.

**Updating the letter body:** Edit `server/templates/letterTemplate.js` > commit > push to GitHub. Railway redeploys in about 2 minutes.

**Updating representatives (after an election):** Replace `server/data/assembly.geojson` or `senate.geojson` > commit > push. Railway redeploys automatically.
