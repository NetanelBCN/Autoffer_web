import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { websocketService, ChatModel, MessageModel, SendMessageRequest } from '@/services/websocketService';

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
  loadUserChats: (userId: string) => Promise<void>;
  initializeUserChats: (userId: string) => Promise<void>;
  searchUserByEmail: (email: string) => Promise<Customer | null>;
  startNewChatWithUser: (email: string) => Promise<boolean>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  console.log('🔥 ChatProvider initialized');
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatWindows, setChatWindows] = useState<ChatWindow[]>([]);
  const [isCustomerListOpen, setIsCustomerListOpen] = useState(false);
  const [loadedChats, setLoadedChats] = useState<Set<string>>(new Set());
  const [activeStreams, setActiveStreams] = useState<Set<string>>(new Set());

  const openCustomerList = () => setIsCustomerListOpen(true);
  const closeCustomerList = () => setIsCustomerListOpen(false);

  // Helper function to format lastSeen information based on available data
  const formatLastSeen = (user: any, chatTimestamp?: string): string => {
    // If we have a chat timestamp (last message), use that
    if (chatTimestamp) {
      const messageDate = new Date(chatTimestamp);
      const now = new Date();
      const diffMs = now.getTime() - messageDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      if (diffHours < 1) {
        return 'Active recently';
      } else if (diffHours < 24) {
        return `${Math.floor(diffHours)} hours ago`;
      } else if (diffDays < 7) {
        return `${Math.floor(diffDays)} days ago`;
      } else {
        return messageDate.toLocaleDateString();
      }
    }
    
    // If no chat timestamp but we have user registration date
    if (user && user.registeredAt) {
      const regDate = new Date(user.registeredAt);
      const now = new Date();
      const diffMs = now.getTime() - regDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      if (diffDays < 1) {
        return 'Joined today';
      } else if (diffDays < 30) {
        return `Joined ${Math.floor(diffDays)} days ago`;
      } else {
        return `Joined ${regDate.toLocaleDateString()}`;
      }
    }
    
    // Fallback
    return 'New contact';
  };

  const initializeUserChats = async (userId: string) => {
    try {
      console.log('🔥 initializeUserChats called with userId:', userId);
      
      if (!userId) {
        console.error('🔥 initializeUserChats - No userId provided!');
        setCustomers([]);
        return;
      }
      
      console.log('🔥 Initializing chats for user:', userId);
      const userChats = await websocketService.getUserChats(userId);
      
      console.log('🔥 User chats loaded:', userChats);
      console.log('🔥 TOTAL CHATS FOUND:', userChats.length);
      
      if (userChats.length > 0) {
        const chatCustomers: Customer[] = [];
        
        for (let i = 0; i < userChats.length; i++) {
          const chat = userChats[i];
          console.log(`🔥 =============== PROCESSING CHAT ${i + 1} ===============`);
          console.log('🔥 Processing chat:', chat);
          console.log('🔥 Chat participants:', chat.participants);
          console.log('🔥 LOGGED IN USER (current user):', userId);
          
          // Check if current user is actually in this chat
          const isUserInChat = chat.participants.includes(userId);
          console.log('🔥 Is logged in user in this chat?', isUserInChat);
          
          if (!isUserInChat) {
            console.warn('🔥 ❌ SKIPPING CHAT - Current user is NOT a participant in this chat!');
            continue;
          }
          
          // Find the OTHER participant (not the current user)
          const otherParticipants = chat.participants.filter(participantId => participantId !== userId);
          console.log('🔥 Other participants found:', otherParticipants);
          
          if (otherParticipants.length === 0) {
            console.warn('🔥 ❌ No other participants found in chat:', chat.participants);
            continue;
          }
          
          const otherUserId = otherParticipants[0];
          console.log('🔥 ✅ OTHER USER ID SELECTED:', otherUserId);
          
          try {
            console.log('🔥 📞 Fetching user details for:', otherUserId);
            const otherUserDetails = await websocketService.getUserById(otherUserId);
            console.log('🔥 📞 User details received:', otherUserDetails);
            
            let customerName = `User ${otherUserId.substring(0, 8)}...`; // Default fallback
            
            if (otherUserDetails && otherUserDetails.firstName && otherUserDetails.lastName) {
              customerName = `${otherUserDetails.firstName} ${otherUserDetails.lastName}`;
              console.log('🔥 ✅ Using full name:', customerName);
            } else if (otherUserDetails && otherUserDetails.firstName) {
              customerName = otherUserDetails.firstName;
              console.log('🔥 ⚠️ Using first name only:', customerName);
            } else {
              console.log('🔥 ⚠️ Using fallback name:', customerName);
            }
            
            const customer = {
              id: otherUserId,
              name: customerName,
              avatar: '/placeholder.svg',
              lastSeen: formatLastSeen(otherUserDetails, chat.lastMessageTimestamp),
              unreadCount: 0
            };
            
            console.log('🔥 ✅ CUSTOMER CREATED:', customer);
            chatCustomers.push(customer);
            
          } catch (userError) {
            console.error('🔥 ❌ Failed to fetch user details for:', otherUserId, userError);
            // Fallback to ID-based name
            const customer = {
              id: otherUserId,
              name: `User ${otherUserId.substring(0, 8)}...`,
              avatar: '/placeholder.svg',
              lastSeen: formatLastSeen(null, chat.lastMessageTimestamp),
              unreadCount: 0
            };
            
            console.log('🔥 ⚠️ FALLBACK CUSTOMER CREATED:', customer);
            chatCustomers.push(customer);
          }
        }
        
        console.log('🔥 ==================== FINAL RESULTS ====================');
        console.log('🔥 TOTAL CUSTOMERS TO SHOW:', chatCustomers.length);
        console.log('🔥 Final customers array:', chatCustomers);
        console.log('🔥 Customer names:', chatCustomers.map(c => c.name));
        console.log('🔥 ==================== END DEBUG ====================');
        setCustomers(chatCustomers);
        
      } else {
        console.log('🔥 No chats found for user, showing empty list');
        setCustomers([]);
      }
      
    } catch (error) {
      console.error('🔥 Failed to initialize user chats:', error);
      setCustomers([]);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    console.log('🔥 ChatProvider useEffect - Raw stored user:', storedUser);
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('🔥 ChatProvider useEffect - Parsed user object:', user);
        console.log('🔥 ChatProvider useEffect - User ID for chat initialization:', user.id);
        console.log('🔥 ChatProvider useEffect - Auto-initializing chats for user:', user.id);
        initializeUserChats(user.id);
      } catch (error) {
        console.error('🔥 Failed to parse stored user in ChatProvider:', error);
      }
    } else {
      console.log('🔥 ChatProvider useEffect - No stored user found');
    }
  }, []);

  const loadUserChats = async (userId: string) => {
    try {
      console.log('Loading chats for user:', userId);
      const chats = await websocketService.getUserChats(userId);
      console.log('Loaded chats:', chats);
    } catch (error) {
      console.error('Failed to load user chats:', error);
    }
  };

  const loadChatHistory = async (chatId: string, currentUserId: string, customerId: string) => {
    console.log('🔥 Loading chat history for chat:', chatId);
    console.log('🔥 Current user ID:', currentUserId);
    console.log('🔥 Customer ID (other user):', customerId);
    
    // Check if we already loaded this chat
    if (loadedChats.has(chatId)) {
      console.log('🔥 Chat history already loaded for chat:', chatId);
      return;
    }
    
    try {
      // Use the dedicated getMessageHistory method with the new messages.history route
      const historicalMessages = await websocketService.getMessageHistory(chatId);
      console.log('🔥 Received historical messages:', historicalMessages.length, historicalMessages);
      
      if (historicalMessages.length > 0) {
        // Convert historical messages to our format
        const convertedMessages: Message[] = historicalMessages.map(message => {
          console.log('🔥 Processing historical message:', message);
          console.log('🔥 Message senderId:', message.senderId);
          console.log('🔥 Message receiverId:', message.receiverId);
          console.log('🔥 Current user:', currentUserId);
          console.log('🔥 Customer (other user):', customerId);
          
          // A message is from the customer if the senderId matches the customerId (other user)
          const isFromCustomer = message.senderId === customerId;
          
          console.log('🔥 Is message from customer?', isFromCustomer);
          console.log('🔥 Message content:', message.content);
          
          return {
            id: message.id || `${Date.now()}-${Math.random()}`,
            customerId: customerId, // Always use the customerId as the chat identifier
            content: message.content,
            timestamp: new Date(message.timestamp),
            isFromCustomer: isFromCustomer
          };
        });
        
        console.log('🔥 Converted historical messages:', convertedMessages);
        
        // Update messages state with historical messages
        setMessages(prevMessages => {
          // Remove any existing messages for this customer first
          const filteredMessages = prevMessages.filter(m => m.customerId !== customerId);
          // Add the historical messages
          const newMessages = [...filteredMessages, ...convertedMessages];
          console.log('🔥 Updated messages state with historical data:', newMessages.length);
          return newMessages;
        });
        
        // Mark this chat as loaded
        setLoadedChats(prev => new Set([...prev, chatId]));
      } else {
        console.log('🔥 No historical messages found for chat:', chatId);
        // Still mark as loaded to avoid repeated attempts
        setLoadedChats(prev => new Set([...prev, chatId]));
      }
      
    } catch (error) {
      console.error('🔥 Failed to load chat history:', error);
      // Mark as loaded even on error to avoid infinite retries
      setLoadedChats(prev => new Set([...prev, chatId]));
    }
  };

  const startMessageStream = async (chatId: string, currentUserId: string, customerId: string) => {
    // Avoid duplicate streams
    if (activeStreams.has(chatId)) {
      console.log('🔥 Message stream already active for chat:', chatId);
      return;
    }

    console.log('🔥 Starting message stream for chat:', chatId);
    setActiveStreams(prev => new Set([...prev, chatId]));

    const handleNewMessage = (message: MessageModel) => {
      console.log('🔥 🆕 NEW MESSAGE RECEIVED from stream:', message);
      console.log('🔥 🆕 Message senderId:', message.senderId);
      console.log('🔥 🆕 Message receiverId:', message.receiverId);
      console.log('🔥 🆕 Current user ID:', currentUserId);
      console.log('🔥 🆕 Customer ID:', customerId);

      // Determine if message is from customer
      const isFromCustomer = message.senderId === customerId;
      console.log('🔥 🆕 Is message from customer?', isFromCustomer);

      const newMessage: Message = {
        id: message.id || `stream-${Date.now()}-${Math.random()}`,
        customerId: customerId,
        content: message.content,
        timestamp: new Date(message.timestamp),
        isFromCustomer: isFromCustomer
      };

      console.log('🔥 🆕 Adding new message to state:', newMessage);

      setMessages(prevMessages => {
        // Check if message already exists to avoid duplicates
        const messageExists = prevMessages.some(m => 
          m.id === newMessage.id || 
          (m.content === newMessage.content && 
           Math.abs(m.timestamp.getTime() - newMessage.timestamp.getTime()) < 1000)
        );
        
        if (messageExists) {
          console.log('🔥 🆕 Message already exists, skipping duplicate');
          return prevMessages;
        }
        
        const updatedMessages = [...prevMessages, newMessage];
        console.log('🔥 🆕 Updated messages state, total messages:', updatedMessages.length);
        return updatedMessages;
      });
    };

    const handleStreamError = (error: Error) => {
      console.error('🔥 Message stream error:', error);
      setActiveStreams(prev => {
        const newSet = new Set(prev);
        newSet.delete(chatId);
        return newSet;
      });
    };

    // Start the message stream
    websocketService.streamMessages(chatId, handleNewMessage, handleStreamError);
  };

  const openChatWindow = async (customerId: string) => {
    console.log('Opening chat window for customer:', customerId);
    
    // Reset unread count for this customer
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, unreadCount: 0 }
          : customer
      )
    );

    // Add chat window if not already open
    setChatWindows(prev => {
      if (prev.find(window => window.customerId === customerId)) {
        console.log('Chat window already open for customer:', customerId);
        return prev;
      }
      const newWindow: ChatWindow = {
        customerId,
        isOpen: true,
        position: { x: 20 + prev.length * 320, y: 20 }
      };
      return [...prev, newWindow];
    });

    // Get current user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const currentUser = JSON.parse(storedUser);
        console.log('🔥 Current user:', currentUser.id, 'Opening chat with customer:', customerId);
        
        // Get or create chat between current user and customer
        const chat = await websocketService.getOrCreateChat(currentUser.id, customerId);
        console.log('🔥 Chat created/retrieved:', chat);
        console.log('🔥 Chat participants:', chat.participants);
        
        // Verify that customerId is actually one of the participants
        if (!chat.participants.includes(customerId)) {
          console.error('🔥 Customer ID not found in chat participants!', {
            customerId,
            participants: chat.participants
          });
        }
        
        // Add a small delay to allow server to process the chat creation
        console.log('🔥 Waiting 500ms before loading chat history...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Load chat history using the dedicated method
        await loadChatHistory(chat.id, currentUser.id, customerId);
        
        // Start real-time message streaming
        await startMessageStream(chat.id, currentUser.id, customerId);
        
      } catch (error) {
        console.error('Failed to open chat window:', error);
      }
    }

    closeCustomerList();
  };

  const closeChatWindow = (customerId: string) => {
    setChatWindows(prev => prev.filter(window => window.customerId !== customerId));
    
    // Stop message stream for this chat
    // Note: We should ideally clean up the stream, but for now just remove from active streams
    // The websocketService.streamMessages doesn't return a cleanup function yet
  };

  const sendMessage = async (customerId: string, content: string) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      console.error('No user found in localStorage');
      return;
    }

    try {
      const currentUser = JSON.parse(storedUser);
      
      // Get or create chat first
      const chat = await websocketService.getOrCreateChat(currentUser.id, customerId);
      console.log('Using chat for sending message:', chat.id);
      
      // Send the message using the correct format
      const messageRequest: SendMessageRequest = {
        chatId: chat.id,
        fromUserId: currentUser.id,
        toUserId: customerId,
        text: content
      };
      
      console.log('🔥 📤 Sending message request:', messageRequest);
      const sentMessage = await websocketService.sendMessage(messageRequest);
      console.log('🔥 📤 Message sent successfully:', sentMessage);
      
      // Add the sent message to local state immediately
      const localMessage: Message = {
        id: sentMessage.id || `local-${Date.now()}`,
        customerId,
        content: sentMessage.content,
        timestamp: new Date(sentMessage.timestamp),
        isFromCustomer: false
      };
      
      console.log('🔥 📤 Adding sent message to local state:', localMessage);
      setMessages(prev => [...prev, localMessage]);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Fallback: add message locally if server fails
      const fallbackMessage: Message = {
        id: `fallback-${Date.now()}`,
        customerId,
        content,
        timestamp: new Date(),
        isFromCustomer: false
      };
      setMessages(prev => [...prev, fallbackMessage]);
    }
  };

  // Debug effect to track messages state changes
  useEffect(() => {
    console.log('🔥 ChatProvider - Messages state changed, total:', messages.length);
    if (messages.length > 0) {
      console.log('🔥 ChatProvider - All messages:', messages);
    }
  }, [messages]);

  // Debug effect to track customers state changes
  useEffect(() => {
    console.log('🔥 ChatProvider - Customers state changed, total:', customers.length);
    if (customers.length > 0) {
      console.log('🔥 ChatProvider - All customers:', customers);
    }
  }, [customers]);

  const searchUserByEmail = async (email: string): Promise<Customer | null> => {
    try {
      console.log('🔍 Searching for user by email:', email);
      const user = await websocketService.searchUserByEmail(email);
      
      if (user) {
        console.log('🔍 User found:', user);
        const customer: Customer = {
          id: user.id!,
          name: `${user.firstName} ${user.lastName}`,
          avatar: '/placeholder.svg',
          lastSeen: formatLastSeen(user),
          unreadCount: 0
        };
        return customer;
      } else {
        console.log('🔍 No user found with email:', email);
        return null;
      }
    } catch (error) {
      console.error('🔍 Failed to search user by email:', error);
      return null;
    }
  };

  const startNewChatWithUser = async (email: string): Promise<boolean> => {
    try {
      const foundCustomer = await searchUserByEmail(email);
      if (!foundCustomer) {
        return false;
      }

      // Get current user
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        console.error('No current user found in localStorage');
        return false;
      }

      const currentUser = JSON.parse(storedUser);
      
      // Check if this user is already in our customers list
      const existingCustomer = customers.find(c => c.id === foundCustomer.id);
      if (!existingCustomer) {
        // Add to customers list
        setCustomers(prev => [...prev, foundCustomer]);
        console.log('🔍 Added new customer to list:', foundCustomer);
      }

      // Open chat window with this user
      await openChatWindow(foundCustomer.id);
      
      return true;
    } catch (error) {
      console.error('🔍 Failed to start new chat:', error);
      return false;
    }
  };

  const contextValue = {
    customers,
    messages,
    chatWindows,
    isCustomerListOpen,
    openCustomerList,
    closeCustomerList,
    openChatWindow,
    closeChatWindow,
    sendMessage,
    loadUserChats,
    initializeUserChats,
    searchUserByEmail,
    startNewChatWithUser
  };

  console.log('🔥 ChatProvider providing context with customers:', customers.length);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  console.log('🔥 useChat hook called');
  const context = useContext(ChatContext);
  if (context === undefined) {
    console.error('🔥 useChat called outside of ChatProvider!');
    throw new Error('useChat must be used within a ChatProvider');
  }
  console.log('🔥 useChat returning context with customers:', context.customers.length);
  return context;
};
