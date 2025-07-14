import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as path from 'path';
import * as fs from 'fs';
import { authMiddleware } from './middleware/auth';
import { whatsappController } from './controllers/whatsappController';
import { WhatsAppService } from './services/whatsappService';
import { HealthService } from './services/healthService';

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
  console.log('Debug endpoint called with info:', debugInfo);
  
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
app.get('/api/whatsapp/missedMessages/:phoneNumber/:numberOfRecords/:summary', whatsappController.getMissedMessages);
app.get('/api/whatsapp/lookupContact/:contactName', whatsappController.lookupContact);
app.post('/api/whatsapp/sendMessage/:phoneNumber', whatsappController.sendMessage);
app.get('/api/whatsapp/qr', whatsappController.getQRCode);
app.get('/api/whatsapp/status', whatsappController.getStatus);
app.get('/api/whatsapp/getAllContacts', whatsappController.getAllContacts);
app.get('/api/whatsapp/getAllChats', whatsappController.getAllChats);

// Check if QR code image exists
app.get('/api/qr-exists', (req, res) => {
  const publicDir = process.env.NODE_ENV === 'production' 
    ? path.join(process.cwd(), 'public')  // Use project root public folder in production
    : path.join(__dirname, '../public');  // Use relative path in development
  const qrFilePath = path.join(publicDir, 'qr-code.png');
  const exists = fs.existsSync(qrFilePath);
  res.json({ exists, path: exists ? '/qr-code.png' : null });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`WhatsApp server running on port http://localhost:${PORT}`);
  // Initialize WhatsApp client
  whatsappService.initialize().catch(console.error);
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await whatsappService.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await whatsappService.cleanup();
  process.exit(0);
});

export default app;
