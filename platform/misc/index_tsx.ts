import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

// Configuración global para desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Shout Aloud - Plataforma Democrática Descentralizada');
  console.log('📡 Backend conectado a:', process.env.REACT_APP_API_URL || 'http://localhost:8000');
  console.log('🔗 Blockchain local activa');
  console.log('🔐 Sistema DID y ZK habilitado');
}

// Configurar interceptores de error global
window.addEventListener('unhandledrejection', (event) => {
  console.error('Error no manejado:', event.reason);
  // En producción, aquí enviarías a un servicio de logging
});

// Configuración de la aplicación
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker para PWA (preparado para futuro)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registrado:', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration falló:', registrationError);
      });
  });
}