import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as dotenv from "dotenv";
import { registerResources } from "./model/resources";
import { registerTools } from "./model/tools";
import {version} from "../package.json";

dotenv.config();

// Create an MCP server
const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

registerResources(server);
registerTools(server);

const startServer = async () => {
  console.log("Starting server...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Server connected");
  console.log(`Server Running ${version}`);
};

startServer().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});