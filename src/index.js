import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Supabase handles Google OAuth now — no provider wrapper needed
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);