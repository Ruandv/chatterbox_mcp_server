import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsappService';

// Use singleton pattern
const getWhatsAppService = (): WhatsAppService => {
  return WhatsAppService.getInstance();
};

export const whatsappController = {
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, numberOfRecords } = req.params;
      const service = getWhatsAppService();
      
      const messages = await service.getMessages(
        phoneNumber,
        parseInt(numberOfRecords),
      );
      
      res.send(messages);
    } catch (error) {
      console.error('Error getting missed messages:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async lookupContact(req: Request, res: Response): Promise<void> {
    try {
      const { contactName } = req.params;
      const service = getWhatsAppService();
      
      const result = await service.lookupContact(contactName);
      res.json(result);
    } catch (error) {
      console.error('Error looking up contact:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber } = req.params;
      const { message } = req.body;
      const service = getWhatsAppService();
      
      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }
      
      const result = await service.sendMessage(phoneNumber, message);
      res.send(result);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async getQRCode(req: Request, res: Response): Promise<void> {
    try {
      const service = getWhatsAppService();
      const qrCode = service.getQRCode();
      
      if (!qrCode) {
        res.status(404).json({ error: 'QR code not available' });
        return;
      }
      
      res.json({ qrCode });
    } catch (error) {
      console.error('Error getting QR code:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const service = getWhatsAppService();
      const status = service.getStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting status:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async getAllContacts(req: Request, res: Response): Promise<void> {
    try {
      const service = getWhatsAppService();
      const result = await service.getAllContacts();
      res.json(result);
    } catch (error) {
      console.error('Error getting all contacts:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async getAllChats(req: Request, res: Response): Promise<void> {
    try {
      const service = getWhatsAppService();
      const result = await service.getAllChats();
      res.json(result);
    } catch (error) {
      console.error('Error getting all chats:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  },
};
