declare module 'redis' {
  import { RedisClientType, RedisClientOptions } from '@redis/client';
  
  export {
    RedisClientType,
    RedisClientOptions,
    createClient
  };
  
  export function createClient(options?: RedisClientOptions): RedisClientType;
} 