# BullMQ Notification Sender App

A standalone microservice that processes email and text message notifications using BullMQ with Redis, providing reliable delivery with retry mechanisms.

## Features

- **BullMQ Integration**: Modern Redis-based queue system with advanced features
- **Retry Logic**: Implements exponential backoff retry strategy for failed notifications
- **Concurrent Processing**: Processes multiple messages concurrently for better performance
- **Graceful Shutdown**: Handles SIGINT and SIGTERM signals for clean shutdowns
- **Comprehensive Logging**: Detailed logging for monitoring and debugging
- **Error Handling**: Robust error handling with automatic retry mechanisms
- **Crash Recovery**: Worker can restart automatically on crashes

## Architecture

The app consists of:

1. **BullMQ Worker**: Redis-based workers for processing notifications
2. **Message Processors**: Handles notification processing with retry logic
3. **Service Integration**: Uses existing Hacado services for actual notification sending
4. **Queue Management**: Handles job retry, failure, and completion
5. **Crash Recovery**: Automatic restart capabilities with exponential backoff

## Configuration

### Environment Variables

| Variable                          | Description                               | Default                      |
| --------------------------------- | ----------------------------------------- | ---------------------------- |
| `MONGODB_URI`                     | MongoDB connection string                 | Required                     |
| `REDIS_HOST`                      | Redis server host                         | `localhost`                  |
| `REDIS_PORT`                      | Redis server port                         | `6379`                       |
| `REDIS_PASSWORD`                  | Redis password (optional)                 | -                            |
| `REDIS_DB`                        | Redis database number                     | `0`                          |
| `BULLMQ_EMAIL_QUEUE_NAME`         | Email queue name                          | `email-notifications`        |
| `BULLMQ_TEXT_MESSAGE_QUEUE_NAME`  | Text message queue name                   | `text-message-notifications` |
| `BULLMQ_EMAIL_CONCURRENCY`        | Number of concurrent email workers        | `5`                          |
| `BULLMQ_TEXT_MESSAGE_CONCURRENCY` | Number of concurrent text message workers | `5`                          |
| `BULLMQ_MAX_RETRIES`              | Max retries for failed jobs               | `3`                          |
| `BULLMQ_BACKOFF_TYPE`             | Backoff type (exponential/fixed)          | `exponential`                |
| `BULLMQ_BACKOFF_DELAY`            | Initial backoff delay (ms)                | `2000`                       |
| `BULLMQ_REMOVE_ON_COMPLETE`       | Keep last N completed jobs                | `100`                        |
| `BULLMQ_REMOVE_ON_FAIL`           | Keep last N failed jobs                   | `50`                         |
| `BULLMQ_RUN_MODE`                 | Run mode (crash/restart)                  | `crash`                      |
| `BULLMQ_MAX_RESTARTS`             | Max restarts (restart mode only)          | `10`                         |
| `BULLMQ_RESTART_DELAY`            | Initial restart delay (ms)                | `5000`                       |
| `LOG_LEVEL`                       | Logging level                             | `info`                       |

### Environment File Setup

A complete environment configuration example is provided in `env.bullmq.example`. This file includes:

- **Core Configuration**: MongoDB and Redis connection settings
- **Queue Settings**: Queue names and worker concurrency
- **Retry Configuration**: Retry attempts, backoff strategy, and delays
- **Job Cleanup**: How many completed/failed jobs to keep
- **Run Modes**: Crash vs restart behavior
- **Advanced Options**: Additional Redis and BullMQ settings
- **Development vs Production**: Recommended settings for different environments

To get started:

```bash
# Copy the example environment file
cp env.bullmq.example .env

# Edit the .env file with your specific configuration
# At minimum, update:
# - MONGODB_URI
# - REDIS_HOST (if not localhost)
# - REDIS_PASSWORD (if required)
```

## Usage

### Development

```bash
# Install dependencies (from project root)
yarn install

# Copy environment file
cp env.bullmq.example .env

# Update .env with BullMQ configuration
# REDIS_HOST=localhost
# REDIS_PORT=6379
# MONGODB_URI=mongodb://localhost:27017/hacado

# Start Redis (if using Docker Compose)
docker-compose up redis -d

# Test Redis connection
yarn test-connection

# Start in development mode
yarn dev

# Or use Turborepo from project root
yarn turbo dev --filter=@hacado/notification-sender
```

### Production

```bash
# Build the application
yarn build

# Or use Turborepo from project root
yarn turbo build --filter=@hacado/notification-sender

# Start the application
yarn start
```

### Docker

```bash
# Start with Docker Compose (includes Redis)
docker-compose up -d

# Or build and run manually
docker build -t hacado-notification-sender .
docker run -d \
  --name notification-sender \
  --env-file .env \
  hacado-notification-sender
```

## Run Modes

### Crash Mode (Default)

The worker runs until it encounters a fatal error. Recommended for production with process managers like PM2.

```bash
# Set environment variable
export BULLMQ_RUN_MODE=crash

# Start the worker
yarn start
```

### Restart Mode

Automatically restarts the worker if it crashes, with exponential backoff. Perfect for development.

```bash
# Set environment variables
export BULLMQ_RUN_MODE=restart
export BULLMQ_MAX_RESTARTS=10
export BULLMQ_RESTART_DELAY=5000

# Start the worker
yarn start
```

## Retry Strategy

Failed jobs are retried with exponential backoff:

- **Attempt 1**: Immediate retry
- **Attempt 2**: 2 second delay
- **Attempt 3**: 4 second delay
- **Attempt 4**: 8 second delay
- And so on...

After max attempts are reached, the job is moved to the failed queue.

## Monitoring

The app provides comprehensive logging for:

- Worker startup and shutdown
- Job processing status
- Retry attempts and delays
- Error conditions and stack traces
- Queue health status
- Redis connection status

## Deployment

### With PM2 (Recommended for Production)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'bullmq-notification-sender',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      MONGODB_URI: 'mongodb://localhost:27017/hacado',
      BULLMQ_RUN_MODE: 'crash',
    },
    restart_delay: 5000,
    max_restarts: 10,
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### With Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```

### With systemd

```ini
[Unit]
Description=BullMQ Notification Sender
After=network.target redis.service

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/notification-sender
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=REDIS_HOST=localhost
Environment=REDIS_PORT=6379
Environment=MONGODB_URI=mongodb://localhost:27017/hacado
Environment=BULLMQ_RUN_MODE=crash

[Install]
WantedBy=multi-user.target
```

## Integration with Main App

To integrate this with your main Hacado application:

1. **Environment Setup**: Add Redis environment variables to your main app
2. **Service Integration**: Use `BullMQNotificationService` instead of the regular notification service
3. **Deployment**: Deploy this notification sender app alongside your main application
4. **Monitoring**: Set up monitoring for Redis and the worker process

## Example Integration

Instead of calling the notification service directly:

```typescript
// Before
await ServicesContainer.NotificationService().sendEmail(emailData);

// After - use BullMQ-based notification service
import { BullMQNotificationService, getBullMQConfig } from "@hacado/services";

const notificationService = new BullMQNotificationService(getBullMQConfig());
await notificationService.start();

await notificationService.sendEmail(emailData);
```

## Turborepo Commands

The notification sender app is fully integrated with Turborepo. You can run commands from the project root:

```bash
# Development
yarn turbo dev --filter=@hacado/notification-sender

# Build
yarn turbo build --filter=@hacado/notification-sender

# Test BullMQ
yarn turbo test-bullmq --filter=@hacado/notification-sender

# Lint
yarn turbo lint --filter=@hacado/notification-sender

# Type checking
yarn turbo check-types --filter=@hacado/notification-sender

# Run all tasks for this app
yarn turbo run build,lint,check-types --filter=@hacado/notification-sender
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**

   - Check Redis is running: `redis-cli ping`
   - Verify REDIS_HOST and REDIS_PORT environment variables
   - Check Redis authentication if using password

2. **MongoDB Connection Failed**

   - Verify MONGODB_URI is correct
   - Check MongoDB is running and accessible
   - Ensure proper authentication if required

3. **Worker Not Processing Jobs**

   - Check Redis connection logs
   - Verify queue names match between producer and consumer
   - Check worker concurrency settings

4. **High Memory Usage**
   - Reduce BULLMQ_REMOVE_ON_COMPLETE and BULLMQ_REMOVE_ON_FAIL
   - Lower concurrency settings
   - Monitor Redis memory usage

### Logs

The app provides detailed logs for debugging:

- Worker lifecycle events
- Job processing details
- Error conditions
- Performance metrics
- Queue statistics

This approach provides better reliability, scalability, and fault tolerance for your notification system compared to direct service calls.
