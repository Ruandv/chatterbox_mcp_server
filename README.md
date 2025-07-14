# 🚀 Chatterbox MCP Server (indexed and certified by [MCPHub](https://mcphub.com/mcp-servers/Ruandv/chatterbox_mcp_server))

This repository contains two main components:

## 🤖 MCP Server (`mcp_server/`)
The Model Context Protocol server that provides WhatsApp functionality through MCP tools.

**Key files:**
- `mcp_server/src/server.ts` - Main MCP server
- `mcp_server/src/model/tools.ts` - MCP tools for WhatsApp operations
- `mcp_server/src/model/resources.ts` - MCP resources

**Usage:**
```bash
cd mcp_server
npm install
npm run dev
```

## 📱 WhatsApp Server (`whatsappServer/`)
The REST API server that handles actual WhatsApp Web integration.

**Key files:**
- `whatsappServer/src/server.ts` - Main Express server
- `whatsappServer/src/services/whatsappService.ts` - WhatsApp Web.js integration
- `whatsappServer/src/controllers/whatsappController.ts` - API endpoints

**Usage:**
```bash
cd whatsappServer
npm install
npm run dev
```

## 🔧 Architecture

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│                 │    Calls       │                 │
│   MCP Server    │ ─────────────► │ WhatsApp Server │
│                 │                │                 │
└─────────────────┘                └─────────────────┘
        │                                   │
        │                                   │
        ▼                                   ▼
┌─────────────────┐                ┌─────────────────┐
│  MCP Client     │                │  WhatsApp Web   │
│  (Claude, etc)  │                │                 │
└─────────────────┘                └─────────────────┘
```

### 📁 Project Structure

```
chatterbox_mcp_server/
├── mcp_server/
│   ├── src/
│   ├── secrets/                    # Secret files for MCP server
│   │   ├── CHATTERBOX_SECRET
│   │   └── WHATSAPP_SERVER_URL
│   └── package.json
├── whatsappServer/
│   ├── src/
│   ├── secrets/                    # Secret files for WhatsApp server
│   │   ├── CHATTERBOX_SECRET
│   │   ├── PORT
│   │   └── HEADLESS
│   └── package.json
└── package.json
```

## 🚀 Quick Start

1. **Set up secrets:**
   ```bash
   # MCP Server secrets (in mcp_server/secrets/)
   echo "your_secret_here" > mcp_server/secrets/CHATTERBOX_SECRET
   echo "http://localhost:3004" > mcp_server/secrets/WHATSAPP_SERVER_URL
   
   # WhatsApp Server secrets (in whatsappServer/secrets/)
   echo "your_secret_here" > whatsappServer/secrets/CHATTERBOX_SECRET
   echo "3004" > whatsappServer/secrets/PORT
   echo "true" > whatsappServer/secrets/HEADLESS
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Start WhatsApp Server:**
   ```bash
   npm run dev:whatsapp
   ```

4. **Start MCP Server:**
   ```bash
   npm run dev:mcp
   ```

5. **Authenticate WhatsApp:**
   - Visit `http://localhost:3004/qr` to get QR code
   - Scan with WhatsApp mobile app

## 🛠️ Development

Each component can be developed independently:

- **MCP Server** focuses on MCP protocol implementation
- **WhatsApp Server** handles WhatsApp Web integration and API endpoints

## 📋 Required Secrets

Both servers use file-based secrets instead of environment variables for better security. Each secret is stored in a separate file within the `secrets/` folder.

### MCP Server (`mcp_server/secrets/`)
- `CHATTERBOX_SECRET` - Authentication secret for API calls to WhatsApp server
- `WHATSAPP_SERVER_URL` - URL of the WhatsApp server (e.g., `http://localhost`)
- `SERVER_PORT` - Port on which the server is listening on (e.g., `3004`)

### WhatsApp Server (`whatsappServer/secrets/`)
- `CHATTERBOX_SECRET` - Authentication secret (must match MCP server secret)
- `PORT` - Server port number (e.g., `3004`)
- `HEADLESS` - Run WhatsApp in headless mode (`true` or `false`)

**Note:** The `CHATTERBOX_SECRET` must be the same in both servers for authentication to work.

## 🐳 Docker

Each component has its own Dockerfile for containerization:

```bash
# WhatsApp Server
cd whatsappServer
docker build -t whatsapp-server .

# MCP Server
cd mcp_server
docker build -t mcp-server .
```
