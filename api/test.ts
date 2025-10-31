import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    message: 'API test funcionando!',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    env: {
      hasDBHost: !!process.env.DB_HOST,
      hasJWTSecret: !!process.env.JWT_SECRET,
    }
  });
}
