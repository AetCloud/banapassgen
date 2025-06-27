const imageLoader = document.getElementById("imageLoader");
const downloadLink = document.getElementById("downloadLink");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const toggleOverlay = document.getElementById("toggleOverlay");
const toggleCardCutout = document.getElementById("toggleCardCutout");
const backgroundColorPicker = document.getElementById("backgroundColorPicker");

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
 * NEW: This function enforces the boundaries for the image.
 * It's called after every move or zoom operation.
 */
function applyConstraints() {
  if (imageScale < 1) {
    imageScale = 1;
  }

  const currentWidth = imageInitialWidth * imageScale;
  const currentHeight = imageInitialHeight * imageScale;

  if (imageX > 0) imageX = 0;
  if (imageY > 0) imageY = 0;

  const minX = canvas.width - currentWidth;
  const minY = canvas.height - currentHeight;
  if (imageX < minX) imageX = minX;
  if (imageY < minY) imageY = minY;
}

/**
 * The main function to draw everything on the canvas.
 */
function drawCanvas() {
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

  downloadLink.href = canvas.toDataURL("image/png");
}

imageLoader.addEventListener("change", (e) => {
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
      applyConstraints();
      drawCanvas();
    };
    userImage.src = event.target.result;
  };
  if (e.target.files[0]) {
    reader.readAsDataURL(e.target.files[0]);
  }
});

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
    applyConstraints();
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

  applyConstraints();
  drawCanvas();
});
