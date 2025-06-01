import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PostHogProvider } from 'posthog-js/react';

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
};

createRoot(document.getElementById('root')!).render(
  <PostHogProvider apiKey={import.meta.env.VITE_POSTHOG_KEY} options={options}>
    <App />
  </PostHogProvider>
);
