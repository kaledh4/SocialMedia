#!/usr/bin/env node
/**
 * dash2 Intelligence Engine
 * Lightweight RSS-based scraper for Reddit + YouTube
 * No APIs, browser-based friendly, low memory footprint
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, 'config.json');
const DATA_FILE = path.join(__dirname, 'docs', 'data.json');

const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

// Importance scoring for ranking posts
function scoreImportance(title, subreddit) {
    let score = 50; // base score
    const t = title.toLowerCase();
    const s = subreddit.toLowerCase();

    // High importance keywords
    if (t.includes('breakthrough')) score += 40;
    if (t.includes('announced') || t.includes('announcement')) score += 35;
    if (t.includes('release') || t.includes('launched')) score += 30;
    if (t.includes('first') || t.includes('world first')) score += 35;
    if (t.includes('agi') || t.includes('asi') || t.includes('gpt-5')) score += 45;
    if (t.includes('new model') || t.includes('open source')) score += 25;
    if (t.includes('benchmark') || t.includes('comparison')) score += 20;
    if (t.includes('update') && t.includes('available')) score += 15;
    if (t.includes('price') && (t.includes('drop') || t.includes('surge'))) score += 25;
    if (t.includes('tesla') || t.includes('spacex') || t.includes('elon')) score += 20;
    
    // Topic-specific boosts
    if (s.includes('ai') || s.includes('llm') || s.includes('gpt')) {
        if (t.includes('model') || t.includes('llama') || t.includes('claude')) score += 20;
    }
    if (s.includes('crypto') || s.includes('stock')) {
        if (t.includes('bitcoin') || t.includes('btc') || t.includes('market')) score += 15;
    }
    if (s.includes('steam') || s.includes('gaming')) {
        if (t.includes('steam deck') || t.includes('game pass')) score += 15;
    }

    // Reduce score for low-value content
    if (t.includes('meme') || t.includes('shitpost')) score -= 30;
    if (t.includes('help') && t.includes('?')) score -= 10; // Questions less important
    if (t.includes('my ') || t.includes('i made') || t.includes('look at')) score -= 5; // Personal posts

    return Math.max(0, Math.min(100, score)); // Clamp 0-100
}

// YouTube channel ID map (verified working)
const CHANNEL_MAP = {
    '@SpaceX': 'UCtI0Hodo5o5dUb67FeUjDeA',
    '@Tesla': 'UC5WjFlyuJ9xy7p67O6e66mA',
    '@lexfridman': 'UCSHZKyawb77ixDdsGog4iWA',
    '@TheLimitingFactor': 'UCIFn7ONIJHyC-lMnb7Fm_jw',
    '@ColdFusion': 'UC4QZ_KsYlR2k619m8Fp88Hw',
    '@WesRoth': 'UChpWqB7D3N0ZJt2d50rYQGA',
    '@DaveLeeInvesting': 'UCQj_f4-QoD5ZpS_o5_S0DdA',
    // Add more as needed - find channel ID from channel page source
};

function fetchRSS(url) {
    try {
        const result = execSync(`curl -sL --max-time 20 -A "${USER_AGENT}" "${url}"`, { 
            encoding: 'utf8',
            maxBuffer: 2 * 1024 * 1024 // 2MB buffer
        });
        return result;
    } catch (e) {
        console.error(`Failed to fetch ${url}: ${e.message}`);
        return null;
    }
}

function generateWhyCare(title, subreddit) {
    // Generate concise "why you should care" summary
    const t = title.toLowerCase();
    const s = subreddit.toLowerCase();
    
    // Priority patterns - return immediately for high-value content
    if (t.includes('breakthrough') || t.includes('world first') || t.includes('historic')) {
        return '🚀 Major breakthrough';
    }
    if (t.includes('agi') || t.includes('asi') || t.includes('superintelligence')) {
        return '🤖 AGI/ASI development';
    }
    if (t.includes('gpt-5') || t.includes('claude 4') || t.includes('gemini 2') || t.includes('llama 4')) {
        return '🧠 Next-gen model news';
    }
    if (t.includes('announced') || t.includes('announcement') || t.includes('official')) {
        return '📢 Official announcement';
    }
    if (t.includes('launch') && (t.includes('product') || t.includes('feature'))) {
        return '🎯 New product launch';
    }
    if (t.includes('benchmark') || t.includes('beats') || t.includes('outperforms')) {
        return '📊 Performance benchmark';
    }
    if (t.includes('price drop') || t.includes('discount') || t.includes('sale')) {
        return '💰 Price alert';
    }
    if (t.includes('tesla') || t.includes('spacex') || t.includes('neuralink')) {
        return '⚡ Musk company update';
    }
    if (t.includes('openai') || t.includes('anthropic') || t.includes('deepmind')) {
        return '🏢 AI lab news';
    }
    if (t.includes('battery') && (t.includes('energy') || t.includes('density'))) {
        return '🔋 Battery tech advance';
    }
    if (t.includes('solar') || t.includes('renewable') || t.includes('fusion')) {
        return '☀️ Energy innovation';
    }
    
    // Context-aware based on subreddit
    if (s.includes('local_llama') || s.includes('llm') || s.includes('gpt')) {
        if (t.includes('quantize') || t.includes('fine-tune') || t.includes('lora')) {
            return '🔧 LLM technique';
        }
        return '📱 Local AI news';
    }
    if (s.includes('invest') || s.includes('stock') || s.includes('crypto')) {
        return '📈 Market insight';
    }
    if (s.includes('steam') || s.includes('gaming') || s.includes('deck')) {
        return '🎮 Gaming update';
    }
    if (s.includes('hardware') || s.includes('framework') || s.includes('raspberry')) {
        return '🖥️ Hardware news';
    }
    if (s.includes('programming') || s.includes('coding') || s.includes('dev')) {
        return '💻 Dev resource';
    }
    
    // Content type fallbacks
    if (t.includes('how to') || t.includes('guide') || t.includes('tutorial')) {
        return '📖 How-to guide';
    }
    if (t.includes('review') || t.includes('comparison') || t.includes('vs ')) {
        return '🔍 Review/comparison';
    }
    if (t.includes('leak') || t.includes('rumor') || t.includes('report')) {
        return '🤫 Leak/rumor';
    }
    if (t.includes('discussion') || t.includes('thoughts') || t.includes('opinion')) {
        return '💭 Community discussion';
    }
    
    return '📌 Trending';
}

function parseRedditRSS(xml, subreddit) {
    const posts = [];
    if (!xml) return posts;

    const entries = xml.split('<entry>').slice(1);
    
    for (const entry of entries) {
        if (posts.length >= 5) break;

        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const linkMatch = entry.match(/<link href="([^"]+)"[^/]*\/?>/);
        const contentMatch = entry.match(/<content[^>]*>(.*?)<\/content>/s);
        const authorMatch = entry.match(/<author>.*?<name>(.*?)<\/name>.*?<\/author>/s);
        const publishedMatch = entry.match(/<published>(.*?)<\/published>/);

        if (titleMatch && linkMatch) {
            let summary = '';
            if (contentMatch) {
                // Strip HTML tags and decode entities
                summary = contentMatch[1]
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/\s+/g, ' ')
                    .trim()
                    .substring(0, 300);
            }

            const title = titleMatch[1];
            const whyCare = generateWhyCare(title, subreddit);

            posts.push({
                title: title,
                url: linkMatch[1],
                summary: summary,
                whyCare: whyCare,
                author: authorMatch ? authorMatch[1] : 'unknown',
                publishedAt: publishedMatch ? publishedMatch[1] : new Date().toISOString(),
                score: 0,
                num_comments: 0
            });
        }
    }

    return posts;
}

function parseYouTubeRSS(xml, channelHandle) {
    const videos = [];
    if (!xml) return videos;

    const entries = xml.split('<entry>').slice(1);

    for (const entry of entries) {
        if (videos.length >= 3) break;

        const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
        const descMatch = entry.match(/<media:description>(.*?)<\/media:description>/s);

        if (idMatch && titleMatch) {
            const videoId = idMatch[1];
            const publishedAt = publishedMatch ? publishedMatch[1] : new Date().toISOString();
            
            // Only include videos from last 7 days (relaxed for testing)
            const pubDate = new Date(publishedAt);
            const daysAgo = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysAgo > 7) continue;

            let description = '';
            if (descMatch) {
                description = descMatch[1]
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .substring(0, 500);
            }

            videos.push({
                channel: channelHandle,
                title: titleMatch[1],
                url: `https://youtube.com/watch?v=${videoId}`,
                videoId: videoId,
                publishedAt: publishedAt,
                transcript: description || 'No description available.'
            });
        }
    }

    return videos;
}

async function runEngine() {
    console.log('=== dash2 Intelligence Engine ===');
    console.log(`Started at ${new Date().toISOString()}`);

    const allPosts = []; // Collect ALL posts, then rank
    const results = {
        date: new Date().toISOString().split('T')[0],
        R: [],
        Y: [],
        T: null
    };

    // Reddit - fetch from all subreddits
    const redditSubs = config.R?.subreddits || [];
    console.log(`\n📰 Fetching ${redditSubs.length} Reddit subs...`);
    
    for (const sub of redditSubs) {
        console.log(`  Fetching r/${sub}...`);
        const rssUrl = `https://www.reddit.com/r/${sub}/hot/.rss`;
        const xml = fetchRSS(rssUrl);
        
        if (xml && xml.includes('<entry>')) {
            const posts = parseRedditRSS(xml, sub);
            posts.forEach(post => {
                // Score importance
                const score = scoreImportance(post.title, sub);
                allPosts.push({
                    ...post,
                    subreddit: sub,
                    importance: score
                });
            });
            console.log(`    ✓ Got ${posts.length} posts`);
        } else {
            console.log(`    ✗ Failed to fetch`);
        }
        
        // Delay to be nice
        await new Promise(r => setTimeout(r, 800));
    }

    // Sort ALL posts by importance and take top 30
    allPosts.sort((a, b) => b.importance - a.importance);
    const top30 = allPosts.slice(0, 30);

    // Group top 30 back by subreddit for the data structure
    const groupedBySub = {};
    top30.forEach(post => {
        if (!groupedBySub[post.subreddit]) {
            groupedBySub[post.subreddit] = [];
        }
        groupedBySub[post.subreddit].push({
            title: post.title,
            url: post.url,
            summary: post.summary,
            whyCare: post.whyCare,
            author: post.author,
            publishedAt: post.publishedAt,
            score: 0,
            num_comments: 0
        });
    });

    results.R = Object.entries(groupedBySub).map(([sub, posts]) => ({
        subreddit: sub,
        posts: posts
    }));

    // YouTube
    const ytChannels = config.Y?.channels || [];
    console.log(`\n🎥 Fetching ${ytChannels.length} YouTube channels...`);
    
    for (const handle of ytChannels.slice(0, 1)) { // Test with first 1
        const channelId = CHANNEL_MAP[handle];
        if (!channelId) {
            console.log(`  Unknown channel ID for ${handle}`);
            continue;
        }

        console.log(`  Fetching ${handle}...`);
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const xml = fetchRSS(rssUrl);

        if (xml && xml.includes('<entry>')) {
            const videos = parseYouTubeRSS(xml, handle);
            results.Y.push(...videos);
            console.log(`    ✓ Got ${videos.length} recent videos`);
        } else {
            console.log(`    ✗ Failed to fetch`);
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    // Twitter - skip for now (bird not installed, nitter blocked)
    console.log(`\n🐦 Twitter: Skipped (bird not installed)`);

    // Write results
    console.log(`\n💾 Writing results...`);
    
    const docsDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(results, null, 2));
    console.log(`  ✓ Written to ${DATA_FILE}`);

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Fetched from ${redditSubs.length} subreddits`);
    console.log(`Top 30 most important posts selected`)
    console.log(`Subreddits with top posts: ${results.R.length}`);
    console.log(`YouTube: ${results.Y.length} videos`);
    console.log(`Twitter: Skipped`);

    return results;
}

// Run if called directly
runEngine().catch(console.error);
