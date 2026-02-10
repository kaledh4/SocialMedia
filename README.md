# dash2 - Automated Daily Intelligence Digest

Everything you need for your daily digest is here.

## 📁 Project Structure

- `index.js`: Main entry point. Orchestrates all digests and pushes to GitHub.
- `reddit-digest.js`: Fetches top posts from R subreddits.
- `youtube-digest.js`: Summarizes new videos from Y channels.
- `twitter-analysis.js`: Performs qualitative analysis on T accounts.
- `config.json`: **The central configuration file** where you list your R subreddits, Y channels, and T handles.
- `setup-cron.sh`: Run this to automate the digests via system cron.
- `.gitignore`: Prevents sensitive info from being pushed to GitHub.

## 🚀 How to Set It Up

1.  **Configure Accounts**: Update `config.json` with the R subreddits and Y channels you want to follow.
2.  **API Keys & Auth**:
    - **Y**: Run `openclaw task "Set up my Y-full skill"` to get your `TRANSCRIPT_API_KEY`. Save it in a `.env` file in this directory.
    - **T**: Log into `x.com` in your browser. Use the `bird` tool to authenticate or provide `auth-token` and `ct0` in the `.env` file.
    - **GitHub**: Ensure your VPS has SSH access to `https://github.com/kaledh4/SocialMedia` so the push works.
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Schedule Everything**:
    ```bash
    bash setup-cron.sh
    ```

## 📊 Where to see the results?

The daily digests are automatically pushed to [kaledh4/SocialMedia](https://github.com/kaledh4/SocialMedia) as `DAILY_BRIEF.md`.

## 🛠 Manual Execution

To run everything manually:
```bash
node index.js --all
```

Or run specific parts:
```bash
node index.js --R
node index.js --Y
node index.js --T
```

---
*Created by Antigravity*
