import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/styles/index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('No se encontró el elemento #root en el documento');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
