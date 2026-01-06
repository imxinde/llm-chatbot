import { useMemo } from 'react';

// Format message content (basic markdown support)
function formatMessage(content) {
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks
  formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Line breaks
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

export default function Message({ role, content, isStreaming }) {
  const formattedContent = useMemo(() => formatMessage(content), [content]);

  const avatarIcon = role === 'user' 
    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
    : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>;

  return (
    <div className={`message ${role}`}>
      <div className="message-avatar">
        {avatarIcon}
      </div>
      <div className="message-content">
        <span dangerouslySetInnerHTML={{ __html: formattedContent }} />
        {isStreaming && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
    </div>
  );
}
