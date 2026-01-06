import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModelModal from './ModelModal';
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

describe('ModelModal', () => {
  describe('Rendering', () => {
    it('should render modal structure', () => {
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [{ id: 'gpt-4', name: 'GPT-4', context_length: 8192 }],
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      const { container } = render(<ModelModal />);

      expect(container.querySelector('.modal-backdrop')).toBeInTheDocument();
      expect(container.querySelector('.modal')).toBeInTheDocument();
      expect(container.querySelector('.modal-header')).toBeInTheDocument();
      expect(container.querySelector('.modal-body')).toBeInTheDocument();
    });

    it('should render modal title', () => {
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [{ id: 'gpt-4', name: 'GPT-4', context_length: 8192 }],
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<ModelModal />);

      expect(screen.getByRole('heading', { name: /select model/i })).toBeInTheDocument();
    });

    it('should render close button', () => {
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [{ id: 'gpt-4', name: 'GPT-4', context_length: 8192 }],
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<ModelModal />);

      expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument();
    });
  });

  describe('Model List', () => {
    it('should render model list when models are loaded', () => {
      const mockModels = [
        { id: 'gpt-4', name: 'GPT-4', description: 'OpenAI GPT-4', context_length: 8192 },
        {
          id: 'claude-3',
          name: 'Claude 3',
          description: 'Anthropic Claude',
          context_length: 100000,
        },
      ];

      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: mockModels,
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<ModelModal />);

      expect(screen.getByText('GPT-4')).toBeInTheDocument();
      expect(screen.getByText('Claude 3')).toBeInTheDocument();
    });

    it('should display model description', () => {
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [
          { id: 'gpt-4', name: 'GPT-4', description: 'OpenAI GPT-4 model', context_length: 8192 },
        ],
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<ModelModal />);

      expect(screen.getByText('OpenAI GPT-4 model')).toBeInTheDocument();
    });

    it('should display context length', () => {
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [{ id: 'gpt-4', name: 'GPT-4', context_length: 8192 }],
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<ModelModal />);

      expect(screen.getByText(/8,192 tokens/)).toBeInTheDocument();
    });

    it('should highlight current model', () => {
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [
          { id: 'gpt-4', name: 'GPT-4', context_length: 8192 },
          { id: 'claude-3', name: 'Claude 3', context_length: 100000 },
        ],
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      const { container } = render(<ModelModal />);

      const selectedItem = container.querySelector('.model-item.selected');
      expect(selectedItem).toBeInTheDocument();
      expect(selectedItem?.textContent).toContain('GPT-4');
    });
  });

  describe('Loading State', () => {
    it('should show loading message when loading models', () => {
      // Mock context with empty models to trigger loading
      const mockDispatch = vi.fn();
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [], // Empty models will trigger loading
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockImplementation(() => {
        return {
          state: mockState,
          dispatch: mockDispatch,
          ActionTypes: AppContextModule.ActionTypes,
        };
      });

      server.use(
        http.get(`${API_BASE}/api/models`, () => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(HttpResponse.json({ models: [] }));
            }, 500);
          });
        })
      );

      render(<ModelModal />);

      // The loading state is shown initially
      expect(screen.getByText(/loading models/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message on API failure', async () => {
      server.use(
        http.get(`${API_BASE}/api/models`, () => {
          return HttpResponse.json({ error: 'Failed to load' }, { status: 500 });
        })
      );

      // Start with empty models to trigger API call
      renderWithProvider(<ModelModal />);

      await waitFor(
        () => {
          expect(screen.getByText(/error:/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Interactions', () => {
    it('should dispatch SELECT_MODEL when model is clicked', () => {
      const mockDispatch = vi.fn();
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [{ id: 'claude-3', name: 'Claude 3', context_length: 100000 }],
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: mockDispatch,
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<ModelModal />);

      fireEvent.click(screen.getByText('Claude 3'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: AppContextModule.ActionTypes.SELECT_MODEL,
        payload: { id: 'claude-3', name: 'Claude 3' },
      });
    });

    it('should dispatch TOGGLE_MODAL when close button is clicked', () => {
      const mockDispatch = vi.fn();
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [{ id: 'gpt-4', name: 'GPT-4', context_length: 8192 }],
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: mockDispatch,
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<ModelModal />);

      fireEvent.click(screen.getByRole('button', { name: '×' }));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: AppContextModule.ActionTypes.TOGGLE_MODAL,
      });
    });

    it('should dispatch TOGGLE_MODAL when backdrop is clicked', () => {
      const mockDispatch = vi.fn();
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [{ id: 'gpt-4', name: 'GPT-4', context_length: 8192 }],
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: mockDispatch,
        ActionTypes: AppContextModule.ActionTypes,
      });

      const { container } = render(<ModelModal />);

      const backdrop = container.querySelector('.modal-backdrop');
      if (!backdrop) throw new Error('Backdrop not found');
      fireEvent.click(backdrop);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: AppContextModule.ActionTypes.TOGGLE_MODAL,
      });
    });

    it('should not close when clicking inside modal', () => {
      const mockDispatch = vi.fn();
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [{ id: 'gpt-4', name: 'GPT-4', context_length: 8192 }],
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: mockDispatch,
        ActionTypes: AppContextModule.ActionTypes,
      });

      const { container } = render(<ModelModal />);

      const modal = container.querySelector('.modal');
      if (!modal) throw new Error('Modal not found');
      fireEvent.click(modal);

      // Should not dispatch TOGGLE_MODAL for modal body click
      const toggleCalls = (mockDispatch.mock.calls as DispatchCall[]).filter(
        (call) => call[0].type === AppContextModule.ActionTypes.TOGGLE_MODAL
      );
      expect(toggleCalls).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should not reload models if already loaded', () => {
      const mockDispatch = vi.fn();
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [{ id: 'gpt-4', name: 'GPT-4', context_length: 8192 }],
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: mockDispatch,
        ActionTypes: AppContextModule.ActionTypes,
      });

      render(<ModelModal />);

      // Should not show loading since models are already present
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    it('should handle model without description', () => {
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [{ id: 'gpt-4', name: 'GPT-4', context_length: 8192 }],
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      const { container } = render(<ModelModal />);

      expect(container.querySelector('.model-item-desc')).not.toBeInTheDocument();
    });

    it('should handle model without context_length', () => {
      const mockState = {
        messages: [],
        currentModel: 'gpt-4',
        currentModelName: 'GPT-4',
        models: [{ id: 'gpt-4', name: 'GPT-4' }],
        isLoading: false,
        isModalOpen: true,
      };

      vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
        state: mockState,
        dispatch: vi.fn(),
        ActionTypes: AppContextModule.ActionTypes,
      });

      const { container } = render(<ModelModal />);

      expect(container.querySelector('.model-item-context')).not.toBeInTheDocument();
    });
  });
});
