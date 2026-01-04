# Custom Images Folder

Place your custom link preview images here.

## How to Use:

1. **Upload your image** to this folder (any size - will auto-resize)
2. **Name it descriptively** (e.g., `lottery-prediction.jpg`, `viral-video.png`)
3. **Reference it in links.json**:
   ```json
   {
     "thumbnail": "images/lottery-prediction.jpg"
   }
   ```

## Supported Formats:
- JPG/JPEG
- PNG
- GIF
- WebP

## Best Practices:
- Use descriptive filenames
- Compress large images before upload
- Any size works (CSS auto-resizes to 250x150)
- Higher resolution = better quality

## Example:
```json
{
  "id": "12",
  "title": "Lottery future draws prediction",
  "url": "https://deol26.github.io/nextdraws-com/",
  "thumbnail": "images/lottery-balls.jpg",
  "category": "tools"
}
```
