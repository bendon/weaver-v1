# Quick Start Guide

## Running the Application

1. **Install dependencies** (if not already done):
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   - Traveler view: http://localhost:3000/traveler
   - DMC view: http://localhost:3000/dmc

## What You'll See

### Traveler View (`/traveler`)
- Beautiful itinerary display with day-by-day breakdown
- Color-coded header matching the DMC branding
- Summary cards showing flights, hotels, activities, and days
- Detailed event cards for each activity and transfer
- Clean, Revolut-inspired design

### DMC View (`/dmc`)
- Control panel for managing all itineraries
- Search and filter functionality
- Grid view of itinerary cards
- Quick actions (View, Edit, Delete)
- Statistics for each itinerary

## Demo Data

The app loads demo data from `public/demo-itinerary.json` which contains:
- Kenya Safari Adventure itinerary
- 2 travelers (John & Jane Smith)
- Flights, hotels, transfers, and activities
- 5 days of scheduled events

## Customization

### Changing Colors
The itinerary header uses the `primary_color` from the itinerary's branding. Update the JSON file to change colors.

### Adding New Itineraries
1. Create a new JSON file in `public/`
2. Update the API service to load it
3. Or connect to your backend API

## Building for Production

```bash
npm run build
```

The built files will be in `dist/` directory, ready for deployment.

## PWA Installation

After building, the app can be installed as a Progressive Web App:
- **Desktop**: Look for the install prompt in the browser
- **Mobile**: Use "Add to Home Screen" option

## Troubleshooting

### Port Already in Use
If port 3000 is busy, Vite will automatically use the next available port.

### API Connection Issues
The app will fall back to demo data if the API is unavailable. Check:
- Backend server is running on port 8000
- CORS is properly configured
- API endpoints match the expected format

### TypeScript Errors
Run `npm run build` to check for TypeScript errors. The dev server may not catch all type issues.

