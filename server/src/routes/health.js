const mongoose = require("mongoose");

function healthRoutes(_req, res) {
  const connected = mongoose.connection.readyState === 1;
  res.json({
    ok: true,
    mongo: {
      connected,
      readyState: mongoose.connection.readyState,
      db: mongoose.connection?.db?.databaseName || null
    }
  });
}

module.exports = healthRoutes;

