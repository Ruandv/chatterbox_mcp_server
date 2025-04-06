import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerTools(server: McpServer) {
  server.tool("Whatsapp",
    "A tool to retrieve WhatsApp messages",
    {
      phoneNumber: z.string().describe("The phone number to use if we want to retrieve a message"),
      numberOfRecords: z.number().describe("The total number of records to retrieve"),
    },
    async ({ phoneNumber,numberOfRecords}) => {
      console.log(`Fetching ${numberOfRecords}missed messages for phone number: ${phoneNumber}`, );
      var res = await fetch(`http://192.168.1.42:3004/missedMessages/${phoneNumber}/${numberOfRecords}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch missed messages: ${res.statusText}`);
      }
      var data = await res.text();
      return {
        content: [{
          type: "text",
          text: `Last WhatsApp message for ${phoneNumber} was:\r\n ${data}`
        }]
      };

      // return {
      //   content: [{
      //     type: "text",
      //     text: `Last WhatsApp message for ${phoneNumber} was:\r\n TTTTTTTT`
      //   }]
      // };
    }
  );

  server.tool("Joke",
    "A tool to tell a joke",
    {
    },
    async () => {
      console.log("Telling a joke:");

      return {
        content: [{
          type: "text",
          text: `HA HA HAHA`
        }]
      };
    }
  );
  console.log(`Tools registered `);
} 