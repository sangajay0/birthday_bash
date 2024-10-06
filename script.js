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
        if (ttlSize == currIdx + 1) {
          setTyping();
          sendResponseMessage(message);
          displayButtons(step.buttons);
        } else {
          hideButtons();
          setTyping();
          sendResponseMessage(message);
        }
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
          if (step.hasOwnProperty("message")) {
            for (let i = 0; i < step.message.length; i++) {
              setTimeout(function () {
                displayMessage(step, step.message[i], i, step.message.length);
              }, (i + 1) * 1500);
            }
          }
          if (step.hasOwnProperty("image")) {
            for (let i = 0; i < step.image.length; i++) {
              setTimeout(function () {
                displayMessage(
                  step,
                  "<img src='" +
                    step.image[i] +
                    "' onclick='openFullScreenImage(this)' style='max-width: 100%; height: auto; display: block; overflow: hidden;'>",
                  i,
                  step.image.length
                );
              }, (i + 1) * 1500);
            }
          }
        }
      }

      console.log("Started Conv");
      nextStep(); // Start the conversation
    })
    .catch((error) => {
      console.error("Error loading JSON data:", error);
    });
}

// Check if the user agent corresponds to a mobile device
function isMobileDevice() {
  const mobilePattern =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobilePattern.test(navigator.userAgent);
}

// Redirect the user if not using a mobile device
function blockNonMobileDevices() {
  if (!isMobileDevice()) {
    window.location.href = "/error.html";
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setTyping() {
  var lastSeen = document.getElementById("lastseen");
  lastSeen.innerText = "typing...";
  console.log("typing");
}

function setLastSeen() {
  var date = new Date();
  var lastSeen = document.getElementById("lastseen");
  lastSeen.innerText =
    "last seen today at " +
    date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  var s = document.getElementById("chatting");
  s.scrollTop = s.scrollHeight;
}

function closeFullimage() {
  var x = document.getElementById("fullScreenDP");
  if (x.style.display === "flex") {
    x.style.display = "none";
  } else {
    x.style.display = "flex";
  }
}

function openFullScreenImage(element) {
  changeImageSrc(element.src);
  var x = document.getElementById("fullScreenDP");
  if (x.style.display === "flex") {
    x.style.display = "none";
  } else {
    x.style.display = "flex";
  }
}

function changeImageSrc(newSrc) {
  const imgElement = document.getElementById("dpImage"); // Get the img element by its id
  if (imgElement) {
    imgElement.src = newSrc; // Set the src attribute to the new path
  }
}

function sendResponseMessage(textToSend) {
  var date = new Date();
  var myLI = document.createElement("li");
  var myDiv = document.createElement("div");
  var greendiv = document.createElement("div");
  var dateLabel = document.createElement("label");
  dateLabel.setAttribute("id", "sentlabel");
  dateLabel.id = "sentlabel";
  dateLabel.innerText = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  myDiv.setAttribute("class", "received");
  greendiv.setAttribute("class", "grey");
  greendiv.innerHTML = textToSend;
  myDiv.appendChild(greendiv);
  myLI.appendChild(myDiv);
  greendiv.appendChild(dateLabel);
  document.getElementById("listUL").appendChild(myLI);

  setTimeout(setLastSeen, 500);
}

function sendMsg(input) {
  console.log(input);
  var ti = input;
  if (input.value == "") {
    return;
  }
  var date = new Date();
  var myLI = document.createElement("li");
  var myDiv = document.createElement("div");
  var greendiv = document.createElement("div");
  var dateLabel = document.createElement("label");
  dateLabel.innerText = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  myDiv.setAttribute("class", "sent");
  greendiv.setAttribute("class", "green");
  dateLabel.setAttribute("class", "dateLabel");
  greendiv.innerText = input;
  myDiv.appendChild(greendiv);
  myLI.appendChild(myDiv);
  greendiv.appendChild(dateLabel);
  document.getElementById("listUL").appendChild(myLI);
  var s = document.getElementById("chatting");
  s.scrollTop = s.scrollHeight;
}

// Example usage: Add a chat message when the page loads
window.onload = function () {
  onLoad();
  addChatMessage("Welcome to Niranjana's Birthday Bash!");
};
