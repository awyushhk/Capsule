// @ts-ignore
window.global = window;
// @ts-ignore
window.globalThis = window;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/globals.css';
import { ClerkProvider } from '@clerk/chrome-extension';
import { CapsuleSidebar } from '../components/CapsuleSidebar';
import { AuthWrapper } from '../components/AuthWrapper';

const root = document.getElementById('root');
if (!root) throw new Error('[Capsule] Root element not found');

// Using the same key from Web Dashboard
const PUBLISHABLE_KEY = 'pk_test_bm90YWJsZS1jYXR0bGUtNzkuY2xlcmsuYWNjb3VudHMuZGV2JA';

createRoot(root).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      syncHost="http://localhost:3000"
    >
      <AuthWrapper>
        <CapsuleSidebar />
      </AuthWrapper>
    </ClerkProvider>
  </StrictMode>
);
