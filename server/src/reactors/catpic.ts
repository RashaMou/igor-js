import { ReactorType } from "../types/ReactorType.js";
import { ResponseType } from "../types/ResponseType.js";
import { EventType } from "../types/EventType.js";
import { sendRequest } from "../utils/httpClient.js";
import { getLogger } from "../logging.js";

const logger = getLogger("CatPicReactor");

interface CatResponse {
  url: string;
}

export default class CatPicReactor implements ReactorType {
  url: string;

  constructor() {
    this.url = "https://api.thecatapi.com/v1/images/search";
  }

  canHandle(event: EventType): boolean {
    return (
      event.eventType === "message" &&
      event.content.toLowerCase().startsWith("igor cat pic")
    );
  }

  async handle(event: EventType): Promise<ResponseType> {
    const res = await sendRequest<CatResponse[]>("get", this.url);
    if (res && res[0] && res[0].url) {
      logger.info(`Catpic res: ${res[0].url}`);
      return { content: res[0].url, channel: event.channel };
    } else {
      return {
        content: "Sorry, I couldn't fetch a cat picture at the moment.",
        channel: event.channel,
      };
    }
  }
}
