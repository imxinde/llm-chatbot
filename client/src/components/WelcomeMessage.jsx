export default function WelcomeMessage() {
  return (
    <div className="welcome-message">
      <div className="welcome-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#EEF2FF"/>
          <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6Z" fill="#C7D2FE"/>
          <circle cx="12" cy="12" r="3" fill="#2563EB"/>
        </svg>
      </div>
      <h2>你好！我是 AI 助手</h2>
      <p>有什么我可以帮助你的吗？</p>
    </div>
  );
}
