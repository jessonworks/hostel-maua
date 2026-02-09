
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
const errorOverlay = document.getElementById('error-overlay');
const errorMessage = document.getElementById('error-message');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error: any) {
  console.error("FALHA CRÍTICA NO RENDER:", error);
  if (errorOverlay && errorMessage) {
    errorOverlay.style.display = 'flex';
    errorMessage.innerText = error.message || "Ocorreu um erro inesperado ao iniciar a aplicação.";
  }
}

// Captura erros não tratados globalmente
window.onerror = (message, source, lineno, colno, error) => {
  console.error("ERRO GLOBAL:", message, error);
  if (errorOverlay && errorMessage && !rootElement.innerHTML) {
    errorOverlay.style.display = 'flex';
    errorMessage.innerText = `Erro Global: ${message}`;
  }
};
