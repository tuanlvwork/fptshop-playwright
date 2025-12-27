import * as lockfile from 'proper-lockfile';
import * as fs from 'fs';
import * as path from 'path';

export interface LockOptions {
    retries?: number;
    minTimeout?: number;
    maxTimeout?: number;
}

/**
 * File locking utility to prevent race conditions in auth session creation
 */
export class FileLock {
    /**
     * Acquire a lock on a file
     * @param filePath - Path to the file to lock
     * @param options - Lock options
     * @returns Release function to unlock
     */
    static async acquire(
        filePath: string,
        options: LockOptions = {}
    ): Promise<() => Promise<void>> {
        const lockPath = `${filePath}.lock`;

        // Ensure parent directory exists before locking
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const lockOptions = {
            retries: {
                retries: options.retries ?? 10,
                minTimeout: options.minTimeout ?? 100,
                maxTimeout: options.maxTimeout ?? 2000,
            },
            stale: 30000, // Consider lock stale after 30s (handles crashes)
            realpath: false, // Don't resolve lock path (prevents ENOENT on missing file)
        };

        const role = filePath.split('/').pop()?.replace('.json', '') || 'unknown';
        console.log(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] 🔒 Acquiring lock for ${filePath}...`);
        const startTime = Date.now();

        try {
            const release = await lockfile.lock(lockPath, lockOptions);
            const duration = Date.now() - startTime;

            if (duration > 50) {
                console.log(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] ✅ Lock acquired (waited ${duration}ms)`);
            } else {
                console.log(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] ✅ Lock acquired immediately`);
            }

            return async () => {
                await release();
                console.log(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] 🔓 Lock released`);
            };
        } catch (error) {
            console.error(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] ❌ Failed to acquire lock: ${error}`);
            throw error;
        }
    }

    /**
     * Check if a file is locked
     * @param filePath - Path to check
     * @returns true if locked
     */
    static async isLocked(filePath: string): Promise<boolean> {
        const lockPath = `${filePath}.lock`;
        try {
            return await lockfile.check(lockPath);
        } catch {
            return false;
        }
    }
}
