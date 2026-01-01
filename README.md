# Instagram Ready

A lightweight, mobile-first web tool that converts images to 1:1 aspect ratio by adding black borders - perfect for Instagram posts.

## Features

- **Bulk upload** - Drag & drop or select multiple images
- **Auto black borders** - Adds padding to make any image square
- **Client-side processing** - Images never leave your browser
- **Individual or bulk download** - Download one or all at once
- **Mobile-first** - Works great on phones and tablets
- **Zero dependencies** - Pure HTML, CSS, and JavaScript

## Usage

1. Open the tool in your browser
2. Drag & drop images or click to select
3. Preview the squared images
4. Download individually or all at once

## Hosting on GitHub Pages

1. Push this repository to GitHub
2. Go to **Settings** > **Pages**
3. Set source to **main** branch
4. Your site will be live at `https://yourusername.github.io/instagram-ready`

## How It Works

The tool detects whether an image is landscape or portrait:
- **Landscape images** get black bars on top and bottom
- **Portrait images** get black bars on left and right

Output is JPEG at 92% quality.

## License

MIT
