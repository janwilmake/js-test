//

const header = document.getElementById("header");
if (!header) throw new Error("Header element not found");

// Apply base styles
header.className =
  "bg-white flex items-center py-2 px-4 gap-4 border-b border-purple-100 flex-wrap";

// GitHub Button
const githubBtn = document.createElement("a");
githubBtn.href = "https://github.com/janwilmake/uithub.chat";
githubBtn.target = "_blank";
githubBtn.innerHTML = `
  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .267.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
`;
githubBtn.classList.add(
  "text-purple-600",
  "hover:text-pink-600",
  "transition-colors",
);
header.appendChild(githubBtn);

// Model Select
const modelSelect = document.createElement("select");
modelSelect.classList.add(
  "px-2",
  "py-1",
  "border",
  "border-purple-200",
  "rounded",
  "text-sm",
  "min-w-[300px]",
);

// Parse current pathname to get existing parameters

const pathComponents = parsePathname(window.location.pathname);

/**
 * @param {Question} question
 */
const x = (question) => {
  console.log(question);
};
// Initialize model in localStorage and from URL
const initialModel =
  pathComponents.modelName ||
  localStorage.getItem("model") ||
  window.data?.models?.[0]?.models?.[0]?.id;
if (initialModel) {
  localStorage.setItem("model", initialModel);
}

// Populate model options
window.data?.models?.forEach((provider) => {
  const optgroup = document.createElement("optgroup");
  optgroup.label = `${provider.provider} - ${provider.description}${
    provider.online ? "" : " (🔴 Offline)"
  }`;

  provider.models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = `${
      model.title || model.id
    } - $${model.completionCpm.toFixed(2)}`;

    // Disable expensive models if balance < 0
    if (window.data?.sponsor?.balance) {
      const balance = parseFloat(window.data.sponsor.balance);
      if (model.completionCpm > 5 && balance < 0) {
        option.disabled = true;
      }
    }

    optgroup.appendChild(option);
  });

  modelSelect.appendChild(optgroup);
});

modelSelect.value = initialModel || "";
modelSelect.addEventListener("change", () => {
  const newModel = modelSelect.value;
  localStorage.setItem("model", newModel);

  // Update URL with new model

  if (pathComponents.contextUrl) {
    const newPath = createPathname({
      contextUrl: pathComponents.contextUrl,
      modelName: newModel,
      message: pathComponents.message,
      page: pathComponents.page,
      ext: pathComponents.ext,
    });

    window.history.pushState({}, "", newPath);
  }
});
header.appendChild(modelSelect);

// Auth Section
const authSection = document.createElement("div");
authSection.className = "ml-auto flex items-center gap-3";

if (window.data?.sponsor?.is_authenticated) {
  // User Card
  const userCard = document.createElement("div");
  userCard.className = "flex items-center gap-2";

  if (window.data.sponsor.avatar_url) {
    const avatar = document.createElement("img");
    avatar.src = window.data.sponsor.avatar_url;
    avatar.className = "w-8 h-8 rounded-full";
    userCard.appendChild(avatar);
  }

  const userInfo = document.createElement("div");
  userInfo.innerHTML = `
    <div class="text-sm">${window.data.sponsor.owner_login}</div>
    <div class="text-xs text-purple-600">Balance: $${
      window.data.sponsor.balance > 1000
        ? Math.round(window.data.sponsor.balance)
        : window.data.sponsor.balance.toFixed(2) || "0"
    }</div>
  `;
  userCard.appendChild(userInfo);

  // Budget Link
  const budgetLink = document.createElement("a");
  budgetLink.href = "https://dashboard.uithub.com/usage";
  budgetLink.textContent = "Budget";
  budgetLink.className =
    "px-3 py-1 text-sm border border-purple-200 rounded hover:bg-purple-50";

  // Add Balance
  const addBalance = document.createElement("a");
  addBalance.href = "https://github.com/sponsors/janwilmake";
  addBalance.textContent = "Add Balance";
  addBalance.className =
    "px-3 text-nowrap py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700";

  // Logout
  const logout = document.createElement("a");
  logout.href = "/logout";
  logout.textContent = "Logout";
  logout.className = "px-3 py-1 text-sm text-purple-600 hover:text-pink-600";

  authSection.append(userCard, budgetLink, addBalance, logout);
} else {
  const loginBtn = document.createElement("a");
  loginBtn.href = "/login";
  loginBtn.textContent = "Login";
  loginBtn.className =
    "px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700";
  authSection.appendChild(loginBtn);
}

header.appendChild(authSection);
