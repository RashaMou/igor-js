import fetch from "node-fetch";
import { getLogger } from "../logging.js";

const logger = getLogger("HttpClient");

export async function sendRequest<T>(
  requestType: string,
  url: string,
  args: Record<string, string> = {},
  optionalHeaders: Record<string, any> = {},
): Promise<T | null> {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...optionalHeaders,
  };

  let options: {
    method: string;
    headers: Record<string, string>;
    body?: string;
  } = {
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
      return (await response.json()) as T;
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
