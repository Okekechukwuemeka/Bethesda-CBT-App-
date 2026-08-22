import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable");
}

// Next.js reloads modules in dev, which would otherwise open a fresh
// connection on every request/hot-reload. Cache it on the global object so
// it survives across those reloads.
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string, {
        bufferCommands: false,
        // Defaults are 30s for both, which is what made a dropped connection
        // (e.g. ECONNRESET / no reachable replica) hang for 30+ seconds
        // before a request could even fail and let client-side retry logic
        // kick in. 8s is still generous for a real network blip, but keeps
        // a genuinely broken connection from stalling every request this long.
        serverSelectionTimeoutMS: 8_000,
        socketTimeoutMS: 20_000,
      })
      .catch((err) => {
        // If the very first connect attempt fails, don't leave a rejected
        // promise cached forever - every request after this one would
        // otherwise immediately replay the same failure with no chance to
        // ever reconnect, even once Atlas/network is back.
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
