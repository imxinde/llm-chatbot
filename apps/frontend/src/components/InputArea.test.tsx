import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputArea from './InputArea';
import { AppProvider } from '../context/AppContext';
import * as AppContextModule from '../context/AppContext';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:3000';

// Type for dispatch action
interface DispatchAction {
  type: string;
  payload?: unknown;
}

// Type for dispatch call
type DispatchCall = [DispatchAction];

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', API_BASE);
});

// Wrapper component with AppProvider
function renderWithProvider(ui: React.ReactElement) {
  return render(<AppProvider>{ui}</AppProvider>);
}

// Helper to create SSE stream
function createSSEStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
}

describe('InputArea', () => {
  describe('Rendering', () => {
    it('should render textarea', () => {
      renderWithProvider(<InputArea />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render send button', () => {
      renderWithProvider(<InputArea />);

      expect(screen.getByRole('button', { name: '➤' })).toBeInTheDocument();
    });

    it('should have placeholder text', () => {
      renderWithProvider(<InputArea />);

      expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    });

    it('should have correct structure', () => {
      const { container } = renderWithProvider(<InputArea />);

      expect(container.querySelector('.input-area')).toBeInTheDocument();
      expect(container.querySelector('.input-form')).toBeInTheDocument();
      expect(container.querySelector('.message-input')).toBeInTheDocument();
      expect(container.querySelector('.send-button')).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should update input value on change', async () => {
      const user = userEvent.setup();
      renderWithProvider(<InputArea />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');

      expect(textarea).toHaveValue('Hello');
    });

    it('should clear input after submit', async () => {
      server.use(
        http.post(`${API_BASE}/api/chat`, () => {
          const stream = createSSEStream(['data: [DONE]\n\n']);
          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        })
      );

      const user = userEvent.setup();
      renderWithProvider(<InputArea />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');
      await user.click(screen.getByRole('button', { name: '➤' }));

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });
  });

  describe('Submit Behavior', () => {
    it('should not submit when input is empty', () => {
      renderWithProvider(<InputArea />);

      const button = screen.getByRole('button', { name: '➤' });
      expect(button).toBeDisabled();
    });

    it('should not submit when input is only whitespace', async () => {
      const user = userEvent.setup();
      renderWithProvider(<InputArea />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '   ');

      const button = screen.getByRole('button', { name: '➤' });
      expect(button).toBeDisabled();
    });

    it('should submit on Enter key', async () => {
      server.use(
        http.post(`${API_BASE}/api/chat`, () => {
          const stream = createSSEStream(['data: [DONE]\n\n']);
          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        })
      );

      const user = userEvent.setup();
      renderWithProvider(<InputArea />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello{Enter}');

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    it('should not submit on Shift+Enter', async () => {
      const user = userEvent.setup();
      renderWithProvider(<InputArea />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello{Shift>}{Enter}{/Shift}');

      // Input should still have the text (with newline)
      expect(textarea).toHaveValue('Hello\n');
    });

    it('should submit on button click', async () => {
      server.use(
        http.post(`${API_BASE}/api/chat`, () => {
          const stream = createSSEStream(['data: [DONE]\n\n']);
          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        })
      );

      const user = userEvent.setup();
      renderWithProvider(<InputArea />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');
      await user.click(screen.getByRole('button', { name: '➤' }));

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });
  });

  describe('Loading State', () => {
    it('should disable textarea when loading', () => {
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [],
        isLoading: true,
        isModalOpen: false,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<InputArea />);

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should disable button when loading', () => {
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [],
        isLoading: true,
        isModalOpen: false,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<InputArea />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show loading indicator in button when loading', () => {
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [],
        isLoading: true,
        isModalOpen: false,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<InputArea />);

      expect(screen.getByRole('button', { name: '...' })).toBeInTheDocument();
    });
  });

  describe('Message Dispatch', () => {
    it('should dispatch ADD_MESSAGE for user message', async () => {
      server.use(
        http.post(`${API_BASE}/api/chat`, () => {
          const stream = createSSEStream(['data: [DONE]\n\n']);
          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        })
      );

      const mockDispatch = vi.fn();
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [],
        isLoading: false,
        isModalOpen: false,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: mockDispatch,
        ActionTypes: AppContextModule.ActionTypes,
      });

      const user = userEvent.setup();
      render(<InputArea />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');
      await user.click(screen.getByRole('button', { name: '➤' }));

      await waitFor(() => {
        const addMessageCalls = (mockDispatch.mock.calls as DispatchCall[]).filter(
          (call) => call[0].type === AppContextModule.ActionTypes.ADD_MESSAGE
        );
        expect(addMessageCalls.length).toBeGreaterThanOrEqual(1);
        const firstCall = addMessageCalls[0];
        if (!firstCall) throw new Error('No ADD_MESSAGE call found');
        const payload = firstCall[0].payload as { content: string; role: string };
        expect(payload.content).toBe('Hello');
        expect(payload.role).toBe('user');
      });
    });

    it('should dispatch SET_LOADING when starting request', async () => {
      server.use(
        http.post(`${API_BASE}/api/chat`, () => {
          const stream = createSSEStream(['data: [DONE]\n\n']);
          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        })
      );

      const mockDispatch = vi.fn();
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [],
        isLoading: false,
        isModalOpen: false,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: mockDispatch,
        ActionTypes: AppContextModule.ActionTypes,
      });

      const user = userEvent.setup();
      render(<InputArea />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');
      await user.click(screen.getByRole('button', { name: '➤' }));

      await waitFor(() => {
        const setLoadingCalls = (mockDispatch.mock.calls as DispatchCall[]).filter(
          (call) => call[0].type === AppContextModule.ActionTypes.SET_LOADING
        );
        expect(setLoadingCalls.some((call) => call[0].payload === true)).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should trim whitespace from input before submit', async () => {
      server.use(
        http.post(`${API_BASE}/api/chat`, () => {
          const stream = createSSEStream(['data: [DONE]\n\n']);
          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/event-stream' },
          });
        })
      );

      const mockDispatch = vi.fn();
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [],
        isLoading: false,
        isModalOpen: false,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: mockDispatch,
        ActionTypes: AppContextModule.ActionTypes,
      });

      const user = userEvent.setup();
      render(<InputArea />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '  Hello  ');
      await user.click(screen.getByRole('button', { name: '➤' }));

      await waitFor(() => {
        const addMessageCalls = (mockDispatch.mock.calls as DispatchCall[]).filter(
          (call) => call[0].type === AppContextModule.ActionTypes.ADD_MESSAGE
        );
        const firstCall = addMessageCalls[0];
        if (!firstCall) throw new Error('No ADD_MESSAGE call found');
        const payload = firstCall[0].payload as { content: string };
        expect(payload.content).toBe('Hello');
      });
    });
  });
});
