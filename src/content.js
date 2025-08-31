// Load synonym dictionary
let synonyms = {};
const divTagForCaption = "ygicle VbkSUe";

fetch(chrome.runtime.getURL("src/words.json"))
  .then((response) => response.json())
  .then((data) => {
    synonyms = data;
  });

// Create overlay
const overlay = document.createElement("div");
overlay.id = "synonym-helper-overlay";
overlay.innerHTML = `
  <div id="overlay-header" style="display:flex;justify-content:space-between;align-items:center;">
    <h4 style="margin:0;">Synonym Helper</h4>
    <div>
      <button id="close-btn">×</button>
    </div>
  </div>
  <div id="overlay-body">
    <input type="text" id="synonym-input" placeholder="Type a word..." />
    <div id="synonym-results"></div>
    <hr/>
    <h4>Live Captions</h4>
    <div id="caption-suggestions"></div>
  </div>
`;

document.body.appendChild(overlay);

// Input handling for manual search
const input = overlay.querySelector("#synonym-input");
const inputResults = overlay.querySelector("#synonym-results");
const captionResults = overlay.querySelector("#caption-suggestions");

input.addEventListener("input", () => {
  const word = input.value.trim().toLowerCase();
  if (word && synonyms[word]) {
    inputResults.innerHTML = `<b>${word}</b> → ${synonyms[word].join(", ")}`;
  } else if (word) {
    inputResults.innerHTML = "No synonyms found.";
  } else {
    inputResults.innerHTML = "";
  }
});

// For auto-hide captions section
let hideTimeout;

// Show caption-based suggestions (with vanish feature)
function showCaptionSuggestions(matches) {
  captionResults.innerHTML = matches
    .map((m) => `<b>${m.word}</b> → ${m.suggestions.join(", ")}`)
    .join("<br>");

  // Reset vanish timer
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    captionResults.innerHTML = "";
  }, 5000);
}

// Helper: process caption text
function processCaptionText(text) {
  const lower = text.toLowerCase().trim();
  if (!lower) return;

  let matches = [];
  for (let word in synonyms) {
    const regex = new RegExp(`\\b${word}s?\\b`, "i");
    if (regex.test(lower)) {
      matches.push({ word, suggestions: synonyms[word] });
    }
  }

  if (matches.length > 0) {
    showCaptionSuggestions(matches);
  }
}

// MutationObserver for captions
const observer = new MutationObserver((mutations) => {
  for (let mutation of mutations) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.innerText) {
          if (node.className && node.className.includes(divTagForCaption)) {
            processCaptionText(node.innerText);
          }
        }
      });
    }
    if (mutation.type === "characterData") {
      const text = mutation.target.textContent;
      if (text) {
        processCaptionText(text);
      }
    }
  }
});

observer.observe(document.body, {
  subtree: true,
  childList: true,
  characterData: true,
});

// Make overlay draggable
let offsetX,
  offsetY,
  isDragging = false;

overlay.addEventListener("mousedown", (e) => {
  // only drag if not clicking inside input field
  if (e.target.tagName.toLowerCase() === "input") return;
  isDragging = true;
  offsetX = e.clientX - overlay.getBoundingClientRect().left;
  offsetY = e.clientY - overlay.getBoundingClientRect().top;
  overlay.style.transition = "none";
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    overlay.style.left = e.clientX - offsetX + "px";
    overlay.style.top = e.clientY - offsetY + "px";
    overlay.style.right = "auto";
    overlay.style.bottom = "auto";
    overlay.style.position = "fixed";
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  overlay.style.transition = "";
});

// Make overlay draggable
(function makeDraggable() {
  const el = overlay;
  let isDown = false;
  let offset = [0, 0];

  el.addEventListener(
    "mousedown",
    function (e) {
      if (e.target.tagName === "INPUT") return; // don't drag when typing
      isDown = true;
      offset = [el.offsetLeft - e.clientX, el.offsetTop - e.clientY];
    },
    true
  );

  document.addEventListener(
    "mouseup",
    function () {
      isDown = false;
    },
    true
  );

  document.addEventListener(
    "mousemove",
    function (e) {
      if (isDown) {
        el.style.left = e.clientX + offset[0] + "px";
        el.style.top = e.clientY + offset[1] + "px";
        el.style.right = "auto"; // prevent snapping back
        el.style.bottom = "auto";
      }
    },
    true
  );
})();

const closeBtn = overlay.querySelector("#close-btn");

closeBtn.addEventListener("click", () => {
  overlay.style.display = "none";
  chrome.storage.local.set({ overlayClosed: true });
});

// When extension is clicked, re-show overlay
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "toggleOverlay") {
    overlay.style.display = "block";
    chrome.storage.local.set({ overlayClosed: false });
  }
});
