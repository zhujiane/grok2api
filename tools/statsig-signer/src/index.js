import { loadConfig } from "./config.js";
import { log } from "./log.js";
import { createServer } from "./server.js";
import { createSession } from "./session.js";
import { createStore } from "./store.js";

const config = loadConfig();
const store = createStore(config.dataDir);
const session = createSession(config, store);
const server = createServer(config, store, session);

server.listen(config.port, config.host, () => {
  log.info("statsig_signer_listen", { host: config.host, port: config.port });
  session.enqueueRefresh("startup");
  setInterval(() => session.enqueueRefresh("interval"), config.refreshIntervalMs).unref();
});

async function shutdown(signal) {
  log.info("statsig_signer_shutdown", { signal });
  server.close();
  await session.close();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
