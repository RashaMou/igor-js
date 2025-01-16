export interface EventType {
  eventType: "message" | string;
  content: string;
  channel: string;
  extra?: { [key: string]: any };
}
