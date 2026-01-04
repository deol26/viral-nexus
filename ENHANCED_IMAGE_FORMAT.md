# Enhanced Link Format Example

This file demonstrates how to add detailed image metadata to your links.json entries to take full advantage of the deterministic image selection algorithm.

## Basic Format (Current - Still Works!)

```json
{
  "id": "1",
  "title": "World Reacts to US Military Action in Venezuela",
  "url": "https://www.aljazeera.com/news/2026/1/3/world-reacts-to-reported-us-bombing-of-venezuela",
  "description": "Global leaders respond as reports emerge of US strikes in Venezuela.",
  "thumbnail": "https://picsum.photos/250/150?random=1",
  "source": "Al Jazeera",
  "viralScore": 95,
  "keywords": ["Venezuela", "Geopolitics", "Breaking"],
  "category": "news",
  "clicks": 2500000,
  "createdAt": "2026-01-03T00:00:00Z"
}
```

## Enhanced Format (New - Recommended!)

```json
{
  "id": "1",
  "title": "World Reacts to US Military Action in Venezuela",
  "url": "https://www.aljazeera.com/news/2026/1/3/world-reacts-to-reported-us-bombing-of-venezuela",
  "description": "Global leaders respond as reports emerge of US strikes in Venezuela.",
  "source": "Al Jazeera",
  "viralScore": 95,
  "keywords": ["Venezuela", "Geopolitics", "Breaking"],
  "category": "news",
  "clicks": 2500000,
  "createdAt": "2026-01-03T00:00:00Z",
  "images": [
    {
      "url": "https://example.com/images/venezuela-military-action-2026.jpg",
      "alt": "Venezuela military situation map showing geopolitical tensions",
      "caption": "Breaking news coverage of Venezuela geopolitics",
      "width": 1920,
      "height": 1080,
      "keywords": ["Venezuela", "military", "geopolitics"]
    },
    {
      "url": "https://example.com/images/world-leaders-react.jpg",
      "alt": "World leaders responding to breaking news",
      "width": 1280,
      "height": 720
    }
  ],
  "meta": {
    "ogImage": "https://example.com/og-venezuela-crisis.jpg",
    "twitterImage": "https://example.com/twitter-card-venezuela.jpg"
  }
}
```

## How the Algorithm Scores These Images

### Example 1: Perfect Match
```json
{
  "url": "https://example.com/images/venezuela-military-action-2026.jpg",
  "alt": "Venezuela military situation map showing geopolitical tensions"
}
```

**Score Breakdown:**
- Filename tokens: "venezuela", "military", "action" → **High match with title keywords** (60% weight)
- Alt text tokens: "venezuela", "military", "situation", "geopolitical" → **Excellent match** (30% weight)
- Result: **Selected as best match** ✅

### Example 2: Generic Image
```json
{
  "url": "https://example.com/images/photo123.jpg",
  "alt": "Generic photo"
}
```

**Score Breakdown:**
- Filename: "photo" → **No match with keywords** (0 points)
- Alt text: "generic", "photo" → **No match** (0 points)
- Result: **Low score, not selected** ❌

## Migration from Basic to Enhanced

You can migrate gradually - no need to update all links at once:

1. **Keep existing links as-is** - They continue to work with Unsplash keyword fallback
2. **Enhance important links first** - Add detailed images to high-traffic or featured content
3. **Test incrementally** - Use development mode to see selection scores

## Tips for Best Results

1. **Include relevant keywords in image filenames**: `ai-technology-breakthrough.jpg` beats `image123.jpg`
2. **Write descriptive alt text**: Include keywords naturally
3. **Provide multiple images**: Algorithm picks the best match
4. **Higher resolution wins ties**: When scores are equal, better quality is preferred
5. **Use image keywords array**: Explicitly tag images with relevant terms

## Development Mode

Enable debug logging by accessing your site on localhost:

```javascript
// Opens automatically when on localhost or 127.0.0.1
// Console output example:
[ImageSelector] Selection: {
  imageUrl: "https://example.com/venezuela-crisis.jpg",
  reason: "json-match",
  score: 0.87
}
```

## Testing Your Changes

After updating links.json with enhanced image metadata:

1. Open your site in a browser
2. Open DevTools Console (F12)
3. Look for `[ImageSelector]` debug messages
4. Verify the right images are selected
5. Check the score values (higher = better match)

## Performance

The algorithm is fast and cached:
- First selection: ~1-5ms per link
- Cached selections: <0.1ms (instant)
- Cache persists in localStorage between sessions
- No network requests during selection (only image loading)
