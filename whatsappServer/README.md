# WhatsApp Server

This is the WhatsApp API server component of the chatterbox MCP project. It provides REST API endpoints for WhatsApp functionality that can be consumed by the MCP server.

## Features

- Send WhatsApp messages
- Retrieve missed messages
- Look up contacts by name
- QR code generation for authentication
- Status monitoring

## API Endpoints

### Authentication
All API endpoints require the `x-secret` header with the correct secret value.

### Endpoints

#### Get Missed Messages
```
GET /missedMessages/:phoneNumber/:numberOfRecords
```
- `phoneNumber`: WhatsApp phone number (with or without @c.us)
- `numberOfRecords`: Number of messages to retrieve

#### Look Up Contact
```
GET /lookupContact/:contactName
```
- `contactName`: Name of the contact to search for

#### Send Message
```
POST /sendMessage/:phoneNumber
```
- `phoneNumber`: WhatsApp phone number to send to
- Body: `{ "message": "Your message here" }`

#### Get QR Code
```
GET /qr
```
Returns the QR code for WhatsApp authentication.

#### Get Status
```
GET /status
```
Returns the current status of the WhatsApp client.

#### Health Check
```
GET /health
```
Returns server health status.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up secrets:**
Create the required secret files in the `secrets/` folder:
```bash
# Create secrets directory if it doesn't exist
mkdir -p secrets

# Authentication secret (must match MCP server)
echo "your_secret_here" > secrets/CHATTERBOX_SECRET

# Server port
echo "3004" > secrets/PORT

# WhatsApp headless mode (true for production, false for development)
echo "true" > secrets/HEADLESS
```

3. **Run in development mode:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
npm start
```

## Docker

Build and run with Docker:
```bash
npm run docker:local
```

## Required Secrets

This server reads secrets from files in the `secrets/` folder instead of environment variables for better security.

### Secrets Files (`secrets/`)
- `CHATTERBOX_SECRET`: Authentication secret for API access (must match MCP server)
- `PORT`: Port number for the server (default: 3004)
- `HEADLESS`: Whether to run WhatsApp in headless mode (`true` or `false`)

**Note:** All secrets are read from individual files in the `secrets/` directory. The server will automatically load these at startup.

## Architecture

```
whatsappServer/
├── src/
│   ├── server.ts              # Main server file
│   ├── controllers/           # API route handlers
│   │   └── whatsappController.ts
│   ├── services/              # Business logic and WhatsApp client
│   │   └── whatsappService.ts
│   └── middleware/            # Authentication and other middleware
│       └── auth.ts
├── secrets/                   # Secret files (not in git)
│   ├── CHATTERBOX_SECRET      # Authentication secret
│   ├── PORT                   # Server port
│   └── HEADLESS               # WhatsApp headless mode
├── public/                    # Static files
│   └── index.html
├── package.json               # Project metadata and scripts
├── tsconfig.json              # TypeScript configuration
└── Dockerfile                 # Docker configuration
```
