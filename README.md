# SeitanYum 🌱

Real-time plant-based kiosk — GitHub Pages + GitHub API as database.

## How it works
- **Customers** open the store, browse, order, pay, ring the bell — zero login needed
- **Admin** logs in once, connects GitHub token once — then manages all orders live from any device
- **Data** lives in `data/*.json` in this repo — every change is a git commit

## Deploy in 4 steps

### 1. Push to GitHub
Create a repo and push this folder.

### 2. Enable GitHub Pages
Settings → Pages → Source: Deploy from branch → main → / (root)
Your store: `https://yourusername.github.io/yourrepo/`

### 3. Get a Personal Access Token
https://github.com/settings/tokens → Generate new token (classic) → tick `repo` → Generate

### 4. Connect in Admin (one time)
Open `/admin/` → enter password → fill in token + username + repo name → Connect → Init Repo Files

That's it. Every customer order writes to `data/orders.json`. Admin sees it live.

## Default password
`sy2025` — change it in Admin → Settings → Change Password

## Google Drive (optional, for shared product images)
1. Create project at console.cloud.google.com
2. Enable Google Drive API
3. Create OAuth 2.0 credentials → Web application
4. Add your GitHub Pages URL as authorized origin
5. Paste the Client ID in Admin → Settings → Google Drive

## File structure
```
/                   ← GitHub Pages root (index.html = hub)
/store/             ← Customer kiosk
/admin/             ← Admin dashboard (password protected)
/assets/db.js       ← Shared backend library
/data/orders.json   ← Live order database
/data/products.json ← Menu (editable from admin)
/data/settings.json ← Bank details, config
```
