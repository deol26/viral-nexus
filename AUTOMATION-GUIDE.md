# AI-Powered Automation Guide

## How to Make Your Website Self-Updating 🤖

Your Viral Nexus website can now automatically find and add trending content daily!

## Setup Steps:

### 1. **Get AI API Key** (Choose One)

**Option A: Anthropic Claude** (Recommended)
- Go to https://console.anthropic.com
- Create account & get API key
- Free tier: $5 credit

**Option B: OpenAI GPT**
- Go to https://platform.openai.com
- Create account & get API key
- Pay-as-you-go: ~$0.01/day

### 2. **Add Secret to GitHub**

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`)
5. Value: Paste your API key
6. Save

### 3. **Upload Automation Files**

Upload these new files to your repository:
```
.github/workflows/auto-update-links.yml
scripts/auto-curator.js
scripts/package.json
```

### 4. **Done! 🎉**

The automation will:
- ✅ Run every day at 9 AM UTC
- ✅ Check Reddit, Twitter trends
- ✅ Use AI to select best viral content
- ✅ Add 3-5 new links to links.json
- ✅ Auto-commit and deploy
- ✅ Keep only latest 50 links

## Manual Trigger:

Go to: Actions tab → "Auto Update Viral Links" → "Run workflow"

## Customize:

Edit `.github/workflows/auto-update-links.yml`:
- Change schedule time (line 7)
- Adjust sources in `scripts/auto-curator.js`

## Cost Estimate:

- **GitHub Actions**: FREE (2,000 minutes/month)
- **AI API**: ~$0.01-0.10 per day
- **Total**: ~$3-5 per month for full automation

## Alternative: Zapier/Make.com

If you prefer no-code:
1. Use Zapier/Make.com
2. Connect RSS feeds → AI → GitHub
3. ~$20/month but easier setup

## Without AI (Free Option):

The script can work without AI:
- Just remove API key
- Will use manual Reddit trending
- Less intelligent but still works!

## Monitoring:

Check "Actions" tab on GitHub to see:
- When it last ran
- What links were added
- Any errors

---

**Your website is now FULLY AUTOMATED!** 🚀🤖
