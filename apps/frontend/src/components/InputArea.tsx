import { useState, useRef, useEffect, FormEvent, KeyboardEvent, ChangeEvent } from 'react';
import { useAppContext, UIMessage } from '../context/AppContext';
import { sendChatMessage } from '../api/client';
import { MessageRole, MessageRoleType } from '@app/shared';

/**
 * Generate unique ID for messages
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function InputArea(): React.JSX.Element {
  const { state, dispatch, ActionTypes } = useAppContext();
  const [input, setInput] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>): Promise<void> => {
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
    const userMessage: UIMessage = {
      id: generateId(),
      role: MessageRole.USER as MessageRoleType,
      content
    };
    dispatch({ type: ActionTypes.ADD_MESSAGE, payload: userMessage });

    // Add placeholder for assistant message
    const assistantMessage: UIMessage = {
      id: generateId(),
      role: MessageRole.ASSISTANT as MessageRoleType,
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
      onChunk: (chunk: string) => {
        assistantContent += chunk;
        dispatch({
          type: ActionTypes.UPDATE_LAST_MESSAGE,
          payload: assistantContent
        });
      },
      onError: (error: Error) => {
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setInput(e.target.value);
  };

  return (
    <footer className="input-area">
      <form className="input-form" onSubmit={(e) => void handleSubmit(e)}>
        <textarea
          ref={textareaRef}
          className="message-input"
          value={input}
          onChange={handleInputChange}
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
