// Helper function to get domain from URL
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return "";
  }
}

// Helper function to truncate text
function truncate(str, n) {
  return str.length > n ? str.slice(0, n - 1) + "..." : str;
}

// Helper function to get path without domain
function getPathWithoutDomain(url) {
  try {
    const urlObj = new URL(prependProtocol(url));
    return urlObj.pathname.slice(1) + urlObj.search + urlObj.hash;
  } catch (e) {
    return url;
  }
}

// Delete context item
function deleteContext(url) {
  const contexts = JSON.parse(localStorage.getItem("context") || "[]");
  const newContexts = contexts.filter((ctx) => ctx.url !== url);
  localStorage.setItem("context", JSON.stringify(newContexts));
  renderNavigation();
}

// Delete domain group
function deleteDomain(domain) {
  const contexts = JSON.parse(localStorage.getItem("context") || "[]");
  const newContexts = contexts.filter((ctx) => getDomain(ctx.url) !== domain);
  localStorage.setItem("context", JSON.stringify(newContexts));
  renderNavigation();
}

// Toggle domain collapse
function toggleCollapse(domain) {
  const collapsed = JSON.parse(localStorage.getItem("collapsed") || "[]");
  const index = collapsed.indexOf(domain);

  if (index === -1) {
    collapsed.push(domain);
  } else {
    collapsed.splice(index, 1);
  }

  localStorage.setItem("collapsed", JSON.stringify(collapsed));
  renderNavigation();
}

// Add new context
async function addContext(url) {
  url = url.trim();
  if (!url) return;

  window.location.href = createPathname({
    ...parsePathname(window.location.href),
    contextUrl: url,
  });
}

// Render the navigation
function renderNavigation() {
  const nav = document.getElementById("navigation");
  const contexts = JSON.parse(localStorage.getItem("context") || "[]");
  const collapsed = JSON.parse(localStorage.getItem("collapsed") || "[]");
  const currentUrl = decodeURIComponent(
    window.location.pathname.split("/model/")[0].slice(1),
  );

  // Group contexts by domain
  const groupedContexts = contexts.reduce((acc, ctx) => {
    const domain = getDomain(ctx.url);
    console.log({ ctx, domain });
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(ctx);
    return acc;
  }, {});

  // Sort domains
  const sortedDomains = Object.keys(groupedContexts).sort();

  const trashSvg = `<svg class="w-4 h-4 text-gray-500 hover:text-purple-500 transition-colors duration-200" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 5h16M7 5V3h10v2" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/><path d="M6 5l1.5 16h9L18 5" stroke="currentColor" fill="none" stroke-width="2"/><path d="M10 9v8M14 9v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  nav.innerHTML = sortedDomains
    .map(
      (domain) => `
      <div class="mb-2">
          <div class="flex items-center justify-between p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
               onclick="toggleCollapse('${domain}')">
              <span class="font-medium">${truncate(domain, 30)}</span>
              <div class="flex items-center">
                  <span class="text-sm text-gray-500 mr-2">${
                    groupedContexts[domain].length
                  }</span>
                  <button class="text-gray-400 hover:text-red-500 opacity-0 hover:opacity-100 transition-opacity"
                          onclick="event.stopPropagation(); deleteDomain('${domain}')">
                      ${trashSvg}
                  </button>
              </div>
          </div>
          <div class="${collapsed.includes(domain) ? "hidden" : ""}">
              ${groupedContexts[domain]
                .map(
                  (ctx) => `
                  <div class="flex items-center justify-between p-2 pl-4 hover:bg-gray-50 group">
                      <a href="/${encodeURIComponent(
                        withoutProtocol(ctx.url),
                      )}/model/${localStorage.getItem("model")}"
                         class="block flex-1 truncate ${
                           ctx.url === prependProtocol(currentUrl)
                             ? "text-purple-500"
                             : "text-gray-700"
                         }"
                         title="${ctx.description || ""}">${truncate(
                    ctx.title || getPathWithoutDomain(ctx.url),
                    30,
                  )}
                         ${
                           ctx.tokens
                             ? `<span class="text-sm text-gray-500">(${ctx.tokens})</span>`
                             : ""
                         }
                      </a>
                      <button class="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              onclick="deleteContext('${ctx.url}')">
                          ${trashSvg}
                      </button>
                  </div>
              `,
                )
                .join("")}
          </div>
      </div>
  `,
    )
    .join("");
}

// Initialize navigation
document.addEventListener("DOMContentLoaded", () => {
  // Setup add context button
  document.getElementById("add-context").addEventListener("click", () => {
    const url = prompt("Enter URL:");
    if (url) addContext(url);
  });

  // Add current page to context if not present
  const currentUrl = parsePathname(window.location.pathname).contextUrl;

  if (currentUrl) {
    const contexts = JSON.parse(localStorage.getItem("context") || "[]");
    if (!contexts.some((ctx) => ctx.url === currentUrl)) {
      localStorage.setItem(
        "context",
        JSON.stringify([
          ...contexts,
          {
            key: currentUrl,
            url: currentUrl,
            title: getPathWithoutDomain(currentUrl),
            tokens: Math.round(
              (window.data?.context?.context?.length || 0) / 5,
            ),
          },
        ]),
      );
    }
  }
  renderNavigation();
});
