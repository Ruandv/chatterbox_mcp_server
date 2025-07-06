import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerResources } from "./model/resources";
import { registerTools } from "./model/tools";
import {version} from "../../package.json";
import * as fs from 'fs';
import * as path from 'path';

// Function to read environment variables from files in the secrets folder
function loadEnvFromFiles() {
  const secretsPath = path.resolve(__dirname, '../secrets');
  const files = fs.readdirSync(secretsPath);

  files.forEach(file => {
      const filePath = path.join(secretsPath, file);
      const envVarName = path.basename(file, path.extname(file)).toUpperCase();
      const envVarValue = fs.readFileSync(filePath, 'utf-8').trim();
      console.log(`Setting ${envVarName} from file ${filePath}`);
      process.env[envVarName] = envVarValue;
  });
}

// Load environment variables
loadEnvFromFiles();
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