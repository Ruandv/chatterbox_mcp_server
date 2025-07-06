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
GET /missedMessages/:phoneNumber/:numberOfRecords/:summary
```
- `phoneNumber`: WhatsApp phone number (with or without @c.us)
- `numberOfRecords`: Number of messages to retrieve
- `summary`: Boolean flag for summary format (true/false)

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

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create .env file
CHATTERBOX_SECRET=your_secret_here
PORT=3000
```

3. Run in development mode:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## Docker

Build and run with Docker:
```bash
npm run docker:local
```

## Environment Variables

- `CHATTERBOX_SECRET`: Secret key for API authentication
- `PORT`: Port number for the server (default: 3000)

## Architecture

- `src/server.ts`: Main server file
- `src/controllers/`: API route handlers
- `src/services/`: Business logic and WhatsApp client
- `src/middleware/`: Authentication and other middleware
