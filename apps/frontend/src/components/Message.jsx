/**
 * Format message content with basic markdown support
 * @param {string} content - Raw message content
 * @returns {string} - HTML formatted content
 */
function formatMessage(content) {
  // Escape HTML first
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (```)
  formatted = formatted.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    '<pre><code class="language-$1">$2</code></pre>'
  );

  // Inline code (`)
  formatted = formatted.replace(
    /`([^`]+)`/g,
    '<code>$1</code>'
  );

  // Bold (**)
  formatted = formatted.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong>$1</strong>'
  );

  // Italic (*)
  formatted = formatted.replace(
    /\*([^*]+)\*/g,
    '<em>$1</em>'
  );

  // Line breaks
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

function Message({ role, content, isStreaming }) {
  const isUser = role === 'user';
  const formattedContent = formatMessage(content);

  return (
    <div className={`message ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="message-avatar">
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="message-content">
        <div 
          className="message-text"
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
        {isStreaming && <span className="typing-indicator">▋</span>}
      </div>
    </div>
  );
}

export default Message;
