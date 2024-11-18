import fetch from "node-fetch";
import { getLogger } from "../logging.js";

const logger = getLogger("HttpClient");

/**
 * Send an HTTP request
 * @param {string} requestType - The HTTP method (GET or POST)
 * @param {string} url - The URL to send the request to
 * @param {Object} [args={}] - The query parameters (for GET) or body (for POST)
 * @param {Object} [optionalHeaders={}] - Additional headers to include in the request
 * @returns {Promise<Object|null>} The JSON response or null if the request failed
 */
export async function sendRequest(
  requestType,
  url,
  args = {},
  optionalHeaders = {},
) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...optionalHeaders,
  };

  let options = {
    method: requestType.toUpperCase(),
    headers: headers,
  };

  if (requestType.toLowerCase() === "get") {
    const params = new URLSearchParams(args);
    url = `${url}?${params}`;
  } else if (requestType.toLowerCase() === "post") {
    options.body = JSON.stringify(args);
  } else {
    throw new Error("Unsupported request type");
  }

  try {
    const response = await fetch(url, options);
    if (response.ok) {
      return await response.json();
    } else {
      const errorText = await response.text();
      logger.error(
        `Request failed with status ${response.status}. Error: ${errorText}`,
      );
      return null;
    }
  } catch (error) {
    logger.error(`Request failed: ${error}`);
    return null;
  }
}
