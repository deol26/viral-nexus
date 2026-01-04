// Automated viral content curator using AI
// This script runs daily via GitHub Actions

const fs = require('fs');
const axios = require('axios');

// Configuration
const MAX_LINKS = 50; // Keep only latest 50 links
const CATEGORIES = ['news', 'videos', 'products', 'tweets', 'memes'];

// Trending sources to check
const TRENDING_SOURCES = [
  'https://news.ycombinator.com/best', // Hacker News
  'https://www.reddit.com/r/all/top.json?limit=10', // Reddit
  // Add more sources as needed
];

async function fetchTrendingFromReddit() {
  try {
    const response = await axios.get('https://www.reddit.com/r/all/top.json?limit=10&t=day', {
      headers: { 'User-Agent': 'ViralNexus/1.0' }
    });
    
    const posts = response.data.data.children;
    return posts.map(post => ({
      title: post.data.title,
      url: post.data.url,
      score: post.data.score,
      source: `r/${post.data.subreddit}`,
      category: categorizeContent(post.data.title, post.data.subreddit)
    }));
  } catch (error) {
    console.error('Reddit fetch error:', error.message);
    return [];
  }
}

async function fetchTrendingWithAI(trendingData) {
  // Use Claude or GPT to curate and format links
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('No AI API key found. Using manual curation only.');
    return formatLinksManually(trendingData);
  }

  try {
    // Example using Anthropic Claude API
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Analyze these trending items and select the 3-5 most viral-worthy ones. Format as JSON array with: id, title, url, description, category (news/videos/products/tweets/memes), keywords (array), viralScore (0-100), estimated clicks.

Trending items: ${JSON.stringify(trendingData, null, 2)}

Return ONLY valid JSON array, no other text.`
      }]
    }, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    const aiContent = response.data.content[0].text;
    const newLinks = JSON.parse(aiContent);
    return newLinks;
    
  } catch (error) {
    console.error('AI API error:', error.message);
    return formatLinksManually(trendingData);
  }
}

function categorizeContent(title, subreddit) {
  const lower = (title + ' ' + subreddit).toLowerCase();
  if (lower.match(/news|breaking|politics|world/)) return 'news';
  if (lower.match(/video|youtube|tiktok|watch/)) return 'videos';
  if (lower.match(/product|buy|amazon|deal/)) return 'products';
  if (lower.match(/tweet|twitter|musk/)) return 'tweets';
  if (lower.match(/meme|funny|humor/)) return 'memes';
  return 'news'; // default
}

function formatLinksManually(trendingData) {
  return trendingData.slice(0, 5).map((item, idx) => ({
    id: Date.now() + idx,
    title: item.title,
    url: item.url,
    description: `Trending on ${item.source}`,
    thumbnail: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/250/150`,
    source: item.source,
    viralScore: Math.min(100, Math.floor(item.score / 100)),
    keywords: extractKeywords(item.title),
    category: item.category,
    clicks: item.score * 10,
    createdAt: new Date().toISOString()
  }));
}

function extractKeywords(title) {
  const words = title.split(/\s+/)
    .filter(w => w.length > 4)
    .slice(0, 3);
  return words.length ? words : ['Trending'];
}

async function main() {
  console.log('🤖 Starting automated link curation...');
  
  // Fetch trending content
  const redditTrending = await fetchTrendingFromReddit();
  console.log(`Found ${redditTrending.length} trending items`);
  
  // Use AI to curate
  const newLinks = await fetchTrendingWithAI(redditTrending);
  console.log(`Curated ${newLinks.length} viral links`);
  
  // Load existing links
  const linksFile = 'links.json';
  let existingLinks = [];
  if (fs.existsSync(linksFile)) {
    existingLinks = JSON.parse(fs.readFileSync(linksFile, 'utf8'));
  }
  
  // Merge: Add new links at the beginning
  const mergedLinks = [...newLinks, ...existingLinks];
  
  // Remove duplicates by URL
  const uniqueLinks = mergedLinks.filter((link, index, self) =>
    index === self.findIndex(l => l.url === link.url)
  );
  
  // Keep only latest MAX_LINKS
  const finalLinks = uniqueLinks.slice(0, MAX_LINKS);
  
  // Save
  fs.writeFileSync(linksFile, JSON.stringify(finalLinks, null, 2));
  console.log(`✅ Updated links.json with ${newLinks.length} new links`);
  console.log(`Total links: ${finalLinks.length}`);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
