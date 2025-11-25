# Deployment Guide

This guide covers two deployment options for your Folio portfolio.

## 🚀 Quick Deploy (No Setup Required)

The simplest way to deploy your portfolio to GitHub Pages:

### Steps

1. **Fork or clone this repository**
   ```bash
   git clone https://github.com/yourusername/folio.git
   cd folio
   ```

2. **Build the bundle**
   ```bash
   npm install
   npm run build
   ```

3. **Commit and push**
   ```bash
   git add dist/
   git commit -m "Build portfolio bundle"
   git push
   ```

4. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Navigate to: Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` / `(root)`
   - Click Save

5. **Visit your site**
   - Your portfolio will be live at: `https://yourusername.github.io/folio`
   - Or if you deploy to `yourusername.github.io` repo: `https://yourusername.github.io`

### How it works

- Your portfolio uses the committed `index.html` which loads the bundle without a token
- GitHub API allows **60 requests/hour** without authentication
- For most portfolios, this is plenty!
- If visitors hit the rate limit, they'll see a prompt to optionally add their own token in their browser (stored in localStorage)

**Pros:**
- ✅ Zero setup
- ✅ No secrets to manage
- ✅ Token never in repo or deployed files
- ✅ Works great for most use cases

**Cons:**
- ⚠️ Limited to 60 GitHub API requests/hour per visitor's IP
- ⚠️ May show rate limit warnings if your portfolio gets heavy traffic

---

## ⚡ Advanced Deploy (With Token Injection)

For portfolios that need higher rate limits (5000 requests/hour):

### Steps

1. **Create a GitHub Personal Access Token**
   - Go to: https://github.com/settings/tokens/new
   - Note: "Portfolio Token"
   - Expiration: No expiration (or 1 year)
   - Scopes: ✅ `public_repo` (read-only access to public repositories)
   - Click "Generate token"
   - **Copy the token** (starts with `ghp_...`)

2. **Add token to repository secrets**
   - Go to your repository on GitHub
   - Navigate to: Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `PORTFOLIO_GITHUB_TOKEN`
   - Value: Paste your token (e.g., `ghp_xxxxxxxxxxxxx`)
   - Click "Add secret"

3. **Enable GitHub Actions workflow**
   ```bash
   # Rename the example workflow file
   mv .github/workflows/deploy.yml.example .github/workflows/deploy.yml
   
   # Commit and push
   git add .github/workflows/deploy.yml
   git commit -m "Add automated deployment with token injection"
   git push
   ```

4. **Enable GitHub Pages (Actions mode)**
   - Go to: Settings → Pages
   - Source: **GitHub Actions** (not "Deploy from a branch")
   - Click Save

5. **Trigger deployment**
   - The workflow runs automatically on every push to `main`
   - Or manually trigger: Actions → Deploy Portfolio → Run workflow

### How it works

1. GitHub Actions builds your portfolio
2. Creates a **new** `index.html` with the token injected from secrets
3. Deploys this generated HTML to GitHub Pages
4. Your deployed site has 5000 requests/hour limit
5. **The token is never committed to your repo source code**

**Pros:**
- ✅ 5000 GitHub API requests/hour (vs 60)
- ✅ Fully automated deployment
- ✅ Token never in repo source code (only in deployed HTML and secrets)
- ✅ Great for high-traffic portfolios

**Cons:**
- ⚠️ Requires GitHub Actions setup
- ⚠️ Token is visible in deployed HTML (but that's fine - it's read-only)

---

## 🔐 Security Notes

### Is it safe to expose the token in deployed HTML?

**Yes!** Here's why:

1. **Read-only token**: Personal access tokens with `public_repo` scope can only read public data
2. **Already public**: Your portfolio is public anyway
3. **Rate limit benefit**: Having the token in the deployed HTML just increases the rate limit
4. **No write access**: The token cannot modify any repositories

### What's the difference between the two approaches?

| Aspect | Quick Deploy | Advanced Deploy |
|--------|--------------|-----------------|
| Token in repo source | ❌ No | ❌ No |
| Token in deployed HTML | ❌ No | ✅ Yes |
| API rate limit | 60/hour | 5000/hour |
| Setup complexity | Simple | Medium |
| Automation | Manual | Automatic |

**The key insight:** It's weird to commit a token to your repo source code, but it's fine to have it in the deployed HTML (which is public anyway).

---

## 🎯 Which Option Should I Use?

### Use Quick Deploy if:
- Your portfolio won't get heavy traffic
- You want zero setup
- You don't want to manage tokens
- 60 API requests/hour is enough

### Use Advanced Deploy if:
- Your portfolio might get heavy traffic
- You want fully automated deployments
- You want higher rate limits (5000/hour)
- You don't mind a bit of setup

---

## 🆘 Troubleshooting

### "API rate limit exceeded" error

**Solution 1:** Wait an hour for the rate limit to reset

**Solution 2:** Add your own token in the browser:
- Click "Add Token" when prompted
- Enter your personal token
- It's stored in localStorage (never leaves your browser)

**Solution 3:** Use the Advanced Deploy option with token injection

### Workflow not running

1. Check that GitHub Pages is set to "GitHub Actions" mode (not "Deploy from a branch")
2. Check repository permissions: Settings → Actions → General → Workflow permissions → "Read and write permissions"
3. Look at Actions tab for error messages

### Token not working

1. Make sure the token has `public_repo` scope
2. Check that the secret name is exactly: `PORTFOLIO_GITHUB_TOKEN`
3. Regenerate the token if it expired

---

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Creating a Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

---

## 🤝 Contributing

Found a better way to deploy? Open an issue or PR!

