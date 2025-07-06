# WhatsApp Server Debug Guide

## JavaScript Debug Environment Setup

This guide will help you set up and use the JavaScript debug environment for the WhatsApp server.

## Prerequisites

- Node.js (v16 or higher)
- Visual Studio Code
- The project dependencies installed (`npm install`)

## Debug Configurations

We've set up three debug configurations in VS Code:

### 1. Debug WhatsApp Server (Recommended)
- **Best for**: Direct TypeScript debugging
- **How to use**: Press `F5` or use the Debug panel in VS Code
- **Features**: 
  - Directly runs TypeScript files with ts-node
  - Full debugging support with breakpoints
  - Environment variables loaded from `.env`
  - Automatic restart on file changes

### 2. Debug WhatsApp Server (with ts-node)
- **Best for**: Alternative TypeScript debugging method
- **How to use**: Select this configuration in the Debug panel
- **Features**: 
  - Uses ts-node binary directly
  - Good for complex TypeScript configurations

### 3. Debug WhatsApp Server (Compiled)
- **Best for**: Production-like debugging
- **How to use**: Select this configuration in the Debug panel
- **Features**: 
  - Debugs compiled JavaScript
  - Automatically builds before debugging
  - Closer to production environment

## Quick Start

1. **Open VS Code** in the `whatsappServer` directory
2. **Set breakpoints** in your TypeScript files
3. **Press F5** to start debugging
4. **Open your browser** to `http://localhost:3001` to see the dashboard
5. **Test the API** endpoints or use the MCP tools

## Debug Features

### Breakpoints
- Set breakpoints by clicking in the gutter next to line numbers
- Conditional breakpoints: Right-click on a breakpoint for conditions
- Logpoints: Add console.log statements without changing code

### Variables & Watch
- View local variables, closure variables, and global variables
- Add expressions to the Watch panel
- Inspect object properties and arrays

### Call Stack
- Navigate through the call stack
- See the execution path that led to the current breakpoint

### Debug Console
- Execute JavaScript/TypeScript expressions in the current context
- Test function calls and variable values

## Environment Variables

The debug configurations automatically load environment variables from `.env`:

```env
PORT=3001
NODE_ENV=development
WHATSAPP_SESSION_PATH=./.wwebjs_auth
SECRET_KEY=your-secret-key-here
```

## Common Debug Scenarios

### 1. QR Code Generation
- Set breakpoints in `whatsappService.ts` in the `initialize()` method
- Watch the `qr` event handler
- Check QR code file creation in `public/qr-code.png`

### 2. Message Sending
- Set breakpoints in `whatsappController.ts` in the `sendMessage` method
- Watch the WhatsApp client's `sendMessage` call
- Debug message formatting and validation

### 3. Authentication Flow
- Set breakpoints in the `ready` event handler
- Watch session management and client state changes

### 4. API Endpoints
- Set breakpoints in controller methods
- Test with tools like Postman or curl
- Debug request/response handling

## Running Without Debugging

If you want to run the server without debugging:

```bash
# Development mode with auto-restart
npm run dev

# Debug mode with inspector (for external debuggers)
npm run debug

# Production build and run
npm run build
npm run start
```

## Troubleshooting

### Port Already in Use
If port 3001 is already in use, change it in the `.env` file:
```env
PORT=3002
```

### TypeScript Errors
- Check the Problems panel in VS Code
- Ensure all dependencies are installed: `npm install`
- Rebuild if necessary: `npm run build`

### WhatsApp Connection Issues
- Delete `.wwebjs_auth` folder to reset authentication
- Check that WhatsApp Web is accessible from your network
- Verify your phone has internet connection for QR code scanning

### Debug Configuration Issues
- Ensure the workspace is opened in the `whatsappServer` directory
- Check that `.vscode/launch.json` exists and is valid
- Restart VS Code if configurations don't appear

## Advanced Debugging

### Remote Debugging
For debugging on a remote server:

1. Run with inspector:
   ```bash
   npm run debug
   ```

2. Connect VS Code to the remote debugger:
   - Use "Attach to Node Process" configuration
   - Set the host and port (default: localhost:9229)

### Docker Debugging
For debugging in Docker:

1. Build the debug image:
   ```bash
   docker build -t whatsapp-server-debug --target debug .
   ```

2. Run with port forwarding:
   ```bash
   docker run -p 3001:3001 -p 9229:9229 whatsapp-server-debug
   ```

3. Attach VS Code debugger to localhost:9229

## Performance Debugging

### Memory Usage
- Use the Memory tab in Chrome DevTools
- Monitor heap snapshots for memory leaks
- Check for unclosed connections or event listeners

### CPU Profiling
- Use the Performance tab in Chrome DevTools
- Profile WhatsApp message processing
- Identify bottlenecks in QR code generation

## Tips for Effective Debugging

1. **Use meaningful breakpoints**: Set breakpoints at decision points and error handling
2. **Watch key variables**: Monitor client state, message queues, and authentication status
3. **Test edge cases**: Try invalid inputs, network failures, and authentication errors
4. **Use the debug console**: Execute code snippets to test hypotheses
5. **Check logs**: Console output often provides valuable context

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify your environment variables are set correctly
3. Ensure WhatsApp Web.js dependencies are compatible
4. Review the WhatsApp Web.js documentation for client-specific issues

Happy debugging! 🐛🔍
