import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as path from 'path';
import * as fs from 'fs';
import { authMiddleware } from './middleware/auth';
import { whatsappController } from './controllers/whatsappController';
import { MessageData, MissedMessages, WhatsAppService } from './services/whatsappService';
import { HealthService } from './services/healthService';
import { TimerService } from './services/timerService';
import { GPTService } from './services/gptService';
import { youtubeController } from './controllers/youtubeController';
import { google } from 'googleapis';
import logger from './services/logger';

// Function to read environment variables from files in the secrets folder
function loadEnvFromFiles() {
  const secretsPath = path.resolve(__dirname, '../secrets');
  const files = fs.readdirSync(secretsPath);

  files.forEach(file => {
    const filePath = path.join(secretsPath, file);
    const envVarName = path.basename(file, path.extname(file)).toUpperCase();
    const envVarValue = fs.readFileSync(filePath, 'utf-8').trim();
    logger.log('info', `Setting ${envVarName} from file ${filePath}`);
    process.env[envVarName] = envVarValue;
  });
}

// Load environment variables from secrets folder
loadEnvFromFiles();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize WhatsApp service singleton
const whatsappService = WhatsAppService.getInstance();

// Initialize Health service singleton
const healthService = HealthService.getInstance();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Auth middleware for API routes
app.use('/missedMessages', authMiddleware);
app.use('/lookupContact', authMiddleware);
app.use('/sendMessage', authMiddleware);
app.use('/getAllContacts', authMiddleware);
app.use('/getAllChats', authMiddleware);

// Debug endpoint for testing debugger
app.get('/debug', (req, res) => {
  const debugInfo = {
    message: 'Debug endpoint reached!',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    port: PORT,
    whatsappServiceStatus: whatsappService.getStatus(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };

  // Set a breakpoint here to test debugging
  logger.log('info', `Debug endpoint called with info: ${JSON.stringify(debugInfo)}`);

  res.json(debugInfo);
});

// Health check endpoint for MCP service discovery
app.get('/api/health', async (req, res) => {
  try {
    const health = await healthService.checkHealth();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed'
    });
  }
});

// Detailed health check endpoint
app.get('/api/health/detailed', async (req, res) => {
  try {
    const detailedHealth = await healthService.getDetailedHealth(whatsappService);
    res.status(detailedHealth.status === 'healthy' ? 200 : 503).json(detailedHealth);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Detailed health check failed'
    });
  }
});

// Serve the welcome page at root
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// WhatsApp API routes
app.get('/api/whatsapp/missedMessages/:phoneNumber/:numberOfRecords', whatsappController.getMessages);
app.get('/api/whatsapp/lookupContact/:contactName', whatsappController.lookupContact);
app.post('/api/whatsapp/sendMessage/:phoneNumber', whatsappController.sendMessage);
app.get('/api/whatsapp/qr', whatsappController.getQRCode);
app.get('/api/whatsapp/status', whatsappController.getStatus);
app.get('/api/whatsapp/getAllContacts', whatsappController.getAllContacts);
app.get('/api/whatsapp/getAllChats', whatsappController.getAllChats);
app.get('/api/youtube/playlist', youtubeController.getPlaylists);
app.post('/api/youtube/playlist', youtubeController.createPlaylist);
app.post('/api/youtube/playlist/:playlistId/add-song', youtubeController.addSong);
app.post('/api/youtube/playlist/:playlistId/delete-song', youtubeController.deleteSong);
app.get('/api/youtube/playlist/:playlistId/songs', youtubeController.getPlaylistSongs);

// Check if QR code image exists
app.get('/api/qr-exists', (req, res) => {
  const publicDir = process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), 'public')  // Use project root public folder in production
    : path.join(__dirname, '../public');  // Use relative path in development
  const qrFilePath = path.join(publicDir, 'qr-code.png');
  const exists = fs.existsSync(qrFilePath);
  res.json({ exists, path: exists ? '/qr-code.png' : null });
});


app.get('/oauth2howzit', (req: any, res) => {
  res.status(200).json({ Message: "Token generated" });
  res.end;
})

app.get('/oauth2generate', (req: any, res) => {
  logger.log('info', `OAuth2 generate query: ${JSON.stringify(req.query)}`);
   var keys: any[] = JSON.parse(process.env.YOUTUBE_KEYS!);
  const KEY:number = parseInt(process.env.YOUTUBE_KEY!);
  const URLKEY = 1;

  const oauth2Client = new google.auth.OAuth2(
    keys[KEY].client_id,
    keys[KEY].client_secret,
    keys[KEY].redirect_uris[URLKEY]
  );
  logger.log('info', `OAuth2 keys: ${JSON.stringify(keys)}`);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Needed for long-lived tokens (refresh token)
    scope: [
      'https://www.googleapis.com/auth/youtube',  // Full YouTube access
    ],
  });
  logger.log('info', `OAuth2 authUrl: ${authUrl}`);
  res.writeHead(302, { 'Location': `${authUrl}` });
  res.end();
})

app.get('/oauth2callback', async (req: any, res) => {
  var keys: any[] = JSON.parse(process.env.YOUTUBE_KEYS!);
  const KEY:number = parseInt(process.env.YOUTUBE_KEY!);
  const URLKEY = 1;

  const oauth2Client = new google.auth.OAuth2(
    keys[KEY].client_id,
    keys[KEY].client_secret,
    keys[KEY].redirect_uris[URLKEY]
  );

  var { tokens } = await oauth2Client.getToken(req.query.code)
  // store the token in secrets/token.json file

  oauth2Client.setCredentials(tokens);
  fs.writeFileSync('./secrets/token.json', JSON.stringify(tokens));
  res.writeHead(302, { 'Location': `${`oauth2howzit`}` });
  res.end();
});


// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  logger.log('info',`WhatsApp server running on port http://localhost:${PORT}`);
  logger.log('info',`YOUTUBE AUTH running at http://localhost:${PORT}/oauth2generate`);
  // Initialize WhatsApp client
  var res = await whatsappService.initialize();
  if (res) {
    logger.log('info',`WhatsApp client initialized successfully`);
    // Start health check timer
    const autoResponseCheckInterval = parseInt(process.env.AUTO_RESPONSE_CHECK_INTERVAL_MS || '60000', 10);
    const autoResponseCallBack = new TimerService(autoResponseCheckInterval, async () => {
      try {
        // get a whatsappService instance
        const whatsappService = WhatsAppService.getInstance();
        const autoResponseNumbers = process.env.AUTO_RESPONSE_NUMBERS ? process.env.AUTO_RESPONSE_NUMBERS.split(',') : [];
        if (autoResponseNumbers.length > 0) {
          logger.log('info', `Auto response numbers configured: ${autoResponseNumbers.join(', ')}`);
          // for each auto response number check the whatsapp messages
          for (const number of autoResponseNumbers) {
            const autoResponseNumberResult: MissedMessages = await whatsappService.getMessages(number, 10);
            if (autoResponseNumberResult.messages.length > 10 && process.env.ADMIN_PHONE_NUMBER && process.env.ADMIN_PHONE_NUMBER.trim() !== '' && number.trim() !== process.env.ADMIN_PHONE_NUMBER.trim()) {
              await whatsappService.sendMessage(process.env.ADMIN_PHONE_NUMBER, `New messages for ${number}: ${autoResponseNumberResult}`);
            }
            if (autoResponseNumberResult.messages.length > 0 && autoResponseNumberResult.hasNewMessages) {
              var question: MessageData = autoResponseNumberResult.messages.pop()!;
              question = question.from.startsWith(number) !== true ? {} as MessageData : question;

              logger.log('info',`Last message from ${number}:`, autoResponseNumberResult.messages[autoResponseNumberResult.messages.length - 1]);
              const gptService = GPTService.getInstance();
              var history = await gptService.getHistory(number);
              if (history.length === 0) {
                await Promise.all(autoResponseNumberResult.messages.map(async (message: MessageData) => {
                  // check the number
                  var prompt = "";
                  var response = "";
                  if (message.from.startsWith(number) == true) {
                    prompt = message.body;
                  }
                  else {
                    response = message.body;
                  }

                  await gptService.saveHistory(number, prompt, response);
                }));
              }
              var res = await gptService.chat(question.body, number);
              whatsappService.sendMessage(number, `${res}`);
            }
            if (autoResponseNumberResult.hasNewMessages) {
              logger.log('info',`Missed messages for ${number}:`, autoResponseNumberResult);
              logger.log('info',`---------------------------------------------------------------`);
            }
          }
        }
        else {
          autoResponseCallBack.stop();
          logger.log('info',`No auto response numbers configured, stopping health check service`);
        }
      } catch (error) {
        logger.log('error',`WhatsApp Health Check Error:`, error);
      }
    });
    autoResponseCallBack.start();
  } else {
    logger.log('error',`Failed to initialize WhatsApp client`);
  }
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logger.log('info',`\nShutting down gracefully...`);
  await whatsappService.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.log('info',`\nShutting down gracefully...`);
  await whatsappService.cleanup();
  process.exit(0);
});

export default app;
