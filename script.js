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
                    if (step.image) {
                        step.image.forEach((imgUrl) => {
                            sendResponseMessage(`<img src='${imgUrl}' onclick='openFullScreenImage(this)' style='max-width: 100%; height: auto; margin-top: 10px; cursor: pointer;'>`);
                        });
                    } else {
                        sendResponseMessage(message);
                    }

                    if (currIdx + 1 === ttlSize && step.buttons) {
                        displayButtons(step.buttons); // Show buttons for user interaction
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
                        const step = data[currentStep - 1];

                        if (step.userInitiated) {
                            sendMsg(button.text);
                        }

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

                    if (step.userInitiated) {
                        if (step.buttons) {
                            displayButtons(step.buttons);
                        }
                    } else {
                        if (step.message) {
                            step.message.forEach((msg, idx) => {
                                setTimeout(() => {
                                    displayMessage(step, msg, idx, step.message.length);
                                    if (idx + 1 === step.message.length) {
                                        currentStep++;
                                        nextStep();
                                    }
                                }, (idx + 1) * 1500);
                            });
                        }

                        if (step.image) {
                            step.image.forEach((imgUrl, idx) => {
                                setTimeout(() => {
                                    displayMessage(step, `<img src='${imgUrl}' onclick='openFullScreenImage(this)' style='max-width: 100%; height: auto; cursor: pointer;'>`, idx, step.image.length);
                                    if (idx + 1 === step.image.length) {
                                        currentStep++;
                                        nextStep();
                                    }
                                }, (idx + 1) * 1500);
                            });
                        }
                    }
                }
            }

            console.log("Started Conversation");
            nextStep();
        })
        .catch((error) => {
            console.error("Error loading JSON data:", error);
        });
}

function openFullScreenImage(element) {
    changeImageSrc(element.src);
    const x = document.getElementById("fullScreenDP");
    x.style.display = "flex";
}

function changeImageSrc(newSrc) {
    const imgElement = document.getElementById("dpImage");
    if (imgElement) {
        imgElement.src = newSrc;
    }
}

// Modified sendMessage to add images
function sendMessage(textToSend, type = 'received') {
    const date = new Date();
    const myLI = document.createElement("li");
    const myDiv = document.createElement("div");
    const greendiv = document.createElement("div");
    const dateLabel = document.createElement("label");
  
    dateLabel.className = "dateLabel";
    dateLabel.innerText = date.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
  
    myDiv.className = type === 'sent' ? "sent" : "received";
    greendiv.className = type === 'sent' ? "green" : "grey";
    greendiv.innerHTML = textToSend;
  
    myDiv.appendChild(greendiv);
    myLI.appendChild(myDiv);
    greendiv.appendChild(dateLabel);
    document.getElementById("listUL").appendChild(myLI);
  
    setLastSeen();
}

function sendResponseMessage(textToSend) {
    sendMessage(textToSend, 'received');
}

function sendMsg(input) {
    sendMessage(input, 'sent');
}

window.onload = function () {
    onLoad();
    sendResponseMessage("Welcome to Niranjana's Birthday Bash!");
};
