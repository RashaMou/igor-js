export class Response {
  constructor(content, channel) {
    this.content = content;
    this.channel = channel;
  }

  // Optional: Add a method to get a string representation of the response
  toString() {
    return `Response(content=${this.content}, channel=${this.channel})`;
  }
}
