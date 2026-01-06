import { useAppContext } from '../context/AppContext.jsx';

function Header() {
  const { state, dispatch, ActionTypes } = useAppContext();

  const handleNewChat = () => {
    dispatch({ type: ActionTypes.CLEAR_MESSAGES });
  };

  const handleOpenModal = () => {
    dispatch({ type: ActionTypes.TOGGLE_MODAL });
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="logo">🤖 LLM ChatBot</h1>
      </div>
      <div className="header-center">
        <button className="model-selector" onClick={handleOpenModal}>
          <span className="model-name">{state.currentModelName}</span>
          <span className="dropdown-arrow">▼</span>
        </button>
      </div>
      <div className="header-right">
        <button className="new-chat-btn" onClick={handleNewChat}>
          <span>+</span> New Chat
        </button>
      </div>
    </header>
  );
}

export default Header;
