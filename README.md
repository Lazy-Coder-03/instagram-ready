# Instagram Ready

A lightweight, mobile-first web tool that converts images to Instagram-friendly aspect ratios by adding borders.

## Features

- **Bulk upload** - Drag & drop or select multiple images
- **Multiple aspect ratios** - 1:1 (square), 4:5 (portrait), 9:16 (stories)
- **Image editor** - Rotate, flip, zoom, and reposition
- **Custom border color** - Not just black, any color you want
- **Client-side processing** - Images never leave your browser
- **Individual or bulk download** - Download one or all at once
- **Mobile-first** - Works great on phones and tablets
- **Zero dependencies** - Pure HTML, CSS, and JavaScript (~15KB total)

## Usage

1. Open the tool in your browser
2. Select aspect ratio and border color
3. Drag & drop images or click to select
4. Tap any image to edit (rotate, flip, zoom, reposition)
5. Download individually or all at once

## Editor Controls

| Control | Function |
|---------|----------|
| Rotate buttons | 90° left/right rotation |
| Flip H/V | Mirror horizontally or vertically |
| Zoom slider | 100% to 300% zoom |
| Drag | Reposition image within frame |

## Hosting on GitHub Pages

1. Push this repository to GitHub
2. Go to **Settings** > **Pages**
3. Set source to **main** branch
4. Your site will be live at `https://yourusername.github.io/instagram-ready`

## Output

- Format: JPEG at 92% quality
- Filename: `originalname_1x1.jpg` (or `4x5`, `9x16`)

## License

MIT
