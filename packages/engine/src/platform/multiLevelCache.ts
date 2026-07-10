import { IMultiLevelCache } from '../interfaces/index.js';
import { createHash } from 'crypto';

export class MultiLevelCache implements IMultiLevelCache {
  private readonly staticCache = new Map<string, string>();
  private readonly conversationCache = new Map<string, string>();
  private readonly providerCache = new Map<string, string>();

  private getHash(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  public lookupStatic(prompt: string): string | undefined {
    return this.staticCache.get(this.getHash(prompt));
  }

  public saveStatic(prompt: string, val: string): void {
    this.staticCache.set(this.getHash(prompt), val);
  }

  public lookupConversation(prompt: string): string | undefined {
    return this.conversationCache.get(this.getHash(prompt));
  }

  public saveConversation(prompt: string, val: string): void {
    this.conversationCache.set(this.getHash(prompt), val);
  }

  public lookupProvider(prompt: string): string | undefined {
    return this.providerCache.get(this.getHash(prompt));
  }

  public saveProvider(prompt: string, val: string): void {
    this.providerCache.set(this.getHash(prompt), val);
  }

  public clearAll(): void {
    this.staticCache.clear();
    this.conversationCache.clear();
    this.providerCache.clear();
  }
}
