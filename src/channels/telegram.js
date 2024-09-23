import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { Channel } from "./baseChannel.js";
import { Event } from "../event.js";
import { getLogger } from "../logging.js";

dotenv.config();

const logger = getLogger("TelegramChannel");

export default class Telegram extends Channel {
  constructor(hub) {
    super(hub);

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

  handleStart(msg) {
    const chatId = msg.chat.id;
    this.bot.sendMessage(chatId, "I'm a bot, please talk to me!");
  }

  async handleMessage(msg) {
    if (msg.text && msg.text.toLowerCase().startsWith("igor")) {
      const event = this.channelEventToIgorEvent(msg);
      await this.hub.processEvent(event);
    }
  }

  channelEventToIgorEvent(msg) {
    const updateType = this.getUpdateType(msg);

    let content = "";
    if (updateType === "message") {
      content = msg.text || "";
    } else if (updateType === "command") {
      content = msg.text.split(" ").slice(1).join(" ");
    }

    return new Event(updateType || "unknown", content, "telegram", {
      chatId: msg.chat.id,
    });
  }

  getUpdateType(msg) {
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

  async sendResponse(event, response) {
    await this.bot.sendMessage(event.extra.chatId, response.content);
  }
}
