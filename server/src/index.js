const { createApp } = require("./app");
const { connectDb } = require("./config/db");
const { env } = require("./config/env");

async function main() {
  const app = createApp();

  try {
    await connectDb();
  } catch (err) {
    // Keep server running for easier debugging; health route will expose DB status.
    // eslint-disable-next-line no-console
    console.error("MongoDB connection failed. Server will start without DB:", err?.message || err);
  }
    app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});
  const port = env.port;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${port}`);
  });
}

main();

