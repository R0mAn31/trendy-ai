# Public Assets

This folder contains static assets that are served at the root URL path.

## Favicon Structure

All favicon files are located here and referenced in `app/layout.tsx`:

- `favicon.ico` - Main favicon (16x16, 32x32, 48x48)
- `favicon-16x16.png` - 16x16 PNG favicon
- `favicon-32x32.png` - 32x32 PNG favicon
- `apple-touch-icon.png` - 180x180 Apple touch icon
- `android-chrome-192x192.png` - 192x192 Android icon
- `android-chrome-512x512.png` - 512x512 Android icon
- `site.webmanifest` - Web app manifest

## Usage

These files are automatically served by Next.js and referenced in the app metadata.

To update favicons:
1. Replace the files in this folder
2. Update `site.webmanifest` if needed
3. The app will automatically use the new icons

## File Structure

```
public/
├── favicon.ico              # Main favicon
├── favicon-16x16.png        # Small favicon
├── favicon-32x32.png        # Medium favicon
├── apple-touch-icon.png     # iOS icon
├── android-chrome-192x192.png  # Android small
├── android-chrome-512x512.png  # Android large
└── site.webmanifest         # PWA manifest
```

