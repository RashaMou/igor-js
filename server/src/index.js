import path from "path";
import { fileURLToPath } from "url";
import { Hub } from "./hub.js";
import { setupLogging, getLogger } from "./logging.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  setupLogging();
  const logger = getLogger("main");
  logger.info("Igor starting up");

  const configPath = path.join(__dirname, "config.toml");

  const hub = new Hub(configPath);

  try {
    logger.info("Initializing Hub");
    await hub.start();
  } catch (error) {
    logger.error(`Error starting the hub: ${error}`, { error });
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
