
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
const errorOverlay = document.getElementById('error-overlay');
const errorMessage = document.getElementById('error-message');

const showError = (msg: string) => {
  if (errorOverlay && errorMessage) {
    errorOverlay.style.display = 'flex';
    errorMessage.innerText = msg;
  }
};

if (!rootElement) {
  console.error("ERRO: Elemento root não encontrado.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error: any) {
    console.error("FALHA NO RENDER:", error);
    showError(error.message || "Erro inesperado ao renderizar a interface.");
  }
}

window.onerror = (message, source, lineno, colno, error) => {
  console.error("ERRO GLOBAL DETECTADO:", message, error);
  // Só mostra o erro se a tela estiver branca (sem conteúdo no root)
  if (rootElement && !rootElement.innerHTML) {
    showError(`Erro Crítico: ${message}`);
  }
};
