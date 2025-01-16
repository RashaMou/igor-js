import readline from "readline";
import { EventType } from "../types/EventType.js";
import { getLogger } from "../logging.js";
import { HubType } from "../types/HubType.js";
import { ResponseType } from "../types/ResponseType.js";
import { ChannelType } from "../types/ChannelType.js";

const logger = getLogger("ConsoleChannel");

export default class ConsoleChannel implements ChannelType<string> {
  hub: HubType;
  rl: readline.Interface;

  constructor(hub: HubType) {
    this.hub = hub;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async startListening() {
    while (true) {
      try {
        const userInput = (await this.asyncInput("> ")) as string;
        if (userInput.toLowerCase().startsWith("igor")) {
          const event = this.channelEventToIgorEvent(userInput) as EventType;
          await this.hub.processEvent(event);
        } else if (userInput.toLowerCase() === "q") {
          console.log(`${this.constructor.name} is shutting down`);
          break;
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          break;
        }
        logger.debug(`An error occurred with the console listening: ${error}`);
      }
    }
  }

  asyncInput(prompt: string): Promise<string | void> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  channelEventToIgorEvent(msg: string): EventType {
    return { content: msg, channel: "console", eventType: "message" };
  }

  async sendResponse(event: EventType, response: ResponseType) {
    console.log(`Igor: ${response.content}`);
  }
}
