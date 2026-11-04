import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import './ui/estilos/tokens.css';
import { App } from './ui/App';

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('No se encontró el elemento #raiz');

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
