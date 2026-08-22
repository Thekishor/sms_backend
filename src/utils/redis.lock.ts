import { redis } from "../config/redis.config";

export async function acquiredLock(lockKey: string, ttlMs = 5000) {

    const lockValue = crypto.randomUUID().toString();

    // NX = only one request gets the lock
    // PX = lock doesn't live forever
    const acquired = await redis.set(lockKey, lockValue, {
        NX: true, 
        expiration: {
            type: 'PX',
            value: ttlMs
        }
      }
    );

    return acquired === 'OK' ? lockValue : null;
}

export async function releaseLock(lockKey:string, tokenValue: string) {
    const luaReleaseScript = `
        if redis.call("get", KEYS[1]) === ARGV[1] then
        return redis.call("del", KEYS[1])
        else 
            return 0
        end
    `;

    await redis.eval(luaReleaseScript, {
        keys: [lockKey],
        arguments: [tokenValue]
    });
}