/**
 * Capsule Extension Configuration
 * 
 * Centralized place for all environment-specific variables.
 * For local development: http://localhost:3000
 * For production: Replace with your deployed dashboard URL.
 */

export const CONFIG = {
  // Use VITE_DASHBOARD_URL from .env if available, otherwise fallback to production
  DASHBOARD_URL: import.meta.env.VITE_DASHBOARD_URL || 'https://capsule-yt.vercel.app/dashboard',
  // API URL for library synchronization
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://capsule-yt.vercel.app',
};
