import { EventType } from "../types/EventType.js";
import { ReactorType } from "../types/ReactorType.js";
import { ResponseType } from "../types/ResponseType.js";

export default class FortuneReactor implements ReactorType {
  fortunes: string[];

  constructor() {
    this.fortunes = [
      "I didn't come this far to only come this far",
      "Anything that you do, any accomplishment that you make, you have to work for",
    ];
  }

  canHandle(event: EventType): boolean {
    console.log("checking fortune reactor");
    return (
      event.eventType === "message" &&
      event.content.toLowerCase().startsWith("igor fortune")
    );
  }

  async handle(event: EventType): Promise<ResponseType> {
    const fortune =
      this.fortunes[Math.floor(Math.random() * this.fortunes.length)];
    return { content: fortune, channel: event.channel } as ResponseType;
  }
}
