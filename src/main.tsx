import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import './styles.css';
import { StoreProvider } from './state/store';
import { CloudProvider } from './cloud/CloudProvider';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <CloudProvider>
        <App />
      </CloudProvider>
    </StoreProvider>
  </StrictMode>,
);
