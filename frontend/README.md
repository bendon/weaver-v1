# Travel Assistant - Itinerary Planner PWA

A modern, Revolut-inspired Progressive Web App for managing travel itineraries with both traveler and DMC (Destination Management Company) interfaces.

## Features

- 🎨 **Revolut-inspired Design**: Clean, modern UI with smooth animations
- 📱 **Progressive Web App**: Installable, works offline
- 👥 **Dual Interfaces**: 
  - Traveler view for viewing itineraries
  - DMC control panel for managing bookings
- 📅 **Day-by-Day Itinerary**: Beautiful timeline view of travel plans
- 🎯 **Activity Management**: Track activities, transfers, flights, and hotels
- 🔍 **Search & Filter**: Easy itinerary management in DMC view

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Lucide React** for icons
- **date-fns** for date formatting
- **PWA Plugin** for service worker and manifest

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── itinerary/    # Itinerary-specific components
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   └── Badge.tsx
│   ├── views/           # Main page views
│   │   ├── TravelerView.tsx
│   │   └── DMCView.tsx
│   ├── services/        # API services
│   │   └── api.ts
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Static assets
│   └── demo-itinerary.json
└── vite.config.ts      # Vite configuration
```

## Routes

- `/traveler` - Traveler itinerary view (default)
- `/traveler/:itineraryId` - Specific itinerary view
- `/dmc` - DMC control panel
- `/dmc/:itineraryId` - DMC view for specific itinerary

## API Integration

The app is configured to connect to a backend API. Update the `VITE_API_URL` environment variable or modify `frontend/src/services/api.ts` to point to your backend.

For demo purposes, the app loads sample data from `public/demo-itinerary.json` when the API is unavailable.

## PWA Features

- **Service Worker**: Caches assets for offline use
- **Web App Manifest**: Allows installation on devices
- **Auto-update**: Service worker updates automatically

## Design System

The app uses a custom design system inspired by Revolut:

- **Primary Color**: `#0073E6` (configurable per itinerary)
- **Typography**: System fonts for native feel
- **Spacing**: Consistent spacing scale
- **Shadows**: Subtle elevation for depth
- **Animations**: Smooth transitions throughout

## Development Notes

- The app uses React Query for data fetching and caching
- All components are TypeScript for type safety
- CSS modules are used for component styling
- The design is mobile-first and responsive

## License

MIT

