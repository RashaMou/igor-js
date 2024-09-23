import { Reactor } from "./baseReactor.js";
import { Response } from "../response.js";

export default class FortuneReactor extends Reactor {
  constructor(hub) {
    super(hub);
    this.fortunes = [
      "I didn't come this far to only come this far",
      "Anything that you do, any accomplishment that you make, you have to work for",
    ];
  }

  canHandle(event) {
    console.log("checking fortune reactor");
    return (
      event.eventType === "message" &&
      event.content.toLowerCase().startsWith("igor fortune")
    );
  }

  async handle(event) {
    const fortune =
      this.fortunes[Math.floor(Math.random() * this.fortunes.length)];
    return new Response(fortune, event.channel);
  }
}
