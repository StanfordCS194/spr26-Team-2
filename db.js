// MongoDB connection (Mongoose). Connects once on server startup using the
// MONGODB_URI from .env. Models added later (reviews, accounts, room designs)
// will register against this single connection.

const mongoose = require("mongoose");

// Connect to MongoDB Atlas. Resolves when the connection is open; rejects if
// the URI is missing or the initial handshake fails (so startup fails loudly).
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI not set in .env");
  }

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });
  mongoose.connection.on("error", (err) => {
    console.error("[mongo error]", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000, // fail fast if the cluster is unreachable
  });

  return mongoose.connection;
}

// 1 = connected, 0 = disconnected, 2 = connecting, 3 = disconnecting
function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isConnected, mongoose };
