const imageLoader = document.getElementById("imageLoader");
const downloadButton = document.getElementById("downloadButton");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const toggleOverlay = document.getElementById("toggleOverlay");
const toggleCardCutout = document.getElementById("toggleCardCutout");
const backgroundColorPicker = document.getElementById("backgroundColorPicker");

const downloadModal = document.getElementById("downloadModal");
const downloadCloseButton = downloadModal.querySelector(".close-button");
const downloadHiResButton = document.getElementById("downloadHiResButton");
const downloadPrintButton = document.getElementById("downloadPrintButton");

const instructionModal = document.getElementById("instructionModal");
const instructionCloseButton = instructionModal.querySelector(".close-button");
const closeInstructionModalButton = document.getElementById(
  "closeInstructionModalButton"
);

const overlay = new Image();
overlay.src = "overlay.png";

const cardcutout = new Image();
cardcutout.src = "cardcutout.png";

let userImage = null;
let imageX = 0,
  imageY = 0,
  imageScale = 1;
let imageInitialWidth, imageInitialHeight;
let isDragging = false;
let startDragX, startDragY;

/**
 * This function enforces the boundaries for the image.
 */
function applyConstraints() {
  if (!userImage) return;

  if (imageScale < 1) {
    imageScale = 1;
  }

  const currentWidth = imageInitialWidth * imageScale;
  const currentHeight = imageInitialHeight * imageScale;

  if (imageX > 0) imageX = 0;
  const minX = canvas.width - currentWidth;
  if (imageX < minX) imageX = minX;

  if (imageY > 0) imageY = 0;

  const overlayBottomMargin = (112 / 645) * canvas.height;
  let effectiveCanvasHeight = canvas.height;

  if (toggleOverlay.checked) {
    effectiveCanvasHeight -= overlayBottomMargin;
  }

  const minY = effectiveCanvasHeight - currentHeight;
  if (imageY < minY) {
    imageY = minY;
  }
}

/**
 * The main function to draw everything on the on-screen canvas.
 */
function drawCanvas() {
  applyConstraints();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = backgroundColorPicker.value;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (userImage) {
    const currentWidth = imageInitialWidth * imageScale;
    const currentHeight = imageInitialHeight * imageScale;
    ctx.drawImage(userImage, imageX, imageY, currentWidth, currentHeight);
  }

  if (toggleOverlay.checked) {
    ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
  }

  if (toggleCardCutout.checked) {
    ctx.drawImage(cardcutout, 0, 0, canvas.width, canvas.height);
  }
}

/**
 * Reusable drawing logic for any canvas size.
 */
function drawToCanvas(targetCtx, width, height) {
  const scaleFactor = width / canvas.width;

  applyConstraints();

  targetCtx.fillStyle = backgroundColorPicker.value;
  targetCtx.fillRect(0, 0, width, height);

  if (userImage) {
    const currentWidth = imageInitialWidth * imageScale;
    const currentHeight = imageInitialHeight * imageScale;
    targetCtx.drawImage(
      userImage,
      imageX * scaleFactor,
      imageY * scaleFactor,
      currentWidth * scaleFactor,
      currentHeight * scaleFactor
    );
  }

  if (toggleOverlay.checked) {
    targetCtx.drawImage(overlay, 0, 0, width, height);
  }

  if (toggleCardCutout.checked) {
    targetCtx.drawImage(cardcutout, 0, 0, width, height);
  }
}

/**
 * Generates a high-resolution image based on the overlay's original size.
 */
function generateHiResImage() {
  const printWidth = 1024;
  const printHeight = 645;

  const printCanvas = document.createElement("canvas");
  printCanvas.width = printWidth;
  printCanvas.height = printHeight;
  const printCtx = printCanvas.getContext("2d");

  drawToCanvas(printCtx, printWidth, printHeight);

  const link = document.createElement("a");
  link.download = "banapassport-decal-hires.png";
  link.href = printCanvas.toDataURL("image/png");
  link.click();
  downloadModal.classList.remove("show");
}

/**
 * Generates a 300 PPI image sized for printing and shows the instruction modal.
 */
function generatePrintImage() {
  const printDPI = 300;
  const cardWidthInches = 3.37;
  const cardHeightInches = 2.125;

  const printWidth = Math.round(cardWidthInches * printDPI);
  const printHeight = Math.round(cardHeightInches * printDPI);

  const printCanvas = document.createElement("canvas");
  printCanvas.width = printWidth;
  printCanvas.height = printHeight;
  const printCtx = printCanvas.getContext("2d");

  drawToCanvas(printCtx, printWidth, printHeight);

  const link = document.createElement("a");
  link.download = "banapassport-decal-print.png";
  link.href = printCanvas.toDataURL("image/png");
  link.click();

  downloadModal.classList.remove("show");

  setTimeout(() => {
    instructionModal.classList.add("show");
  }, 100);
}

/**
 * Reusable function to handle loading an image from a File object.
 */
function loadImageFromFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    console.error("The provided file is not a valid image.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    userImage = new Image();
    userImage.onload = () => {
      const canvasAspectRatio = canvas.width / canvas.height;
      const imageAspectRatio = userImage.naturalWidth / userImage.naturalHeight;

      if (imageAspectRatio > canvasAspectRatio) {
        imageInitialHeight = canvas.height;
        imageInitialWidth = canvas.height * imageAspectRatio;
      } else {
        imageInitialWidth = canvas.width;
        imageInitialHeight = canvas.width / imageAspectRatio;
      }

      imageScale = 1;
      imageX = (canvas.width - imageInitialWidth) / 2;
      imageY = (canvas.height - imageInitialHeight) / 2;

      canvas.classList.add("interactive");
      drawCanvas();
    };
    userImage.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

imageLoader.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) {
    loadImageFromFile(e.target.files[0]);
  }
});

window.addEventListener("paste", (e) => {
  e.preventDefault();

  const items = e.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].kind === "file" && items[i].type.startsWith("image/")) {
      const imageFile = items[i].getAsFile();
      loadImageFromFile(imageFile);
      break;
    }
  }
});

downloadButton.addEventListener("click", () =>
  downloadModal.classList.add("show")
);

downloadCloseButton.addEventListener("click", () =>
  downloadModal.classList.remove("show")
);
instructionCloseButton.addEventListener("click", () =>
  instructionModal.classList.remove("show")
);
closeInstructionModalButton.addEventListener("click", () =>
  instructionModal.classList.remove("show")
);

window.addEventListener("click", (e) => {
  if (e.target === downloadModal) {
    downloadModal.classList.remove("show");
  }
  if (e.target === instructionModal) {
    instructionModal.classList.remove("show");
  }
});

downloadHiResButton.addEventListener("click", generateHiResImage);
downloadPrintButton.addEventListener("click", generatePrintImage);

toggleOverlay.addEventListener("change", drawCanvas);
toggleCardCutout.addEventListener("change", drawCanvas);
backgroundColorPicker.addEventListener("input", drawCanvas);

overlay.onload = drawCanvas;
cardcutout.onload = drawCanvas;

canvas.addEventListener("mousedown", (e) => {
  if (!userImage) return;
  isDragging = true;
  startDragX = e.offsetX - imageX;
  startDragY = e.offsetY - imageY;
});

canvas.addEventListener("mousemove", (e) => {
  if (isDragging) {
    imageX = e.offsetX - startDragX;
    imageY = e.offsetY - startDragY;
    drawCanvas();
  }
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
});
canvas.addEventListener("mouseleave", () => {
  isDragging = false;
});

canvas.addEventListener("wheel", (e) => {
  if (!userImage) return;
  e.preventDefault();

  const scaleAmount = 0.05;
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;
  const oldWidth = imageInitialWidth * imageScale;
  const oldHeight = imageInitialHeight * imageScale;

  if (e.deltaY < 0) {
    imageScale += scaleAmount;
  } else {
    imageScale -= scaleAmount;
  }

  applyConstraints();

  const newWidth = imageInitialWidth * imageScale;
  const newHeight = imageInitialHeight * imageScale;

  const mouseRatioX = (mouseX - imageX) / oldWidth;
  const widthChange = newWidth - oldWidth;
  imageX -= widthChange * mouseRatioX;

  const mouseRatioY = (mouseY - imageY) / oldHeight;
  const heightChange = newHeight - oldHeight;
  imageY -= heightChange * mouseRatioY;

  drawCanvas();
});
