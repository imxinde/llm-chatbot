function WelcomeMessage() {
  return (
    <div className="welcome-message">
      <div className="welcome-icon">🤖</div>
      <h2>Welcome to LLM ChatBot</h2>
      <p>Start a conversation by typing a message below.</p>
      <p className="welcome-hint">
        You can select different AI models using the dropdown in the header.
      </p>
    </div>
  );
}

export default WelcomeMessage;
