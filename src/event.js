export class Event {
  constructor(eventType, content, channel, extra = {}) {
    this.eventType = eventType;
    this.content = content;
    this.channel = channel;
    this.extra = extra;
  }

  addExtra(key, value) {
    this.extra[key] = value;
  }

  toString() {
    return `Event(type=${this.eventType}, content=${this.content}, channel=${this.channel}, extra=${JSON.stringify(this.extra)})`;
  }
}
