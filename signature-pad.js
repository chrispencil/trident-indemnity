function createSignaturePad(canvas) {
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let hasInk = false;
  let lastX = 0;
  let lastY = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const prev = hasInk ? canvas.toDataURL() : null;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#121315';
    if (prev) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = prev;
    }
  }

  function pointFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function start(e) {
    e.preventDefault();
    drawing = true;
    const p = pointFromEvent(e);
    lastX = p.x;
    lastY = p.y;
  }

  function move(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastX = p.x;
    lastY = p.y;
    hasInk = true;
    canvas.dispatchEvent(new Event('sig:change'));
  }

  function end() { drawing = false; }

  canvas.addEventListener('pointerdown', start);
  canvas.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  window.addEventListener('touchend', end);

  window.addEventListener('resize', resize);
  resize();

  return {
    clear() {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      hasInk = false;
      canvas.dispatchEvent(new Event('sig:change'));
    },
    isEmpty() { return !hasInk; },
    toDataURL(maxWidth, maxHeight) {
      const out = document.createElement('canvas');
      out.width = maxWidth;
      out.height = maxHeight;
      const octx = out.getContext('2d');
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, maxWidth, maxHeight);
      octx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, maxWidth, maxHeight);
      return out.toDataURL('image/png');
    }
  };
}
