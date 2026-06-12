import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Chatbot from '../components/Chatbot';

const mockSessions = [
  { id: 's1', context: 'Consulta sobre pasteles', createdAt: '2024-01-15' },
  { id: 's2', context: 'Información de envíos', createdAt: '2024-01-16' },
];

const mockMessages = [
  { id: 'm1', senderRole: 'user', message: 'Hola' },
  { id: 'm2', senderRole: 'assistant', message: '¡Hola! ¿En qué puedo ayudarte?' },
];

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u1' } }),
}));

vi.mock('../services/chatService', () => ({
  chatService: {
    getSessions: vi.fn(),
    getSession: vi.fn(),
    sendMessage: vi.fn(),
    createSession: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

vi.mock('../services/websocketService', () => ({
  default: {
    onMessage: vi.fn(() => () => {}),
    onTyping: vi.fn(() => () => {}),
    sendMessage: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));

vi.mock('../utils/markdown', () => ({
  renderMarkdown: (text) => text,
}));

import { chatService } from '../services/chatService';
import websocketService from '../services/websocketService';

describe('Chatbot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('Muestra botón flotante de chat inicialmente (no abierto)', () => {
    render(<Chatbot />);
    const button = screen.getByLabelText('Chatbot');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('💬');
    expect(screen.queryByText('Asistente PastelHub')).not.toBeInTheDocument();
  });

  it('Abre chat al hacer click en el botón flotante', async () => {
    chatService.getSessions.mockResolvedValue([]);
    render(<Chatbot />);
    fireEvent.click(screen.getByLabelText('Chatbot'));
    await waitFor(() => {
      expect(screen.getByText('Asistente PastelHub')).toBeInTheDocument();
    });
  });

  it('Carga sesiones al abrir', async () => {
    chatService.getSessions.mockResolvedValue(mockSessions);
    chatService.getSession.mockResolvedValue({ messages: mockMessages });
    render(<Chatbot />);
    fireEvent.click(screen.getByLabelText('Chatbot'));
    await waitFor(() => {
      expect(chatService.getSessions).toHaveBeenCalledWith('active');
      expect(screen.getByText('Hola')).toBeInTheDocument();
    });
  });

  it('Muestra mensajes de la sesión activa', async () => {
    chatService.getSessions.mockResolvedValue(mockSessions);
    chatService.getSession.mockResolvedValue({ messages: mockMessages });
    render(<Chatbot />);
    fireEvent.click(screen.getByLabelText('Chatbot'));
    await waitFor(() => {
      expect(screen.getByText('Hola')).toBeInTheDocument();
      expect(screen.getByText('¡Hola! ¿En qué puedo ayudarte?')).toBeInTheDocument();
    });
  });

  it('Envía mensaje al hacer click en enviar', async () => {
    chatService.getSessions.mockResolvedValue(mockSessions);
    chatService.getSession.mockResolvedValue({ messages: mockMessages });
    chatService.sendMessage.mockResolvedValue({
      userMessage: { id: 'new-1', senderRole: 'user', message: 'Test message' },
      aiMessage: { id: 'new-2', senderRole: 'assistant', message: 'Respuesta' },
    });
    render(<Chatbot />);
    fireEvent.click(screen.getByLabelText('Chatbot'));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Escribe un mensaje...')).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(screen.getByText('➤')).not.toBeDisabled();
    fireEvent.click(screen.getByText('➤'));
    await waitFor(() => {
      expect(websocketService.sendMessage).toHaveBeenCalledWith('s1', 'Test message');
    });
  });

  it('Cierra chat al hacer click en cerrar', async () => {
    chatService.getSessions.mockResolvedValue([]);
    render(<Chatbot />);
    fireEvent.click(screen.getByLabelText('Chatbot'));
    await waitFor(() => {
      expect(screen.getByText('Asistente PastelHub')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Chatbot'));
    expect(screen.queryByText('Asistente PastelHub')).not.toBeInTheDocument();
  });

  it('Muestra indicador de escritura de IA', async () => {
    chatService.getSessions.mockResolvedValue(mockSessions);
    chatService.getSession.mockResolvedValue({ messages: mockMessages });
    render(<Chatbot />);
    fireEvent.click(screen.getByLabelText('Chatbot'));
    await waitFor(() => {
      expect(screen.getByText('Hola')).toBeInTheDocument();
    });
    const typingCalls = websocketService.onTyping.mock.calls.filter(
      ([cb]) => typeof cb === 'function'
    );
    const typingCallback = typingCalls[typingCalls.length - 1]?.[0];
    typingCallback({ sessionId: 's1', isTyping: true });
    await waitFor(() => {
      expect(screen.getByText('Escribiendo')).toBeInTheDocument();
    });
  });

  it('Muestra sesiones en el historial', async () => {
    chatService.getSessions.mockResolvedValue(mockSessions);
    chatService.getSession.mockResolvedValue({ messages: mockMessages });
    render(<Chatbot />);
    fireEvent.click(screen.getByLabelText('Chatbot'));
    await waitFor(() => {
      expect(screen.getByText('Asistente PastelHub')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Historial'));
    await waitFor(() => {
      expect(screen.getByText('Consulta sobre pasteles')).toBeInTheDocument();
      expect(screen.getByText('Información de envíos')).toBeInTheDocument();
    });
  });

  it('Maneja error al cargar sesiones', async () => {
    chatService.getSessions.mockRejectedValue(new Error('Network error'));
    render(<Chatbot />);
    fireEvent.click(screen.getByLabelText('Chatbot'));
    await waitFor(() => {
      expect(screen.getByText('Asistente PastelHub')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Nueva conversación')).toBeInTheDocument();
    });
  });
});
