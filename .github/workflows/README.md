# CI/CD Pipeline Documentation

This directory contains GitHub Actions workflows for automated testing, building, and deployment.

## ⚠️ Important: Separate Repositories Setup

**Your backend and frontend are in separate repositories.** You need to copy the appropriate workflows to each repository:

- **Backend Repository**: Copy `backend-ci.yml` and `backend-security.yml`
- **Frontend Repository**: Copy `frontend-ci.yml` and `frontend-security.yml`

---

## Backend Repository Workflows

### 1. `backend-ci.yml`
**Purpose**: Backend CI/CD pipeline

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs**:
- **test**: Installs dependencies, runs linting and tests
- **deploy**: Logs deployment status (Render auto-deploys on push)

**Setup**:
1. Copy this file to your backend repository: `.github/workflows/backend-ci.yml`
2. Ensure `package.json` has `test` and `lint` scripts (even if they're placeholders)
3. Push to GitHub - workflows will run automatically

**Status**: ✅ Ready to use

---

### 2. `backend-security.yml`
**Purpose**: Backend security scanning

**Triggers**:
- Push to `main` or `develop`
- Pull requests
- Weekly (every Sunday at midnight UTC)

**Jobs**:
- **security**: Runs npm audit and checks for exposed secrets

**Setup**:
1. Copy this file to your backend repository: `.github/workflows/backend-security.yml`
2. No additional configuration needed

**Status**: ✅ Ready to use

---

## Frontend Repository Workflows

### 1. `frontend-ci.yml`
**Purpose**: Frontend CI/CD pipeline

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs**:
- **test**: Installs dependencies, runs linting, builds the project
- **deploy**: Deploys to Vercel (requires secrets configuration)

**Setup**:
1. Copy this file to your frontend repository: `.github/workflows/frontend-ci.yml`
2. Configure Vercel secrets (see below)
3. Push to GitHub

**Status**: ⚠️ Requires Vercel secrets configuration for deployment

---

### 2. `frontend-security.yml`
**Purpose**: Frontend security scanning

**Triggers**:
- Push to `main` or `develop`
- Pull requests
- Weekly (every Sunday at midnight UTC)

**Jobs**:
- **security**: Runs npm audit and checks for exposed secrets

**Setup**:
1. Copy this file to your frontend repository: `.github/workflows/frontend-security.yml`
2. No additional configuration needed

**Status**: ✅ Ready to use

---

## Setup Instructions

### For Frontend Deployment (Vercel)

1. **Get Vercel credentials**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to Settings → Tokens
   - Create a new token
   - Go to your project settings to get `ORG_ID` and `PROJECT_ID`

2. **Add GitHub Secrets to Frontend Repository**:
   - Go to your **frontend** GitHub repository
   - Navigate to **Settings → Secrets and variables → Actions**
   - Add the following secrets:
     - `VERCEL_TOKEN`: Your Vercel token
     - `VERCEL_ORG_ID`: Your Vercel organization ID
     - `VERCEL_PROJECT_ID`: Your Vercel project ID
     - `VITE_API_URL`: (Optional) Your backend API URL

### For Backend Deployment (Render)

Render auto-deploys on git push by default. The workflow currently just logs deployment status. 

**No additional setup needed** - Render will automatically:
- Detect pushes to your connected branch
- Build and deploy your backend
- Restart services as needed

If you want to trigger Render deployments via API:
1. Get your Render API token from Render Dashboard
2. Add `RENDER_API_TOKEN` secret to GitHub (backend repo)
3. Update the `deploy` job in `backend-ci.yml` to use Render API

---

## Installation Steps

### Step 1: Backend Repository

```bash
# In your backend repository
mkdir -p .github/workflows

# Copy backend workflows
cp /path/to/this/repo/.github/workflows/backend-ci.yml .github/workflows/
cp /path/to/this/repo/.github/workflows/backend-security.yml .github/workflows/

# Commit and push
git add .github/
git commit -m "Add CI/CD workflows"
git push
```

### Step 2: Frontend Repository

```bash
# In your frontend repository
mkdir -p .github/workflows

# Copy frontend workflows
cp /path/to/this/repo/.github/workflows/frontend-ci.yml .github/workflows/
cp /path/to/this/repo/.github/workflows/frontend-security.yml .github/workflows/

# Commit and push
git add .github/
git commit -m "Add CI/CD workflows"
git push
```

### Step 3: Configure Vercel Secrets (Frontend Only)

1. Go to frontend repository on GitHub
2. Settings → Secrets and variables → Actions
3. Add the Vercel secrets mentioned above

---

## How It Works

### Backend Repository:
- **On push to `main`**: Tests run → Render auto-deploys
- **On PR**: Tests run → No deployment
- **Weekly**: Security scan runs

### Frontend Repository:
- **On push to `main`**: Tests run → Builds → Deploys to Vercel
- **On PR**: Tests run → Builds → No deployment
- **Weekly**: Security scan runs

---

## Testing the Workflows

1. Make a small change (e.g., update a comment)
2. Push to GitHub
3. Go to **Actions** tab in your repository
4. Watch the workflow run

---

## Workflow Status Badges

Add these to your README.md files:

**Backend Repository README:**
```markdown
![Backend CI](https://github.com/YOUR_USERNAME/BACKEND_REPO/workflows/Backend%20CI%2FCD/badge.svg)
```

**Frontend Repository README:**
```markdown
![Frontend CI](https://github.com/YOUR_USERNAME/FRONTEND_REPO/workflows/Frontend%20CI%2FCD/badge.svg)
```

---

## Troubleshooting

### Workflows not running?
- Check that `.github/workflows/*.yml` files are in the repository root
- Verify branch names match (`main` vs `master`)
- Check if workflows are disabled in repository settings

### Frontend deployment failing?
- Verify all Vercel secrets are set in GitHub (frontend repo)
- Check Vercel API credentials are valid
- Review workflow logs in the Actions tab

### Backend deployment not working?
- Render auto-deploys on push - check Render dashboard
- Verify Render is connected to the correct GitHub branch
- Check Render build logs

### Build failures?
- Check Node.js version compatibility
- Verify all dependencies install correctly
- Review error logs in the Actions tab

---

## Key Differences from Monorepo Setup

| Aspect | Monorepo | Separate Repos (Your Setup) |
|--------|----------|----------------------------|
| Workflow location | One repo, path filters | Separate repos, no path filters |
| Package.json | `backend/package.json` | Root `package.json` |
| Working directory | `./backend` or `./mockup1` | Root directory (`.`) |
| Deployment | Both from one repo | Each repo deploys independently |

---

## Next Steps

1. ✅ Copy workflows to respective repositories
2. ⏭️ Configure Vercel secrets (frontend repo)
3. ⏭️ Test workflows by pushing to each repo
4. ⏭️ Add actual tests (replace placeholder scripts)
5. ⏭️ Set up staging environment workflows
6. ⏭️ Configure code coverage reporting

---

## Questions?

Refer to [GitHub Actions Documentation](https://docs.github.com/en/actions)
