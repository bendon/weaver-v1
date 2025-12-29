import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingView from './views/LandingView';
import TravelerView from './views/TravelerView';
import DMCView from './views/DMCView';
import FlightSearchView from './views/FlightSearchView';
import PNRImportView from './views/PNRImportView';
import LoginView from './views/LoginView';
import AIBookingAssistantView from './views/AIBookingAssistantView';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.message?.toLowerCase().includes('session') || 
            error?.message?.toLowerCase().includes('expired') ||
            error?.message?.toLowerCase().includes('authentication')) {
          return false;
        }
        return failureCount < 1;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
    mutations: {
      retry: false, // Don't retry mutations on error
    },
  },
});

function AppRoutes() {
  // Protected route component - must be inside AppRoutes to have access to AuthProvider
  const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };
  return (
    <Routes>
      <Route path="/" element={<LandingView />} />
      <Route path="/login" element={<LoginView />} />
      <Route path="/traveler" element={<TravelerView />} />
      <Route path="/traveler/:itineraryId" element={<TravelerView />} />
      <Route path="/traveler/code/:bookingCode" element={<TravelerView />} />
      <Route 
        path="/dmc" 
        element={
          <ProtectedRoute>
            <DMCView />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dmc/:itineraryId" 
        element={
          <ProtectedRoute>
            <DMCView />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/flights/search" 
        element={
          <ProtectedRoute>
            <FlightSearchView />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/pnr/import" 
        element={
          <ProtectedRoute>
            <PNRImportView />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ai-assistant" 
        element={
          <ProtectedRoute>
            <AIBookingAssistantView />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

