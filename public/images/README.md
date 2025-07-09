# Document Images for Microfilm Viewer

Place your document images in this directory with the following naming convention:

## Required Images:

### Project Alpha (Code: 123)
- doc1_page1.jpg - First page of Project Alpha document
- doc1_page2.jpg - Second page of Project Alpha document

### Operation Beta (Code: abc)  
- doc2_page1.jpg - First page of Operation Beta document
- doc2_page2.jpg - Second page of Operation Beta document
- doc2_page3.jpg - Third page of Operation Beta document

### Classified Delta (Code: 456)
- doc3_page1.jpg - Single page of Classified Delta document

## Image Requirements:
- Format: JPG, PNG, or other web-compatible formats
- Resolution: 1200x1600 pixels recommended (standard document aspect ratio)
- File size: Keep under 2MB per image for good performance

## Adding New Documents:
1. Add images to this directory
2. Update the `documentData` object in Microfilm.tsx
3. Add corresponding entry to the `FILES` array with access code

## Example Usage:
After placing the images, users can:
1. Navigate to `?map=microfilm`
2. Enter access codes: 123, abc, or 456
3. View and navigate through the document images
4. Use zoom and pan controls to examine details
