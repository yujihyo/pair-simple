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

    dragging: false,

    startX: 0,
    startY: 0

  };

});

function applyImageTransform(slotId) {
  const slot = document.querySelector(
    `.image-slot[data-slot="${slotId}"]`
  );
  if (!slot) return;
  const img = slot.querySelector("img");
  const state = imageStates[slotId];
  img.style.transform =
    `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
}

function initImageDragging() {
  document.querySelectorAll(".image-slot img").forEach(img => {
    const slot = img.closest(".image-slot");
    const slotName = slot.dataset.slot;
    img.addEventListener("mousedown", startDrag);
    function startDrag(e) {
      e.preventDefault();
      const state = imageStates[slotName];
      state.dragging = true;
      state.startX = e.clientX - state.x;
      state.startY = e.clientY - state.y;
      img.classList.add("dragging");
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", stopDrag);
    }
    function drag(e) {
      const state = imageStates[slotName];
      if (!state.dragging) return;
      state.x = e.clientX - state.startX;
      state.y = e.clientY - state.startY;
      applyImageTransform(slotName);
    }
    function stopDrag() {
      const state = imageStates[slotName];
      state.dragging = false;
      img.classList.remove("dragging");
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", stopDrag);
    }
  });
}

function setSlotImage(slotId, dataUrl, fileName) {
  const slot = getLayoutSlot(slotId);
  if (!slot) {
    return;
  }

  const img = slot.querySelector("img");
  img.src = dataUrl;
  const state = imageStates[slotId];

  state.x = 0;
  state.y = 0;
  state.scale = 1;

  applyImageTransform(slotId);
  slot.classList.add("has-image");

  const preview = document.querySelector(`[data-preview="${slotId}"]`);
  if (preview) {
    preview.textContent = fileName || "업로드됨";
    preview.classList.add("is-uploaded");
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
initExport();
initImageDragging();