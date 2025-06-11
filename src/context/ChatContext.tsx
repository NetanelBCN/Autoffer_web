
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Customer {
  id: string;
  name: string;
  avatar: string;
  lastSeen: string;
  unreadCount: number;
}

interface Message {
  id: string;
  customerId: string;
  content: string;
  timestamp: Date;
  isFromCustomer: boolean;
}

interface ChatWindow {
  customerId: string;
  isOpen: boolean;
  position: { x: number; y: number };
}

interface ChatContextType {
  customers: Customer[];
  messages: Message[];
  chatWindows: ChatWindow[];
  isCustomerListOpen: boolean;
  openCustomerList: () => void;
  closeCustomerList: () => void;
  openChatWindow: (customerId: string) => void;
  closeChatWindow: (customerId: string) => void;
  sendMessage: (customerId: string, content: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Mock data
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    avatar: '/placeholder.svg',
    lastSeen: '2 minutes ago',
    unreadCount: 3
  },
  {
    id: '2',
    name: 'Bob Smith',
    avatar: '/placeholder.svg',
    lastSeen: '1 hour ago',
    unreadCount: 0
  },
  {
    id: '3',
    name: 'Carol Davis',
    avatar: '/placeholder.svg',
    lastSeen: '3 hours ago',
    unreadCount: 1
  }
];

const mockMessages: Message[] = [
  {
    id: '1',
    customerId: '1',
    content: 'Hi, I have a question about my order',
    timestamp: new Date(Date.now() - 120000),
    isFromCustomer: true
  },
  {
    id: '2',
    customerId: '1',
    content: 'Of course! How can I help you?',
    timestamp: new Date(Date.now() - 60000),
    isFromCustomer: false
  }
];

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [chatWindows, setChatWindows] = useState<ChatWindow[]>([]);
  const [isCustomerListOpen, setIsCustomerListOpen] = useState(false);

  const openCustomerList = () => setIsCustomerListOpen(true);
  const closeCustomerList = () => setIsCustomerListOpen(false);

  const openChatWindow = (customerId: string) => {
    // Reset unread count for this customer
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, unreadCount: 0 }
          : customer
      )
    );

    setChatWindows(prev => {
      if (prev.find(window => window.customerId === customerId)) {
        return prev;
      }
      const newWindow: ChatWindow = {
        customerId,
        isOpen: true,
        position: { x: 20 + prev.length * 320, y: 20 }
      };
      return [...prev, newWindow];
    });
    closeCustomerList();
  };

  const closeChatWindow = (customerId: string) => {
    setChatWindows(prev => prev.filter(window => window.customerId !== customerId));
  };

  const sendMessage = (customerId: string, content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      customerId,
      content,
      timestamp: new Date(),
      isFromCustomer: false
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <ChatContext.Provider value={{
      customers,
      messages,
      chatWindows,
      isCustomerListOpen,
      openCustomerList,
      closeCustomerList,
      openChatWindow,
      closeChatWindow,
      sendMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
