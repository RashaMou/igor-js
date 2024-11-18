import { Reactor } from "./baseReactor.js";
import { Response } from "../response.js";
import { sendRequest } from "../utils/httpClient.js";
import { getLogger } from "../logging.js";

const logger = getLogger("CatPicReactor");

export default class CatPicReactor extends Reactor {
  constructor(hub) {
    super(hub);
    this.url = "https://api.thecatapi.com/v1/images/search";
  }

  canHandle(event) {
    return (
      event.eventType === "message" &&
      event.content.toLowerCase().startsWith("igor cat pic")
    );
  }

  async handle(event) {
    const res = await sendRequest("get", this.url);
    if (res && res[0] && res[0].url) {
      logger.info(`Catpic res: ${res[0].url}`);
      return new Response(res[0].url, event.channel);
    } else {
      return new Response(
        "Sorry, I couldn't fetch a cat picture at the moment.",
        event.channel,
      );
    }
  }
}
