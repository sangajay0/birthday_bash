/******** Utilities ********/
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const byId = (id) => document.getElementById(id);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function scrollToBottom() {
  const sc = byId("myScrollable");
  if (!sc) return;
  requestAnimationFrame(() => sc.scrollTop = sc.scrollHeight);
}

function setLastSeen() {
  const date = new Date();
  const el = byId("lastseen");
  if (el) el.innerText = "last seen today at " + date.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
}

/******** DP modal ********/
function openFullScreenImage(el) {
  changeImageSrc(el.src);
  const x = byId("fullScreenDP");
  if (x) x.style.display = "flex";
}
function closeFullImage(){ const x = byId("fullScreenDP"); if (x) x.style.display="none"; }
function changeImageSrc(src){ const img = byId("dpImage"); if (img) img.src = src; }
window.openFullScreenImage = openFullScreenImage;
window.closeFullImage = closeFullImage;

/******** Composer (bottom typing) ********/
function setComposer(text) {
  const t = byId("typingtext");
  if (t) t.textContent = text || "";
  scrollToBottom();
}
async function typeInComposer(fullText, charDelay = 45) {
  if (!fullText) return;
  setComposer("");
  for (let i = 1; i <= fullText.length; i++) {
    const ch = fullText[i-1];
    setComposer(fullText.slice(0, i));
    const extra = /[,.!?… ]/.test(ch) ? 55 : 0;
    await sleep(charDelay + extra);
  }
  await sleep(250);
}

/******** Chat bubbles ********/
function sendMessage(textToSend, type='received') {
  const li = document.createElement("li");
  const wrap = document.createElement("div");
  const bubble = document.createElement("div");
  const dateLabel = document.createElement("label");

  wrap.className   = type === 'sent' ? "sent" : "received";
  bubble.className = type === 'sent' ? "green" : "grey";
  dateLabel.className = "dateLabel";
  dateLabel.innerText = new Date().toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });

  bubble.innerHTML = textToSend;   // HTML allowed for <img>
  wrap.appendChild(bubble);
  li.appendChild(wrap);
  byId("listUL").appendChild(li);
  bubble.appendChild(dateLabel);

  setLastSeen();
  scrollToBottom();
}
const sendResponseMessage = (t) => sendMessage(t, 'received');
const sendMsg            = (t) => sendMessage(t, 'sent');

/******** Conversation engine (auto flow) ********/
window.onload = () => start();

async function start() {
  setLastSeen();

  // Load conversation
  let steps = [];
  try {
    const res = await fetch("conversation.json");
    steps = await res.json();
  } catch (e) {
    console.error("Failed to load conversation.json", e);
    return;
  }

  // Support BOTH old and new formats:
  // NEW: step.message = [{from:'user'|'bot', text?:string, image?:string}]
  // OLD: step.message = ["text", ...], step.userInitiated, step.image
  for (const step of steps) {
    // NEW format?
    if (Array.isArray(step.message) && typeof step.message[0] === "object") {
      for (const item of step.message) {
        if (item.text) {
          // type in composer, then add bubble from the right side
          await typeInComposer(item.text);
          setComposer("");
          const side = item.from === "user" ? "sent" : "received";
          sendMessage(item.text, side);
          await sleep(350);
        }
        if (item.image) {
          // preload to ensure it shows; also use correct GitHub raw URL
          const url = item.image;
          await ensureImageLoads(url);
          sendMessage(`<img src="${url}" alt="" style="max-width:100%; height:auto; border-radius:10px;">`, 'sent'); // show as sent or received—your choice
          await sleep(250);
        }
      }
      continue;
    }

    // OLD format fallback (auto bot messages + optional images)
    if (step.image) {
      for (const imgUrl of step.image) {
        const url = imgUrl.replace("refs/heads/main/", "main/"); // fix wrong GitHub path if present
        await ensureImageLoads(url);
        sendMessage(`<img src="${url}" alt="" style="max-width:100%; height:auto; border-radius:10px;">`, 'sent');
      }
      await sleep(200);
    }

    if (Array.isArray(step.message)) {
      for (const msg of step.message) {
        await typeInComposer(msg);
        setComposer("");
        sendResponseMessage(msg);
        await sleep(350);
      }
    }
  }

  // end: clear composer
  setComposer("");
}

/******** Helpers ********/
function ensureImageLoads(src) {
  const url = src.replace("refs/heads/main/", "main/"); // normalize bad path
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => { console.warn("Image failed to load:", url); resolve(false); };
    img.src = url;
  });
}
