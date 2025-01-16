import TelegramBot, { Message } from "node-telegram-bot-api";
import dotenv from "dotenv";
import { ChannelType } from "../types/ChannelType.js";
import { getLogger } from "../logging.js";
import { HubType } from "../types/HubType.js";
import { EventType } from "../types/EventType.js";
import { ResponseType } from "../types/ResponseType.js";

dotenv.config();

const logger = getLogger("TelegramChannel");

export default class Telegram implements ChannelType<Message> {
  bot: TelegramBot;
  hub: HubType;

  constructor(hub: HubType) {
    this.hub = hub;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      const error = "TELEGRAM_BOT_TOKEN environment variable not set";
      logger.error(error);
      throw new Error(error);
    }

    this.bot = new TelegramBot(token, { polling: true });
  }

  async startListening() {
    // Setup handlers
    this.bot.onText(/\/start/, this.handleStart.bind(this));
    this.bot.on("message", this.handleMessage.bind(this));

    logger.info("Telegram bot started polling");
  }

  async stopListening() {
    this.bot.stopPolling();
    logger.info("Telegram bot stopped polling");
  }

  handleStart(msg: Message) {
    const chatId = msg.chat.id;
    this.bot.sendMessage(chatId, "I'm a bot, please talk to me!");
  }

  async handleMessage(msg: Message) {
    if (msg.text && msg.text.toLowerCase().startsWith("igor")) {
      const event = this.channelEventToIgorEvent(msg);
      await this.hub.processEvent(event);
    }
  }

  channelEventToIgorEvent(msg: Message): EventType {
    const updateType = this.getUpdateType(msg);

    let content = "";
    if (updateType === "message" && msg.text) {
      content = msg.text || "";
    } else if (updateType === "command" && msg.text) {
      content = msg.text.split(" ").slice(1).join(" ");
    }

    return {
      eventType: updateType || "unknown",
      content: content,
      channel: "telegram",
      extra: {
        chatId: msg.chat.id,
      },
    };
  }

  getUpdateType(msg: Message) {
    if (msg.text) {
      if (msg.text.startsWith("/")) {
        return "command";
      } else {
        return "message";
      }
    } else if (msg.photo) {
      return "photo";
    } else if (msg.voice) {
      return "voice";
    } else {
      return "other_message";
    }
  }

  async sendResponse(event: EventType, response: ResponseType) {
    if (event.extra) {
      await this.bot.sendMessage(event.extra.chatId, response.content);
    }
  }
}
