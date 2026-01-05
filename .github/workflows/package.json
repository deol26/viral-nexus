const fs = require('fs');
const axios = require('axios');

const MAX_LINKS = 50;

async function fetchTrendingFromReddit() {
  try {
    const response = await axios.get('https://www.reddit.com/r/all/top.json?limit=10&t=day', {
      headers: { 'User-Agent': 'ViralNexus/1.0' }
    });
    
    return response.data.data.children.map(post => ({
      title: post.data.title,
      url: post.data.url,
      score: post.data.score,
      source: `r/${post.data.subreddit}`,
      category: categorizeContent(post.data.title, post.data.subreddit)
    }));
  } catch (error) {
    console.error('Reddit error:', error.message);
    return [];
  }
}

function categorizeContent(title, subreddit) {
  const lower = (title + ' ' + subreddit).toLowerCase();
  if (lower.match(/news|breaking|politics|world/)) return 'news';
  if (lower.match(/video|youtube|tiktok|watch/)) return 'videos';
  if (lower.match(/product|buy|amazon|deal/)) return 'products';
  if (lower.match(/tweet|twitter/)) return 'tweets';
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
    keywords: item.title.split(/\s+/).filter(w => w.length > 4).slice(0, 3),
    category: item.category,
    clicks: item.score * 10,
    createdAt: new Date().toISOString()
  }));
}

async function main() {
  console.log('Starting automated link curation...');
  
  const redditTrending = await fetchTrendingFromReddit();
  console.log(`Found ${redditTrending.length} trending items`);
  
  const newLinks = formatLinksManually(redditTrending);
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
  console.log(`Updated links.json with ${newLinks.length} new links`);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
