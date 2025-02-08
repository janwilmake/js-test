/**
 * @typedef {object} Person
 * @property {string} name
 * @property {string} text
 */
/**
 * @typedef {object} Question
 * @property {Person} askedBy
 * @property {string} text
 */

/**
 * @param {string} url
 * @returns {string}
 */
const prependProtocol = (url) =>
  url.startsWith("http://") || url.startsWith("https://")
    ? url
    : "https://" + url;

/**
 * @param {string} url
 * @returns {string}
 */
const withoutProtocol = (url) =>
  url.startsWith("http://")
    ? url.slice("http://".length)
    : url.startsWith("https://")
    ? url.slice("https://".length)
    : url;

/**
 * Creates a pathname from components
 * @param {{
 *   contextUrl: string,
 *   modelName?: string,
 *   message?: string,
 *   page?: string,
 *   ext?: string
 * }} components - The components to create the pathname from
 * @returns {string} The formatted pathname
 */
const createPathname = ({ contextUrl, modelName, message, page, ext }) => {
  const parts = [];

  const rawUrl = withoutProtocol(contextUrl);
  parts.push(encodeURIComponent(rawUrl).replaceAll("%2F", "/"));

  if (message) {
    parts.push(`message/${encodeURIComponent(message)}`);
  }

  if (modelName) {
    parts.push(`model/${modelName}`);
  }

  if (page) {
    if (ext && page.endsWith(`.${ext}`)) {
      parts.push(page);
    } else if (ext) {
      parts.push(`${page}.${ext}`);
    } else {
      parts.push(page);
    }
  }
  console.log({ parts });
  return "/" + parts.join("/");
};

/**
 * Parses a pathname into its components
 * @param {string} pathname - The pathname to parse
 * @returns {{
 *   contextUrl?: string,
 *   rawContextUrl?: string,
 *   isContextUrlDesired?: boolean,
 *   desiredContextUrlFormatted?: string,
 *   modelName?: string,
 *   message?: string,
 *   page?: string,
 *   name?: string,
 *   ext?: string
 * }}
 */
const parsePathname = (pathname) => {
  if (pathname === "/") return {};

  let path = pathname.slice(1);
  const segments = path.split("/");

  // Find special segments
  const messageIdx = segments.lastIndexOf("message");
  const modelIdx = segments.lastIndexOf("model");

  // Initialize variables
  let contextPath = path;
  let message, modelName, page;

  // Handle message segment
  if (messageIdx !== -1 && messageIdx < segments.length - 1) {
    message = decodeURIComponent(segments[messageIdx + 1]);

    // Check if message segment is valid (should be followed by model or end)
    const nextSegmentIndex = messageIdx + 2;
    if (
      nextSegmentIndex < segments.length &&
      segments[nextSegmentIndex] !== "model"
    ) {
      // Invalid message format - treat everything as context URL
      return {
        contextUrl: prependProtocol(decodeURIComponent(path)),
        rawContextUrl: path,
        isContextUrlDesired: false,
        desiredContextUrlFormatted: encodeURIComponent(
          withoutProtocol(decodeURIComponent(path)),
        ).replaceAll("%2F", "/"),
      };
    }

    contextPath = segments.slice(0, messageIdx).join("/");
  }

  // Handle model segment
  if (modelIdx !== -1 && (messageIdx === -1 || modelIdx > messageIdx + 1)) {
    const modelSegments = segments.slice(modelIdx + 1);

    // Check if the last segment might be a page
    const hasMessage = messageIdx !== -1;
    const isPageNested = modelSegments.includes("codeblock");

    if (hasMessage && isPageNested) {
      // codeblock page
      const chunks = modelSegments.join("/").split("/codeblock/");
      modelName = chunks[0];
      page = "codeblock/" + chunks[1];
    } else if (hasMessage) {
      const lastSegment = modelSegments[modelSegments.length - 1];

      modelName = modelSegments.slice(0, -1).join("/");
      page = lastSegment;
    } else {
      modelName = modelSegments.join("/");
    }

    if (!message) {
      contextPath = segments.slice(0, modelIdx).join("/");
    }
  }

  const rawContextUrl = contextPath;
  const contextUrl = prependProtocol(decodeURIComponent(rawContextUrl));
  const desiredContextUrlFormatted = encodeURIComponent(
    withoutProtocol(decodeURIComponent(rawContextUrl)),
  ).replaceAll("%2F", "/");
  const isContextUrlDesired = rawContextUrl === desiredContextUrlFormatted;

  let name, ext;
  if (page) {
    const dotIndex = page.lastIndexOf(".");
    if (dotIndex !== -1) {
      name = page.slice(0, dotIndex);
      ext = page.slice(dotIndex + 1);
    } else {
      name = page;
    }
  }

  return {
    contextUrl,
    rawContextUrl,
    isContextUrlDesired,
    desiredContextUrlFormatted,
    ...(message && { message }),
    ...(modelName && { modelName }),
    ...(page && { page }),
    ...(name && { name }),
    ...(ext && { ext }),
  };
};

if (typeof exports !== "undefined") {
  exports.parsePathname = parsePathname;
  exports.prependProtocol = prependProtocol;
  exports.withoutProtocol = withoutProtocol;
  exports.createPathname = createPathname;
}
