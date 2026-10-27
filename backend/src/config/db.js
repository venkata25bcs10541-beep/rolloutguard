const mongoose = require('mongoose');
const dns = require('dns');

// On Windows, Node.js DNS resolver can fail with querySrv EBADRESP on local network DNS.
// Setting public reliable DNS resolvers prevents this for mongodb+srv connections.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // fallback to system default
}

let mongodInstance = null;

let dbStatus = {
  isConnected: false,
  isInMemory: false,
  uri: '',
  dbName: '',
  error: null
};

/**
 * Connect to MongoDB or start MongoMemoryServer fallback
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    dbStatus.isConnected = true;
    return mongoose.connection;
  }

  const requestedUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rolloutguard';
  const allowInMemory = process.env.USE_IN_MEMORY_DB !== 'false';

  // 1. If not strictly in test and requested URI is provided, attempt connection
  if (process.env.NODE_ENV !== 'test') {
    try {
      console.log(`[Database] Attempting connection to MongoDB at: ${requestedUri}`);
      const conn = await mongoose.connect(requestedUri, {
        serverSelectionTimeoutMS: 2500
      });
      dbStatus.isConnected = true;
      dbStatus.isInMemory = false;
      dbStatus.uri = requestedUri;
      dbStatus.dbName = conn.connection.name;
      dbStatus.error = null;
      console.log(`[Database] Successfully connected to MongoDB (${conn.connection.name})`);
      return conn;
    } catch (err) {
      console.warn(`[Database] Connection to ${requestedUri} failed: ${err.message}`);
      if (!allowInMemory) {
        dbStatus.isConnected = false;
        dbStatus.error = `Could not connect to MongoDB at ${requestedUri}: ${err.message}`;
        throw err;
      }
      console.log('[Database] Falling back to embedded MongoMemoryServer for development/demo...');
    }
  }

  // 2. Fallback to MongoMemoryServer (development fallback or automated testing)
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const uri = mongodInstance.getUri();

    const conn = await mongoose.connect(uri);
    dbStatus.isConnected = true;
    dbStatus.isInMemory = true;
    dbStatus.uri = uri;
    dbStatus.dbName = conn.connection.name;
    dbStatus.error = null;
    console.log(`[Database] Connected to in-memory MongoDB instance at: ${uri}`);
    return conn;
  } catch (memErr) {
    dbStatus.isConnected = false;
    dbStatus.error = `Failed to start MongoMemoryServer: ${memErr.message}`;
    console.error(`[Database Error] ${dbStatus.error}`);
    throw memErr;
  }
}

/**
 * Close database connection and stop memory server if running
 */
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
  dbStatus.isConnected = false;
}

function getDBStatus() {
  return { ...dbStatus };
}

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus
};
