import 'dotenv/config';
import { createServer, IncomingMessage } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { Server } from 'socket.io';
import { prisma } from './src/lib/prisma';
import { rateLimitAsync } from './src/lib/rate-limit';
import sanitizeHtml from 'sanitize-html';
import { getSocketJwtSecret, verifySocketToken } from './src/lib/socket-auth';
import { logger } from './src/lib/logger';
import { encryptHighRiskContent } from './src/lib/high-risk-content-crypto';

export interface TokenPayload {
    userId: string;
    email: string;
    exp?: number;
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Setup Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();


function getSocketCorsOrigin(): string {
    const origin = process.env.SOCKET_CORS_ORIGIN;
    if (origin) {
        return origin;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('SOCKET_CORS_ORIGIN must be set for the custom socket server in production');
    }

    return 'http://localhost:3000';
}

const JWT_SECRET = getSocketJwtSecret();

const MESSAGE_MAX_LENGTH = 2000;
const DIRECT_MESSAGE_ENCRYPTION_CONTEXT = 'changemappers:direct-message:v1';

const ALLOWED_MESSAGE_TAGS: string[] = [];

function sanitizeMessageContent(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: ALLOWED_MESSAGE_TAGS,
    allowedAttributes: {},
    disallowedTagsMode: 'escape',
  });
}

function parseCookies(request: IncomingMessage) {
    const list: Record<string, string> = {};
    const rc = request.headers.cookie;
    if (rc) {
        rc.split(';').forEach((cookie: string) => {
            const parts = cookie.split('=');
            list[parts.shift()!.trim()] = decodeURI(parts.join('='));
        });
    }
    return list;
}

await app.prepare();
{
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
    } catch (err) {
      logger.error({ msg: 'Socket server request handler error', url: req.url, err: err instanceof Error ? err.message : String(err) });
      res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new Server(server, {
        path: '/api/socket/io',
        addTrailingSlash: false,
        cors: {
            origin: getSocketCorsOrigin(),
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.use((socket, next) => {
        // Try auth header first
        let token = socket.handshake.auth.token;

        // Try cookie if no auth header
        if (!token) {
            const cookies = parseCookies(socket.request);
            token = cookies['accessToken'];
        }

        if (!token) {
            // Allow unauthenticated connection (guest access for public events etc.)
            return next();
        }

        try {
            const payload = verifySocketToken(token, JWT_SECRET);
            if (typeof payload === 'string' || typeof payload.userId !== 'string') {
                return next(new Error('Unauthorized'));
            }
            socket.data.user = payload;
            socket.data.authExpiresAt = typeof payload.exp === 'number'
                ? payload.exp * 1000
                : Date.now() + 15 * 60 * 1000;
            next();
        } catch {
            // A presented but invalid/revoked token must be rejected outright.
            // Silent downgrade to guest would let forged tokens bypass auth checks.
            return next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        if (socket.data.user?.userId) {
            socket.join(socket.data.user.userId);
        }

        if (socket.data.authExpiresAt) {
            const disconnectInMs = Math.max(0, socket.data.authExpiresAt - Date.now());
            const expiryTimer = setTimeout(() => socket.disconnect(true), disconnectInMs);
            expiryTimer.unref?.();
            socket.on('disconnect', () => {
                clearTimeout(expiryTimer);
            });
        }

        socket.on('join-room', (roomId: string) => {
            if (!socket.data.user?.userId) {
                socket.emit('error', { message: 'Authentication required to join rooms' });
                return;
            }
            // Room membership is not authorized yet. Reject instead of letting any
            // authenticated user subscribe to arbitrary room traffic.
            if (typeof roomId !== 'string' || roomId.trim().length === 0) {
                socket.emit('error', { message: 'Invalid room' });
                return;
            }

            socket.emit('error', { message: 'Room subscriptions are disabled until authorization is implemented' });
        });

        socket.on('send-message', async (data) => {
            // data: { receiverId, content }
            const { receiverId, content } = data;
            const senderId = socket.data.user?.userId;

	if (!senderId) return;

	if (senderId === receiverId) {
		socket.emit('message-error', { error: 'Cannot send a message to yourself' });
		return;
	}

	const rl = await rateLimitAsync(`msg_${senderId}`, 30, 60_000);
	if (!rl.success) {
		socket.emit('message-error', { error: 'Too many messages — please slow down.' });
		return;
	}

	// Validate content
            if (typeof content !== 'string' || content.trim().length === 0) {
                socket.emit('message-error', { error: 'Message content is required' });
                return;
            }
            if (content.length > MESSAGE_MAX_LENGTH) {
                socket.emit('message-error', { error: `Message exceeds maximum length of ${MESSAGE_MAX_LENGTH} characters` });
                return;
            }
            if (typeof receiverId !== 'string' || receiverId.trim().length === 0) {
                socket.emit('message-error', { error: 'Invalid recipient' });
                return;
            }

try {
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true },
      });
      if (!receiver) {
        socket.emit('message-error', { error: 'Recipient not found' });
        return;
      }

      // Reject if either party has blocked the other.
      const block = await prisma.connection.findFirst({
    where: {
      status: 'BLOCKED',
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
    select: { id: true },
  });
  if (block) {
    socket.emit('message-error', { error: 'Cannot send message to this user' });
    return;
  }

  const sanitizedContent = sanitizeMessageContent(content.trim());
  const encryptedContent = encryptHighRiskContent(sanitizedContent, DIRECT_MESSAGE_ENCRYPTION_CONTEXT);
  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      content: encryptedContent,
    }
  });

                // Emit to receiver
                const emittedMessage = { ...message, content: sanitizedContent };
                io.to(receiverId).emit('receive-message', {
                    ...emittedMessage,
                    timestamp: message.createdAt // Ensure timestamp is date object or ISO string in client
                });

                // Also emit back to sender (for other tabs/optimistic UI confirmation)
                io.to(senderId).emit('message-sent', emittedMessage);
      } catch (error) {
        logger.error({ msg: 'Socket message save error', err: error instanceof Error ? error.message : String(error) });
        socket.emit('message-error', { error: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
        });
    });

    server.listen(port, () => {
        logger.info({ msg: 'Socket server ready', url: `http://${hostname}:${port}` });
    });
}
