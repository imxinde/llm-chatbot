import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import ModelModal from './components/ModelModal';

export default function App() {
  return (
    <AppProvider>
      <div className="app-container">
        <Header />
        <ChatArea />
        <InputArea />
        <ModelModal />
      </div>
    </AppProvider>
  );
}
