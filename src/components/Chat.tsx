
import { useLocation } from 'react-router-dom';
import { useChat } from '@/context/ChatContext';
import ChatIcon from './ChatIcon';
import CustomerList from './CustomerList';
import ChatWindow from './ChatWindow.tsx';

const Chat = () => {
  const { chatWindows, isCustomerListOpen } = useChat();
  const location = useLocation();

  // Only show chat on home page (after sign-in)
  if (location.pathname !== '/home') {
    return null;
  }

  return (
    <>
      <ChatIcon />
      {isCustomerListOpen && (
        <CustomerList position={{ x: 20, y: 20 }} />
      )}
      {chatWindows.map((window) => (
        <ChatWindow
          key={window.customerId}
          customerId={window.customerId}
          position={window.position}
        />
      ))}
    </>
  );
};

export default Chat;
