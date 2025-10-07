import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { EncryptionService } from './encryption.service';

@Injectable()
export class EncryptionMiddleware implements NestMiddleware {
  constructor(private readonly encryptionService: EncryptionService) {}

  use(req: Request, res: Response, next: NextFunction) {    
    const shouldEncrypt = process.env.ENCRYPTION_ENABLED === 'true';

    if (!shouldEncrypt) {
      return next();
    }

    // DESENCRIPTAR REQUEST
    if (this.shouldProcessRequest(req)) {      
      try {
        const decrypted = this.encryptionService.decryptToObject(req.body.encData);
        req.body = decrypted;
      } catch (error) {
        throw new Error('Invalid encrypted data');
      }
    }

    // ENCRIPTAR RESPONSE
    this.encryptResponse(res);
    next();
  }

  private shouldProcessRequest(req: Request): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
           req.body &&
           req.body.encData;
  }

  private encryptResponse(res: Response): void {
    const originalJson = res.json;
    const originalSend = res.send;

res.json = (data: any) => {
      if (this.shouldEncryptResponse(res)) {
        try {
          const encrypted = this.encryptionService.encryptObject(data);
          return originalJson.call(res, { encData: encrypted });
        } catch (error) {
          console.error('Response encryption error:', error);
        }
      }
      return originalJson.call(res, data);
    };

    res.send = (data: any) => {
      if (typeof data === 'object' && this.shouldEncryptResponse(res)) {
        try {
          const encrypted = this.encryptionService.encryptObject(data);
          return originalSend.call(res, { encData: encrypted });
        } catch (error) {
          console.error('Send encryption error:', error);
        }
      }
      return originalSend.call(res, data);
    };
  }

  private shouldEncryptResponse(res: Response): boolean {
    return res.statusCode >= 200 && res.statusCode < 300;
  }
}
