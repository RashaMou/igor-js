import readline from "readline";
import { Channel } from "./baseChannel.js";
import { Event } from "../event.js";
import { getLogger } from "../logging.js";

const logger = getLogger("ConsoleChannel");

export default class ConsoleChannel extends Channel {
  constructor(hub) {
    super(hub);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async startListening() {
    while (true) {
      try {
        const userInput = await this.asyncInput("> ");
        if (userInput.toLowerCase().startsWith("igor")) {
          const event = this.channelEventToIgorEvent(userInput);
          await this.hub.processEvent(event);
        } else if (userInput.toLowerCase() === "q") {
          await this.stopListening();
          console.log(`${this.constructor.name} is shutting down`);
          break;
        }
      } catch (error) {
        if (error.name === "AbortError") {
          break;
        }
        logger.debug(`An error occurred with the console listening: ${error}`);
      }
    }
  }

  asyncInput(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  channelEventToIgorEvent(event) {
    return new Event("message", event, "console");
  }

  async sendResponse(event, response) {
    console.log(`Igor: ${response}`);
  }

  async stopListening() {
    this.rl.close();
    this.hub.signalShutdown();
  }
}
