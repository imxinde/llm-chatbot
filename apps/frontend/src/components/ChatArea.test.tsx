import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatArea from './ChatArea';
import { AppProvider } from '../context/AppContext';
import * as AppContextModule from '../context/AppContext';

// Store mock function reference
const mockScrollIntoView = vi.fn();

// Mock scrollIntoView
beforeEach(() => {
  Element.prototype.scrollIntoView = mockScrollIntoView;
});

// Wrapper component with AppProvider
function renderWithProvider(ui: React.ReactElement) {
  return render(<AppProvider>{ui}</AppProvider>);
}

describe('ChatArea', () => {
  describe('Empty State', () => {
    it('should render WelcomeMessage when no messages', () => {
      renderWithProvider(<ChatArea />);

      expect(screen.getByText(/welcome to llm chatbot/i)).toBeInTheDocument();
    });

    it('should not render messages container when empty', () => {
      const { container } = renderWithProvider(<ChatArea />);

      expect(container.querySelector('.messages-container')).not.toBeInTheDocument();
    });
  });

  describe('With Messages', () => {
    it('should render messages when present', () => {
      // Create a custom context with messages
      const mockState = {
        messages: [
          { id: '1', role: 'user' as const, content: 'Hello' },
          { id: '2', role: 'assistant' as const, content: 'Hi there!' },
        ],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [],
        isLoading: false,
        isModalOpen: false,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<ChatArea />);

      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    it('should not render WelcomeMessage when messages exist', () => {
      const mockState = {
        messages: [{ id: '1', role: 'user' as const, content: 'Hello' }],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [],
        isLoading: false,
        isModalOpen: false,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<ChatArea />);

      expect(screen.queryByText(/welcome to llm chatbot/i)).not.toBeInTheDocument();
    });

    it('should render messages container when messages exist', () => {
      const mockState = {
        messages: [{ id: '1', role: 'user' as const, content: 'Hello' }],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [],
        isLoading: false,
        isModalOpen: false,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      const { container } = render(<ChatArea />);

      expect(container.querySelector('.messages-container')).toBeInTheDocument();
    });

    it('should pass isStreaming prop to Message component', () => {
      const mockState = {
        messages: [
          { id: '1', role: 'assistant' as const, content: 'Streaming...', isStreaming: true },
        ],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [],
        isLoading: false,
        isModalOpen: false,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<ChatArea />);

      // Typing indicator should be visible
      expect(screen.getByText('▋')).toBeInTheDocument();
    });
  });

  describe('Auto-scroll', () => {
    it('should call scrollIntoView when messages change', () => {
      const mockState = {
        messages: [{ id: '1', role: 'user' as const, content: 'Hello' }],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [],
        isLoading: false,
        isModalOpen: false,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<ChatArea />);

      expect(mockScrollIntoView).toHaveBeenCalled();
    });
  });

  describe('Structure', () => {
    it('should have chat-area class on main element', () => {
      const { container } = renderWithProvider(<ChatArea />);

      expect(container.querySelector('.chat-area')).toBeInTheDocument();
    });
  });
});
