import {
  RSocketConnector,
  RSocket,
  Payload,
} from '@rsocket/core';
import { WebsocketClientTransport } from '@rsocket/websocket-client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserModel {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  address: string;
  profileType: string;
  registeredAt: string;
  chats: string[];
  photoBytes: number[] | null;
  factor: number;
}

export interface ChatRequest {
  currentUserId: string;
  otherUserId: string;
}

export interface UserChatsRequest {
  userId: string;
  page: number;
  size: number;
}

export interface UserIdRequest {
  userId: string;
}

export interface ChatModel {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTimestamp: string;
}

export interface MessageModel {
  id?: string;           // Optional for new messages
  chatId: string;
  senderId: string;      // Changed from fromUserId
  receiverId: string;    // Changed from toUserId
  content: string;       // Changed from text
  timestamp: string;
  readBy: string[];      // Changed from isRead boolean to readBy array
  fileBytes?: number[];  // For file messages
  fileName?: string;     // File name
  fileType?: string;     // File type
}

export interface SendMessageRequest {
  chatId: string;
  fromUserId: string;
  toUserId: string;
  text: string;
}

export interface ChatMessagesRequest {
  chatId: string;
  page: number;
  size: number;
}

export interface UnreadCountRequest {
  chatId: string;
  userId: string;
}

export interface UserSearchRequest {
  email: string;
}

export interface CreateQuoteFromBOQRequest {
  projectId: string;
  factoryId: string;
}

class WebSocketService {
  private rsocket: RSocket | null = null;
  private connectionPromise: Promise<RSocket> | null = null;

  async connect(): Promise<RSocket> {
    // If we already have a connection promise, return it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.rsocket) {
      return Promise.resolve(this.rsocket);
    }

    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('Attempting to connect to RSocket at ws://localhost:8080/rsocket...');
        
        const connector = new RSocketConnector({
          transport: new WebsocketClientTransport({
            url: 'ws://localhost:8080/rsocket',
          }),
          setup: {
            keepAlive: 10000,
            lifetime: 20000,
            dataMimeType: 'application/json',
            metadataMimeType: 'message/x.rsocket.routing.v0',
          },
        });

        const rsocket = await connector.connect();
        
        console.log('RSocket connected successfully');
        this.rsocket = rsocket;
        this.connectionPromise = null;
        
        rsocket.onClose(() => {
          console.log('RSocket connection closed');
          this.rsocket = null;
          this.connectionPromise = null;
        });

        resolve(rsocket);
        
      } catch (error) {
        console.error('RSocket connection error:', error);
        this.connectionPromise = null;
        reject(new Error('RSocket connection failed - server may be unavailable'));
      }
    });

    return this.connectionPromise;
  }

  private createRouteMetadata(route: string): Buffer {
    const routingMetadata = (globalThis as any).Buffer.alloc(route.length + 1);
    routingMetadata.writeUInt8(route.length, 0);
    routingMetadata.write(route, 1);
    return routingMetadata;
  }

  async getUserById(userId: string): Promise<UserModel | null> {
    try {
      const rsocket = await this.connect();
      const route = 'users.getById';
      
      console.log('🔥 getUserById - Starting request for userId:', userId);
      console.log('🔥 getUserById - Using route:', route);
      
      // Send userId as JSON object that matches server expectation
      const requestData = { userId: userId };
      const payload: Payload = {
        data: (globalThis as any).Buffer.from(JSON.stringify(requestData), 'utf8'),
        metadata: this.createRouteMetadata(route),
      };

      console.log('🔥 getUserById - Request data:', requestData);
      console.log('🔥 getUserById - Payload created, sending request...');

      return new Promise<UserModel | null>((resolve, reject) => {
        let isResolved = false;
        
        // Add timeout to prevent hanging
        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            console.log('🔥 getUserById - Request timed out');
            resolve(null);
          }
        }, 5000);

        rsocket.requestResponse(payload, {
          onNext(payload: Payload) {
            console.log('🔥 getUserById onNext called with payload:', payload);
            if (!isResolved) {
              clearTimeout(timeout);
              isResolved = true;
              
              if (payload.data) {
                try {
                  const responseText = payload.data.toString('utf8');
                  console.log('🔥 getUserById raw response text:', responseText);
                  
                  // Check if response is empty or just whitespace
                  if (!responseText || responseText.trim() === '') {
                    console.log('🔥 getUserById - Empty response received');
                    resolve(null);
                    return;
                  }
                  
                  const user: UserModel = JSON.parse(responseText);
                  console.log('🔥 User details received:', user);
                  resolve(user);
                } catch (e) {
                  console.error('🔥 Failed to parse user data:', e);
                  console.error('🔥 Raw response that failed to parse:', payload.data.toString('utf8'));
                  resolve(null);
                }
              } else {
                console.log('🔥 No user data received in payload');
                resolve(null);
              }
            }
          },
          onError(err: Error) {
            console.error('🔥 Get user by ID error:', err);
            if (!isResolved) {
              clearTimeout(timeout);
              isResolved = true;
              console.log('🔥 getUserById - Resolving null due to error');
              resolve(null); // Return null instead of rejecting to handle gracefully
            }
          },
          onComplete() {
            console.log('🔥 getUserById onComplete called');
            if (!isResolved) {
              clearTimeout(timeout);
              isResolved = true;
              console.log('🔥 getUserById - Request completed without data');
              resolve(null);
            }
          },
          onExtension() {
            console.log('🔥 getUserById onExtension called');
            // Handle extension if needed
          }
        });
      });
    } catch (error) {
      console.error('🔥 Failed to get user by ID:', error);
      return null;
    }
  }

  async loginUser(loginRequest: LoginRequest): Promise<UserModel> {
    try {
      console.log('Starting RSocket login process...');
      const rsocket = await this.connect();

      const route = 'users.login';
      const payload: Payload = {
        data: (globalThis as any).Buffer.from(JSON.stringify(loginRequest), 'utf8'),
        metadata: this.createRouteMetadata(route),
      };

      console.log('Sending login request with route:', route);
      console.log('Login payload:', loginRequest);

      return new Promise<UserModel>((resolve, reject) => {
        console.log('Promise created, setting up RSocket callbacks...');
        
        let isResolved = false;
        
        // Add timeout to prevent infinite loading
        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            console.log('🚨 Login request timed out');
            reject(new Error('Login request timed out - please try again'));
          }
        }, 10000); // 10 second timeout

        rsocket.requestResponse(payload, {
          onNext(payload: Payload) {
            console.log('🔥 onNext called - received response payload:', payload);
            if (!isResolved) {
              clearTimeout(timeout);
              isResolved = true;
              
              if (payload.data) {
                const responseData = payload.data.toString('utf8');
                console.log('🔥 Response data string:', responseData);
                
                try {
                  const user: UserModel = JSON.parse(responseData);
                  console.log('🔥 Login successful, parsed user:', user);
                  resolve(user);
                } catch (e) {
                  console.error('🚨 Failed to parse user data:', e);
                  reject(new Error('Failed to parse user data'));
                }
              } else {
                console.log('🚨 No data in payload!');
                reject(new Error('No response data received'));
              }
            }
          },
          onComplete() {
            console.log('🔥 onComplete called');
            // If onComplete is called without onNext, it means no data was returned (login failed)
            if (!isResolved) {
              clearTimeout(timeout);
              isResolved = true;
              console.log('🚨 Login failed - no user data returned');
              reject(new Error('Invalid credentials - please check your email and password'));
            }
          },
          onError(err: Error) {
            console.error('🚨 Login request failed with error:', err);
            if (!isResolved) {
              clearTimeout(timeout);
              isResolved = true;
              reject(err);
            }
          },
          onExtension() {
            console.log('🔥 onExtension called');
          }
        });
        
        console.log('🔥 requestResponse called, waiting for callbacks...');
      });

    } catch (error) {
      console.error('🚨 Login failed in outer catch:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to connect to server');
      }
    }
  }

  async getOrCreateChat(currentUserId: string, otherUserId: string): Promise<ChatModel> {
    const rsocket = await this.connect();
    const route = 'chats.getOrCreate';
    
    const chatRequest: ChatRequest = { currentUserId, otherUserId };
    const payload: Payload = {
      data: (globalThis as any).Buffer.from(JSON.stringify(chatRequest), 'utf8'),
      metadata: this.createRouteMetadata(route),
    };

    return new Promise<ChatModel>((resolve, reject) => {
      rsocket.requestResponse(payload, {
        onNext(payload: Payload) {
          if (payload.data) {
            try {
              const chat: ChatModel = JSON.parse(payload.data.toString('utf8'));
              resolve(chat);
            } catch (e) {
              reject(new Error('Failed to parse chat data'));
            }
          } else {
            reject(new Error('No chat data received'));
          }
        },
        onError(err: Error) {
          reject(err);
        },
        onComplete() {
          // Handle completion if needed
        },
        onExtension() {
          // Handle extension if needed
        }
      });
    });
  }

  async getUserChats(userId: string, page: number = 0, size: number = 50): Promise<ChatModel[]> {
    const rsocket = await this.connect();
    const route = 'chats.getAll';
    
    const userChatsRequest: UserChatsRequest = { userId, page, size };
    console.log('🔥 getUserChats - Request payload:', userChatsRequest);
    console.log('🔥 getUserChats - Using route:', route);
    
    const payload: Payload = {
      data: (globalThis as any).Buffer.from(JSON.stringify(userChatsRequest), 'utf8'),
      metadata: this.createRouteMetadata(route),
    };

    console.log('🔥 getUserChats - Full payload created');

    return new Promise<ChatModel[]>((resolve, reject) => {
      const chats: ChatModel[] = [];
      let messageCount = 0;
      
      console.log('🔥 getUserChats - Starting requestStream...');
      
      rsocket.requestStream(payload, 2147483647, {
        onNext(payload: Payload) {
          messageCount++;
          console.log('🔥 getUserChats - onNext called, message #', messageCount);
          
          if (payload.data) {
            try {
              const chatData = payload.data.toString('utf8');
              console.log('🔥 getUserChats - Raw chat data:', chatData);
              console.log('🔥 getUserChats - Raw chat data TYPE:', typeof chatData);
              console.log('🔥 getUserChats - Raw chat data LENGTH:', chatData.length);
              
              const chat: ChatModel = JSON.parse(chatData);
              console.log('🔥 getUserChats - Parsed chat FULL OBJECT:', chat);
              console.log('🔥 getUserChats - Parsed chat KEYS:', Object.keys(chat));
              console.log('🔥 getUserChats - Parsed chat VALUES:', Object.values(chat));
              console.log('🔥 getUserChats - Chat ID:', chat.id);
              console.log('🔥 getUserChats - Chat participants:', chat.participants);
              console.log('🔥 getUserChats - Chat lastMessage:', chat.lastMessage);
              console.log('🔥 getUserChats - Chat lastMessageTimestamp:', chat.lastMessageTimestamp);
              
              chats.push(chat);
            } catch (e) {
              console.error('🔥 getUserChats - Failed to parse chat:', e);
              console.error('🔥 getUserChats - Raw data that failed to parse:', payload.data.toString('utf8'));
            }
          } else {
            console.log('🔥 getUserChats - No data in payload');
          }
        },
        onError(err: Error) {
          console.error('🔥 getUserChats - Stream error:', err);
          reject(err);
        },
        onComplete() {
          console.log('🔥 getUserChats - Stream completed');
          console.log('🔥 getUserChats - Total messages received:', messageCount);
          console.log('🔥 getUserChats - Total chats parsed:', chats.length);
          console.log('🔥 getUserChats - Final chats array FULL STRUCTURE:', JSON.stringify(chats, null, 2));
          resolve(chats);
        },
        onExtension() {
          console.log('🔥 getUserChats - Extension called');
        }
      });
    });
  }

  async sendMessage(messageRequest: SendMessageRequest): Promise<MessageModel> {
    const rsocket = await this.connect();
    const route = 'messages.send';
    
    // Create message payload that matches your Kotlin MessageModel exactly
    const messageModel = {
      chatId: messageRequest.chatId,
      senderId: messageRequest.fromUserId,    // Map fromUserId to senderId
      receiverId: messageRequest.toUserId,    // Map toUserId to receiverId
      content: messageRequest.text,           // Map text to content
      timestamp: new Date().toISOString(),
      readBy: []                              // Initialize as empty array
    };
    
    const json = JSON.stringify(messageModel);
    console.log('Sending message JSON with correct field names:', json);
    
    const payload: Payload = {
      data: (globalThis as any).Buffer.from(json, 'utf8'),
      metadata: this.createRouteMetadata(route),
    };

    console.log('Sending message with payload:', messageModel);

    return new Promise<MessageModel>((resolve, reject) => {
      rsocket.requestResponse(payload, {
        onNext(payload: Payload) {
          if (payload.data) {
            try {
              const sentMessage: MessageModel = JSON.parse(payload.data.toString('utf8'));
              console.log('Message sent successfully:', sentMessage);
              resolve(sentMessage);
            } catch (e) {
              console.error('Failed to parse sent message:', e);
              reject(new Error('Failed to parse message data'));
            }
          } else {
            reject(new Error('No message data received'));
          }
        },
        onError(err: Error) {
          console.error('Send message error:', err);
          reject(err);
        },
        onComplete() {
          console.log('Send message completed');
        },
        onExtension() {
          console.log('Send message extension');
        }
      });
    });
  }

  async streamMessages(chatId: string, onMessage: (message: MessageModel) => void, onError?: (error: Error) => void) {
    this.connect().then(rsocket => {
      const route = 'chats.streamMessages'; // Use server's actual route
      const payload: Payload = {
        data: (globalThis as any).Buffer.from(chatId, 'utf8'), // Send chatId as raw string, not JSON
        metadata: this.createRouteMetadata(route),
      };

      console.log('Streaming messages for chatId:', chatId);

      rsocket.requestStream(payload, 2147483647, {
        onNext(payload: Payload) {
          if (payload.data) {
            try {
              const message: MessageModel = JSON.parse(payload.data.toString('utf8'));
              console.log('Received message from stream:', message);
              onMessage(message);
            } catch (e) {
              console.error('Failed to parse streamed message:', e);
              onError?.(new Error('Failed to parse message'));
            }
          }
        },
        onError(err: Error) {
          console.error('Message stream error:', err);
          onError?.(err);
        },
        onComplete() {
          console.log('Message stream completed for chat:', chatId);
        },
        onExtension() {
          // Handle extension if needed
        }
      });
    }).catch(error => {
      console.error('Failed to connect for message streaming:', error);
      onError?.(error);
    });
  }

  async getMessageHistory(chatId: string, page: number = 0, size: number = 50): Promise<MessageModel[]> {
    const rsocket = await this.connect();
    const route = 'chats.getMessages'; // Use server's actual route
    
    const chatMessagesRequest: ChatMessagesRequest = { chatId, page, size };
    const payload: Payload = {
      data: (globalThis as any).Buffer.from(JSON.stringify(chatMessagesRequest), 'utf8'),
      metadata: this.createRouteMetadata(route),
    };

    console.log('🔥 Loading message history for chatId:', chatId, 'using route:', route);

    return new Promise<MessageModel[]>((resolve, reject) => {
      const messages: MessageModel[] = [];
      
      rsocket.requestStream(payload, 2147483647, {
        onNext(payload: Payload) {
          if (payload.data) {
            try {
              const message: MessageModel = JSON.parse(payload.data.toString('utf8'));
              console.log('🔥 Received historical message:', message);
              messages.push(message);
            } catch (e) {
              console.error('🔥 Failed to parse historical message:', e);
            }
          }
        },
        onError(err: Error) {
          console.error('🔥 Message history error:', err);
          reject(err);
        },
        onComplete() {
          console.log('🔥 Message history loaded, total messages:', messages.length);
          resolve(messages);
        },
        onExtension() {
          // Handle extension if needed
        }
      });
    });
  }

  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    const rsocket = await this.connect();
    const route = 'messages.markAsRead';
    
    const request: UnreadCountRequest = { chatId, userId };
    const payload: Payload = {
      data: (globalThis as any).Buffer.from(JSON.stringify(request), 'utf8'),
      metadata: this.createRouteMetadata(route),
    };

    return new Promise<void>((resolve, reject) => {
      rsocket.requestResponse(payload, {
        onNext() {
          resolve();
        },
        onError(err: Error) {
          reject(err);
        },
        onComplete() {
          resolve();
        },
        onExtension() {
          // Handle extension if needed
        }
      });
    });
  }

  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    const rsocket = await this.connect();
    const route = 'chats.getUnreadCount';
    
    const request: UnreadCountRequest = { chatId, userId };
    const payload: Payload = {
      data: (globalThis as any).Buffer.from(JSON.stringify(request), 'utf8'),
      metadata: this.createRouteMetadata(route),
    };

    return new Promise<number>((resolve, reject) => {
      rsocket.requestResponse(payload, {
        onNext(payload: Payload) {
          if (payload.data) {
            try {
              const response = JSON.parse(payload.data.toString('utf8'));
              resolve(response.unreadCount || 0);
            } catch (e) {
              resolve(0);
            }
          } else {
            resolve(0);
          }
        },
        onError(err: Error) {
          reject(err);
        },
        onComplete() {
          resolve(0);
        },
        onExtension() {
          // Handle extension if needed
        }
      });
    });
  }

  async getAllUsers(): Promise<UserModel[]> {
    const rsocket = await this.connect();
    const route = 'users.getAll';
    
    const payload: Payload = {
      data: (globalThis as any).Buffer.from('', 'utf8'), // Empty data for getAll
      metadata: this.createRouteMetadata(route),
    };

    return new Promise<UserModel[]>((resolve, reject) => {
      const users: UserModel[] = [];
      
      rsocket.requestStream(payload, 2147483647, {
        onNext(payload: Payload) {
          if (payload.data) {
            try {
              const user: UserModel = JSON.parse(payload.data.toString('utf8'));
              users.push(user);
            } catch (e) {
              console.error('Failed to parse user data:', e);
            }
          }
        },
        onError(err: Error) {
          reject(err);
        },
        onComplete() {
          resolve(users);
        },
        onExtension() {
          // Handle extension if needed
        }
      });
    });
  }

  async searchUserByEmail(email: string): Promise<UserModel | null> {
    try {
      // Get all users and filter by email on the client side
      // This is because the server doesn't have a dedicated search by email endpoint
      const allUsers = await this.getAllUsers();
      const foundUser = allUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
      return foundUser || null;
    } catch (error) {
      console.error('Failed to search user by email:', error);
      return null;
    }
  }

  async getProjectsForUser(userId: string, userType: 'CLIENT' | 'FACTORY'): Promise<any[]> {
    try {
      console.log('🔍 Fetching projects for user:', userId, 'type:', userType);
      const rsocket = await this.connect();
      const route = 'projects.getAllForUser';
      
      const request = { userId, profileType: userType };
      const payload: Payload = {
        data: (globalThis as any).Buffer.from(JSON.stringify(request), 'utf8'),
        metadata: this.createRouteMetadata(route),
      };

      return new Promise<any[]>((resolve) => {
        const projects: any[] = [];
        let hasReceivedData = false;
        
        // Add timeout to prevent hanging
        const timeout = setTimeout(() => {
          if (!hasReceivedData) {
            console.log('🔍 Projects request timed out, returning empty array');
            resolve([]);
          }
        }, 10000);
        
        rsocket.requestStream(payload, 2147483647, {
          onNext(payload: Payload) {
            hasReceivedData = true;
            if (payload.data) {
              try {
                const project = JSON.parse(payload.data.toString('utf8'));
                console.log('🔍 Received project:', project);
                projects.push(project);
              } catch (e) {
                console.error('🔍 Failed to parse project data:', e);
              }
            }
          },
          onError(err: Error) {
            clearTimeout(timeout);
            console.error('🔍 Projects request error:', err);
            // Don't reject, return empty array instead to handle gracefully
            console.log('🔍 Server may not support this route yet, returning empty projects');
            resolve([]);
          },
          onComplete() {
            clearTimeout(timeout);
            console.log('🔍 Projects request completed, total:', projects.length);
            resolve(projects);
          },
          onExtension() {
            // Handle extension if needed
          }
        });
      });
    } catch (error) {
      console.error('🔍 Failed to fetch projects:', error);
      console.log('🔍 Connection error, returning empty projects array');
      return [];
    }
  }

  async updateUserFactor(userId: string, factor: number): Promise<UserModel | null> {
    try {
      console.log('🔍 Updating user factor:', userId, 'to:', factor);
      const rsocket = await this.connect();
      const route = 'users.updateFactor';
      
      const request = { userId, factor };
      const payload: Payload = {
        data: (globalThis as any).Buffer.from(JSON.stringify(request), 'utf8'),
        metadata: this.createRouteMetadata(route),
      };

      return new Promise<UserModel | null>((resolve, reject) => {
        rsocket.requestResponse(payload, {
          onNext(payload: Payload) {
            console.log('🔍 Update factor response received:', payload);
            if (payload.data) {
              try {
                const updatedUser: UserModel = JSON.parse(payload.data.toString('utf8'));
                console.log('🔍 User factor updated successfully:', updatedUser);
                resolve(updatedUser);
              } catch (e) {
                console.error('🔍 Failed to parse updated user data:', e);
                resolve(null);
              }
            } else {
              console.log('🔍 No updated user data received');
              resolve(null);
            }
          },
          onError(err: Error) {
            console.error('🔍 Update factor request error:', err);
            reject(err);
          },
          onComplete() {
            console.log('🔍 Update factor request completed without data');
            resolve(null);
          },
          onExtension() {
            // Handle extension if needed
          }
        });
      });
    } catch (error) {
      console.error('🔍 Failed to update user factor:', error);
      return null;
    }
  }

  async getBOQPdf(projectId: string): Promise<Uint8Array | null> {
    try {
      console.log('🔍 Fetching BOQ PDF for project:', projectId);
      const rsocket = await this.connect();
      const route = 'projects.getBoqPdf';
      
      const payload: Payload = {
        data: (globalThis as any).Buffer.from(projectId, 'utf8'),
        metadata: this.createRouteMetadata(route),
      };

      return new Promise<Uint8Array | null>((resolve, reject) => {
        rsocket.requestResponse(payload, {
          onNext(payload: Payload) {
            console.log('🔍 BOQ PDF response received:', payload);
            if (payload.data) {
              try {
                // Convert Buffer to Uint8Array for PDF handling
                const pdfData = new Uint8Array(payload.data);
                console.log('🔍 BOQ PDF data size:', pdfData.length, 'bytes');
                resolve(pdfData);
              } catch (e) {
                console.error('🔍 Failed to process BOQ PDF data:', e);
                resolve(null);
              }
            } else {
              console.log('🔍 No BOQ PDF data received');
              resolve(null);
            }
          },
          onError(err: Error) {
            console.error('🔍 BOQ PDF request error:', err);
            reject(err);
          },
          onComplete() {
            console.log('🔍 BOQ PDF request completed without data');
            resolve(null);
          },
          onExtension() {
            // Handle extension if needed
          }
        });
      });
    } catch (error) {
      console.error('🔍 Failed to fetch BOQ PDF:', error);
      return null;
    }
  }

  async createQuoteFromBOQ(projectId: string, factoryId: string): Promise<boolean> {
    try {
      console.log('🏗️ Creating quote from BOQ for project:', projectId, 'factory:', factoryId);
      const rsocket = await this.connect();
      const route = 'projects.createQuoteFromBOQ';
      
      const request: CreateQuoteFromBOQRequest = { projectId, factoryId };
      const payload: Payload = {
        data: (globalThis as any).Buffer.from(JSON.stringify(request), 'utf8'),
        metadata: this.createRouteMetadata(route),
      };

      return new Promise<boolean>((resolve, reject) => {
        rsocket.requestResponse(payload, {
          onNext(payload: Payload) {
            console.log('🏗️ Quote creation response received:', payload);
            if (payload.data) {
              try {
                const response = JSON.parse(payload.data.toString('utf8'));
                console.log('🏗️ Quote created successfully:', response);
                resolve(true);
              } catch (e) {
                console.error('🏗️ Failed to parse quote creation response:', e);
                resolve(false);
              }
            } else {
              console.log('🏗️ Quote created successfully (no response data)');
              resolve(true);
            }
          },
          onError(err: Error) {
            console.error('🏗️ Quote creation error:', err);
            reject(err);
          },
          onComplete() {
            console.log('🏗️ Quote creation completed');
            resolve(true);
          },
          onExtension() {
            // Handle extension if needed
          }
        });
      });
    } catch (error) {
      console.error('🏗️ Failed to create quote from BOQ:', error);
      return false;
    }
  }

  async getAluminumProfiles(height: number, width: number): Promise<any[]> {
    try {
      console.log('🔧 STARTING - Fetching aluminum profiles for dimensions:', { height, width });
      const rsocket = await this.connect();
      console.log('🔧 RSocket connection established successfully');
      
      const route = 'profiles.getByDimensions';
      const request = { height, width };
      
      console.log('🔧 Using route:', route);
      console.log('🔧 Request payload:', JSON.stringify(request));
      
      const payload: Payload = {
        data: (globalThis as any).Buffer.from(JSON.stringify(request), 'utf8'),
        metadata: this.createRouteMetadata(route),
      };

      console.log('🔧 Payload created, sending requestStream...');

      return new Promise<any[]>((resolve) => {
        const profiles: any[] = [];
        let hasReceivedData = false;
        let messageCount = 0;
        
        // Add timeout to prevent hanging
        const timeout = setTimeout(() => {
          if (!hasReceivedData) {
            console.log('🔧 ❌ TIMEOUT - Aluminum profiles request timed out after 10 seconds');
            console.log('🔧 ❌ This likely means the backend route "profiles.getByDimensions" does not exist');
            resolve([]);
          }
        }, 10000);
        
        rsocket.requestStream(payload, 2147483647, {
          onNext(payload: Payload) {
            messageCount++;
            hasReceivedData = true;
            console.log('🔧 ✅ onNext called - message #', messageCount);
            
            if (payload.data) {
              try {
                const rawData = payload.data.toString('utf8');
                console.log('🔧 Raw profile data received:', rawData);
                
                const profile = JSON.parse(rawData);
                console.log('🔧 ✅ Parsed aluminum profile successfully:', profile);
                console.log('🔧 Profile details - Number:', profile.profileNumber, 'UsageType:', profile.usageType);
                profiles.push(profile);
              } catch (e) {
                console.error('🔧 ❌ Failed to parse aluminum profile data:', e);
                console.error('🔧 Raw data that failed to parse:', payload.data.toString('utf8'));
              }
            } else {
              console.log('🔧 ⚠️  onNext called but no data in payload');
            }
          },
          onError(err: Error) {
            clearTimeout(timeout);
            console.error('🔧 ❌ STREAM ERROR - Aluminum profiles request failed:', err);
            console.error('🔧 ❌ Error details:', {
              name: err.name,
              message: err.message,
              stack: err.stack
            });
            console.log('🔧 ❌ This confirms the server route "profiles.getByDimensions" does not exist or has errors');
            resolve([]);
          },
          onComplete() {
            clearTimeout(timeout);
            console.log('🔧 ✅ STREAM COMPLETED - Aluminum profiles request finished');
            console.log('🔧 ✅ Total messages received:', messageCount);
            console.log('🔧 ✅ Total profiles parsed:', profiles.length);
            console.log('🔧 ✅ Final profiles array:', profiles);
            resolve(profiles);
          },
          onExtension() {
            console.log('🔧 📝 onExtension called');
          }
        });
      });
    } catch (error) {
      console.error('🔧 ❌ OUTER CATCH - Failed to fetch aluminum profiles:', error);
      console.log('🔧 ❌ Connection or setup error, returning empty profiles array');
      return [];
    }
  }

  disconnect() {
    if (this.rsocket) {
      this.rsocket.close();
      this.rsocket = null;
      this.connectionPromise = null;
      console.log('RSocket disconnected manually');
    }
  }
}

export const websocketService = new WebSocketService();
