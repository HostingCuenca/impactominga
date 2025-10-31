import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import { createServer } from '../server/index';

// Lazy initialization - create server only when needed
let handler: any = null;

export default async function(req: VercelRequest, res: VercelResponse) {
  try {
    if (!handler) {
      const app = createServer();
      handler = serverless(app);
    }
    return await handler(req, res);
  } catch (error: any) {
    console.error('Function invocation error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
