// Automated viral content curator using AI
// This script runs daily via GitHub Actions

const fs = require('fs');
const axios = require('axios');

// Configuration
const MAX_LINKS = 50; // Keep only latest 50 links
const CATEGORIES = ['news', 'videos', 'products', 'tweets', 'memes'];
const FETCH_PER_SOURCE = 5; // Get 5 items from each source

// Multiple trending sources for global coverage
const REDDIT_SOURCES = [
  'worldnews',
  'news', 
  'technology',
  'videos',
  'entertainment',
  'Damnthatsinteresting'
];

async function fetchTrendingFromReddit() {
  console.log('🌍 Fetching trending content from Reddit...');
  let allPosts = [];
  
  for (const subreddit of REDDIT_SOURCES) {
    try {
      console.log(`  Checking r/${subreddit}...`);
      const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json?limit=5`, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      const posts = response.data.data.children;
      allPosts.push(...posts.map(post => ({
        title: post.data.title,
        url: post.data.url,
        score: post.data.score,
        source: `r/${subreddit}`,
        category: categorizeContent(post.data.title, subreddit)
      })));
      
      console.log(`  ✅ Got ${posts.length} posts from r/${subreddit}`);
    } catch (error) {
      console.log(`  ⚠️ Failed to fetch r/${subreddit}: ${error.message}`);
    }
  }
  
  if (allPosts.length === 0) {
    console.log('❌ All Reddit sources failed. Using fallback data...');
    return getFallbackData();
  }
  
  // Sort by score and return top trending
  allPosts.sort((a, b) => b.score - a.score);
  console.log(`✅ Total fetched: ${allPosts.length} posts from ${REDDIT_SOURCES.length} subreddits`);
  return allPosts.slice(0, 15);
}

function getFallbackData() {
  // Fallback viral content if APIs fail
  return [
    { title: '🚨 Breaking: Major Global Event Unfolds', url: 'https://bbc.com/news', score: 9500, source: 'r/worldnews', category: 'news' },
    { title: '🎥 Viral Video Breaks Internet Records', url: 'https://youtube.com', score: 8800, source: 'r/videos', category: 'videos' },
    { title: '🤖 Revolutionary AI Technology Announced', url: 'https://techcrunch.com', score: 7200, source: 'r/technology', category: 'news' },
    { title: '📱 New App Goes Viral Overnight', url: 'https://apps.apple.com', score: 6500, source: 'r/technology', category: 'products' },
    { title: '🔥 Trending Celebrity News Shocks World', url: 'https://tmz.com', score: 6000, source: 'r/entertainment', category: 'tweets' },
    { title: '😂 Hilarious Meme Takes Over Social Media', url: 'https://reddit.com/r/memes', score: 5800, source: 'r/memes', category: 'memes' }
  ];
}

async function fetchTrendingWithAI(trendingData) {
  // Use Claude or GPT to curate and format links
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  
  console.log(`API Key status: ${apiKey ? '✅ Found' : '❌ Not found'}`);
  
  if (!apiKey) {
    console.log('⚠️  No AI API key found. Using manual curation...');
    return formatLinksManually(trendingData);
  }

  try {
    console.log('🤖 Using OpenAI to curate content...');
    // Use OpenAI GPT API
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `You are a viral content curator for a trending website. Analyze these items and select the 5-7 MOST viral-worthy ones with global appeal.

Focus on:
- Breaking world news
- Viral videos/memes
- Technology breakthroughs
- Entertainment buzz
- Products going viral

Trending items: ${JSON.stringify(trendingData, null, 2)}

Return ONLY a valid JSON array with these fields for each item:
[
  {
    "title": "catchy rewritten title (keep it concise)",
    "url": "original url",
    "description": "engaging 1-sentence description",
    "category": "news/videos/products/tweets/memes",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "viralScore": 0-100,
    "clicks": estimated clicks number
  }
]

Return ONLY the JSON array, no markdown, no explanation.`
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
    console.log(`✅ AI curated ${newLinks.length} viral links`);
    return newLinks.map((link, idx) => ({
      ...link,
      id: Date.now() + idx,
      thumbnail: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/250/150`,
      createdAt: new Date().toISOString()
    }));
    
  } catch (error) {
    console.error('❌ AI API error:', error.message);
    console.log('Falling back to manual curation...');
    return formatLinksManually(trendingData);
  }
}

function categorizeContent(title, subreddit) {
  const lower = (title + ' ' + subreddit).toLowerCase();
  if (lower.match(/news|breaking|politics|world|war|economy|election/)) return 'news';
  if (lower.match(/video|youtube|tiktok|watch|viral|clip/)) return 'videos';
  if (lower.match(/product|buy|amazon|deal|launch|gadget/)) return 'products';
  if (lower.match(/tweet|twitter|x\.com|musk|social/)) return 'tweets';
  if (lower.match(/meme|funny|humor|wtf|damn/)) return 'memes';
  if (lower.match(/entertainment|celebrity|movie|music/)) return 'videos';
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
