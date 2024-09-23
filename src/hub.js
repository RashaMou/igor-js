import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import TOML from "@iarna/toml";
import { getLogger } from "./logging.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = getLogger("hub");

export class Hub {
  constructor(configFile) {
    this.config = null;
    this.channels = {};
    this.reactors = [];
    this.shutdownPromise = null;
    this.tasks = [];
    this.configFile = configFile;
  }

  async initialize() {
    await this.loadConfig(this.configFile);
    await this.initializeChannels();
    await this.initializeReactors();
  }

  async loadConfig(configPath) {
    try {
      const configContent = await fs.readFile(configPath, "utf-8");
      this.config = TOML.parse(configContent);
      logger.info("Configuration loaded successfully");
    } catch (error) {
      logger.error(`Error loading config: ${error}`);
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
          const ChannelClass = module.default; // assuming the default export is the class
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
          const ReactorClass = module.default; // assuming the default export is the class
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

    const listeningPromises = Object.values(this.channels).map((channel) =>
      channel.startListening(),
    );
    this.tasks.push(...listeningPromises);

    this.shutdownPromise = new Promise((resolve) => {
      process.on("SIGINT", () => {
        this.signalShutdown();
        resolve();
      });
    });

    await Promise.race([this.shutdownPromise, ...this.tasks]);
  }

  signalShutdown() {
    logger.info("Shutting down...");
    for (const task of this.tasks) {
      if (typeof task.cancel === "function") {
        task.cancel();
      }
    }
  }

  async processEvent(event) {
    logger.info(`Processing event: ${JSON.stringify(event)}`);
    for (const reactor of this.reactors) {
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
    const channelName = event.channel;
    if (this.channels[channelName]) {
      await this.channels[channelName].sendResponse(event, response);
    } else {
      logger.warn(`Channel ${channelName} not found`);
    }
  }
}
