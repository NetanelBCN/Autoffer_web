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
  chats: any[];
  photoBytes: string;
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

  async loginUser(loginRequest: LoginRequest): Promise<UserModel> {
    try {
      console.log('Starting RSocket login process...');
      const rsocket = await this.connect();

      const route = 'users.login';
      const routingMetadata = (globalThis as any).Buffer.alloc(route.length + 1);
      routingMetadata.writeUInt8(route.length, 0);
      routingMetadata.write(route, 1);

      const payload: Payload = {
        data: (globalThis as any).Buffer.from(JSON.stringify(loginRequest), 'utf8'),
        metadata: routingMetadata,
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
