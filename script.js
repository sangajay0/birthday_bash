// --- Utilities ---
function isMobileDevice() {
  const mobilePattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobilePattern.test(navigator.userAgent);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scrollToBottom() {
  const container = document.getElementById("myScrollable");
  if (!container) return;
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}

// --- Header helpers ---
function setLastSeen() {
  const date = new Date();
  const lastSeen = document.getElementById("lastseen");
  if (!lastSeen) return;
  lastSeen.innerText = "last seen today at " + date.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
}

// --- Typing bar helpers (BOTTOM) ---
function setTypingBar(text) {
  const bar = document.getElementById("typingbar");
  if (!bar) return;
  bar.textContent = text || "";
  scrollToBottom();
}

// Typeout text letter-by-letter *in the typing bar*. Returns a Promise.
async function typeInTypingBar(fullText, charDelay = 45) {
  if (!fullText) return;
  setTypingBar("");                 // clear first
  for (let i = 1; i <= fullText.length; i++) {
    setTypingBar(fullText.slice(0, i));
    // slightly slower for spaces/punctuation feels nicer
    const ch = fullText[i - 1];
    const extra = /[,.!?… ]/.test(ch) ? 55 : 0;
    await delay(charDelay + extra);
  }
  await delay(250);                  // small pause after finishing
}

// --- Image modal helpers ---
function closeFullImage() {
  const x = document.getElementById("fullScreenDP");
  if (x) x.style.display = "none";
}

function openFullScreenImage(element) {
  changeImageSrc(element.src);
  const x = document.getElementById("fullScreenDP");
  if (x) x.style.display = "flex";
}

function changeImageSrc(newSrc) {
  const imgElement = document.getElementById("dpImage");
  if (imgElement) imgElement.src = newSrc;
}

// --- Chat message rendering ---
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
  bubble.innerHTML = textToSend; // supports HTML content like <img>

  wrap.appendChild(bubble);
  li.appendChild(wrap);
  bubble.appendChild(dateLabel);
  document.getElementById("listUL").appendChild(li);

  setLastSeen();
  scrollToBottom();
}

function sendResponseMessage(textToSend) {
  sendMessage(textToSend, 'received');
}

function sendMsg(input) {
  sendMessage(input, 'sent');
}

// --- Conversation engine (with typewriter) ---
window.onload = function () {
  onLoad();
};

function onLoad() {
  console.log("Page loaded");
  setLastSeen();

  // If you WANT to block desktop, uncomment next line:
  // if (!isMobileDevice()) window.location.href = "/error.html";

  const buttonsContainer = document.getElementById("button-container");

  fetch("conversation.json")
    .then((response) => response.json())
    .then(async (data) => {
      let currentStep = 0;

      function hideButtons() {
        buttonsContainer.innerHTML = "";
      }

      function displayButtons(buttons) {
        buttonsContainer.innerHTML = "";
        buttons.forEach((button) => {
          const buttonElement = document.createElement("button");
          buttonElement.className = "message-button";
          buttonElement.textContent = button.text;

          buttonElement.addEventListener("click", async () => {
            currentStep = button.next;                 // 0-based
            const step = data[currentStep];

            // Echo user's selection as a sent message
            sendMsg(button.text);
            hideButtons();

            // If destination step has images, render them immediately (inline)
            if (step && step.image) {
              for (const imgUrl of step.image) {
                sendMsg(`<img src='${imgUrl}' style='max-width: 100%; height: auto; margin-top: 10px;'>`);
              }
            }

            await nextStep();                          // continue flow
          });

          buttonsContainer.appendChild(buttonElement);
        });
        scrollToBottom();
      }

      // Shows a single message with bottom typewriter first, then sends bubble
      async function displayMessageWithTyping(msgText) {
        // show progressive typing in bottom bar
        await typeInTypingBar(msgText);
        // then clear typing bar and send final message bubble
        setTypingBar("");
        sendResponseMessage(msgText);
      }

      // Drives the conversation for the current step
      async function nextStep() {
        if (currentStep >= data.length) {
          setTypingBar(""); // no further typing
          return;
        }

        const step = data[currentStep];

        if (!step) return;

        if (step.userInitiated) {
          // For user-initiated steps, just show buttons (and optional images if you want)
          if (step.buttons) displayButtons(step.buttons);
          // If you also want to show step.image on user-initiated steps (before click), uncomment:
          // if (step.image) {
          //   for (const imgUrl of step.image) {
          //     sendMsg(`<img src='${imgUrl}' style='max-width: 100%; height: auto; margin-top: 10px;'>`);
          //   }
          // }
          return;
        }

        // Automatic bot messages
        if (step.message && Array.isArray(step.message)) {
          for (let i = 0; i < step.message.length; i++) {
            const msg = step.message[i];
            await displayMessageWithTyping(msg);
            // short pause between messages feels natural
            await delay(350);
          }
        }

        // After finishing this step, advance and recurse
        currentStep++;
        await delay(150); // tiny buffer
        return nextStep();
      }

      console.log("Started Conversation");
      await nextStep(); // kick off
    })
    .catch((error) => {
      console.error("Error loading JSON data:", error);
    });
}
