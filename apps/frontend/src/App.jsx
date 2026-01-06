import Header from './components/Header.jsx';
import ChatArea from './components/ChatArea.jsx';
import InputArea from './components/InputArea.jsx';
import ModelModal from './components/ModelModal.jsx';
import { useAppContext } from './context/AppContext.jsx';

function App() {
  const { state } = useAppContext();

  return (
    <div className="app">
      <Header />
      <ChatArea />
      <InputArea />
      {state.isModalOpen && <ModelModal />}
    </div>
  );
}

export default App;
