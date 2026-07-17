import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateUser } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    if (token.startsWith('mock-')) {
      const uid = token;
      const cleanId = token.replace('mock-phone-', '');
      const email = cleanId.includes('@') ? cleanId : `${cleanId}@phone-simplify.app`;
      const dbUser = await getOrCreateUser(uid, email);
      
      req.user = {
        uid,
        email,
        phone_number: cleanId,
        email_verified: true,
      } as any;
      req.dbUser = dbUser;
      return next();
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    
    // Sync user with PostgreSQL
    const email = decodedToken.email || 'unknown@example.com';
    const dbUser = await getOrCreateUser(decodedToken.uid, email);
    req.dbUser = dbUser;
    
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
