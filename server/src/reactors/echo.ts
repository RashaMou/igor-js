import { ResponseType } from "../types/ResponseType.js";
import { EventType } from "../types/EventType.js";
import { ReactorType } from "../types/ReactorType.js";

export default class EchoReactor implements ReactorType {
  canHandle(event: EventType): boolean {
    return (
      event.eventType === "message" &&
      event.content.toLowerCase().startsWith("igor echo")
    );
  }

  async handle(event: EventType): Promise<ResponseType> {
    let message = event.content.toLowerCase().split("igor echo")[1].trim();
    if (message === "") {
      message = "You didn't say anything";
    }
    return { content: message, channel: event.channel };
  }
}
