import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import { sendChatMessage } from '../api/client.js';
import { MessageRole } from '@app/shared';

// Generate unique ID for messages
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function InputArea() {
  const { state, dispatch, ActionTypes } = useAppContext();
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    const content = input.trim();
    if (!content || state.isLoading) return;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Clear input
    setInput('');

    // Add user message
    const userMessage = {
      id: generateId(),
      role: MessageRole.USER,
      content
    };
    dispatch({ type: ActionTypes.ADD_MESSAGE, payload: userMessage });

    // Add placeholder for assistant message
    const assistantMessage = {
      id: generateId(),
      role: MessageRole.ASSISTANT,
      content: '',
      isStreaming: true
    };
    dispatch({ type: ActionTypes.ADD_MESSAGE, payload: assistantMessage });
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });

    // Prepare messages for API
    const messages = [
      ...state.messages.map(m => ({ role: m.role, content: m.content })),
      { role: userMessage.role, content: userMessage.content }
    ];

    let assistantContent = '';

    await sendChatMessage({
      messages,
      model: state.currentModel,
      signal: abortControllerRef.current.signal,
      onChunk: (chunk) => {
        assistantContent += chunk;
        dispatch({
          type: ActionTypes.UPDATE_LAST_MESSAGE,
          payload: assistantContent
        });
      },
      onError: (error) => {
        console.error('Chat error:', error);
        dispatch({
          type: ActionTypes.UPDATE_LAST_MESSAGE,
          payload: assistantContent || `Error: ${error.message}`
        });
      },
      onDone: () => {
        dispatch({
          type: ActionTypes.UPDATE_LAST_MESSAGE,
          payload: assistantContent
        });
      }
    });

    dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    abortControllerRef.current = null;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <footer className="input-area">
      <form className="input-form" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="message-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Shift+Enter for new line)"
          rows={1}
          disabled={state.isLoading}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!input.trim() || state.isLoading}
        >
          {state.isLoading ? '...' : '➤'}
        </button>
      </form>
    </footer>
  );
}

export default InputArea;
