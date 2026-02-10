const { execSync } = require('child_process');

const REDDIT_MIRRORS = [
    'https://libreddit.kavin.rocks',
    'https://libreddit.privacydev.net',
    'https://r.iff.ink',
    'https://reddit.invak.id',
    'https://snoo.habedieeh.re',
    'https://redlib.catsarch.com'
];

const NITTER_INSTANCES = [
    'https://nitter.poast.org',
    'https://nitter.privacydev.net',
    'https://nitter.lucabased.xyz',
    'https://nitter.woodland.cafe',
    'https://nitter.salastil.com',
    'https://nitter.moomoo.me',
    'https://nitter.soopy.moe',
    'https://nitter.freedit.eu'
];

console.log('--- Testing Reddit Mirrors ---');
for (const mirror of REDDIT_MIRRORS) {
    try {
        const start = Date.now();
        console.log(`Checking ${mirror}...`);
        execSync(`curl -s --max-time 3 "${mirror}/r/technology/top.json?limit=1" > /dev/null`, { stdio: 'ignore' });
        console.log(`[OK] ${mirror} (${Date.now() - start}ms)`);
    } catch (e) {
        console.error(`[FAIL] ${mirror}:`, e.message);
    }
}

console.log('\n--- Testing Nitter Instances ---');
for (const instance of NITTER_INSTANCES) {
    try {
        const start = Date.now();
        // Nitter often blocks automated requests or has captchas on main pages, check RSS or specific endpoint
        execSync(`curl -s --max-time 5 "${instance}/elonmusk/rss"`, { stdio: 'ignore' });
        console.log(`[OK] ${instance} (${Date.now() - start}ms)`);
    } catch (e) {
        console.log(`[FAIL] ${instance}`);
    }
}
