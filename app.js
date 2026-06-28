function initImageUploads() {
  document.querySelectorAll(".image-slot").forEach((slot) => {
    const input = slot.querySelector('input[type="file"]');
    const img = slot.querySelector("img");

    slot.addEventListener("click", (event) => {
      if (event.target === img && slot.classList.contains("has-image")) {
        return;
      }
    });

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result;
        slot.classList.add("has-image");
      };
      reader.readAsDataURL(file);
    });
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
          return;
        }

        option.classList.add("is-selected");
        options
          .filter((item) => item !== option)
          .forEach((item) => item.classList.add("is-unselected"));
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

initImageUploads();
initCheckGroups();
initEditableFields();
initExport();
