import { useAppContext, ActionTypes } from '../context/AppContext';

export default function Header() {
  const { state, dispatch } = useAppContext();

  const handleNewChat = () => {
    dispatch({ type: ActionTypes.CLEAR_MESSAGES });
  };

  const handleOpenModal = () => {
    dispatch({ type: ActionTypes.TOGGLE_MODAL, payload: true });
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#2563EB"/>
            <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="#3B82F6"/>
            <circle cx="12" cy="12" r="3" fill="#60A5FA"/>
          </svg>
          <span className="logo-text">AI ChatBot</span>
        </div>
      </div>
      <div className="header-center">
        <button className="model-selector" onClick={handleOpenModal}>
          <span>{state.currentModelName}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div className="header-right">
        <button className="btn-icon" onClick={handleNewChat} title="新建对话">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
