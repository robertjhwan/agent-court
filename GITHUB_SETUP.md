# Publish Agent Court to GitHub (for Devpost)

## 1. Create the repo on GitHub

1. Log in to [GitHub](https://github.com) → **New repository**
2. **Repository name:** e.g. `agent-court` (or `aws-hackathon-agent-court`)
3. Set **Public**
4. Do **not** add a README, .gitignore, or license (this folder already has content)
5. Click **Create repository**

## 2. Push this project (run from the repo root)

```bash
cd "/Users/robertwan/Desktop/LLM Projects/aws-hackathon"
git init
git add .
git status   # confirm .env is NOT listed
git commit -m "Initial commit: Agent Court demo"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

Replace `<YOUR_GITHUB_USERNAME>` and `<YOUR_REPO_NAME>` with your values.

**SSH instead of HTTPS:**

```bash
git remote add origin git@github.com:<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
```

## 3. Link on Devpost

- **Project URL / GitHub URL:** `https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>`
- Confirm the repo is **Public** (Settings → General → Danger Zone is not needed; visibility should show Public at the top).

## 4. What stays private

- `apps/web/.env` is listed in `.gitignore` and must **not** be committed.
- For collaborators, use `apps/web/.env.example` (add one if missing) with placeholder keys only.

## Quick copy: submission line

After you push, your link is:

**`https://github.com/<YOUR_GITHUB_USERNAME>/agent-court`**

(adjust path to match the repo you created.)
