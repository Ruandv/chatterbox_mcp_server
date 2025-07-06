# Chatterbox MCP Server

This repository contains two main components:

## 🤖 MCP Server (`mcp_server`)
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

## 🚀 Quick Start

1. **Set up environment variables:**
   ```bash
   # Create secrets files or .env files in each directory
   echo "your_secret_here" > mcp_server/secrets/CHATTERBOX_SECRET
   echo "http://localhost:3000" > mcp_server/secrets/whatsappServerUrl
   
   # Or use .env files
   cp whatsappServer/.env.example whatsappServer/.env
   # Edit whatsappServer/.env with your values
   ```

2. **Start WhatsApp Server:**
   ```bash
   cd whatsappServer
   npm install
   npm run dev
   ```

3. **Start MCP Server:**
   ```bash
   cd mcp_server
   npm install
   npm run dev
   ```

4. **Authenticate WhatsApp:**
   - Visit `http://localhost:3000/qr` to get QR code
   - Scan with WhatsApp mobile app

## 🛠️ Development

Each component can be developed independently:

- **MCP Server** focuses on MCP protocol implementation
- **WhatsApp Server** handles WhatsApp Web integration and API endpoints

## 📋 Environment Variables

### MCP Server
- `CHATTERBOX_SECRET` - Secret for API authentication
- `WHATSAPPSERVERURL` - URL of the WhatsApp server

### WhatsApp Server
- `CHATTERBOX_SECRET` - Secret for API authentication
- `PORT` - Server port (default: 3000)

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
