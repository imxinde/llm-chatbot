import { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import Message from './Message.jsx';
import WelcomeMessage from './WelcomeMessage.jsx';

function ChatArea() {
  const { state } = useAppContext();
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  return (
    <main className="chat-area">
      {state.messages.length === 0 ? (
        <WelcomeMessage />
      ) : (
        <div className="messages-container">
          {state.messages.map((msg) => (
            <Message
              key={msg.id}
              role={msg.role}
              content={msg.content}
              isStreaming={msg.isStreaming}
            />
          ))}
          <div ref={chatEndRef} />
        </div>
      )}
    </main>
  );
}

export default ChatArea;
