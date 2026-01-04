# Viral Nexus - JSON-Based Content Management

A simplified viral content aggregator that uses a JSON file for easy content management.

## 🚀 How It Works

This website loads viral content from a **links.json** file instead of requiring a complex admin panel or database. Simply edit the JSON file and push to GitHub to update your site!

## Features

- **Homepage Grid**: Displays trending content in a responsive card layout
- **Category Filtering**: Browse by content type (Tweets, News, Videos, Products, Memes)
- **Intelligent Search**: Search by title, keywords, or category
- **Keyword Tags**: Clickable tags for related content discovery
- **Dark Mode**: Toggle between light and dark themes
- **Infinite Scroll**: Load more content dynamically
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **JSON-Based Management**: No admin panel needed - just edit links.json!
- **Smart Image Selection**: Deterministic algorithm selects most relevant preview images based on content matching

## 📝 Managing Content

### Edit links.json

All your viral links are stored in `links.json`. Each link has this structure:

```json
{
  "id": "1",
  "title": "Your Viral Content Title",
  "url": "https://example.com/viral-content",
  "description": "Brief description of the content",
  "thumbnail": "https://picsum.photos/250/150?random=1",
  "source": "Source Name",
  "viralScore": 95,
  "keywords": ["Keyword1", "Keyword2", "Keyword3"],
  "category": "news",
  "clicks": 1000000,
  "createdAt": "2026-01-04T00:00:00Z"
}
```

### Categories

Available categories:
- `news` - Breaking News
- `videos` - Top Videos
- `products` - Viral Products
- `tweets` - Viral Tweets
- `memes` - Hot Memes

### Adding New Links

1. Open `links.json` in any text editor
2. Add a new object to the array (copy an existing one as template)
3. Update the id, title, url, description, keywords, etc.
4. Save the file
5. Commit and push to GitHub
6. Wait 2-5 minutes for GitHub Pages to deploy

### Example Workflow

```bash
# 1. Edit links.json (add your new viral content)
# 2. Commit changes
git add links.json
git commit -m "Add new viral content"

# 3. Push to GitHub
git push origin main

# 4. Wait a few minutes - your site will auto-update!
```

## 🎯 Benefits Over Admin Panel

✅ **Simple** - Just edit a JSON file
✅ **No Database** - Everything in one file
✅ **Version Control** - Track all changes in Git
✅ **Easy Backup** - Just copy the JSON file
✅ **Fast Deployment** - Push to GitHub and you're done
✅ **No Server Required** - Pure client-side

## Getting Started

### User Interface
1. Open `index.html` in your web browser
2. Browse trending content or use the search bar
3. Click on category buttons to filter content
4. Click on keyword tags to search for related content
5. Toggle dark mode using the moon/sun icon

### Admin Panel
1. Open `admin.html` in your web browser
2. Use the navigation tabs to access different admin functions:
   - **Add Link**: Manually add new viral content
   - **Bulk Upload**: Import multiple links via CSV/JSON
   - **Moderation Queue**: Review and approve/reject submitted content
   - **Analytics**: View site metrics and performance data
   - **Keyword Management**: Manage keywords, synonyms, and usage
5. Toggle dark mode using the moon/sun icon

## 🌐 Deploying to GitHub Pages

1. Create a new repository on GitHub
2. Push your files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
3. Go to Settings > Pages
4. Select "main" branch as source
5. Your site will be live at: `https://YOUR-USERNAME.github.io/YOUR-REPO/`

## File Structure

```
viral-nexus/
├── index.html      # Main user homepage
├── style.css       # Homepage CSS styles
├── script.js       # Homepage JavaScript functionality
├── links.json      # Viral content data (EDIT THIS!)
├── admin.html      # Admin panel (optional - can be removed)
├── admin.css       # Admin panel CSS (optional)
├── admin.js        # Admin panel JS (optional)
└── README.md       # This file
```

## 🔧 Local Development

Simply open `index.html` in a browser, or use a local server:

```bash
# Python
python -m http.server 8000

# Node.js (http-server)
npx http-server

# VS Code Live Server extension
# Just right-click index.html > Open with Live Server
```

Then visit `http://localhost:8000`

## ❓ Troubleshooting

**Links not loading?**
- Make sure `links.json` is in the same folder as `index.html`
- Check browser console (F12) for errors
- Verify JSON syntax at https://jsonlint.com

**GitHub Pages not updating?**
- Wait 2-5 minutes for deployment
- Clear browser cache (Ctrl+Shift+R)
- Check GitHub Actions for deployment status

## Technologies Used

- HTML5
- CSS3 (with Flexbox and Grid)
- Vanilla JavaScript (ES6+)

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Development

This is a static website prototype. For a full production version, consider:

- Backend API for dynamic content
- Database for storing links and keywords
- User authentication system
- Real-time updates
- Advanced search with Elasticsearch

## 🖼️ Smart Image Selection

Viral Nexus uses an intelligent, deterministic algorithm to select the most relevant preview images for your links. This ensures that images are chosen based on actual content relevance rather than randomly.

### How It Works

The image selector scores each candidate image based on:

1. **Filename matching** (60% weight): Compares image URL/filename tokens with link title and keywords
2. **Alt text matching** (30% weight): Analyzes alt text and captions for relevance
3. **Keyword tags** (40% weight): Matches explicit image keyword tags with link keywords
4. **Resolution boost** (5% weight): Slight preference for higher-quality images

### Image Sources (Priority Order)

Images are selected from these sources in order of priority:
1. `images` array in link JSON (highest priority)
2. Open Graph (`og:image`) or Twitter meta tags
3. First available page image
4. Category-specific placeholder (fallback)

### Enhanced Link JSON Format

To take full advantage of the smart selector, you can optionally include detailed image metadata:

```json
{
  "id": "1",
  "title": "AI Breakthrough in Healthcare",
  "url": "https://example.com/article",
  "keywords": ["AI", "Healthcare", "Technology"],
  "images": [
    {
      "url": "https://example.com/images/ai-healthcare-lab.jpg",
      "alt": "AI technology in healthcare laboratory",
      "caption": "Researchers using artificial intelligence",
      "width": 1920,
      "height": 1080
    }
  ],
  "meta": {
    "ogImage": "https://example.com/og-image.jpg",
    "twitterImage": "https://example.com/twitter-image.jpg"
  }
}
```

**Note**: The basic link format still works! The selector intelligently falls back to available data. Your existing `thumbnail` field continues to work as before.

### Performance & Caching

- **In-memory cache**: Server-side selections are cached for fast repeated access
- **localStorage cache**: Client-side persistence reduces redundant calculations
- **Deterministic**: Same input always produces the same output for consistency

### Customization

To adjust selection behavior, modify `src/utils/imageSelector.js`:

- **Weights**: Adjust `WEIGHTS` object to change scoring priorities
- **Threshold**: Change `SCORE_THRESHOLD` (default: 0.05) to be more/less selective
- **Stop words**: Add domain-specific terms to filter from matching

Example:
```javascript
const WEIGHTS = {
    filename: 0.7,      // Increase filename importance
    altCaption: 0.2,    // Decrease alt text importance
    keywordTag: 0.5,    // Increase keyword matching
    resolution: 0.1     // Increase quality preference
};
```

### Testing

Run the test suite to verify image selection logic:

**In Browser**: Open `tests/test-runner.html` in your browser and click "Run Tests"

**In Node.js**: 
```bash
node tests/imageSelector.test.js
```

## Troubleshooting

### Content Not Loading
- Ensure all files are in the same directory
- Check browser console for JavaScript errors
- Try refreshing the page

### Styling Issues
- Clear browser cache
- Ensure CSS file is linked correctly in HTML
- Check for CSS syntax errors

### Search Not Working
- Verify JavaScript is enabled in browser
- Check console for errors
- Ensure search query matches sample data

## License

This project is for demonstration purposes. Modify and use as needed.