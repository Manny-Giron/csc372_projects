import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/legacy/styles.css';
import './styles/legacy/toolCategories.css';
import './styles/legacy/cart.css';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
