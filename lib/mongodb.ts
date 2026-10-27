/**
 * lib/mongodb.ts
 *
 * Reusable MongoDB connection module for Next.js App Router.
 *
 * – Reads MONGODB_URI from server-only env var (never NEXT_PUBLIC_).
 * – Caches the connection promise to avoid multiple connections during
 *   Next.js hot-reload in development.
 * – Never logs credentials or connection strings.
 */

import mongoose from "mongoose";

/**
 * Global cache to preserve the connection across hot-reloads in dev.
 * In production, the module-level cache suffices.
 */
interface MongoCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/* eslint-disable no-var */
declare global {
  var _mongoCache: MongoCache | undefined;
}
/* eslint-enable no-var */

const cached: MongoCache = global._mongoCache ?? { conn: null, promise: null };
if (!global._mongoCache) {
  global._mongoCache = cached;
}

/**
 * Returns a connected mongoose instance.
 * Safe to call from any API route handler — concurrent callers share
 * the same in-flight promise.
 */
export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI environment variable is not defined. " +
      "Add it to .env.local (see .env.example)."
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
      })
      .then((m) => {
        console.log("[mongodb] connected successfully");
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        // Log a sanitized message — never log the URI itself
        console.error("[mongodb] connection failed:", err.message);
        throw new Error("Database connection failed. Check MONGODB_URI.");
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
