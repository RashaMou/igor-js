import { EventType } from "./EventType.js";
import { ResponseType } from "./ResponseType.js";

export interface ReactorType {
  canHandle: (event: EventType) => boolean;
  handle: (event: EventType) => Promise<ResponseType>;
}
