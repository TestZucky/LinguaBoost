// Load synonym dictionary
let synonyms = {};
let dictionaryReady = false;

fetch(chrome.runtime.getURL("words.json"))
  .then((response) => response.json())
  .then((data) => {
    synonyms = data;
    console.log("Synonym dictionary loaded:", synonyms);
  });

// Create overlay
const overlay = document.createElement("div");
overlay.id = "synonym-helper-overlay";
document.body.appendChild(overlay);

let hideTimeout;

function showSuggestions(matches) {
  overlay.innerHTML = matches
    .map((m) => `<b>${m.word}</b> → ${m.suggestions.join(", ")}`)
    .join("<br>");

  overlay.style.display = "block";

  // Reset the hide timer every time new text comes
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    overlay.style.display = "none";
  }, 5000);
}

// Helper: process caption text
function processCaptionText(text) {
  const lower = text.toLowerCase().trim();
  if (!lower) return;

  console.log("Captions detected:", lower);

  let matches = [];
  for (let word in synonyms) {
    console.log(`Checking for log ${lower}`);

    const regex = new RegExp(`\\b${word}s?\\b`, "i");
    if (regex.test(lower)) {
      console.log(`Found word: ${word}`);
      matches.push({ word, suggestions: synonyms[word] });
    }
  }

  if (matches.length > 0) {
    showSuggestions(matches);
  }
}

// MutationObserver for captions
const observer = new MutationObserver((mutations) => {
  for (let mutation of mutations) {
    // Case 1: new caption nodes
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.innerText) {
          if (node.className && node.className.includes("ygicle VbkSUe")) {
            processCaptionText(node.innerText);
          }
        }
      });
    }

    // Case 2: existing captions updated
    if (mutation.type === "characterData") {
      const text = mutation.target.textContent;
      if (text) {
        processCaptionText(text);
      }
    }
  }
});

// Observe both new nodes & text changes
observer.observe(document.body, {
  subtree: true,
  childList: true,
  characterData: true,
  characterDataOldValue: false,
});

console.log("Synonym Helper is running. Turn on captions in Meet!");
