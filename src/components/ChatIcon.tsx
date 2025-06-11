import { MessageCircle } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

const ChatIcon = () => {
  const { openCustomerList, customers } = useChat();
  
  const totalUnreadCount = customers.reduce((total, customer) => total + customer.unreadCount, 0);

  return (
    <button
      onClick={openCustomerList}
      className="fixed bottom-8 right-8 bg-black text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
      aria-label="Open chat"
      style={{ backgroundColor: '#000000', color: '#ffffff' }}
    >
      <MessageCircle size={24} color="white" />
      {totalUnreadCount > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white px-1">
          {totalUnreadCount}
        </span>
      )}
    </button>
  );
};

export default ChatIcon;
