const DEFAULT_CIRCLE_COLOR = "#a3a3a3";

function getLayoutSlot(slotId) {
  return document.querySelector(`.layout [data-slot="${slotId}"]`);
}

function getSlotWrapper(slotId) {
  return document.querySelector(`[data-slot-wrapper="${slotId}"]`);
}

const imageStates = {};

document.querySelectorAll(".image-slot").forEach(slot => {
  imageStates[slot.dataset.slot] = {
    x: 0,
    y: 0,
    scale: 1,
    minScale: 1,
    maxScale: 8,
    drawWidth: 0,
    drawHeight: 0,
    height: null,
    dragging: false,
    startMouseX: 0,
    startMouseY: 0,
    originX: 0,
    originY: 0
  };

});

function fitImage(slotName) {
  const slot = document.querySelector(
    `.image-slot[data-slot="${slotName}"]`
  );
  const img = slot.querySelector("img");
  if (!img.complete) return;
  const state = imageStates[slotName];
  const slotW = slot.clientWidth;
  const slotH = slot.clientHeight;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const scale = Math.max(
    slotW / imgW,
    slotH / imgH
  );
  state.minScale = scale;
  state.scale = scale;
  state.maxScale = scale * 8;
  state.drawWidth = imgW;
  state.drawHeight = imgH;
  clampPosition(slot, state);
  applyImageTransform(slotName);
}

function applyImageTransform(slotName) {
  const slot = document.querySelector(
    `.image-slot[data-slot="${slotName}"]`
  );
  if (!slot) return;
  const img = slot.querySelector("img");
  const state = imageStates[slotName];
  const width = state.drawWidth * state.scale;
  const height = state.drawHeight * state.scale;
  img.style.width = width + "px";
  img.style.height = height + "px";
  img.style.transform =
    `translate(calc(-50% + ${state.x}px), calc(-50% + ${state.y}px))`;
}

function initImageDragging() {
  document.querySelectorAll(".image-slot").forEach(slot => {
    const slotName = slot.dataset.slot;
    slot.addEventListener("mousedown", startDrag);
    slot.addEventListener("wheel", function (e) {
      if (!slot.classList.contains("has-image")) return;
      e.preventDefault();
      zoomImage(
        slotName,
        e.deltaY,
        e.clientX,
        e.clientY
      );
    }, { passive: false });
    function startDrag(e) {
      if (!slot.classList.contains("has-image")) return;
      e.preventDefault();
      const state = imageStates[slotName];
      state.dragging = true;
      state.startMouseX = e.clientX;
      state.startMouseY = e.clientY;
      state.originX = state.x;
      state.originY = state.y;
      slot.classList.add("is-dragging");
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", stopDrag);
    }
    function drag(e) {
      const state = imageStates[slotName];
      if (!state.dragging) return;
      const dx = e.clientX - state.startMouseX;
      const dy = e.clientY - state.startMouseY;
      state.x = state.originX + dx;
      state.y = state.originY + dy;
      clampPosition(slot, state);
      applyImageTransform(slotName);
    }
    function stopDrag() {
      const state = imageStates[slotName];
      state.dragging = false;
      slot.classList.remove("is-dragging");
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", stopDrag);
    }
  });
}

function clampPosition(slot, state) {
  const limitX = Math.max(
    0,
    (state.drawWidth * state.scale - slot.clientWidth) / 2
  );
  const limitY = Math.max(
    0,
    (state.drawHeight * state.scale - slot.clientHeight) / 2
  );
  state.x = Math.max(
    -limitX,
    Math.min(limitX, state.x)
  );
  state.y = Math.max(
    -limitY,
    Math.min(limitY, state.y)
  );
}

function zoomImage(slotName, delta, mouseX, mouseY) {
  const slot = document.querySelector(
    `.image-slot[data-slot="${slotName}"]`
  );
  const state = imageStates[slotName];
  const oldScale = state.scale;
  const zoomSpeed = 0.0015;
  state.scale *= 1 - delta * zoomSpeed;
  state.scale = Math.max(
    state.minScale,
    Math.min(state.maxScale, state.scale)
  );
  if (oldScale === state.scale) return;
  const rect = slot.getBoundingClientRect();
  const cx = mouseX - rect.left - slot.clientWidth / 2;
  const cy = mouseY - rect.top - slot.clientHeight / 2;
  const ratio = state.scale / oldScale;
  state.x = cx - (cx - state.x) * ratio;
  state.y = cy - (cy - state.y) * ratio;
  clampPosition(slot, state);
  applyImageTransform(slotName);
}

function setSlotImage(slotId, dataUrl, fileName) {
  const slot = getLayoutSlot(slotId);
  if (!slot) {
    return;
  }

  const img = slot.querySelector("img");
  img.src = dataUrl;
  const state = imageStates[slotId];

  state.scale = 1;

  state.x = 0;
  state.y = 0;

  img.onload = () => {
    fitImage(slotId);
  };

  slot.classList.add("has-image");

  const preview = document.querySelector(`[data-preview="${slotId}"]`);
  if (preview) {
    preview.textContent = fileName || "업로드됨";
    preview.classList.add("is-uploaded");
  }
}

function initVerticalResize() {
  document
    .querySelectorAll('[data-slot^="outfit-"]')
    .forEach(slot => {
      const handle = slot.querySelector(".resize-handle-y");
      if (!handle) {
        return;
      }
      handle.addEventListener("mousedown", startResize);
      function startResize(e) {
        e.stopPropagation();
        const startY = e.clientY;
        const startHeight = slot.offsetHeight;
        function resize(ev) {
          const h = Math.max(
            220,
            startHeight + (ev.clientY - startY)
          );
          slot.style.height = h + "px";
          slot.style.minHeight = h + "px";
          fitImage(slot.dataset.slot);
        }
        function stop() {
          document.removeEventListener("mousemove", resize);
          document.removeEventListener("mouseup", stop);
        }
        document.addEventListener("mousemove", resize);
        document.addEventListener("mouseup", stop);
      }
    });
}

function initReferenceResize() {
  console.log("initReferenceResize");
  const slot = document.querySelector('.image-slot[data-slot="reference"]');
  console.log(slot);
  const handle = slot.querySelector(".resize-handle-xy");
  console.log(handle);
  handle.addEventListener("mousedown", function(e) {
    console.log("DOWN");
    e.preventDefault();
    e.stopImmediatePropagation();   // 중요
    start(e);
  });
  function start(e) {
    console.log("REFERENCE START");
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = slot.offsetWidth;
    const startHeight = slot.offsetHeight;
    function resize(ev) {
      console.log("REFERENCE RESIZE");
      const w = Math.max(
        220,
        startWidth + (ev.clientX - startX)
      );
      const h = Math.max(
        300,
        startHeight + (ev.clientY - startY)
      );
      slot.style.width = w + "px";
      slot.style.height = h + "px";
      slot.style.flex = "none";
      fitImage("reference");
    }
    function stop() {
      document.removeEventListener(
        "mousemove",
        resize
      );
      document.removeEventListener(
        "mouseup",
        stop
      );
    }
    document.addEventListener(
      "mousemove",
      resize
    );
    document.addEventListener(
      "mouseup",
      stop
    );
  }
}

function setCircleColor(slotId, color) {
  const circle = getLayoutSlot(slotId);
  if (circle) {
    circle.style.backgroundColor = color;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function initPanelUploads() {
  document.querySelectorAll('.control-panel input[type="file"][data-slot]').forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        setSlotImage(input.dataset.slot, dataUrl, file.name);
      } catch (error) {
        console.error(error);
        window.alert("사진 업로드에 실패했습니다.");
      }
    });
  });
}

function initColorPickers() {
  document.querySelectorAll('.control-panel input[type="color"][data-slot]').forEach((input) => {
    setCircleColor(input.dataset.slot, input.value);

    input.addEventListener("input", () => {
      setCircleColor(input.dataset.slot, input.value);
    });
  });

  document.querySelectorAll(".layout .color-circle[data-slot]").forEach((circle) => {
    if (!circle.style.backgroundColor) {
      circle.style.backgroundColor = DEFAULT_CIRCLE_COLOR;
    }
  });
}

function updateHiddenSlots(group) {
  const selected = group.querySelector(".check-option.is-selected");
  const slotIds = new Set();

  group.querySelectorAll(".check-option").forEach((option) => {
    if (option.dataset.hides) {
      slotIds.add(option.dataset.hides);
    }
    if (option.dataset.shows) {
      slotIds.add(option.dataset.shows);
    }
  });

  slotIds.forEach((slotId) => {
    const wrapper = getSlotWrapper(slotId);
    if (!wrapper) {
      return;
    }

    const shouldHide = selected?.dataset.hides === slotId;
    wrapper.classList.toggle("is-hidden", shouldHide);
  });
}

function initCheckGroups() {
  document.querySelectorAll(".check-group").forEach((group) => {
    const options = [...group.querySelectorAll(".check-option")];

    options.forEach((option) => {
      option.addEventListener("click", () => {
        const isAlreadySelected = option.classList.contains("is-selected");

        options.forEach((item) => {
          item.classList.remove("is-selected", "is-unselected");
        });

        if (isAlreadySelected) {
          updateHiddenSlots(group);
          return;
        }

        option.classList.add("is-selected");
        options
          .filter((item) => item !== option)
          .forEach((item) => item.classList.add("is-unselected"));

        updateHiddenSlots(group);
      });
    });
  });
}

function initEditableFields() {
  document.querySelectorAll(".editable").forEach((field) => {
    field.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        field.blur();
      }
    });

    field.addEventListener("paste", (event) => {
      event.preventDefault();
      const text = event.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    });
  });
}

async function exportAsImage() {
  const captureArea = document.getElementById("capture-area");
  const exportBtn = document.getElementById("export-btn");

  exportBtn.disabled = true;
  exportBtn.textContent = "저장 중...";

  try {
    const canvas = await html2canvas(captureArea, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const link = document.createElement("a");
    link.download = `pair-simple-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    console.error(error);
    window.alert("이미지 저장에 실패했습니다. 다시 시도해 주세요.");
  } finally {
    exportBtn.disabled = false;
    exportBtn.textContent = "이미지로 저장";
  }
}

function initExport() {
  document.getElementById("export-btn").addEventListener("click", exportAsImage);
}

initPanelUploads();
initColorPickers();
initCheckGroups();
initEditableFields();
initImageDragging();
initVerticalResize();
initReferenceResize();
initExport();