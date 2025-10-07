import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

interface EncryptionResult {
  ciphertext: string;
  iv: string;
  salt: string;
  iterations: number;
}

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';

  encrypt(data: string): string {
    try {      
      const iv = crypto.randomBytes(16);
      const salt = crypto.randomBytes(256);
      
      const key = crypto.pbkdf2Sync(process.env.ENC_KEY!, salt, 999, 32, 'sha512');
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');      

      const output: EncryptionResult = {
        ciphertext: encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        iterations: 999
      };
      
      return Buffer.from(JSON.stringify(output)).toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  decrypt(encryptedString: string): { data: string } {
    try {      
      const json: EncryptionResult = JSON.parse(
        Buffer.from(encryptedString, 'base64').toString('utf8')
      );      

      const iv = Buffer.from(json.iv, 'hex');
      const salt = Buffer.from(json.salt, 'hex');      
      const key = crypto.pbkdf2Sync(process.env.ENC_KEY!, salt, 999, 32, 'sha512');

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      
      let decrypted = decipher.update(json.ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return { data: decrypted };
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  encryptObject(obj: any): string {
    return this.encrypt('data=' + JSON.stringify(obj));
  }

  decryptToObject(encryptedString: string): any {
    const decrypted = this.decrypt(encryptedString);
    const dataString = decrypted.data.startsWith('data=') 
      ? decrypted.data.substring(5) 
      : decrypted.data;
    return JSON.parse(dataString);
  }
}