import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerTools(server: McpServer) {
  server.tool("Whatsapp",
    "A tool to retrieve WhatsApp messages",
    {
      phoneNumber: z.string().describe("The phone number to use if we want to retrieve a message"),
      numberOfRecords: z.string().describe("The total number of records to retrieve")
    },
    async ({ phoneNumber, numberOfRecords }) => {
      console.log(`TRY Fetching ${numberOfRecords} missed messages for phone number: ${phoneNumber}`);
      var res = await fetch(`${process.env.WHATSAPPSERVERURL}/missedMessages/${phoneNumber}/${numberOfRecords}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch missed messages: ${res.statusText}`);
      }
      var data = await res.text();
      // var data = undefined
      return {
        content: [{
          type: "text",
          text: `Last ${numberOfRecords} WhatsApp messages for ${phoneNumber} were:\r\n ${data ?? "No messages found"}`
        }]
      };
    }
  );

  server.tool("WhatsappSend",
    "A tool to send WhatsApp messages",
    {
      phoneNumber: z.string().describe("The phone number to send the message to"),
      message: z.string().describe("The message to send")
    },
    async ({ phoneNumber, message }) => {
      console.log(`TRY sending ${phoneNumber} a message ${message}`);
      // use the fetch api to send a http post to /sendMessage/:telNumber with the message in the body
      var res = await fetch(`${process.env.WHATSAPPSERVERURL}/sendMessage/${phoneNumber}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phoneNumber,
          message
        })
      })
      if (!res.ok) {
        throw new Error(`Failed to fetch missed messages: ${res.statusText}`);
      }
      var data = await res.text();
      // var data = undefined
      return {
        content: [{
          type: "text",
          text: `${data}`
        }]
      };
    });
}