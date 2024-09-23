import { Reactor } from "./baseReactor.js";
import { Response } from "../response.js";

export default class EchoReactor extends Reactor {
  constructor(hub) {
    super(hub);
  }

  canHandle(event) {
    return (
      event.eventType === "message" &&
      event.content.toLowerCase().startsWith("igor echo")
    );
  }

  async handle(event) {
    let message = event.content.toLowerCase().split("igor echo")[1].trim();
    if (message === "") {
      message = "You didn't say anything";
    }
    return new Response(message, event.channel);
  }
}
