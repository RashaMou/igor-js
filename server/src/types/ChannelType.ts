import { EventType } from "./EventType.js";
import { HubType } from "./HubType.js";
import { ResponseType } from "./ResponseType.js";

export interface ChannelType<T> {
  hub: HubType;
  startListening: () => Promise<void>;
  channelEventToIgorEvent: (msg: T) => EventType;
  sendResponse: (event: EventType, response: ResponseType) => Promise<void>;
}
