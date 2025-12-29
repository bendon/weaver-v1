/**
 * API Error Handler
 * Centralized error handling for API responses, especially authentication errors
 */

export interface ApiError {
  detail?: string;
  message?: string;
  error?: string;
}

export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  // Check if it's a Response object with 401 status
  if (error instanceof Response) {
    return error.status === 401;
  }
  
  // Check if error message contains auth-related keywords
  const errorMessage = error.message || error.detail || error.error || '';
  const authKeywords = [
    'invalid authentication',
    'expired authentication',
    'missing authentication',
    'unauthorized',
    'authentication token',
    'invalid token',
    'expired token'
  ];
  
  return authKeywords.some(keyword => 
    errorMessage.toLowerCase().includes(keyword.toLowerCase())
  );
}

export function extractErrorMessage(error: any): string {
  if (error instanceof Response) {
    return `HTTP ${error.status}: ${error.statusText}`;
  }
  
  if (error.detail) {
    return error.detail;
  }
  
  if (error.message) {
    return error.message;
  }
  
  if (error.error) {
    return error.error;
  }
  
  return 'An unexpected error occurred';
}

