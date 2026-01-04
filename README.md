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