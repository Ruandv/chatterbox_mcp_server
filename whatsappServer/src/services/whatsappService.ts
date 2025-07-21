import { Client, LocalAuth, Message, Contact } from 'whatsapp-web.js';
import QrCode from "qrcode-terminal";
import * as qrcode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

export interface MissedMessages {
    messages: MessageData[];
    hasNewMessages?: boolean;
}

export interface MessageData {
    from: string;
    body: string;
    timestamp: number;
}

export class WhatsAppService {
    private static instance: WhatsAppService;
    private client: Client;
    private isReady: boolean = false;
    private qrCodeData: string | null = null;

    private constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: process.env.HEADLESS === 'true', // Use environment variable to control headless mode
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.setupEventHandlers();
    }

    // Singleton pattern - get or create the single instance
    public static getInstance(): WhatsAppService {
        if (!WhatsAppService.instance) {
            WhatsAppService.instance = new WhatsAppService();
        }
        return WhatsAppService.instance;
    }

    // Prevent external instantiation
    public static resetInstance(): void {
        if (WhatsAppService.instance) {
            WhatsAppService.instance.client.destroy();
        }
        WhatsAppService.instance = new WhatsAppService();
    }

    private setupEventHandlers() {
        this.client.on('qr', async (qr) => {
            console.log('QR Code received, generating...');

            // Display QR code in terminal
            QrCode.generate(qr, { small: true });

            // Generate QR code as base64 data URL for web display
            try {
                const qrDataUrl = await qrcode.toDataURL(qr, {
                    type: 'image/png',
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });

                // Save QR code as PNG file to public folder
                // In development: src/services -> ../../public
                // In production: dist/services -> ../../public (but we want to use the project root public folder)
                const publicDir = process.env.NODE_ENV === 'production'
                    ? path.join(process.cwd(), 'public')  // Use project root public folder in production
                    : path.join(__dirname, '../../public');  // Use relative path in development
                console.log('Saving QR code to:', publicDir);
                const qrFilePath = path.join(publicDir, 'qr-code.png');

                // Ensure public directory exists
                if (!fs.existsSync(publicDir)) {
                    fs.mkdirSync(publicDir, { recursive: true });
                }

                // Convert data URL to buffer and save as PNG
                const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                fs.writeFileSync(qrFilePath, buffer);

                console.log('QR code saved as PNG:', qrFilePath);

                this.qrCodeData = `Please scan this QR Code:\n\n![QR Code](${qrDataUrl})\n\nScan this with your WhatsApp mobile app by going to Settings > Linked Devices > Link a Device. Also visit the homepage to view the QR Code`;
            } catch (error) {
                console.error('Error generating QR code data URL:', error);
                this.qrCodeData = `Please scan this QR Code. Visit http://localhost:${process.env.PORT || 3000}/qr to see the QR code.`;
            }
        });

        this.client.on('ready', () => {
            console.log('WhatsApp client is ready!');
            this.isReady = true;

            // Clean up QR code file when authenticated
            try {
                const publicDir = process.env.NODE_ENV === 'production'
                    ? path.join(process.cwd(), 'public')  // Use project root public folder in production
                    : path.join(__dirname, '../../public');  // Use relative path in development
                const qrFilePath = path.join(publicDir, 'qr-code.png');
                if (fs.existsSync(qrFilePath)) {
                    fs.unlinkSync(qrFilePath);
                    console.log('QR code file cleaned up after authentication');
                }
            } catch (error) {
                console.error('Error cleaning up QR code file:', error);
            }
        });

        this.client.on('authenticated', () => {
            console.log('WhatsApp client authenticated');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('Authentication failed:', msg);
        });

        this.client.on('disconnected', (reason) => {
            console.log('WhatsApp client disconnected:', reason);
            this.isReady = false;
        });
    }

    async initialize(): Promise<boolean> {
        try {
            await this.client.initialize();
            return true;
        } catch (error) {
            console.error('Failed to initialize WhatsApp client:', error);
            return false;
        }
    }

    async sendMessage(phoneNumber: string, message: string): Promise<string> {
        if (!this.isReady) {
            if (this.qrCodeData) {
                return this.qrCodeData;
            } else {
                return "WhatsApp client is not ready and no QR code available. Please restart the server.";
            }
        }

        try {
            const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`;
            const response = await this.client.sendMessage(chatId, message);
            return `Message sent successfully to ${phoneNumber}`;
        } catch (error) {
            console.error('Failed to send message:', error);
            throw new Error(`Failed to send message: ${error}`);
        }
    }

    async getMessages(phoneNumber: string, numberOfRecords: number): Promise<MissedMessages> {
        this.ensureReady();
        var missedMessages: MissedMessages = { messages: [] };
        try {
            const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`;
            const chat = await this.client.getChatById(chatId);
            const messages = await chat.fetchMessages({ limit: numberOfRecords });
            missedMessages.messages = this.formatMessages(messages);
            missedMessages.hasNewMessages = messages[messages.length - 1].from.startsWith(phoneNumber) === true;
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            throw new Error(`Failed to fetch messages: ${error}`);
        }
        finally{
            return missedMessages;
        }
    }

    async lookupContact(contactName: string): Promise<{ whatsAppId: string }> {
        this.ensureReady();

        try {
            const contacts = await this.client.getContacts();
            const contact = contacts.find(c =>
                c.name?.toLowerCase().includes(contactName.toLowerCase()) ||
                c.pushname?.toLowerCase().includes(contactName.toLowerCase())
            );

            if (!contact) {
                throw new Error(`Contact '${contactName}' not found`);
            }

            return { whatsAppId: contact.id._serialized };
        } catch (error: any) {
            // check if the error ends with "not found"
            if (error.message.endsWith('not found')) {
                console.warn('Contact not found, trying fuzzy search:');
                // do a fuzzy search
                const contacts = await this.client.getContacts();
                console.log('Available contacts:', contacts.map(c => {
                    return {
                        name: c.name,
                        pushname: c.pushname,
                        id: c.id._serialized
                    };
                }));
                const fuzzyContact = contacts.find(c =>
                    c.name?.toLowerCase().includes(contactName.toLowerCase()) ||
                    c.pushname?.toLowerCase().includes(contactName.toLowerCase())
                );
                if (fuzzyContact) {
                    return { whatsAppId: fuzzyContact.id._serialized };
                }
            }
            console.error('Failed to lookup contact:', error);
            throw new Error(`Failed to lookup contact: ${error}`);
        }
    }

    async getAllContacts(): Promise<{ contacts: Array<{ name: string; pushname: string; id: string; phone: string }> }> {
        this.ensureReady();

        try {
            const contacts = await this.client.getContacts();
            const formattedContacts = contacts.map(c => ({
                name: c.name || '',
                pushname: c.pushname || '',
                id: c.id._serialized,
                phone: c.number || ''
            })).filter(c => c.phone); // Only include contacts with phone numbers

            return { contacts: formattedContacts };
        } catch (error) {
            console.error('Failed to get all contacts:', error);
            throw new Error(`Failed to get all contacts: ${error}`);
        }
    }

    async getAllChats(): Promise<{ chats: Array<{ name: string; id: string; unreadCount: number; lastMessage?: string }> }> {
        this.ensureReady();

        try {
            const chats = await this.client.getChats();
            const formattedChats = await Promise.all(chats.map(async (chat) => {
                let lastMessage = '';
                try {
                    const messages = await chat.fetchMessages({ limit: 1 });
                    lastMessage = messages.length > 0 ? messages[0].body : '';
                } catch (error) {
                    console.warn('Could not fetch last message for chat:', chat.id);
                }

                return {
                    name: chat.name || chat.id._serialized,
                    id: chat.id._serialized,
                    unreadCount: chat.unreadCount,
                    lastMessage
                };
            }));

            return { chats: formattedChats };
        } catch (error) {
            console.error('Failed to get all chats:', error);
            throw new Error(`Failed to get all chats: ${error}`);
        }
    }
    
    private formatMessages(messages: Message[]): MessageData[] {
        return messages.map(msg => {
            // check if the message contains a media attachment
            if (msg.hasMedia) {
                return {
                    from: msg.from === msg.to ? 'You' : msg.from,
                    body: "Some media attachment (ignore this message)",
                    timestamp: msg.timestamp
                };
            }
            else {
                return {
                    from: msg.from === msg.to ? 'You' : msg.from,
                    body: msg.body,
                    timestamp: msg.timestamp
                };
            }
        });
    }

    getQRCode(): string | null {
        return this.qrCodeData;
    }

    getStatus(): { isReady: boolean; hasQR: boolean } {
        return {
            isReady: this.isReady,
            hasQR: this.qrCodeData !== null
        };
    }

    private ensureReady(): void {
        if (!this.isReady) {
            throw new Error('WhatsApp client is not ready');
        }
    }

    // Cleanup method for graceful shutdown
    public async cleanup(): Promise<void> {
        if (this.client) {
            try {
                await this.client.destroy();
                console.log('WhatsApp client destroyed');
            } catch (error) {
                console.error('Error destroying WhatsApp client:', error);
            }
        }
        this.isReady = false;
        this.qrCodeData = null;
    }
}
