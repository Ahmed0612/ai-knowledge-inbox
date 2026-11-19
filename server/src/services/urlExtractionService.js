
const axios = require("axios");
const cheerio = require("cheerio");
const dns = require("node:dns").promises;
const ipaddr = require("ipaddr.js");

const MAX_CONTENT_LENGTH = 2 * 1024 * 1024; // 2 MB

const isPublicIP = (address) => {
  try {
    const parsedIP = ipaddr.process(address);

    // Only globally routable unicast addresses are accepted.
    return parsedIP.range() === "unicast";
  } catch {
    return false;
  }
};

const validateAndResolveURL = async (input) => {
  let parsedURL;

  try {
    parsedURL = new URL(input);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(parsedURL.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  if (parsedURL.username || parsedURL.password) {
    throw new Error("URLs containing credentials are not allowed");
  }

  if (!["80", "443", ""].includes(parsedURL.port)) {
    throw new Error("Only standard HTTP and HTTPS ports are allowed");
  }

  const hostname = parsedURL.hostname;

  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    throw new Error("Local network URLs are not allowed");
  }

  let addresses;

  try {
    addresses = await dns.lookup(hostname, {
      all: true,
      verbatim: true
    });
  } catch {
    throw new Error("Unable to resolve the URL hostname");
  }

  if (
    !addresses.length ||
    addresses.some(({ address }) => !isPublicIP(address))
  ) {
    throw new Error("Private or restricted IP addresses are not allowed");
  }

  // Pin the HTTP request to a validated DNS result.
  const validatedAddress = addresses[0];

  const lookup = (hostname, options, callback) => {
    if (options?.all) {
      return callback(null, [validatedAddress]);
    }

    callback(
      null,
      validatedAddress.address,
      validatedAddress.family
    );
  };

  return {
    parsedURL,
    lookup
  };
};

const extractWebpageContent = async (inputURL) => {
  const { parsedURL, lookup } =
    await validateAndResolveURL(inputURL);

  let response;

  try {
    response = await axios.get(parsedURL.href, {
      timeout: 15000,
      maxRedirects: 0,
      maxContentLength: MAX_CONTENT_LENGTH,
      responseType: "text",
      proxy: false,
      lookup,
      headers: {
        "User-Agent": "TuriumAI-Assessment/1.0",
        Accept: "text/html,application/xhtml+xml"
      }
    });
  } catch (error) {
    if (error.response?.status >= 300 &&
        error.response.status < 400) {
      throw new Error(
        "Redirected URLs are not supported. Submit the final URL directly."
      );
    }

    throw new Error(
      error.code === "ECONNABORTED"
        ? "Website request timed out"
        : "Unable to fetch webpage content"
    );
  }

  const contentType = response.headers["content-type"] || "";

  if (
    !contentType.includes("text/html") &&
    !contentType.includes("application/xhtml+xml")
  ) {
    throw new Error("URL must point to an HTML webpage");
  }

  const $ = cheerio.load(response.data);

  // Remove unwanted webpage elements.
  $(
    "script, style, noscript, iframe, svg, nav, footer, header, " +
    "aside, form, button, input"
  ).remove();

  const title = $("title").first().text().trim() || "Untitled";

  // Prefer article or main content when available.
  const mainContent = $("article, main").first();

  const content = (
    mainContent.length
      ? mainContent.text()
      : $("body").text()
  )
    .replace(/\s+/g, " ")
    .trim();

  if (!content || content.length < 50) {
    throw new Error("Unable to extract meaningful webpage content");
  }

  return {
    title,
    content,
    sourceUrl: parsedURL.href
  };
};

module.exports = extractWebpageContent;
