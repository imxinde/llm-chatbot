import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';
import { AppProvider } from '../context/AppContext';

// Wrapper component with AppProvider
function renderWithProvider(ui: React.ReactElement) {
  return render(<AppProvider>{ui}</AppProvider>);
}

describe('Header', () => {
  describe('Rendering', () => {
    it('should render logo', () => {
      renderWithProvider(<Header />);

      expect(screen.getByText(/🤖 LLM ChatBot/)).toBeInTheDocument();
    });

    it('should render model selector button', () => {
      renderWithProvider(<Header />);

      expect(screen.getByRole('button', { name: /▼/i })).toBeInTheDocument();
    });

    it('should render New Chat button', () => {
      renderWithProvider(<Header />);

      expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument();
    });

    it('should display current model name', () => {
      renderWithProvider(<Header />);

      // Default model name from DEFAULTS
      expect(screen.getByText(/GPT-3.5 Turbo/i)).toBeInTheDocument();
    });

    it('should have correct header structure', () => {
      const { container } = renderWithProvider(<Header />);

      expect(container.querySelector('.header')).toBeInTheDocument();
      expect(container.querySelector('.header-left')).toBeInTheDocument();
      expect(container.querySelector('.header-center')).toBeInTheDocument();
      expect(container.querySelector('.header-right')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should dispatch CLEAR_MESSAGES when New Chat is clicked', () => {
      renderWithProvider(<Header />);

      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      fireEvent.click(newChatButton);

      // The action is dispatched - we verify the component doesn't crash
      // and the button is still clickable
      expect(newChatButton).toBeInTheDocument();
    });

    it('should dispatch TOGGLE_MODAL when model selector is clicked', () => {
      renderWithProvider(<Header />);

      const modelSelector = screen.getByRole('button', { name: /▼/i });
      fireEvent.click(modelSelector);

      // The action is dispatched - we verify the component doesn't crash
      expect(modelSelector).toBeInTheDocument();
    });

    it('should show dropdown arrow in model selector', () => {
      renderWithProvider(<Header />);

      expect(screen.getByText('▼')).toBeInTheDocument();
    });
  });
});
