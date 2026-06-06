module.exports = {
  server: {
    command: "node src/backend/server.js",
    port: 3000,
    launchTimeout: 15000,
    env: {
      PORT: "3000",
      // No REPLICATE_API_TOKEN needed — tests run against the text-only fallback path
    },
  },
  launch: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
};
