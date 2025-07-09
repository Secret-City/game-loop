# Microfilm Viewer Component

A retrofuturistic microfilm viewer component that displays PDFs with password protection.

## Features

### Password Screen
- Cryptic keyboard interface
- Code entry system with visual feedback
- Error animations for incorrect codes
- Retro CRT monitor aesthetic

### PDF Viewer
- Multi-page PDF support
- Zoom controls (50% - 300%)
- X/Y axis positioning controls
- Drag-to-pan functionality
- Page navigation
- Status display panel

## Usage

1. Access the microfilm viewer by navigating to: `?map=microfilm`
2. Enter one of the following codes on the password screen:
   - `123` - Access Project Alpha document
   - `abc` - Access Operation Beta document  
   - `456` - Access Classified Delta document

## File Structure

The component expects PDF files to be placed in `/public/pdfs/` directory.

Files are configured in the `FILES` array within the component:

```javascript
const FILES = [
  {
    code: "123",
    file: "test1.pdf",
    name: "Project Alpha"
  },
  {
    code: "abc", 
    file: "test2.pdf",
    name: "Operation Beta"
  }
];
```

## Controls

### Password Screen
- Click keyboard buttons to enter code
- CLEAR button to reset input
- SUBMIT button to verify code

### Viewer Screen
- **Zoom**: +/- buttons to increase/decrease magnification
- **X-Axis**: ←/→ buttons to move horizontally
- **Y-Axis**: ↑/↓ buttons to move vertically
- **Page Navigation**: PREV/NEXT buttons
- **Mouse**: Click and drag to pan the document
- **Return**: Back button to return to password screen

## Dependencies

- `react-pdf` - PDF rendering
- `pdfjs-dist` - PDF.js library

## Styling

The component uses a retrofuturistic aesthetic with:
- Cyan (#00ffff) accent colors
- Dark blue/black backgrounds
- CRT monitor effects
- Scanning line animations
- Glowing text effects
- Retro keyboard styling

## Testing

For testing purposes, you can:
1. Add actual PDF files to `/public/pdfs/`
2. Update the `FILES` array with new entries
3. Use the provided test codes to access different documents

Note: Currently the component references placeholder PDF files. Replace with actual PDF files for full functionality.
