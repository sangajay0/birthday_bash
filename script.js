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
 * Presence (header status)
 * Show "online" during typing AND just after sending,
 * then revert to "last seen". Works for both ends.
 *********************/
let presenceTimer = null;
function goOnline() {
  if (presenceTimer) clearTimeout(presenceTimer);
  const el = byId("lastseen");
  if (el) el.innerText = "online";
}
function goIdleSoon(delayMs = 800) {
  if (presenceTimer) clearTimeout(presenceTimer);
  presenceTimer = setTimeout(() => setLastSeen(), delayMs);
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
  const el = byId("typingtext");
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
  goOnline();                // online while typing (both ends)
  setComposerTyping(true);
  await sleep(ms);
  setComposerTyping(false);
  // do not go idle yet; let the sender set goIdleSoon() AFTER sending bubble
}

/* --- Letter-by-letter only for the greeting --- */
const TYPEWRITER_TARGET = "Hey bestie, happy birthday";
function shouldTypewriter(text) {
  return (text || "").trim().toLowerCase() === TYPEWRITER_TARGET.toLowerCase();
}
async function typeInComposerLetterByLetter(fullText, charDelay = 45) {
  if (!fullText) return;
  goOnline();                // online while typing
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
  // don't go idle here; the sender will call goIdleSoon() after sending
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

  // Presence: keep "online" during/just after send; caller will schedule goIdleSoon()
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
        // USER typing: special greeting -> typewriter; others -> dots
        if (shouldTypewriter(btn.text)) {
          await typeInComposerLetterByLetter(btn.text);
        } else {
          await showTyping(typingDurationFor(btn.text));
        }
        // Sending: keep online briefly after
        goOnline();
        sendMsg(btn.text);
        goIdleSoon(900);

        hideButtons();

        // Destination step (if has images, show as SENT/right side)
        currentStep = btn.next;
        const step = steps[currentStep];
        if (step && step.image) {
          await showTyping(900); // quick dots while we "prepare" image
          for (const raw of step.image) {
            const url = await ensureImageLoads(raw);
            if (url) {
              goOnline();
              sendMessage(
                `<img src="${url}" alt="" style="max-width:100%; height:auto; border-radius:10px;">`,
                "sent" // 👉 force right side for shared images
              );
              goIdleSoon(900);
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
    // step.message: [{from:'user'|'bot', text?, image?}, ...]
    for (const item of step.message) {
      if (item.text) {
        if (shouldTypewriter(item.text) && (item.from || "").toLowerCase() === "user") {
          await typeInComposerLetterByLetter(item.text);
        } else {
          await showTyping(typingDurationFor(item.text));
        }
        // Send bubble on correct side; keep online briefly after sending
        const side = (item.from || "").toLowerCase() === "user" ? "sent" : "received";
        goOnline();
        sendMessage(item.text, side);
        goIdleSoon(900);
        await sleep(350);
      }
      if (item.image) {
        // Always treat images as SHARED by "us" → show on right side
        await showTyping(900);
        const url = await ensureImageLoads(item.image);
        if (url) {
          goOnline();
          sendMessage(
            `<img src="${url}" alt="" style="max-width:100%; height:auto; border-radius:10px;">`,
            "sent" // 👉 force right side
          );
          goIdleSoon(900);
          await sleep(250);
        }
      }
    }
  }

  async function handleOldFormatStep(step) {
    // Old format images → also right side
    if (step.image) {
      await showTyping(900);
      for (const raw of step.image) {
        const url = await ensureImageLoads(raw);
        if (url) {
          goOnline();
          sendMessage(
            `<img src="${url}" alt="" style="max-width:100%; height:auto; border-radius:10px;">`,
            "sent" // 👉 force right side
          );
          goIdleSoon(900);
        }
      }
      await sleep(200);
    }

    // Old format auto messages (bot): dots typing then received bubble
    if (Array.isArray(step.message)) {
      for (const msg of step.message) {
        await showTyping(typingDurationFor(msg));
        goOnline();
        sendResponseMessage(msg);
        goIdleSoon(900);
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

    // NEW format?
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

    // OLD format
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
