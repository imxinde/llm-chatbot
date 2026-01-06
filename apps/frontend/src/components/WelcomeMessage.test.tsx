import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WelcomeMessage from './WelcomeMessage';

describe('WelcomeMessage', () => {
  it('should render welcome icon', () => {
    render(<WelcomeMessage />);

    expect(screen.getByText('🤖')).toBeInTheDocument();
  });

  it('should render welcome title', () => {
    render(<WelcomeMessage />);

    expect(screen.getByRole('heading', { name: /welcome to llm chatbot/i })).toBeInTheDocument();
  });

  it('should render instruction text', () => {
    render(<WelcomeMessage />);

    expect(screen.getByText(/start a conversation by typing a message below/i)).toBeInTheDocument();
  });

  it('should render model selection hint', () => {
    render(<WelcomeMessage />);

    expect(
      screen.getByText(/you can select different ai models using the dropdown/i)
    ).toBeInTheDocument();
  });

  it('should have correct CSS class', () => {
    const { container } = render(<WelcomeMessage />);

    expect(container.querySelector('.welcome-message')).toBeInTheDocument();
  });
});
