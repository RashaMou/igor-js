import { getLogger } from "../logging.js";

const logger = getLogger("BaseChannel");

export class Channel {
  /**
   * Abstract base class for all channels in Igor.
   *
   * A channel represents a specific communication platform (e.g., Telegram, Discord, Console).
   * It's responsible for receiving input from the platform, converting it to Igor events,
   * and sending responses back to the platform.
   */

  constructor(hub) {
    if (new.target === Channel) {
      throw new TypeError("Cannot construct Channel instances directly");
    }
    this.hub = hub;
  }

  async startListening() {
    /**
     * Start listening for incoming messages or events from the platform.
     *
     * This method should implement the necessary logic to connect to the platform
     * and set up any required event listeners or polling mechanisms.
     *
     * This method is called by the hub when Igor starts up.
     */
    throw new Error("startListening() must be implemented by subclass");
  }

  async stopListening() {
    /**
     * Stop listening for incoming messages or events from the platform.
     *
     * This method should implement the necessary logic to disconnect from the platform
     * and clean up any resources.
     *
     * This method is called by the hub when Igor is shutting down.
     */
    throw new Error("stopListening() must be implemented by subclass");
  }

  channelEventToIgorEvent(event) {
    /**
     * Convert a channel-specific event to an Igor Event.
     *
     * This method should be implemented to convert the channel's native message format
     * into an Igor Event that can be processed by reactors.
     *
     * @param {*} event - The channel-specific event to convert.
     * @returns {Event} The Igor Event created from the message.
     */
    throw new Error(
      "channelEventToIgorEvent() must be implemented by subclass",
    );
  }

  async sendResponse(event, response) {
    /**
     * Send a response back to the platform.
     *
     * This method should implement the necessary logic to send the response
     * back to the user through the specific platform this channel represents.
     *
     * @param {Event} event - The original event that triggered this response.
     * @param {Response} response - The response to be sent back to the user.
     */
    throw new Error("sendResponse() must be implemented by subclass");
  }
}
