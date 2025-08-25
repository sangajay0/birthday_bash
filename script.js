/**********************
 * Utility
 *********************/
const qs  = (sel) => document.querySelector(sel);
const qid = (id)  => document.getElementById(id);

function isMobileDevice() {
  const mobilePattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobilePattern.test(navigator.userAgent);
}
const delay = (ms) => new Promise(r => setTimeout(r, ms));

function scrollToBottom() {
  const container = qid("myScrollable");
  if (!container) return;
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}

function setLastSeen() {
  const date = new Date();
  const lastSeen = qid("lastseen");
  if (!lastSeen) return;
  lastSeen.innerText = "last seen today at " + date.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
}

/**********************
 * Fullscreen DP
 *********************/
function closeFullImage() {
  const x = qid("fullScreenDP");
  if (x) x.style.display = "none";
}
function openFullScreenImage(element) {
  changeImageSrc(element.src);
  const x = qid("fullScreenDP");
  if (x) x.style.display = "flex";
}
function changeImageSrc(newSrc) {
  const imgElement = qid("dpImage");
  if (imgElement) imgElement.src = newSrc;
}

/**********************
 * Composer (typing section)
 * We "type" here for BOTH bot & user,
 * then send a bubble to the chat.
 *********************/
function setComposer(text) {
  const el = qid("typingtext");
  if (el) el.textContent = text || "";
  scrollToBottom();
}

// typewriter effect in composer
async function typeInComposer(fullText, charDelay = 45) {
  if (!fullText) return;
  setComposer("");
  for (let i = 1; i <= fullText.length; i++) {
    const ch = fullText[i - 1];
    setComposer(fullText.slice(0, i));
    const extra = /[,.!?… ]/.test(ch) ? 55 : 0;
    await delay(charDelay + extra);
  }
  await delay(250);
}

/**********************
 * Chat bubbles
 *********************/
function sendMessage(textToSend, type = 'received') {
  const date = new Date();
  const li = document.createElement("li");
  const wrap = document.createElement("div");
  const bubble = document.createElement("div");
  const dateLabel = document.createElement("label");

  dateLabel.className = "dateLabel";
  dateLabel.innerText = date.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });

  wrap.className = type === 'sent' ? "sent" : "received";
  bubble.className = type === 'sent' ? "green" : "grey";
  bubble.innerHTML = textToSend; // support HTML (<img>)

  wrap.appendChild(bubble);
  li.appendChild(wrap);
  qid("listUL").appendChild(li);

  bubble.appendChild(dateLabel);
  setLastSeen();
  scrollToBottom();
}
const sendResponseMessage = (txt) => sendMessage(txt, "received");
const sendMsg            = (txt) => sendMessage(txt, "sent");

/**********************
 * Conversation engine
 *********************/
window.onload = function () {
  onLoad();
};

function onLoad() {
  // Uncomment to block desktop:
  // if (!isMobileDevice()) window.location.href = "/error.html";

  setLastSeen();
  startConversation();
}

async function startConversation() {
  const buttonsContainer = qid("button-container");

  fetch("conversation.json")
    .then((r) => r.json())
    .then(async (data) => {
      let currentStep = 0;

      function hideButtons() { buttonsContainer.innerHTML = ""; }
      function showButtons(buttons) {
        buttonsContainer.innerHTML = "";
        buttons.forEach((btn) => {
          const el = document.createElement("button");
          el.className = "message-button";
          el.textContent = btn.text;

          el.addEventListener("click", async () => {
            // USER typewriter in composer, then send
            await typeInComposer(btn.text);
            setComposer("");
            sendMsg(btn.text);
            hideButtons();

            // Move to destination step (0-based) and show images if any
            currentStep = btn.next;
            const step = data[currentStep];

            if (step && step.image) {
              for (const imgUrl of step.image) {
                sendMsg(`<img src='${imgUrl}' style='max-width: 100%; height: auto; margin-top: 10px;'>`);
              }
            }
            await nextStep();
          });

          buttonsContainer.appendChild(el);
        });
        scrollToBottom();
      }

      async function displayMessageWithTyping(text) {
        // BOT typewriter in composer
        await typeInComposer(text);
        setComposer("");
        sendResponseMessage(text);
      }

      async function nextStep() {
        if (currentStep >= data.length) { setComposer(""); return; }

        const step = data[currentStep];
        if (!step) return;

        if (step.userInitiated) {
          // Optionally, also show step.image here before click:
          // if (step.image) { step.image.forEach(url => sendMsg(`<img src='${url}' ...>`)); }
          if (step.buttons) showButtons(step.buttons);
          return;
        }

        // Automatic bot messages for this step
        if (Array.isArray(step.message)) {
          for (const msg of step.message) {
            await displayMessageWithTyping(msg);
            await delay(350);
          }
        }

        currentStep++;
        await delay(150);
        return nextStep();
      }

      await nextStep();
    })
    .catch((err) => console.error("Error loading JSON:", err));
}

/**********************
 * Expose image funcs to window (used by HTML)
 *********************/
window.openFullScreenImage = openFullScreenImage;
window.closeFullImage = closeFullImage;
