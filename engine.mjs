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
    // Generate a brief "why you should care" summary based on keywords
    const t = title.toLowerCase();
    const s = subreddit.toLowerCase();
    
    let why = [];
    
    // Technology breakthroughs
    if (t.includes('breakthrough') || t.includes('discovery') || t.includes('first time')) {
        why.push('Major advancement in the field');
    }
    if (t.includes('release') || t.includes('launch') || t.includes('announce')) {
        why.push('New product or update available');
    }
    if (t.includes('update') || t.includes('patch') || t.includes('fix')) {
        why.push('Important update to be aware of');
    }
    
    // AI/Tech specific
    if (s.includes('ai') || s.includes('artificial') || s.includes('llm') || s.includes('gpt')) {
        if (t.includes('model') || t.includes('gpt') || t.includes('claude') || t.includes('llama')) {
            why.push('AI model development news');
        }
    }
    
    // Gaming
    if (s.includes('steam') || s.includes('gaming') || s.includes('deck') || s.includes('game')) {
        if (t.includes('game') || t.includes('play') || t.includes('performance')) {
            why.push('Gaming relevance');
        }
    }
    
    // Crypto/Finance
    if (s.includes('crypto') || s.includes('stock') || s.includes('dividend')) {
        if (t.includes('price') || t.includes('market') || t.includes('btc') || t.includes('eth')) {
            why.push('Market movement to watch');
        }
    }
    
    // Hardware
    if (s.includes('raspberry') || s.includes('framework') || s.includes('xiaomi') || s.includes('quest')) {
        if (t.includes('review') || t.includes('compare') || t.includes('vs')) {
            why.push('Hardware insights for buyers');
        }
    }
    
    // Default if nothing specific
    if (why.length === 0) {
        if (t.includes('how to') || t.includes('guide') || t.includes('tutorial')) {
            why.push('Useful guide/resource');
        } else if (t.includes('question') || t.includes('help') || t.includes('issue')) {
            why.push('Community discussion');
        } else {
            why.push('Trending in community');
        }
    }
    
    return why.join(' • ');
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

    const results = {
        date: new Date().toISOString().split('T')[0],
        R: [],
        Y: [],
        T: null
    };

    // Reddit
    const redditSubs = config.R?.subreddits || [];
    console.log(`\n📰 Fetching ${redditSubs.length} Reddit subs...`);
    
    for (const sub of redditSubs) {
        console.log(`  Fetching r/${sub}...`);
        const rssUrl = `https://www.reddit.com/r/${sub}/hot/.rss`;
        const xml = fetchRSS(rssUrl);
        
        if (xml && xml.includes('<entry>')) {
            const posts = parseRedditRSS(xml, sub);
            if (posts.length > 0) {
                results.R.push({
                    subreddit: sub,
                    posts: posts
                });
                console.log(`    ✓ Got ${posts.length} posts`);
            }
        } else {
            console.log(`    ✗ Failed to fetch`);
        }
        
        // Delay to be nice
        await new Promise(r => setTimeout(r, 1000));
    }

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
    console.log(`Reddit: ${results.R.length} subreddits`);
    console.log(`YouTube: ${results.Y.length} videos`);
    console.log(`Twitter: Skipped`);

    return results;
}

// Run if called directly
runEngine().catch(console.error);
