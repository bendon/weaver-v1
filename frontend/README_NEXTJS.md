# Frontend - Next.js Application

This is the frontend for the Travel Assistant application, built with Next.js 15 and the App Router.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **TanStack Query** - Server state management
- **Lucide React** - Icons
- **date-fns** - Date formatting

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   ├── providers.tsx      # Client-side providers
│   ├── login/             # Login page
│   ├── traveler/          # Traveler workspace
│   ├── dmc/               # DMC control panel
│   ├── flights/           # Flight search
│   ├── pnr/               # PNR import
│   └── ai-assistant/      # AI booking assistant
├── src/
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── services/          # API services
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript types
│   ├── views/             # View components
│   ├── lib/               # Library code
│   │   └── router-compat.tsx  # React Router compatibility layer
│   └── hooks/             # Custom hooks
├── public/                # Static assets
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies

```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Create environment file:

```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

Build the production bundle:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Features

- **App Router**: Modern Next.js routing with React Server Components
- **API Proxy**: Automatic proxying of `/api/*` requests to the backend
- **React Router Compatibility**: Compatibility layer for existing views that use react-router-dom
- **Type Safety**: Full TypeScript support
- **Server State Management**: TanStack Query for efficient data fetching
- **Responsive Design**: Mobile-first approach

## API Integration

The frontend communicates with the FastAPI backend through:

1. **API Proxy**: All `/api/*` requests are proxied to `http://localhost:8000` in development
2. **Environment Variable**: Set `NEXT_PUBLIC_API_URL` to change the backend URL

## Migration Notes

This app was migrated from Vite to Next.js. Key changes:

1. **Routing**: Converted from React Router to Next.js App Router
2. **Compatibility Layer**: Created `src/lib/router-compat.tsx` to maintain compatibility with existing views
3. **Dynamic Imports**: Views are loaded dynamically to support client-side features
4. **Webpack Aliasing**: `react-router-dom` is aliased to the compatibility layer

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Troubleshooting

### Module Resolution Errors

If you encounter module resolution errors, ensure:
1. `tsconfig.json` has the correct path mappings
2. Dependencies are installed (`npm install`)

### API Connection Issues

If the API is not connecting:
1. Verify the backend is running on port 8000
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Review the Next.js proxy configuration in `next.config.ts`

### Build Errors

For build errors:
1. Clear the `.next` directory: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Run type checking: `npm run type-check`
