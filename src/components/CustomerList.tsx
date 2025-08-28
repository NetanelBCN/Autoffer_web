
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useChat } from '@/context/ChatContext';
import { X, Search, UserPlus, Mail } from 'lucide-react';

interface CustomerListProps {
  position: { x: number; y: number };
}

const CustomerList = ({ position }: CustomerListProps) => {
  const { 
    customers, 
    closeCustomerList, 
    openChatWindow,
    startNewChatWithUser
  } = useChat();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [isSearchingEmail, setIsSearchingEmail] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleCustomerClick = (customerId: string) => {
    openChatWindow(customerId);
  };

  const handleEmailSearch = async () => {
    if (!emailSearch.trim()) {
      setSearchError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailSearch.trim())) {
      setSearchError('Please enter a valid email address');
      return;
    }

    setIsSearchingEmail(true);
    setSearchError('');

    try {
      const success = await startNewChatWithUser(emailSearch.trim());
      
      if (success) {
        setEmailSearch('');
        setSearchError('');
        // Chat window will open automatically via startNewChatWithUser
      } else {
        setSearchError('User not found with this email address');
      }
    } catch (error) {
      setSearchError('Failed to search for user. Please try again.');
      console.error('Email search error:', error);
    } finally {
      setIsSearchingEmail(false);
    }
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEmailSearch();
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="fixed bg-white border rounded-lg shadow-xl w-80 h-[500px] flex flex-col z-50 animate-scale-in origin-bottom-right"
      style={{ right: position.x, bottom: position.y }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Clients Chat</h2>
        <button
          onClick={closeCustomerList}
          className="h-6 w-6 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Start New Chat Section */}
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <UserPlus className="h-4 w-4" />
          Start New Chat
        </h3>
        <div className="space-y-2">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter email address..."
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={handleEmailSearch} 
            disabled={isSearchingEmail}
            className="w-full"
            size="sm"
          >
            {isSearchingEmail ? 'Searching...' : 'Start Chat'}
          </Button>
          {searchError && (
            <p className="text-xs text-red-600 mt-1">{searchError}</p>
          )}
        </div>
      </div>
      
      {/* Search Existing Clients */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search existing clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Customer List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => handleCustomerClick(customer.id)}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
              >
                <Avatar>
                  <AvatarImage src={customer.avatar} alt={customer.name} />
                  <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">
                      {customer.name}
                    </p>
                    {customer.unreadCount > 0 && (
                      <span className="ml-2 min-w-[20px] h-[20px] bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full px-1">
                        {customer.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">No clients found</p>
              <p className="text-xs">Try adjusting your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerList;
