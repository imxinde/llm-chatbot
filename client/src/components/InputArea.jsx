import { useState, useRef, useEffect } from 'react';
import { useAppContext, ActionTypes } from '../context/AppContext';

export default function InputArea() {
  const [input, setInput] = useState('');
  const { state, dispatch } = useAppContext();
  const textareaRef = useRef(null);

  const isDisabled = !input.trim() || state.isLoading;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = async () => {
    const content = input.trim();
    if (!content || state.isLoading) return;

    // Clear input
    setInput('');

    // Add user message
    dispatch({
      type: ActionTypes.ADD_MESSAGE,
      payload: { role: 'user', content, timestamp: Date.now() }
    });

    // Add assistant placeholder
    dispatch({
      type: ActionTypes.ADD_MESSAGE,
      payload: { role: 'assistant', content: '', isStreaming: true, timestamp: Date.now() }
    });

    dispatch({ type: ActionTypes.SET_LOADING, payload: true });

    try {
      const apiMessages = [...state.messages, { role: 'user', content }].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: state.currentModel
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.content) {
              assistantContent += parsed.content;
              dispatch({
                type: ActionTypes.UPDATE_LAST_MESSAGE,
                payload: assistantContent
              });
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      // Finalize message (remove streaming flag)
      dispatch({
        type: ActionTypes.UPDATE_LAST_MESSAGE,
        payload: assistantContent
      });

    } catch (error) {
      console.error('Error:', error);
      dispatch({
        type: ActionTypes.UPDATE_LAST_MESSAGE,
        payload: '抱歉，发生了错误：' + error.message
      });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isDisabled) {
        handleSubmit();
      }
    }
  };

  return (
    <footer className="input-area">
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息，按 Enter 发送，Shift+Enter 换行..."
          rows="1"
        />
        <button 
          className="send-btn" 
          onClick={handleSubmit}
          disabled={isDisabled}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <p className="input-hint">AI 可能会产生不准确的信息，请注意甄别</p>
    </footer>
  );
}
