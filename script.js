/**********************
 * Utils
 *********************/
const $ = (s) => document.querySelector(s);
const byId = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function scrollToBottom() {
  const sc = byId("myScrollable");
  if (!sc) return;
  requestAnimationFrame(() => (sc.scrollTop = sc.scrollHeight));
}

function setLastSeen() {
  const el = byId("lastseen");
  if (!el) return;
  el.innerText =
    "last seen today at " +
    new Date().toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
}

/**********************
 * Fullscreen DP
 *********************/
function openFullScreenImage(el) {
  changeImageSrc(el.src);
  const x = byId("fullScreenDP");
  if (x) x.style.display = "flex";
}
function closeFullImage() {
  const x = byId("fullScreenDP");
  if (x) x.style.display = "none";
}
function changeImageSrc(src) {
  const img = byId("dpImage");
  if (img) img.src = src;
}
window.openFullScreenImage = openFullScreenImage;
window.closeFullImage = closeFullImage;

/**********************
 * Composer (bottom typing)
 *********************/
function setComposer(html) {
  const el = document.getElementById("typingtext");
  if (!el) return;
  el.innerHTML = html ? html : "";
  scrollToBottom();
}

/* --- WhatsApp-like typing dots --- */
function setComposerTyping(on = true) {
  if (on) {
    setComposer(
      '<div class="typingdots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>'
    );
  } else {
    setComposer("");
  }
}
function typingDurationFor(text = "", minMs = 900, maxMs = 2400) {
  const perChar = 40;
  const est = minMs + Math.floor((text.length * perChar) / 4);
  return Math.max(minMs, Math.min(maxMs, est));
}
async function showTyping(ms = 1200) {
  setComposerTyping(true);
  await sleep(ms);
  setComposerTyping(false);
}

/* --- Letter-by-letter (typewriter) just for the greeting --- */
const TYPEWRITER_TARGET = "Hey bestie, happy birthday";
function shouldTypewriter(text) {
  return (text || "").trim().toLowerCase() === TYPEWRITER_TARGET.toLowerCase();
}
async function typeInComposerLetterByLetter(fullText, charDelay = 45) {
  if (!fullText) return;
  setComposer("");
  let html = "";
  for (let i = 0; i < fullText.length; i++) {
    const ch = fullText[i];
    html += ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch; // basic safety
    setComposer(html);
    const extra = /[,.!?… ]/.test(ch) ? 55 : 0;
    await sleep(charDelay + extra);
  }
  await sleep(250);
}

/**********************
 * Chat bubbles
 *********************/
function sendMessage(textToSend, type = "received") {
  const li = document.createElement("li");
  const wrap = document.createElement("div");
  const bubble = document.createElement("div");
  const dateLabel = document.createElement("label");

  wrap.className = type === "sent" ? "sent" : "received";
  bubble.className = type === "sent" ? "green" : "grey";
  dateLabel.className = "dateLabel";
  dateLabel.innerText = new Date().toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  bubble.innerHTML = textToSend; // HTML allowed (e.g., <img>)
  wrap.appendChild(bubble);
  li.appendChild(wrap);
  byId("listUL").appendChild(li);
  bubble.appendChild(dateLabel);

  setLastSeen();
  scrollToBottom();
}
const sendResponseMessage = (t) => sendMessage(t, "received");
const sendMsg = (t) => sendMessage(t, "sent");

/**********************
 * Image helpers
 *********************/
function normalizeGithubRaw(src) {
  return src.replace("refs/heads/main/", "main/");
}
function ensureImageLoads(src) {
  const url = normalizeGithubRaw(src);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => {
      console.warn("Image failed to load:", url);
      resolve(null);
    };
    img.src = url;
  });
}

/**********************
 * Conversation engine
 * Supports NEW & OLD formats
 *********************/
window.onload = () => startConversation();

async function startConversation() {
  setLastSeen();

  let steps = [];
  try {
    const res = await fetch("conversation.json");
    steps = await res.json();
  } catch (e) {
    console.error("Failed to load conversation.json", e);
    return;
  }

  const buttonsContainer = byId("button-container");
  let currentStep = 0;

  function hideButtons() {
    buttonsContainer.innerHTML = "";
  }
  function showButtons(buttons) {
    buttonsContainer.innerHTML = "";
    buttons.forEach((btn) => {
      const el = document.createElement("button");
      el.className = "message-button";
      el.textContent = btn.text;

      el.addEventListener("click", async () => {
        // SPECIAL: first greeting gets letter-by-letter, others use dots
        if (shouldTypewriter(btn.text)) {
          await typeInComposerLetterByLetter(btn.text);
          setComposer("");
        } else {
          await showTyping(typingDurationFor(btn.text));
        }
        sendMsg(btn.text);
        hideButtons();

        // Move to destination step and render images first if any
        currentStep = btn.next;
        const step = steps[currentStep];

        if (step && step.image) {
          await showTyping(1100); // dots while loading
          for (const raw of step.image) {
            const url = await ensureImageLoads(raw);
            if (url) {
              sendMessage(
                `<img src="${url}" alt="" style="max-width:100%; height:auto; border-radius:10px;">`,
                "sent"
              );
            }
          }
        }
        await nextStep();
      });

      buttonsContainer.appendChild(el);
    });
    scrollToBottom();
  }

  async function handleNewFormatStep(step) {
    for (const item of step.message) {
      if (item.text) {
        if (shouldTypewriter(item.text)) {
          await typeInComposerLetterByLetter(item.text);
          setComposer("");
        } else {
          await showTyping(typingDurationFor(item.text));
        }
        const side = item.from === "user" ? "sent" : "received";
        sendMessage(item.text, side);
        await sleep(350);
      }
      if (item.image) {
        await showTyping(1100);
        const url = await ensureImageLoads(item.image);
        if (url) {
          // Show image as 'sent' (change to 'received' if you prefer)
          sendMessage(
            `<img src="${url}" alt="" style="max-width:100%; height:auto; border-radius:10px;">`,
            "sent"
          );
          await sleep(250);
        }
      }
    }
  }

  async function handleOldFormatStep(step) {
    if (step.image) {
      await showTyping(1100);
      for (const raw of step.image) {
        const url = await ensureImageLoads(raw);
        if (url) {
          sendMessage(
            `<img src="${url}" alt="" style="max-width:100%; height:auto; border-radius:10px;">`,
            "sent"
          );
        }
      }
      await sleep(200);
    }

    if (Array.isArray(step.message)) {
      for (const msg of step.message) {
        if (shouldTypewriter(msg)) {
          await typeInComposerLetterByLetter(msg);
          setComposer("");
        } else {
          await showTyping(typingDurationFor(msg));
        }
        sendResponseMessage(msg);
        await sleep(350);
      }
    }
  }

  async function nextStep() {
    if (currentStep >= steps.length) {
      setComposer("");
      return;
    }

    const step = steps[currentStep];
    if (!step) return;

    if (
      Array.isArray(step.message) &&
      step.message.length &&
      typeof step.message[0] === "object"
    ) {
      await handleNewFormatStep(step);
      currentStep++;
      await sleep(150);
      return nextStep();
    }

    if (step.userInitiated) {
      if (step.buttons) showButtons(step.buttons);
      return;
    }

    await handleOldFormatStep(step);
    currentStep++;
    await sleep(150);
    return nextStep();
  }

  await nextStep();
}
