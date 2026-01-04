# Image Selection Migration Guide

## Overview

Viral Nexus now uses an intelligent, deterministic image selection algorithm instead of random image selection. This document explains the changes and how to use the new features.

## What Changed?

### Before
- Images were selected randomly from Unsplash based on the first keyword
- No consistency - same link could show different images on each page load
- No relevance matching - images didn't necessarily match the content

### After
- Images are scored based on relevance to link title and keywords
- Deterministic - same link always shows the same image
- Multiple fallback options for better coverage
- Cached for performance

## How It Works

### Scoring Algorithm

The system analyzes each image candidate and assigns a score based on:

1. **Filename/URL Matching (60%)**: Does the image URL contain words from the title or keywords?
2. **Alt Text Matching (30%)**: Does the alt text or caption match the content?
3. **Keyword Tags (40%)**: Direct matches with link keywords
4. **Resolution Bonus (10%)**: Preference for higher quality images (>100k pixels)

### Fallback Chain

If no image scores above the threshold (0.1), the system falls back to:

1. Best-scored image from the images array
2. `og:image` from meta tags
3. `twitter:image` from meta tags  
4. First available image in the array
5. Category-specific placeholder

## Using the New Features

### Basic Usage (Existing Links)

No changes required! The system works with your existing `links.json` structure:

```json
{
  "id": "1",
  "title": "Venezuela Breaking News",
  "url": "https://example.com/article",
  "thumbnail": "https://picsum.photos/250/150?random=1",
  "keywords": ["Venezuela", "Politics"]
}
```

The `thumbnail` field is still supported for backward compatibility.

### Enhanced Usage (Recommended)

For better image selection, add an `images` array with metadata:

```json
{
  "id": "1",
  "title": "Venezuela Breaking News",
  "url": "https://example.com/article",
  "keywords": ["Venezuela", "Politics", "Breaking"],
  "images": [
    {
      "url": "https://example.com/venezuela-protest-2026.jpg",
      "alt": "Venezuela protest scene in Caracas",
      "caption": "Protesters gather in the capital",
      "width": 800,
      "height": 600
    },
    {
      "url": "https://example.com/other-photo.jpg",
      "alt": "Related image"
    }
  ],
  "meta": {
    "ogImage": "https://example.com/og-image.jpg",
    "twitterImage": "https://example.com/twitter-card.jpg"
  }
}
```

### Tips for Best Results

1. **Use descriptive filenames**: `venezuela-protest-2026.jpg` is better than `img123.jpg`
2. **Add alt text**: Helps the algorithm understand image content
3. **Include metadata**: Higher resolution images get a small score boost
4. **Match keywords**: Images with URLs/alt text matching your keywords score higher

## Debugging

When running on localhost, the system logs debug information to the console:

```javascript
[imageSelector] Link tokens: [venezuela, breaking, news, politics]
[imageSelector] Found candidates: 3
[imageSelector] Top 3 candidates: [...]
[imageSelector] Selected: {imageUrl: "...", reason: "scored_match", score: 0.45}
```

The `reason` field explains why an image was chosen:
- `scored_match (linkJson)` - Image matched based on scoring
- `fallback_og_image` - Used Open Graph image
- `fallback_twitter_image` - Used Twitter card image
- `fallback_first_image` - Used first available image
- `fallback_placeholder` - No images available, used placeholder

## Performance

### Caching

Selection results are cached in memory. The cache is keyed by the link URL, so repeated renders of the same link don't require re-scoring.

Cache statistics are available via:
```javascript
window.imageSelector.getCacheStats()
// Returns: { size: 10, keys: [...] }
```

Clear the cache if needed:
```javascript
window.imageSelector.clearCache()
```

## Testing

Run the comprehensive test suite:

```bash
# Node.js
node tests/imageSelector.test.js

# Browser
open tests/test-runner.html
```

All 19 tests should pass.

## Migration Checklist

- [ ] Review your existing links.json entries
- [ ] Add `images` array to high-priority links (optional but recommended)
- [ ] Include descriptive filenames and alt text
- [ ] Test locally with debug logging enabled
- [ ] Deploy and verify images are more relevant
- [ ] Monitor cache performance

## Backward Compatibility

✅ Existing `thumbnail` field continues to work  
✅ No breaking changes to the API  
✅ Graceful degradation if imageSelector.js fails to load  
✅ All existing links render correctly without modification

## Questions?

See the main README.md for more details about the scoring algorithm and feature set.
