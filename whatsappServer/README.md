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
Create the required secret files in the `secrets/` folder. Each secret should be placed in its own file as shown below:
```bash
# Create secrets directory if it doesn't exist
mkdir -p secrets

# Authentication secret (must match MCP server)
echo "your_secret_here" > secrets/CHATTERBOX_SECRET

# Server port
echo "3004" > secrets/PORT

# WhatsApp headless mode (true for production, false for development)
echo "true" > secrets/HEADLESS

# Admin phone number (for privileged actions)
echo "+1234567890" > secrets/ADMIN_PHONE_NUMBER

# Auto response check interval (in ms)
echo "60000" > secrets/AUTO_RESPONSE_CHECK_INTERVAL_MS

# Auto response numbers (comma-separated)
echo "+1234567890,+0987654321" > secrets/AUTO_RESPONSE_NUMBERS

# Chatterbox secret (for integration)
echo "your_secret_here" > secrets/CHATTERBOX_SECRET

# AZURE GPT API key (for AI integration)
echo "your_gpt_api_key" > secrets/GPT_API_KEY

# AZURE GPT deployment name
echo "your_gpt_deployment_name" > secrets/GPT_DEPLOYMENT_NAME

# AZURE GPT resource name
echo "your_gpt_resource_name" > secrets/GPT_RESOURCE_NAME

# YouTube API key
echo "0" > secrets/YOUTUBE_KEY

# YouTube API keys (comma-separated for rotation)
echo "[\n    {\n        \"name\": \"youtube\",\n        \"client_id\": \"YOURKEY.apps.googleusercontent.com\",\n        \"client_secret\": \"YOUR_SECRET\",\n        \"redirect_uris\": [\n \"http://localhost:5210/oauth2callback\"\n        ]\n    }\n]" > secrets/YOUTUBE_KEYS
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
The following files must exist in the `secrets/` directory:
- `CHATTERBOX_SECRET`: Authentication secret for API access (must match MCP server)
- `PORT`: Port number for the server (default: 3004)
- `HEADLESS`: Whether to run WhatsApp in headless mode (`true` or `false`)
- `ADMIN_PHONE_NUMBER`: Admin phone number for privileged actions
- `AUTO_RESPONSE_CHECK_INTERVAL_MS`: Interval (ms) for auto response checks
- `AUTO_RESPONSE_NUMBERS`: Comma-separated list of phone numbers for auto response
- `GPT_API_KEY`: Azure GPT API key for AI integration
- `GPT_DEPLOYMENT_NAME`: Azure GPT deployment name
- `GPT_RESOURCE_NAME`: Azure GPT resource name
- `YOUTUBE_KEY`: YouTube API key
- `YOUTUBE_KEYS`: YouTube API keys and OAuth config (JSON array)
- `token.json`: Token file for YouTube session

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
