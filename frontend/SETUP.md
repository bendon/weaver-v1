# TravelWeaver Frontend Setup Guide

## Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:8000`

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

The `.env.local` file has been created for you with default settings:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Important:** Make sure the backend API is running before starting the frontend.

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

### 4. Start the Backend API

In a separate terminal, start the FastAPI backend:

```bash
cd ../  # Go to project root
uvicorn app.api:app --reload --port 8000
```

Or use the Python command:

```bash
python -m uvicorn app.api:app --reload --port 8000
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Check TypeScript types |

---

## Project Structure

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout (imports global CSS)
│   ├── providers.tsx            # Client providers (Auth, Query)
│   ├── page.tsx                 # Landing page
│   ├── login/                   # Login page
│   ├── dmc/                     # DMC dashboard
│   ├── traveler/                # Traveler workspace
│   ├── flights/search/          # Flight search
│   ├── pnr/import/              # PNR import
│   └── ai-assistant/            # AI chat
│
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── itinerary/          # Itinerary components
│   │   └── ...
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication context
│   │
│   ├── services/
│   │   └── api.ts              # API client (all backend calls)
│   │
│   ├── views/                   # Page view components
│   │   ├── DMCView.tsx         # DMC dashboard view
│   │   ├── TravelerView.tsx    # Traveler workspace view
│   │   ├── LoginView.tsx       # Login view
│   │   └── ...
│   │
│   ├── lib/
│   │   └── router-compat.tsx   # React Router compatibility layer
│   │
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   └── index.css                # Global styles (CSS variables)
│
├── public/                      # Static assets
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies
```

---

## API Integration

### How It Works

1. **API Proxy**: All `/api/*` requests are automatically proxied to the backend
   - Frontend: `http://localhost:3000/api/bookings`
   - Backend: `http://localhost:8000/api/bookings`

2. **API Service** (`src/services/api.ts`):
   - All API calls go through this centralized service
   - Handles authentication headers automatically
   - Error handling and retry logic built-in

3. **Authentication**:
   - JWT tokens stored in localStorage
   - AuthContext provides user state globally
   - Automatic redirect on 401 errors

### Example API Usage

```typescript
import { api } from '@/services/api';
import { useQuery } from '@tanstack/react-query';

// Fetch bookings
const { data, isLoading } = useQuery({
  queryKey: ['bookings'],
  queryFn: () => api.getBookings()
});

// Create booking
const createBooking = async () => {
  const booking = await api.createBooking({
    title: "Kenya Safari",
    start_date: "2025-03-15"
  });
};
```

---

## Authentication Flow

### Login

1. User enters email/password on `/login`
2. Frontend calls `api.login(email, password)`
3. Backend returns JWT token + user data
4. Token saved to localStorage
5. User redirected to dashboard

### Protected Routes

Routes that require authentication:
- `/dmc` - DMC dashboard
- `/dmc/[id]` - Booking details
- `/flights/search` - Flight search
- `/pnr/import` - PNR import
- `/ai-assistant` - AI chat

### Session Expiry

- 401 errors trigger automatic logout
- User redirected to `/login?expired=true`
- Message displayed: "Your session has expired"

---

## Styling

### CSS Architecture

Uses **CSS Variables** for theming (no Tailwind):

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #000000;
  --border-color: rgba(0, 0, 0, 0.1);
  --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.08);
  /* ... more variables */
}
```

### Global Styles

- `src/index.css` - Global CSS variables and base styles
- `src/styles/utilities.css` - Utility classes
- Component-specific CSS files alongside components

---

## Data Fetching

### TanStack Query (React Query)

Configured in `app/providers.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  }
});
```

### Usage Pattern

```typescript
// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['bookings', status],
  queryFn: () => api.getBookings(status),
  enabled: !!token // Only fetch when authenticated
});

// Mutate data
const mutation = useMutation({
  mutationFn: api.createBooking,
  onSuccess: () => {
    queryClient.invalidateQueries(['bookings']);
  }
});
```

---

## React Router Compatibility

### Migration Note

The app was migrated from Vite + React Router to Next.js.

A **compatibility layer** (`src/lib/router-compat.tsx`) allows existing components to use React Router hooks:

```typescript
import { useNavigate, useParams } from 'react-router-dom';

// Works seamlessly with Next.js!
const navigate = useNavigate();
const { id } = useParams();
```

This means **all existing views work without modification**.

---

## Common Issues

### API Connection Failed

**Problem:** Frontend can't reach backend

**Solution:**
1. Check backend is running: `curl http://localhost:8000/api/docs`
2. Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
3. Restart dev server after changing `.env.local`

### Authentication Not Working

**Problem:** Login succeeds but user not authenticated

**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Check browser console for errors
3. Verify backend returns `{ token, user }` from `/api/auth/login`

### Build Errors

**Problem:** `npm run build` fails

**Solution:**
```bash
# Clear build cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build
```

---

## Production Deployment

### Build

```bash
npm run build
```

### Environment Variables

For production, update `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Start Production Server

```bash
npm start
```

Runs on port 3000 by default.

---

## Development Tips

### Hot Reload

- Changes to pages/components hot reload automatically
- Changes to `.env.local` require server restart
- CSS changes hot reload

### Debugging

1. **React DevTools**: Install browser extension
2. **Network Tab**: Check API calls
3. **Console**: Check for errors
4. **TanStack Query DevTools**: Add to `providers.tsx` for query debugging

### API Testing

Test backend endpoints directly:

```bash
# Get bookings
curl http://localhost:8000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN"

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## Next Steps

1. ✅ Frontend setup complete
2. ✅ API integration working
3. ⏭️ Test all pages with real data
4. ⏭️ Add missing routes from spec
5. ⏭️ Add comprehensive error handling
6. ⏭️ Add loading states
7. ⏭️ Add form validation

---

**Questions?** Check the [README_NEXTJS.md](./README_NEXTJS.md) for migration notes.
