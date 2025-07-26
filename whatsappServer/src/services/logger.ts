import { createLogger, format, transports } from 'winston';
import * as appInsights from 'applicationinsights';
import { KnownSeverityLevel } from 'applicationinsights';

// Initialize Application Insights
const appInsightsConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || undefined;
if (appInsightsConnectionString && appInsights) {
    appInsights.setup(appInsightsConnectionString).start();
}
const appInsightsClient = appInsights.defaultClient;

// Custom Winston transport for Application Insights
class AppInsightsTransport extends transports.Console {
    log(info: any, callback: () => void) {
        setImmediate(() => this.emit('logged', info));
        // Send log to Application Insights
        if (appInsightsClient) {
            appInsightsClient.trackTrace({
                message: info.message,
                severity: this.mapLogLevelToSeverity(info.level),
            });
        }

        callback();
    }

    // Map Winston log levels to Application Insights severity levels
    private mapLogLevelToSeverity(level: string) {
        switch (level.toLocaleLowerCase()) {
            case 'error':
                return KnownSeverityLevel.Error;
            case 'warn':
                return KnownSeverityLevel.Warning;
            case 'info':
                return KnownSeverityLevel.Information;
            case 'debug':
                return KnownSeverityLevel.Verbose;
            default:
                return KnownSeverityLevel.Information;
        }
    }
}

// Create the logger 
const loggerTransports = [
    new transports.Console(), // Log to the console
    new transports.File({ filename: process.env.LOG_FILE || ".logs/apps.log" }), // Log to a file
];

// Conditionally add AppInsightsTransport if appInsightsKey is available
if (appInsightsClient) {
    loggerTransports.push(new AppInsightsTransport());
}


const logger = createLogger({ 
    level: process.env.LOG_LEVEL?.toLocaleLowerCase() || 'info', // Default log level
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: loggerTransports,
});

// Export the logger instance
export default logger;