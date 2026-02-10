# dash2 - Automated Daily Intelligence Digest

Everything you need for your daily digest is here.

## 📁 Project Structure

- `engine.mjs`: Main entry point. Lightweight RSS-based intelligence engine.
- `config.json`: **The central configuration file** where you list your sources.
- `docs/index.html`: Live dashboard for GitHub Pages.
- `docs/data.json`: Intelligence data consumed by the dashboard.

## 🚀 How It Works

1. **Configure Sources**: Update `config.json` with topics and channels you want to follow.
2. **Run the Engine**: Fetches latest content via RSS feeds (no APIs, no rate limits).
3. **View Dashboard**: Results pushed to GitHub Pages automatically.

## 📊 Configuration

Edit `config.json` to customize:

```json
{
  "R": {
    "subreddits": ["energy", "Batteries", "Singularity"],
    "rules": "focus on technical breakthroughs"
  },
  "Y": {
    "channels": ["@SpaceX", "@Tesla", "@ColdFusion"]
  },
  "general": {
    "timezone": "America/New_York"
  }
}
```

## 🛠 Manual Execution

```bash
node engine.mjs
```

## 📈 Dashboard

View the live intelligence feed at the GitHub Pages URL.

## ⚡ Features

- **Zero API dependencies** - Pure RSS/Atom feeds
- **Low memory footprint** - Designed for 1GB RAM environments
- **No rate limiting** - Browser-friendly approach
- **Automated scheduling** - Cron-ready

---
*Intelligence automation for the curious mind.*
