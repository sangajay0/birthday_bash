// script.js

function onLoad() {
  // Initialize the page
  console.log("Page loaded");
  setLastSeen();

  const chatContainer = document.getElementById("chatting");
  const buttonsContainer = document.getElementById("button-container");

  fetch("conversation.json")
    .then((response) => response.json())
    .then((data) => {
      let currentStep = 0;

      function displayMessage(step, message, currIdx, ttlSize) {
        hideButtons(); // Hide buttons initially
        setTyping();
        setTimeout(() => {
          sendResponseMessage(message);
          if (currIdx + 1 === ttlSize) {
            if (step.buttons) displayButtons(step.buttons); // Show buttons for user interaction
          }
        }, 1500);
      }

      function displayButtons(buttons) {
        buttonsContainer.innerHTML = "";
        buttons.forEach((button) => {
          const buttonElement = document.createElement("button");
          buttonElement.className = "message-button";
          buttonElement.textContent = button.text;
          buttonElement.addEventListener("click", () => {
            currentStep = button.next;
            sendMsg(button.text);
            nextStep();
          });
          buttonsContainer.appendChild(buttonElement);
        });
      }

      function hideButtons() {
        buttonsContainer.innerHTML = "";
      }

      function nextStep() {
  if (currentStep < data.length) {
    const step = data[currentStep];
    
    // Check if the message is user-initiated
    if (step.userInitiated) {
      if (step.message) {
        step.message.forEach((msg, idx) => {
          setTimeout(() => {
            sendMsg(msg); // User sends the message
            if (idx + 1 === step.message.length && step.buttons) {
              displayButtons(step.buttons); // Show buttons after user message
            }
          }, 1500);
        });
      }
      if (step.image) {
        step.image.forEach((imgUrl, idx) => {
          setTimeout(() => {
            sendMsg(`<img src='${imgUrl}' onclick='openFullScreenImage(this)' style='max-width: 100%; height: auto;'>`); // User sends the image
            if (idx + 1 === step.image.length && step.buttons) {
              displayButtons(step.buttons); // Show buttons after user image
            }
          }, (idx + 1) * 1500);
        });
      }
    } else {
      // Regular response from Niranjana
      if (step.message) {
        step.message.forEach((msg, idx) => {
          setTimeout(() => {
            displayMessage(step, msg, idx, step.message.length);
          }, (idx + 1) * 1500);
        });
      }
      if (step.image) {
        step.image.forEach((imgUrl, idx) => {
          setTimeout(() => {
            displayMessage(step, `<img src='${imgUrl}' onclick='openFullScreenImage(this)' style='max-width: 100%; height: auto;'>`, idx, step.image.length);
          }, (idx + 1) * 1500);
        });
      }
    }
  }
}


      console.log("Started Conversation");
      nextStep(); // Start the conversation
    })
    .catch((error) => {
      console.error("Error loading JSON data:", error);
    });
}

function isMobileDevice() {
  const mobilePattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobilePattern.test(navigator.userAgent);
}

function blockNonMobileDevices() {
  if (!isMobileDevice()) {
    window.location.href = "/error.html";
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setTyping() {
  const lastSeen = document.getElementById("lastseen");
  lastSeen.innerText = "typing...";
}

function setLastSeen() {
  const date = new Date();
  const lastSeen = document.getElementById("lastseen");
  lastSeen.innerText = "last seen today at " +
    date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
}

function closeFullimage() {
  const x = document.getElementById("fullScreenDP");
  x.style.display = x.style.display === "flex" ? "none" : "flex";
}

function openFullScreenImage(element) {
  changeImageSrc(element.src);
  const x = document.getElementById("fullScreenDP");
  x.style.display = x.style.display === "flex" ? "none" : "flex";
}

function changeImageSrc(newSrc) {
  const imgElement = document.getElementById("dpImage");
  if (imgElement) {
    imgElement.src = newSrc;
  }
}

function sendResponseMessage(textToSend) {
  const date = new Date();
  const myLI = document.createElement("li");
  const myDiv = document.createElement("div");
  const greendiv = document.createElement("div");
  const dateLabel = document.createElement("label");
  dateLabel.className = "dateLabel";
  dateLabel.innerText = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  myDiv.className = "received";
  greendiv.className = "grey";
  greendiv.innerHTML = textToSend;
  myDiv.appendChild(greendiv);
  myLI.appendChild(myDiv);
  greendiv.appendChild(dateLabel);
  document.getElementById("listUL").appendChild(myLI);
  setLastSeen();
}

function sendMsg(input) {
  const date = new Date();
  const myLI = document.createElement("li");
  const myDiv = document.createElement("div");
  const greendiv = document.createElement("div");
  const dateLabel = document.createElement("label");
  dateLabel.className = "dateLabel";
  dateLabel.innerText = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  myDiv.className = "sent";
  greendiv.className = "green";
  greendiv.innerText = input;
  myDiv.appendChild(greendiv);
  myLI.appendChild(myDiv);
  greendiv.appendChild(dateLabel);
  document.getElementById("listUL").appendChild(myLI);
}

window.onload = function () {
  onLoad();
  sendResponseMessage("Welcome to Niranjana's Birthday Bash!");
};
