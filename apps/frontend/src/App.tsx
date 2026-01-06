import Header from './components/Header';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import ModelModal from './components/ModelModal';
import { useAppContext } from './context/AppContext';

function App(): React.JSX.Element {
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
