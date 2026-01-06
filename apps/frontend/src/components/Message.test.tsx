import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Message from './Message';

describe('Message', () => {
  describe('Rendering', () => {
    it('should render user message with correct avatar', () => {
      render(<Message role="user" content="Hello" />);

      expect(screen.getByText('👤')).toBeInTheDocument();
    });

    it('should render assistant message with correct avatar', () => {
      render(<Message role="assistant" content="Hi there" />);

      expect(screen.getByText('🤖')).toBeInTheDocument();
    });

    it('should apply user-message class for user role', () => {
      const { container } = render(<Message role="user" content="Hello" />);

      expect(container.querySelector('.user-message')).toBeInTheDocument();
    });

    it('should apply assistant-message class for assistant role', () => {
      const { container } = render(<Message role="assistant" content="Hi" />);

      expect(container.querySelector('.assistant-message')).toBeInTheDocument();
    });

    it('should render content text', () => {
      render(<Message role="user" content="Test message content" />);

      expect(screen.getByText('Test message content')).toBeInTheDocument();
    });
  });

  describe('Streaming Indicator', () => {
    it('should show typing indicator when isStreaming is true', () => {
      render(<Message role="assistant" content="Hello" isStreaming={true} />);

      expect(screen.getByText('▋')).toBeInTheDocument();
    });

    it('should not show typing indicator when isStreaming is false', () => {
      render(<Message role="assistant" content="Hello" isStreaming={false} />);

      expect(screen.queryByText('▋')).not.toBeInTheDocument();
    });

    it('should not show typing indicator by default', () => {
      render(<Message role="assistant" content="Hello" />);

      expect(screen.queryByText('▋')).not.toBeInTheDocument();
    });
  });

  describe('formatMessage - HTML Escaping', () => {
    it('should escape HTML tags', () => {
      const { container } = render(<Message role="user" content="<script>alert('xss')</script>" />);

      const messageText = container.querySelector('.message-text');
      expect(messageText?.innerHTML).toContain('&lt;script&gt;');
      expect(messageText?.innerHTML).not.toContain('<script>');
    });

    it('should escape ampersands', () => {
      const { container } = render(<Message role="user" content="Tom & Jerry" />);

      const messageText = container.querySelector('.message-text');
      expect(messageText?.innerHTML).toContain('Tom &amp; Jerry');
    });

    it('should escape greater than and less than', () => {
      const { container } = render(<Message role="user" content="a < b > c" />);

      const messageText = container.querySelector('.message-text');
      expect(messageText?.innerHTML).toContain('a &lt; b &gt; c');
    });
  });

  describe('formatMessage - Code Blocks', () => {
    it('should format code blocks with triple backticks', () => {
      const { container } = render(
        <Message role="assistant" content="```javascript\nconst x = 1;\n```" />
      );

      const codeBlock = container.querySelector('pre code');
      expect(codeBlock).toBeInTheDocument();
      expect(codeBlock?.className).toContain('language-javascript');
    });

    it('should format inline code with single backticks', () => {
      const { container } = render(<Message role="assistant" content="Use `const` keyword" />);

      const inlineCode = container.querySelector('code');
      expect(inlineCode).toBeInTheDocument();
      expect(inlineCode?.textContent).toBe('const');
    });
  });

  describe('formatMessage - Text Formatting', () => {
    it('should format bold text with double asterisks', () => {
      const { container } = render(<Message role="assistant" content="This is **bold** text" />);

      const strong = container.querySelector('strong');
      expect(strong).toBeInTheDocument();
      expect(strong?.textContent).toBe('bold');
    });

    it('should format italic text with single asterisks', () => {
      const { container } = render(<Message role="assistant" content="This is *italic* text" />);

      const em = container.querySelector('em');
      expect(em).toBeInTheDocument();
      expect(em?.textContent).toBe('italic');
    });

    it('should convert newlines to br tags', () => {
      // Use actual newline character
      const content = `Line 1
Line 2`;
      const { container } = render(<Message role="assistant" content={content} />);

      const messageText = container.querySelector('.message-text');
      // The innerHTML should contain <br> after formatting
      expect(messageText?.innerHTML).toContain('<br>');
    });
  });

  describe('formatMessage - Mixed Content', () => {
    it('should handle mixed formatting', () => {
      const { container } = render(
        <Message role="assistant" content="**Bold** and *italic* with `code`" />
      );

      expect(container.querySelector('strong')).toBeInTheDocument();
      expect(container.querySelector('em')).toBeInTheDocument();
      expect(container.querySelector('code')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const { container } = render(<Message role="user" content="" />);

      expect(container.querySelector('.message-text')).toBeInTheDocument();
    });

    it('should handle system role', () => {
      const { container } = render(<Message role="system" content="System message" />);

      // System messages render as assistant style
      expect(container.querySelector('.assistant-message')).toBeInTheDocument();
    });
  });
});
