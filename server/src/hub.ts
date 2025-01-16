import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getLogger } from "./logging.js";
import {
  IgorConfig,
  ChannelConfig,
  ReactorConfig,
} from "./types/igorConfigType.js";
import { HubType } from "./types/HubType.js";
import { EventType } from "./types/EventType.js";
import { ResponseType } from "./types/ResponseType.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = getLogger("hub");

export class Hub implements HubType {
  config: IgorConfig | null;
  channels: Map<string, ChannelConfig>;
  reactors: Map<string, ReactorConfig>;
  isShuttingDown: boolean;
  configFile: string;
  activeChannels: Set<ChannelConfig> = new Set();
  shutdownResolver?: (value?: unknown) => void;

  constructor(configFile: string) {
    this.config = null;
    this.channels = new Map<string, ChannelConfig>();
    this.reactors = new Map<string, ChannelConfig>();
    this.isShuttingDown = false;
    this.configFile = configFile;
  }

  async initialize() {
    await this.loadConfig(this.configFile);
    await this.loadPlugins("channels");
    await this.loadPlugins("reactors");
  }

  async loadPlugins(pluginType: "channels" | "reactors"): Promise<void> {
    if (!this.config || !this.config[pluginType]) {
      logger.warn(`No ${pluginType} configuration found`);
      return;
    }

    const pluginMap = this[pluginType];

    for (const [pluginName, pluginConfig] of Object.entries(
      this.config[pluginType],
    )) {
      const pluginPath = path.join(__dirname, pluginType, `${pluginName}.js`);

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

  async loadConfig(configPath: string) {
    try {
      const configContent = await fs.readFile(configPath, "utf-8");
      this.config = JSON.parse(configContent);
      logger.info("Configuration loaded successfully");
    } catch (error: any) {
      logger.error(`Error loading config: ${error.message}`);
      throw error;
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
    const shutdownPromises: Promise<void>[] = [];

    for (const channel of this.activeChannels) {
      shutdownPromises.push(
        channel.stopListening().catch((error: any) => {
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

  async processEvent(event: EventType): Promise<void> {
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

  async sendChannelResponse(event: EventType, response: ResponseType) {
    const channel = this.channels.get(event.channel);
    if (channel) {
      await channel.sendResponse(event, response);
    } else {
      logger.warn(`Channel ${event.channel} not found`);
    }
  }
}
