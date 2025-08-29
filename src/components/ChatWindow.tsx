import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/context/ChatContext';
import { websocketService } from '@/services/websocketService';
import { X, Send, ArrowLeft, FileText, Download, Eye, Calculator } from 'lucide-react';

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

  // Extract project ID from BOQ filename
  const extractProjectIdFromBOQ = (fileName: string): string | null => {
    const match = fileName.match(/BOQ_Project_([^.]+)\.pdf/);
    return match ? match[1] : null;
  };

  // Create PDF blob URL for viewing
  const createPdfBlobUrl = (pdfData: Uint8Array): string => {
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  };

  // Download PDF file
  const downloadPdf = (pdfData: Uint8Array, fileName: string) => {
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper function to detect BOQ files in message content or message data
  const detectBOQFile = (message: any) => {
    const content = message.content;
    
    // Check if message has file data (server-provided file)
    if (message.fileBytes && message.fileName && message.fileName.toLowerCase().includes('boq')) {
      return {
        isBoqFile: true,
        fileName: message.fileName,
        displayText: content || 'BOQ Document',
        hasFileData: true,
        fileType: message.fileType || 'application/pdf'
      };
    }
    
    // Check for BOQ pattern in content (text-based BOQ reference)
    const boqPattern = /\[BOQ_REQUEST\]\s*(BOQ_Project_[^.\s]+\.pdf)/;
    const match = content.match(boqPattern);
    if (match) {
      return {
        isBoqFile: true,
        fileName: match[1],
        displayText: content.replace(boqPattern, '').trim(),
        hasFileData: false,
        fileType: 'application/pdf'
      };
    }
    
    return { 
      isBoqFile: false, 
      fileName: '', 
      displayText: content, 
      hasFileData: false,
      fileType: null 
    };
  };

  // Handler for viewing BOQ file
  const handleViewBOQ = async (fileName: string, hasFileData: boolean) => {
    console.log('Viewing BOQ file:', fileName, 'Has file data:', hasFileData);
    
    try {
      if (hasFileData) {
        // TODO: Handle direct file data when available from message.fileBytes
        alert(`Direct file viewing not yet implemented.\n\nFile: ${fileName}`);
        return;
      }

      // Extract project ID and fetch from server
      const projectId = extractProjectIdFromBOQ(fileName);
      if (!projectId) {
        alert('Could not extract project ID from filename');
        return;
      }

      console.log('🔍 Fetching BOQ PDF for project:', projectId);
      const pdfData = await websocketService.getBOQPdf(projectId);
      
      if (pdfData && pdfData.length > 0) {
        console.log('🔍 Successfully received PDF data, size:', pdfData.length, 'bytes');
        
        // Create blob URL and open in new tab
        const pdfUrl = createPdfBlobUrl(pdfData);
        console.log('🔍 Created blob URL:', pdfUrl);
        
        // Open PDF in new tab
        const newWindow = window.open(pdfUrl, '_blank');
        if (!newWindow) {
          alert('Pop-up blocked. Please allow pop-ups to view the PDF file.');
        }
        
        // Clean up after a delay
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
          console.log('🔍 Cleaned up blob URL');
        }, 30000); // 30 seconds should be enough for PDF to load
      } else {
        console.log('🔍 No PDF data received from server');
        alert('BOQ file not found or empty');
      }
    } catch (error) {
      console.error('Failed to view BOQ file:', error);
      alert('Failed to load BOQ file. Please try again.');
    }
  };

  // Handler for creating quote from BOQ
  const handleCreateQuote = async (fileName: string, hasFileData: boolean) => {
    console.log('Creating quote from BOQ:', fileName, 'Has file data:', hasFileData);
    
    try {
      const projectId = extractProjectIdFromBOQ(fileName);
      if (!projectId) {
        alert('Could not extract project ID from filename');
        return;
      }

      // TODO: Navigate to quote creation page or open quote creation dialog
      console.log('🔍 Creating quote for project:', projectId);
      alert(`Quote creation feature coming soon!\n\nProject ID: ${projectId}\nBOQ File: ${fileName}`);
      
      // Future implementation could:
      // 1. Navigate to operations page with BOQ pre-loaded
      // 2. Open a quote creation dialog
      // 3. Redirect to a dedicated quote builder
      
    } catch (error) {
      console.error('Failed to create quote from BOQ:', error);
      alert('Failed to initialize quote creation. Please try again.');
    }
  };

  // Handler for downloading BOQ file
  const handleDownloadBOQ = async (fileName: string, hasFileData: boolean) => {
    console.log('Downloading BOQ file:', fileName, 'Has file data:', hasFileData);
    
    try {
      if (hasFileData) {
        // TODO: Handle direct file data when available from message.fileBytes
        alert(`Direct file download not yet implemented.\n\nFile: ${fileName}`);
        return;
      }

      // Extract project ID and fetch from server
      const projectId = extractProjectIdFromBOQ(fileName);
      if (!projectId) {
        alert('Could not extract project ID from filename');
        return;
      }

      console.log('🔍 Fetching BOQ PDF for download:', projectId);
      const pdfData = await websocketService.getBOQPdf(projectId);
      
      if (pdfData && pdfData.length > 0) {
        console.log('🔍 Successfully received PDF data for download, size:', pdfData.length, 'bytes');
        
        // Download the file
        downloadPdf(pdfData, fileName);
        console.log('🔍 Initiated download of:', fileName);
      } else {
        console.log('🔍 No PDF data received from server for download');
        alert('BOQ file not found or empty');
      }
    } catch (error) {
      console.error('Failed to download BOQ file:', error);
      alert('Failed to download BOQ file. Please try again.');
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(customerId, newMessage);
      setNewMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
        {customerMessages.map((message) => {
          const boqInfo = detectBOQFile(message);
          
          return (
            <div
              key={message.id}
              className={`flex ${message.isFromCustomer ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`${
                  boqInfo.isBoqFile ? 'max-w-[85%]' : 'max-w-[70%]'
                } rounded-lg px-3 py-2 text-sm ${
                  message.isFromCustomer
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-gray-900 text-white'
                }`}
              >
                {boqInfo.isBoqFile ? (
                  <div className="w-full">
                    {/* Display any additional text */}
                    {boqInfo.displayText && (
                      <p className="mb-3">{boqInfo.displayText}</p>
                    )}
                    
                    {/* Enhanced BOQ File Card */}
                    <div className={`border-2 rounded-xl p-4 shadow-md ${
                      message.isFromCustomer 
                        ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100' 
                        : 'border-blue-400 bg-gradient-to-br from-blue-800 to-blue-900'
                    }`}>
                      {/* Header with BOQ icon and title */}
                      <div className="flex items-center justify-center mb-4">
                        <div className={`p-3 rounded-full ${
                          message.isFromCustomer 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-blue-300 text-blue-900'
                        }`}>
                          <FileText className="h-6 w-6" />
                        </div>
                      </div>
                      
                      <div className="text-center mb-4">
                        <p className={`font-semibold text-sm ${
                          message.isFromCustomer ? 'text-blue-900' : 'text-blue-100'
                        }`}>
                          BOQ Document
                        </p>
                        <p className={`text-xs mt-1 break-words px-2 leading-relaxed ${
                          message.isFromCustomer ? 'text-blue-700' : 'text-blue-300'
                        }`}>
                          {boqInfo.fileName.length > 50 
                            ? `${boqInfo.fileName.substring(0, 25)}...${boqInfo.fileName.slice(-15)}`
                            : boqInfo.fileName
                          }
                        </p>
                      </div>
                      
                      {/* Action buttons - Icons only */}
                      <div className="flex justify-center space-x-3">
                        <Button
                          size="icon"
                          variant={message.isFromCustomer ? "default" : "secondary"}
                          onClick={() => handleViewBOQ(boqInfo.fileName, boqInfo.hasFileData)}
                          className={`h-10 w-10 rounded-full shadow-lg ${
                            message.isFromCustomer 
                              ? 'bg-green-500 hover:bg-green-600 text-white' 
                              : 'bg-green-400 hover:bg-green-500 text-green-900'
                          }`}
                          title="View BOQ"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="icon"
                          variant={message.isFromCustomer ? "default" : "secondary"}
                          onClick={() => handleDownloadBOQ(boqInfo.fileName, boqInfo.hasFileData)}
                          className={`h-10 w-10 rounded-full shadow-lg ${
                            message.isFromCustomer 
                              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                              : 'bg-blue-400 hover:bg-blue-500 text-blue-900'
                          }`}
                          title="Download BOQ"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="icon"
                          variant={message.isFromCustomer ? "default" : "secondary"}
                          onClick={() => handleCreateQuote(boqInfo.fileName, boqInfo.hasFileData)}
                          className={`h-10 w-10 rounded-full shadow-lg ${
                            message.isFromCustomer 
                              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                              : 'bg-orange-400 hover:bg-orange-500 text-orange-900'
                          }`}
                          title="Create Quote"
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  message.content
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="space-y-2">
          {/* Quick BOQ test button */}
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                sendMessage(customerId, '[BOQ_REQUEST] BOQ_Project_688f9263f6a39d084f258ec2.pdf Please review the attached BOQ document.');
                setNewMessage('');
              }}
              className="text-xs px-2 py-1 h-7"
            >
              Test BOQ
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
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
    </div>
  );
};

export default ChatWindow;