import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/context/ChatContext';
import { X, Send, ArrowLeft } from 'lucide-react';

interface ChatWindowProps {
  customerId: string;
  position: { x: number; y: number };
}

const ChatWindow = ({ customerId, position }: ChatWindowProps) => {
  const { customers, messages, closeChatWindow, sendMessage, openCustomerList } = useChat();
  const [newMessage, setNewMessage] = useState('');

  const customer = customers.find(c => c.id === customerId);
  const customerMessages = messages.filter(m => m.customerId === customerId);

  if (!customer) return null;

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(customerId, newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleBackToList = () => {
    closeChatWindow(customerId);
    openCustomerList();
  };

  return (
    <div
      className="fixed bg-white border rounded-lg shadow-xl w-80 h-96 flex flex-col z-50 animate-scale-in origin-bottom-right"
      style={{ right: position.x, bottom: position.y }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToList}
            className="h-6 w-6"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={customer.avatar} alt={customer.name} />
            <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{customer.name}</p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => closeChatWindow(customerId)}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {customerMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isFromCustomer ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                message.isFromCustomer
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-gray-900 text-white'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            size="icon"
            className="h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;