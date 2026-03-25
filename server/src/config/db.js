const mongoose = require("mongoose");
const { env } = require("./env");

async function connectDb() {
  mongoose.set("strictQuery", true);
  // eslint-disable-next-line no-console
  console.log("Connecting to MongoDB...");
  await mongoose.connect(env.mongodbUri, {
    autoIndex: true
  });
  // eslint-disable-next-line no-console
  console.log(
    "MongoDB connected:",
    `readyState=${mongoose.connection.readyState}`,
    `db=${mongoose.connection?.db?.databaseName || "unknown"}`
  );
}

module.exports = { connectDb };

