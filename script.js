const fileInput = document.getElementById('fileInput');
const editorCanvas = document.getElementById('editorCanvas');
const ctx = editorCanvas.getContext('2d');
const scaleInput = document.getElementById('scalePercent');
const hotspotXInput = document.getElementById('hotspotX');
const hotspotYInput = document.getElementById('hotspotY');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const uploadArea = document.getElementById('upload-area');
const editorArea = document.getElementById('editor-area');
const downloadArea = document.getElementById('download-area');
const downloadPreview = document.getElementById('downloadPreview');
const processingText = document.getElementById('processingText');

let image = new Image();

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  processingText.style.display = 'block';

  const reader = new FileReader();
  reader.onload = () => {
    image.onload = () => {
      const size = Math.max(image.width, image.height);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(image, 0, 0);
      image.src = canvas.toDataURL();

      drawEditorCanvas();
      uploadArea.classList.add('hidden');
      editorArea.classList.remove('hidden');
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

function drawEditorCanvas() {
  const scale = parseInt(scaleInput.value) / 100;
  const w = Math.floor(image.width * scale);
  const h = Math.floor(image.height * scale);
  editorCanvas.width = w;
  editorCanvas.height = h;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(image, 0, 0, w, h);

  // Draw red dot for hotspot
  ctx.beginPath();
  ctx.arc(hotspotXInput.value, hotspotYInput.value, 5, 0, 2 * Math.PI);
  ctx.fillStyle = 'red';
  ctx.fill();
}

[scaleInput, hotspotXInput, hotspotYInput].forEach(el =>
  el.addEventListener('input', drawEditorCanvas)
);

generateBtn.addEventListener('click', async () => {
  const scale = parseInt(scaleInput.value) / 100;
  const w = Math.floor(image.width * scale);
  const h = Math.floor(image.height * scale);
  const hotX = parseInt(hotspotXInput.value);
  const hotY = parseInt(hotspotYInput.value);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(image, 0, 0, w, h);
  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
  const buffer = await blob.arrayBuffer();

  const ICONDIR_SIZE = 6;
  const ICONDIRENTRY_SIZE = 16;
  const total = ICONDIR_SIZE + ICONDIRENTRY_SIZE + buffer.byteLength;
  const fileBuf = new ArrayBuffer(total);
  const view = new DataView(fileBuf);
  let offset = 0;

  view.setUint16(offset, 0, true);
  view.setUint16(offset + 2, 2, true);
  view.setUint16(offset + 4, 1, true);
  offset += ICONDIR_SIZE;

  view.setUint8(offset, w === 256 ? 0 : w);
  view.setUint8(offset + 1, h === 256 ? 0 : h);
  view.setUint8(offset + 2, 0);
  view.setUint8(offset + 3, 0);
  view.setUint16(offset + 4, hotX, true);
  view.setUint16(offset + 6, hotY, true);
  view.setUint32(offset + 8, buffer.byteLength, true);
  view.setUint32(offset + 12, ICONDIR_SIZE + ICONDIRENTRY_SIZE, true);
  offset += ICONDIRENTRY_SIZE;

  new Uint8Array(fileBuf, offset).set(new Uint8Array(buffer));

  const curBlob = new Blob([fileBuf], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(curBlob);
  downloadPreview.style.backgroundImage = `url(${image.src})`;
  downloadBtn.onclick = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cursor.cur';
    a.click();
  };

  editorArea.classList.add('hidden');
  downloadArea.classList.remove('hidden');
});