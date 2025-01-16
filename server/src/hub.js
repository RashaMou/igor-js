import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getLogger } from "./logging.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = getLogger("hub");

export class Hub {
  constructor(configFile) {
    this.config = null;
    this.channels = new Map();
    this.reactors = new Map();
    this.shutdownPromise = null;
    this.tasks = [];
    this.configFile = configFile;
  }

  async initialize() {
    await this.loadConfig(this.configFile);
    await this.loadPlugins("channels");
    await this.loadPlugins("reactors");
  }

  async loadPlugins(pluginType) {
    if (!this.config || !this.config[pluginType]) {
      logger.warn(`No ${pluginType} configuration found`);
      return;
    }

    const pluginMap = this[pluginType];
    const baseDir = pluginType;

    for (const [pluginName, pluginConfig] of Object.entries(
      this.config[pluginType],
    )) {
      const pluginPath = path.join(__dirname, baseDir, `${pluginName}.js`);

      try {
        const module = await import(pluginPath);
        const PluginClass = module.default;

        if (typeof PluginClass !== "function") {
          throw new Error(`${pluginConfig.class} is not a constructor`);
        }

        const plugin = new PluginClass(this, pluginConfig);
        pluginMap.set(pluginName, plugin);
        logger.info(`Initialized ${pluginName} ${pluginType.slice(0, -1)}`); // remove 's' from end
      } catch (error) {
        logger.error(
          `Failed to initialize ${pluginName} ${pluginType.slice(0, -1)}: ${error}`,
        );
      }
    }
  }

  async loadConfig(configPath) {
    try {
      const configContent = await fs.readFile(configPath, "utf-8");
      this.config = JSON.parse(configContent);
      logger.info("Configuration loaded successfully");
    } catch (error) {
      logger.error(`Error loading config: ${error.message}`);
      throw error;
    }
  }

  async initializeChannels() {
    if (this.config && this.config.channels) {
      for (const [channelName, channelConfig] of Object.entries(
        this.config.channels,
      )) {
        const channelPath = path.join(
          __dirname,
          "channels",
          `${channelName}.js`,
        );

        try {
          const module = await import(channelPath);
          const ChannelClass = module.default;
          if (typeof ChannelClass !== "function") {
            throw new Error(`${channelConfig.class} is not a constructor`);
          }
          this.channels[channelName] = new ChannelClass(this, channelConfig);
          logger.info(`Initialized ${channelName} channel`);
        } catch (error) {
          logger.error(`Failed to initialize ${channelName} channel: ${error}`);
        }
      }
    } else {
      logger.warn("No channel configuration found");
    }
  }

  async initializeReactors() {
    if (this.config && this.config.reactors) {
      for (const [reactorName, reactorConfig] of Object.entries(
        this.config.reactors,
      )) {
        const reactorPath = path.join(
          __dirname,
          "reactors",
          `${reactorName}.js`,
        );

        try {
          const module = await import(reactorPath);
          const ReactorClass = module.default;
          if (typeof ReactorClass !== "function") {
            throw new Error(`${reactorConfig.class} is not a constructor`);
          }
          this.reactors.push(new ReactorClass(this, reactorConfig));
          logger.info(`Initialized ${reactorName} reactor`);
        } catch (error) {
          logger.error(`Failed to initialize ${reactorName} reactor: ${error}`);
        }
      }
    } else {
      logger.warn("No reactor configuration found");
    }
  }

  async start() {
    await this.initialize();

    for (const channel of this.channels.values()) {
      try {
        await channel.startListening();
        this.activeChannels.add(channel);
      } catch (error) {
        logger.error(`Failed to start channel: ${error}`);
      }
    }

    process.on("SIGINT", async () => {
      logger.info("Received SIGINT (Ctrl+C). Shutting down...");
      await this.signalShutdown();
      process.exit(0);
    });

    return new Promise((resolve) => {
      this.shutdownResolver = resolve;
    });
  }

  async signalShutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    logger.info("Shutting down channels...");
    const shutdownPromises = [];

    for (const channel of this.activeChannels) {
      shutdownPromises.push(
        channel.stopListening().catch((error) => {
          logger.error(`Error stopping channel ${channel.name}:`, error);
        }),
      );
    }

    await Promise.allSettled(shutdownPromises);
    this.activeChannels.clear();

    if (this.shutdownResolver) {
      this.shutdownResolver();
    }

    logger.info("Shutdown complete.");
  }

  async processEvent(event) {
    logger.info(`Processing event: ${JSON.stringify(event)}`);
    for (const reactor of this.reactors.values()) {
      if (reactor.canHandle(event)) {
        logger.info(`Reactor ${reactor.constructor.name} handling event`);
        const response = await reactor.handle(event);
        if (response) {
          await this.sendChannelResponse(event, response);
          return;
        }
      }
    }
    logger.warn(`No reactor found to handle event: ${JSON.stringify(event)}`);
  }

  async sendChannelResponse(event, response) {
    const channel = this.channels.get(event.channel);
    if (channel) {
      await channel.sendResponse(event, response);
    } else {
      logger.warn(`Channel ${channelName} not found`);
    }
  }
}
