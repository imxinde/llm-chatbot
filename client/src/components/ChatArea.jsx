import { useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import Message from './Message';
import WelcomeMessage from './WelcomeMessage';

export default function ChatArea() {
  const { state } = useAppContext();
  const chatAreaRef = useRef(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [state.messages]);

  const hasMessages = state.messages.length > 0;

  return (
    <main className="chat-area" ref={chatAreaRef}>
      {!hasMessages && <WelcomeMessage />}
      <div className="messages-container">
        {state.messages.map((msg, index) => (
          <Message
            key={index}
            role={msg.role}
            content={msg.content}
            isStreaming={msg.isStreaming}
          />
        ))}
      </div>
    </main>
  );
}
