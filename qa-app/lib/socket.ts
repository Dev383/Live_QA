type WebSocketEvent = 'new_question' | 'question_updated' | 'new_answer' | 'connect' | 'disconnect';
type MessageHandler = (data: any) => void;

class WebSocketService {
    private socket: WebSocket | null = null;
    private url: string;
    private listeners: Map<string, Set<MessageHandler>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private baseReconnectDelay = 1000;
    private isExplicitlyDisconnected = false;

    constructor() {
        let url = process.env.NEXT_PUBLIC_WS_URL;

        // Default or fix malformed URL
        if (!url) {
            url = 'ws://localhost:8000/ws';
        } else {
            // Ensure specific path for this app's backend
            if (url.endsWith('/')) {
                url = url.slice(0, -1);
            }
            if (!url.endsWith('/ws')) {
                console.log(`Appending /ws to WebSocket URL: ${url}`);
                url += '/ws';
            }
        }

        this.url = url;
    }

    public connect() {
        if (typeof window === 'undefined') return; // Don't run on server
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        this.isExplicitlyDisconnected = false;
        console.log(`Connecting to WebSocket at ${this.url}...`);

        try {
            this.socket = new WebSocket(this.url);

            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.emit('connect', null);
            };

            this.socket.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    // Expecting payload in format: { type: "event_name", data: ... }
                    if (payload.type && payload.data) {
                        this.emit(payload.type, payload.data);
                    } else {
                        console.warn('Received malformed message:', payload);
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };

            this.socket.onclose = () => {
                if (!this.isExplicitlyDisconnected) {
                    console.log('WebSocket connection lost. Attempting to reconnect...');
                    this.emit('disconnect', null);
                    this.attemptReconnect();
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                // onerror usually precedes onclose, so reconnection logic is handled in onclose
            };

        } catch (e) {
            console.error('Failed to create WebSocket connection:', e);
            this.attemptReconnect();
        }
    }

    public disconnect() {
        this.isExplicitlyDisconnected = true;
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    public on(event: WebSocketEvent | string, handler: MessageHandler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)?.add(handler);
    }

    public off(event: WebSocketEvent | string, handler: MessageHandler) {
        this.listeners.get(event)?.delete(handler);
    }

    private emit(event: string, data: any) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.forEach((handler) => handler(data));
        }
    }

    private attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached.');
            return;
        }

        const delay = Math.min(10000, this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempts));
        this.reconnectAttempts++;

        setTimeout(() => {
            if (!this.isExplicitlyDisconnected) {
                this.connect();
            }
        }, delay);
    }
}

// Singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;

export const getSocket = () => {
    webSocketService.connect();
    return webSocketService;
};