# SeitanYum v5 🌱

## GITHUB UPLOAD FIX — How to upload correctly

**The problem:** GitHub's web UI drag-and-drop UNPACKS folders. You cannot upload a folder structure via drag-and-drop.

**The solution — two options:**

### Option A: GitHub Desktop (easiest)
1. Install GitHub Desktop: desktop.github.com
2. Clone your repo locally
3. Copy/replace all files from this zip into the cloned folder
4. Commit & Push — done.

### Option B: GitHub web UI (file by file)
Upload each file to the correct path manually:
- Drag `index.html` → root of repo
- Create folder `store/` → upload `store/index.html` into it
- Create folder `admin/` → upload `admin/index.html` into it  
- Create folder `assets/` → upload `assets/db.js` into it
- Create folder `data/` → upload all 3 `.json` files into it
- Upload `.nojekyll` to root

To create a folder on GitHub web: click "Add file" → "Create new file" → type `store/index.html` (GitHub creates the folder automatically when you include the slash).

### Option C: Git command line
```bash
git clone https://github.com/YOURUSERNAME/YOURREPO
# copy all files from zip into cloned folder
cd YOURREPO
git add .
git commit -m "Update SeitanYum v5"
git push
```

---

## Google Drive Setup (fix for "Drive failed")

The error happens when this site's URL is not whitelisted in your Google Cloud OAuth Client.

1. Go to console.cloud.google.com
2. Your project → APIs & Services → Credentials
3. Click your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, add EXACTLY:
   `https://YOURUSERNAME.github.io`
   (No trailing slash. No path. Just the origin.)
5. Save. Wait 5 minutes for Google to propagate.
6. In Admin → Settings → Google Drive → click **Test Sign-In**

---

## Admin Setup (one time)
1. Open `/admin/` → enter password (default: `sy2025`)
2. First login prompts for GitHub config:
   - Token: github.com/settings/tokens → classic → repo scope
   - Owner: your GitHub username
   - Repo: your repo name
3. Connect → Init Repo Files

## Default password
`sy2025` — change in Admin → Settings → Change Password
