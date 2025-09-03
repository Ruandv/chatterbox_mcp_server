import sharp from 'sharp'; // Ensure sharp is installed
import { z } from "zod";
import { pipeline } from "stream/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WhatsAppService } from "../services/WhatsAppService.js";
import { MissedMessages } from "./interfaces.js";
import { JSDOM } from 'jsdom';
import fs from 'fs';
import { YoutubeService } from '../services/YoutubeService.js';

export function registerTools(server: McpServer) {
  server.tool("WhatsappReader",
    "A tool to retrieve WhatsApp messages",
    {
      phoneNumber: z.string().describe("The phone number to use if we want to retrieve a message"),
      numberOfRecords: z.string().describe("The total number of records to retrieve")
    },
    async ({ phoneNumber, numberOfRecords }) => {
      try {
        const whatsappService = await WhatsAppService.getInstance();
        const data: MissedMessages = await whatsappService.getMessages(phoneNumber, numberOfRecords);
        var messageData = `Last ${data.messages.length} WhatsApp messages for ${phoneNumber} were:\r\n ${data.messages.map(message => `[${message.timestamp}] ${message.from} : ${message.body}`).join("\r\n") ?? "No messages found"}`;
        if (data.hasNewMessages) {
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

    /*MCP Servers does not support showing images YET */
  server.tool("906FMChartScraper",
    "Retrieve the SA Top 20 Charts from the 906FM website",
    {},
    async (): Promise<any> => {
      try {
        var downLoadImage = async (src: string) => {
          try {
            var response = await fetch(src);
            const nodeStream = response.body as unknown as NodeJS.ReadableStream;
            const currentDir = process.cwd();
            if (!fs.existsSync(currentDir + '/.temp')) {
              fs.mkdirSync(currentDir + '/.temp', { recursive: true });
              console.log(`directory: ${currentDir + '/.temp'} CREATED`);
            }
            const fileName = currentDir + '/.temp/' + src.split('/').pop();
            await pipeline(nodeStream, fs.createWriteStream(fileName));
            var base64 = await compressAndConvertToBase64(fileName);
            var fileType = fileName.split('.').pop();
            return {
              type: "image",
              data: base64,
              mimeType: `image/${fileType}`
              // size: 232
            };
          } catch (error: any) {
            return {
              type: "text",
              text: `Failed to download or process image: ${error.message}`
            };
          }
        };

        const compressAndConvertToBase64 = async (filePath: string): Promise<string> => {
          try {
            // Resize the image to a maximum width of 800px and compress it
            const buffer = await sharp(filePath)
              .resize({ width: 800 }) // Resize to a maximum width of 800px
              .jpeg({ quality: 70 }) // Compress as JPEG with 70% quality
              .toBuffer();

            // Convert the buffer to Base64
            const baseValue = buffer.toString('base64');

            // Decode the Base64 string back into binary data
            const decodedBuffer = Buffer.from(baseValue, 'base64');
            const currentDir = process.cwd() + "/.temp";

            // // Save the decoded binary data to a file
            fs.writeFileSync(currentDir + '/charts.jpg', decodedBuffer);
            return baseValue;
          } catch (error: any) {
            throw new Error(`Failed to process the image: ${error.message}`);
          }
        };

        var url = "https://www.906fmstereo.com/charts";
        // create a basic fetch request to get the html content of the page
        var res = await fetch(url);
        var answer: any[] = [];
        // check if the response is successful
        if (res.status === 200) {
          try {
            // parse the response into text
            var text = await res.text();
            // // parse the text into a document
            const dom = new JSDOM(text);
            const document = dom.window.document;
            // Example: Get all links on the page
            const images: any[] = Array.from(document.querySelectorAll("img"));
            for (const image of images) {
              if (!image || typeof image.src !== 'string' || typeof image.alt !== 'string') continue;
              var res1 = image.src.split('/v1/')[0];
              var alt = image.alt ? image.alt.toLowerCase() : '';
              var src = encodeURI(res1);
              var list = ['sa top 20', 'mobi'];
              if (!src.endsWith('.jpg') && !src.endsWith('.png') || !list.some((word) => alt.includes(word))) {
                continue;
              }
              const imageResult = await downLoadImage(src);
              // now we need to send the image result to GPT to extract the text

              if (imageResult.type === 'image') {
                return {
                  content: [
                    {
                      type: "text",
                      text: "This is the Top 20 Charts"
                    },
                    {
                      type: "text",
                      text: `${src}`,
                    }
                  ]
                };
              } else {
                return {
                  content: [
                    {
                      type: "text",
                      text: imageResult.text || "Failed to download chart image."
                    }
                  ]
                };
              }
            }
            return {
              content: [{
                type: "text",
                text: "No valid chart image found."
              }]
            };
          }
          catch (error) {
            console.log("error", error);
          }
        }

      }
      catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error getting all chats: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    });

  server.tool("youtubeCreatePlaylist", "Create a youtube playlist.", {
    playlistName: z.string().describe("The name of the playlist to create")
  },
    async ({ playlistName }) => {
      debugger;
      const youtubeService = await YoutubeService.getInstance();
      const result = await youtubeService.createPlaylist(playlistName, "A new playlist");      
      return {
        content: [{
          type: "text",
          text: result
        }]
      }
    });
  server.tool("youtubeGetPlaylists", "Retrieve a list of all user YouTube playlists.", {},
    async () => {
      try {
        const youtubeService = await YoutubeService.getInstance();
        const playlists = await youtubeService.getPlaylists();
        if (!playlists || playlists.length === 0) {
          return {
            content: [{
              type: "text",
              text: "No playlists found."
            }]
          };
        }
        let playlistsText = "YouTube Playlists:\n\n";
        playlists.forEach((playlist: any) => {
          playlistsText += `• ${playlist.snippet.title} (ID: ${playlist.id})\n`;
        });
        return {
          content: [{
            type: "text",
            text: playlistsText
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error retrieving playlists: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );
  server.tool("youtubeGetPlaylistSongs", "Retrieve the songs of a specific YouTube playlist.", {
    playlistId: z.string().describe("The ID of the playlist to retrieve songs from")
  },
    async ({ playlistId }) => {
      try {
        const youtubeService = await YoutubeService.getInstance();
        const songs = await youtubeService.getPlaylistSongs(playlistId);
        if (!songs || songs.length === 0) {
          return {
            content: [{
              type: "text",
              text: "No songs found in this playlist."
            }]
          };
        }
        let songsText = `Songs in Playlist (${playlistId}):\n\n`;
        songs.forEach((song: any, idx: number) => {
          songsText += `${idx + 1}. ${song.snippet.title} (ID: ${song.id})\n`;
        });
        return {
          content: [{
            type: "text",
            text: songsText
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error retrieving playlist songs: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );
  server.tool("youtubeAddSong", "Add a song to a specific playlistId", {
    playlistId: z.string().describe("The ID of the playlist to add the song to"),
    songName: z.string().describe("The name of the song to add")
  },
    async ({ playlistId, songName }) => {
      const youtubeService = await YoutubeService.getInstance();
      const result = await youtubeService.addSong(playlistId, songName);
      return {
        content: [{
          type: "text",
          text: result
        }]
      }
    });
  server.tool("youtubeDeleteSong", "Delete a song from a specific playlistId", {
    playlistId: z.string().describe("The ID of the playlist to delete the song from"),
    songName: z.string().describe("The name of the song to delete")
  },
    async ({ playlistId, songName }) => {
      const youtubeService = await YoutubeService.getInstance();
      const result = await youtubeService.deleteSong(playlistId, songName);
      return {
        content: [{
          type: "text",
          text: result
        }]
      }
    });
}