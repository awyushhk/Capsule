/**
 * Capsule Extension Configuration
 * 
 * Centralized place for all environment-specific variables.
 * For local development: http://localhost:3000
 * For production: Replace with your deployed dashboard URL.
 */

export const CONFIG = {
  // Use VITE_DASHBOARD_URL from .env if available, otherwise fallback to local
  DASHBOARD_URL: import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:3000/dashboard',
};
