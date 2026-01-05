// Automated viral content curator using AI
// This script runs daily via GitHub Actions

const fs = require('fs');
const axios = require('axios');

// Configuration
const MAX_LINKS = 50; // Keep only latest 50 links
const CATEGORIES = ['news', 'videos', 'products', 'tweets', 'memes'];

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
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('No AI API key found. Using manual curation only.');
    return formatLinksManually(trendingData);
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Analyze these trending items and select the 3-5 most viral-worthy ones. Format as JSON array with: id (number), title, url, description, category (news/videos/products/tweets/memes), keywords (array), viralScore (0-100), clicks (estimated number).

Trending items: ${JSON.stringify(trendingData, null, 2)}

Return ONLY valid JSON array, no other text.`
      }],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const aiContent = response.data.choices[0].message.content;
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
  return 'news';
}

function formatLinksManually(trendingData) {
  return trendingData.slice(0, 5).map((item, idx) => ({
    id: String(Date.now() + idx),
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
  
  const redditTrending = await fetchTrendingFromReddit();
  console.log(`Found ${redditTrending.length} trending items`);
  
  const newLinks = await fetchTrendingWithAI(redditTrending);
  console.log(`Curated ${newLinks.length} viral links`);
  
  const linksFile = 'links.json';
  let existingLinks = [];
  if (fs.existsSync(linksFile)) {
    existingLinks = JSON.parse(fs.readFileSync(linksFile, 'utf8'));
  }
  
  const mergedLinks = [...newLinks, ...existingLinks];
  
  const uniqueLinks = mergedLinks.filter((link, index, self) =>
    index === self.findIndex(l => l.url === link.url)
  );
  
  const finalLinks = uniqueLinks.slice(0, MAX_LINKS);
  
  fs.writeFileSync(linksFile, JSON.stringify(finalLinks, null, 2));
  console.log(`✅ Updated links.json with ${newLinks.length} new links`);
  console.log(`Total links: ${finalLinks.length}`);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
