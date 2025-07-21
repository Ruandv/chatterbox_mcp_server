import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WhatsAppService } from "../services/WhatsAppService.js";
import { MissedMessages } from "./interfaces.js";

export function registerTools(server: McpServer) {
  server.tool("WhatsappReader",
    "A tool to retrieve WhatsApp messages",
    {
      phoneNumber: z.string().describe("The phone number to use if we want to retrieve a message"),
      numberOfRecords: z.string().describe("The total number of records to retrieve")
    },
    async ({ phoneNumber, numberOfRecords }) => {
      try {
        console.log(`Fetching ${numberOfRecords} missed messages for phone number: ${phoneNumber}`);
        const whatsappService = await WhatsAppService.getInstance();
        const data: MissedMessages = await whatsappService.getMessages(phoneNumber, numberOfRecords);
        var messageData = `Last ${data.messages.length} WhatsApp messages for ${phoneNumber} were:\r\n ${data.messages.map(message => `[${message.timestamp}] ${message.from} : ${message.body}`).join("\r\n") ?? "No messages found"}`;
        if (data.hasNewMessages) {
          console.log(`You need to respond to the last message from ${data.messages[data.messages.length - 1].from}`);
          messageData += `\n\nYou need to respond to the last message from ${data.messages[data.messages.length - 1].from}`;
        }

        return {
          content: [{
            type: "text",
            text: messageData
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching WhatsApp messages: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );
  server.tool("WhatsappRetrieveUser", "Look for a whatsapp user by name and get back a WhatsApp ID that can be used as the phone number",
    {
      contactName: z.string().describe("The name of the contact to lookup")
    }, async ({ contactName }) => {
      try {
        console.log(`Looking up WhatsApp user: ${contactName}`);
        const whatsappService = await WhatsAppService.getInstance();
        const whatsAppId = await whatsappService.lookupContact(contactName);
        return {
          content: [{
            type: "text",
            text: whatsAppId
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error looking up contact: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    });
  server.tool("WhatsappSender",
    "A tool to send WhatsApp messages",
    {
      phoneNumber: z.string().describe("The phone number to send the message to"),
      message: z.string().describe("The message to send")
    },
    async ({ phoneNumber, message }) => {
      try {
        console.log(`Sending message to ${phoneNumber}: ${message}`);
        const whatsappService = await WhatsAppService.getInstance();
        const result = await whatsappService.sendMessage(phoneNumber, message);
        return {
          content: [{
            type: "text",
            text: result
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error sending WhatsApp message: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    });

  server.tool("WhatsappHealthCheck",
    "Check if the WhatsApp server is running and accessible",
    {},
    async () => {
      try {
        const whatsappService = await WhatsAppService.getInstance();
        const isHealthy = await whatsappService.getServerHealth();
        const currentUrl = whatsappService.getCurrentServerUrl();
        return {
          content: [{
            type: "text",
            text: isHealthy
              ? `WhatsApp server is healthy and accessible at: ${currentUrl}`
              : `WhatsApp server is not accessible at: ${currentUrl}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error checking WhatsApp server health: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    });

  server.tool("WhatsappServerStatus",
    "Get detailed status of all configured WhatsApp servers",
    {},
    async () => {
      try {
        const whatsappService = await WhatsAppService.getInstance();
        const allServers = await whatsappService.getAllServersHealth();
        const currentUrl = whatsappService.getCurrentServerUrl();

        let statusText = "WhatsApp Server Status:\n\n";
        statusText += `Current Active Server: ${currentUrl}\n\n`;
        statusText += "All Configured Servers:\n";

        allServers.forEach(server => {
          const status = server.healthy ? "✅ HEALTHY" : "❌ UNHEALTHY";
          const active = server.url === currentUrl ? " (ACTIVE)" : "";
          statusText += `- ${server.url}: ${status}${active}\n`;
        });

        return {
          content: [{
            type: "text",
            text: statusText
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error checking server status: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    });

  server.tool("WhatsappGetAllContacts",
    "Get all WhatsApp contacts",
    {},
    async () => {
      try {
        const whatsappService = await WhatsAppService.getInstance();
        const result = await whatsappService.getAllContacts();

        let contactsText = "All WhatsApp Contacts:\n\n";
        result.contacts.forEach(contact => {
          const displayName = contact.name || contact.pushname || contact.phone;
          contactsText += `• ${displayName} (${contact.phone}) - ID: ${contact.id}\n`;
        });

        return {
          content: [{
            type: "text",
            text: contactsText
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error getting all contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    });

  server.tool("WhatsappGetAllChats",
    "Get all WhatsApp chats with unread count",
    {},
    async () => {
      try {
        const whatsappService = await WhatsAppService.getInstance();
        const result = await whatsappService.getAllChats();

        let chatsText = "All WhatsApp Chats:\n\n";
        const unreadChats = result.chats.filter(chat => chat.unreadCount > 0);

        if (unreadChats.length > 0) {
          chatsText += "📱 CHATS WITH UNREAD MESSAGES:\n";
          unreadChats.forEach(chat => {
            chatsText += `• ${chat.name} - ${chat.unreadCount} unread messages\n`;
            if (chat.lastMessage) {
              chatsText += `  Last: "${chat.lastMessage.substring(0, 50)}${chat.lastMessage.length > 50 ? '...' : ''}"\n`;
            }
          });
          chatsText += "\n";
        }

        chatsText += "📂 ALL CHATS:\n";
        result.chats.forEach(chat => {
          const unreadBadge = chat.unreadCount > 0 ? ` (${chat.unreadCount} unread)` : '';
          chatsText += `• ${chat.name}${unreadBadge}\n`;
        });

        return {
          content: [{
            type: "text",
            text: chatsText
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error getting all chats: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    });
}