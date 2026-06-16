import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, CSSReset } from '@chakra-ui/react'
import theme from './styles/chakraTheme'
import './index.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((reg) => {
        if (import.meta.env.DEV) {
          console.log('SW registered:', reg.scope);
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.error('SW registration failed:', err);
        }
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <CSSReset />
      <App />
    </ChakraProvider>
  </StrictMode>,
)
