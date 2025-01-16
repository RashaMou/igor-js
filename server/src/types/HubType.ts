import { EventType } from "./EventType.js";
import { IgorConfig, ChannelConfig, ReactorConfig } from "./igorConfigType.js";

export interface HubType {
  config: IgorConfig | null;
  channels: Map<string, ChannelConfig>;
  reactors: Map<string, ReactorConfig>;
  isShuttingDown: boolean;
  configFile: string;
  shutdownResolver?: (value?: unknown) => void;
  processEvent: (event: EventType) => Promise<void>;
}
