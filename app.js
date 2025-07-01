const imageLoader = document.getElementById("imageLoader");
const downloadButton = document.getElementById("downloadButton");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const toggleOverlay = document.getElementById("toggleOverlay");
const toggleCardCutout = document.getElementById("toggleCardCutout");
const backgroundColorPicker = document.getElementById("backgroundColorPicker");

const guiPanel = document.getElementById("gui");
const panelToggleButton = document.getElementById("panelToggleButton");
const closePanelButton = document.getElementById("closePanelButton");

const downloadModal = document.getElementById("downloadModal");
const downloadCloseButton = downloadModal.querySelector(".close-button");
const downloadHiResButton = document.getElementById("downloadHiResButton");
const downloadPrintButton = document.getElementById("downloadPrintButton");

const instructionModal = document.getElementById("instructionModal");
const instructionCloseButton = instructionModal.querySelector(".close-button");
const closeInstructionModalButton = document.getElementById(
  "closeInstructionModalButton"
);

const contextMenu = document.getElementById("contextMenu");
const rotationSlider = document.getElementById("rotation-slider");
const rotationValue = document.getElementById("rotation-value");
const scaleSlider = document.getElementById("scale-slider");
const scaleValue = document.getElementById("scale-value");
const xInput = document.getElementById("x-input");
const yInput = document.getElementById("y-input");

const controlsHelpModal = document.getElementById("controlsHelpModal");
const closeControlsHelpButton = document.getElementById(
  "closeControlsHelpButton"
);
const controlsHelpCloseButton =
  controlsHelpModal.querySelector(".close-button");

const overlay = new Image();
overlay.src = "overlay.png";
const cardcutout = new Image();
cardcutout.src = "cardcutout.png";

let userImage = null;
let imageX = 0,
  imageY = 0,
  imageScale = 1,
  imageRotation = 0;
let imageInitialWidth, imageInitialHeight;
let isDragging = false;
let startDragX, startDragY;
let isFirstImage = true;

let initialPinchDistance = null;
let lastTouchX = null;
let lastTouchY = null;
let cardContainerScale = 1;

/**
 * Updates the values in the context menu to match the current image state.
 */
function updateContextMenuControls() {
  if (!userImage) return;
  rotationSlider.value = imageRotation;
  rotationValue.textContent = imageRotation;
  const scalePercentage = Math.round(imageScale * 100);
  scaleSlider.value = scalePercentage;
  scaleValue.textContent = scalePercentage;
  xInput.value = Math.round(imageX);
  yInput.value = Math.round(imageY);
}

/**
 * Enforces the boundaries for the image.
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
 * The drawing functions now handle canvas rotation.
 */
function drawRotatedImage(targetCtx, scaleFactor = 1) {
  if (!userImage) return;
  const currentWidth = imageInitialWidth * imageScale;
  const currentHeight = imageInitialHeight * imageScale;
  const centerX = imageX + currentWidth / 2;
  const centerY = imageY + currentHeight / 2;
  targetCtx.save();
  targetCtx.translate(centerX * scaleFactor, centerY * scaleFactor);
  targetCtx.rotate((imageRotation * Math.PI) / 180);
  targetCtx.drawImage(
    userImage,
    (-currentWidth / 2) * scaleFactor,
    (-currentHeight / 2) * scaleFactor,
    currentWidth * scaleFactor,
    currentHeight * scaleFactor
  );
  targetCtx.restore();
}

/**
 * The main function to draw everything on the on-screen canvas.
 */
function drawCanvas() {
  applyConstraints();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = backgroundColorPicker.value;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawRotatedImage(ctx);
  if (toggleOverlay.checked)
    ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
  if (toggleCardCutout.checked)
    ctx.drawImage(cardcutout, 0, 0, canvas.width, canvas.height);
}

/**
 * Reusable drawing logic for any canvas size.
 */
function drawToCanvas(targetCtx, width, height) {
  const scaleFactor = width / canvas.width;
  applyConstraints();
  targetCtx.fillStyle = backgroundColorPicker.value;
  targetCtx.fillRect(0, 0, width, height);
  drawRotatedImage(targetCtx, scaleFactor);
  if (toggleOverlay.checked) targetCtx.drawImage(overlay, 0, 0, width, height);
  if (toggleCardCutout.checked)
    targetCtx.drawImage(cardcutout, 0, 0, width, height);
}

/**
 * Generates a high-resolution image.
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
 * Generates a 300 PPI image sized for printing.
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
  setTimeout(() => instructionModal.classList.add("show"), 100);
}

/**
 * Shows the controls help modal based on platform.
 */
function showControlsHelp() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const desktopHelp = document.getElementById("desktop-help");
  const mobileHelp = document.getElementById("mobile-help");
  if (isMobile) {
    desktopHelp.style.display = "none";
    mobileHelp.style.display = "block";
  } else {
    desktopHelp.style.display = "block";
    mobileHelp.style.display = "none";
  }
  controlsHelpModal.classList.add("show");
}

/**
 * Reusable function to handle loading an image from a File object.
 */
function loadImageFromFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
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
      imageRotation = 0;
      imageX = (canvas.width - imageInitialWidth) / 2;
      imageY = (canvas.height - imageInitialHeight) / 2;
      canvas.classList.add("interactive");
      updateContextMenuControls();
      drawCanvas();
      if (isFirstImage) {
        showControlsHelp();
        isFirstImage = false;
      }
    };
    userImage.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * Helper function to add both click and touchstart events for mobile reliability.
 */
function addSafeEventListener(element, handler) {
  element.addEventListener("click", handler);
  element.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handler(e);
  });
}

imageLoader.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) loadImageFromFile(e.target.files[0]);
});
window.addEventListener("paste", (e) => {
  e.preventDefault();
  const items = e.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].kind === "file" && items[i].type.startsWith("image/")) {
      loadImageFromFile(items[i].getAsFile());
      break;
    }
  }
});

addSafeEventListener(panelToggleButton, () =>
  guiPanel.classList.toggle("show")
);
addSafeEventListener(closePanelButton, () => guiPanel.classList.remove("show"));
addSafeEventListener(downloadButton, () => downloadModal.classList.add("show"));
addSafeEventListener(instructionCloseButton, () =>
  instructionModal.classList.remove("show")
);
addSafeEventListener(closeInstructionModalButton, () =>
  instructionModal.classList.remove("show")
);
addSafeEventListener(downloadCloseButton, () =>
  downloadModal.classList.remove("show")
);
addSafeEventListener(closeControlsHelpButton, () =>
  controlsHelpModal.classList.remove("show")
);
addSafeEventListener(controlsHelpCloseButton, () =>
  controlsHelpModal.classList.remove("show")
);

function handleOverlayClose(e) {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("show");
  }
  if (e.type === "click" && !contextMenu.contains(e.target)) {
    contextMenu.classList.remove("show");
  }
}
window.addEventListener("click", handleOverlayClose);
window.addEventListener("touchend", handleOverlayClose);

addSafeEventListener(downloadHiResButton, generateHiResImage);
addSafeEventListener(downloadPrintButton, generatePrintImage);

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (!userImage) return;

  if (contextMenu.classList.contains("show")) {
    contextMenu.classList.remove("show");
  }

  requestAnimationFrame(() => {
    updateContextMenuControls();

    let top = e.clientY;
    let left = e.clientX;

    const menuWidth = 220;
    const menuHeight = 180;
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 5;
    }
    if (top + menuHeight > window.innerHeight) {
      top = window.innerHeight - menuHeight - 5;
    }

    contextMenu.style.left = `${left}px`;
    contextMenu.style.top = `${top}px`;
    contextMenu.style.transformOrigin = "top left";
    contextMenu.classList.add("show");
  });
});
rotationSlider.addEventListener("input", (e) => {
  imageRotation = parseInt(e.target.value, 10);
  drawCanvas();
  rotationValue.textContent = imageRotation;
});
scaleSlider.addEventListener("input", (e) => {
  imageScale = parseInt(e.target.value, 10) / 100;
  drawCanvas();
  scaleValue.textContent = Math.round(imageScale * 100);
});
xInput.addEventListener("input", (e) => {
  imageX = parseInt(e.target.value, 10);
  drawCanvas();
});
yInput.addEventListener("input", (e) => {
  imageY = parseInt(e.target.value, 10);
  drawCanvas();
});

canvas.addEventListener("mousedown", (e) => {
  if (!userImage || e.button !== 0) return;
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
window.addEventListener(
  "wheel",
  (e) => {
    if (canvas.contains(e.target)) {
      if (!userImage) return;
      e.preventDefault();
      const scaleAmount = 0.05;
      const oldWidth = imageInitialWidth * imageScale;
      const oldHeight = imageInitialHeight * imageScale;
      if (e.deltaY < 0) imageScale += scaleAmount;
      else imageScale -= scaleAmount;
      applyConstraints();
      const newWidth = imageInitialWidth * imageScale;
      const newHeight = imageInitialHeight * imageScale;
      imageX -= ((newWidth - oldWidth) * (e.offsetX - imageX)) / oldWidth;
      imageY -= ((newHeight - oldHeight) * (e.offsetY - imageY)) / oldHeight;
      drawCanvas();
    } else if (
      !guiPanel.contains(e.target) &&
      !contextMenu.classList.contains("show")
    ) {
      e.preventDefault();
      const scaleAmount = 0.1;
      if (e.deltaY < 0) cardContainerScale += scaleAmount;
      else cardContainerScale -= scaleAmount;
      cardContainerScale = Math.max(0.2, Math.min(cardContainerScale, 2));
      canvas.style.transform = `scale(${cardContainerScale})`;
    }
  },
  { passive: false }
);

canvas.addEventListener(
  "touchstart",
  (e) => {
    if (!userImage) return;
    if (e.touches.length === 1) {
      isDragging = true;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      initialPinchDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  },
  { passive: false }
);
canvas.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    if (!userImage) return;
    if (isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - lastTouchX;
      const deltaY = e.touches[0].clientY - lastTouchY;
      imageX += deltaX;
      imageY += deltaY;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      drawCanvas();
    } else if (e.touches.length === 2) {
      const currentPinchDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleChange = currentPinchDistance / initialPinchDistance;
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const canvasRect = canvas.getBoundingClientRect();
      const canvasMidX = midX - canvasRect.left;
      const canvasMidY = midY - canvasRect.top;
      imageX = canvasMidX - (canvasMidX - imageX) * scaleChange;
      imageY = canvasMidY - (canvasMidY - imageY) * scaleChange;
      imageScale *= scaleChange;
      initialPinchDistance = currentPinchDistance;
      drawCanvas();
    }
  },
  { passive: false }
);
canvas.addEventListener("touchend", () => {
  isDragging = false;
  initialPinchDistance = null;
  lastTouchX = null;
  lastTouchY = null;
});

toggleOverlay.addEventListener("change", drawCanvas);
toggleCardCutout.addEventListener("change", drawCanvas);
backgroundColorPicker.addEventListener("input", drawCanvas);
overlay.onload = drawCanvas;
cardcutout.onload = drawCanvas;
