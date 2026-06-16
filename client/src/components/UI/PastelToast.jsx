import { useState, useEffect, useCallback } from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';
import { font, colors } from '../../styles/theme';

let toastListeners = [];

export function showToast(message, type = 'info', duration = 3000) {
  toastListeners.forEach(fn => fn({ message, type, duration }));
}

export function showSuccess(message) {
  showToast(message, 'success');
}

export function showError(message) {
  showToast(message, 'error', 5000);
}

export function showWarning(message) {
  showToast(message, 'warning', 4000);
}

export function showInfo(message) {
  showToast(message, 'info');
}

const BG_MAP = {
  success: '#16a34a',
  error: '#dc2626',
  warning: '#f59e0b',
  info: '#1D9E75',
};

export default function PastelToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(item => item.id !== id));
    }, t.duration || 3000);
  }, []);

  useEffect(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter(fn => fn !== addToast);
    };
  }, [addToast]);

  return (
    <Flex
      position="fixed"
      top="16px"
      right="16px"
      zIndex={9999}
      direction="column"
      gap="8px"
      pointerEvents="none"
    >
      {toasts.map(t => (
        <Box
          key={t.id}
          bg={BG_MAP[t.type] || BG_MAP.info}
          color="#fff"
          px="16px"
          py="10px"
          borderRadius="8px"
          boxShadow="0 4px 12px rgba(0,0,0,0.15)"
          fontFamily={font.body}
          fontSize="14px"
          maxW="360px"
          pointerEvents="auto"
          animation="slideIn 0.3s ease"
        >
          <Text>{t.message}</Text>
        </Box>
      ))}
    </Flex>
  );
}
