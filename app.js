const DEFAULT_CIRCLE_COLOR = "#00e600";

const profileTemplate = document.getElementById("profile-template");
const profilesContainer = document.getElementById("profiles-container");
const referenceTemplate = document.getElementById("reference-template");

let profileCount = 2;

function createProfile(index) {
  const profile = profileTemplate.content.firstElementChild.cloneNode(true);

  profile.dataset.profile = index;

  profile.querySelectorAll("[data-slot]").forEach((el) => {
    el.dataset.slot = el.dataset.slot.replace("-a", `-${index}`);
  });

  profile.querySelectorAll("[data-slot-wrapper]").forEach((el) => {
    el.dataset.slotWrapper = el.dataset.slotWrapper.replace("-a", `-${index}`);
  });

  profile.querySelectorAll("[data-check-group]").forEach((el) => {
    el.dataset.checkGroup = el.dataset.checkGroup.replace("-a", `-${index}`);
  });

  profile.querySelectorAll("[data-preview]").forEach((el) => {
    el.dataset.preview = el.dataset.preview.replace("-a", `-${index}`);
  });

  profile.querySelectorAll("[data-hides]").forEach((el) => {
    el.dataset.hides = el.dataset.hides.replace("-a", `-${index}`);
  });

  profile.querySelectorAll("[data-shows]").forEach((el) => {
    el.dataset.shows = el.dataset.shows.replace("-a", `-${index}`);
  });

  const name = profile.querySelector(".name");
  name.textContent = `이름${index}`;
  name.dataset.placeholder = `이름${index}`;

  return profile;
}

function createReference() {
  return referenceTemplate.content.firstElementChild.cloneNode(true);
}

function getProfileSlots(index) {
  return {
    head: `head-${index}`,
    outfit: `outfit-${index}`,
    profile: `profile-${index}`,
    colors: [
      `color-${index}-1`,
      `color-${index}-2`,
      `color-${index}-3`,
      `color-${index}-4`,
    ],
  };
}

function renderProfiles() {
  profilesContainer.innerHTML = "";

  for (let i = 1; i <= profileCount; i++) {
    profilesContainer.appendChild(createProfile(i));
  }
  profilesContainer.appendChild(createReference());
}

function getLayoutSlot(slotId) {
  return document.querySelector(`.layout [data-slot="${slotId}"]`);
}

function getSlotWrapper(slotId) {
  return document.querySelector(`[data-slot-wrapper="${slotId}"]`);
}

function setSlotImage(slotId, dataUrl, fileName) {
  const slot = getLayoutSlot(slotId);
  if (!slot) {
    return;
  }

  const img = slot.querySelector("img");
  img.src = dataUrl;
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

function renderUploadPanel() {
  const list = document.getElementById("upload-list");

  list.innerHTML = "";

  for (let i = 1; i <= profileCount; i++) {

    const slot = getProfileSlots(i);

    list.insertAdjacentHTML("beforeend", `
            <li class="control-item">

                <div class="control-label">
                    프로필 ${i}
                </div>

                <label class="upload-btn">
                    얼굴
                    <input
                        type="file"
                        hidden
                        data-slot="${slot.head}">
                </label>

                <div
                    class="control-preview"
                    data-preview="${slot.head}">
                    선택되지 않음
                </div>

                <label class="upload-btn">
                    의상
                    <input
                        type="file"
                        hidden
                        data-slot="${slot.outfit}">
                </label>

                <div
                    class="control-preview"
                    data-preview="${slot.outfit}">
                    선택되지 않음
                </div>

            </li>
        `);

  }

  list.insertAdjacentHTML("beforeend", `
        <li class="control-item">

            <div class="control-label">
                참고 이미지
            </div>

            <label class="upload-btn">
                업로드
                <input
                    type="file"
                    hidden
                    data-slot="reference">
            </label>

            <div
                class="control-preview"
                data-preview="reference">
                선택되지 않음
            </div>

        </li>
    `);
}

function updateProfileCounter() {
    document.getElementById("profile-count").textContent =
        `${profileCount}명`;
}

function initProfileButtons() {

    document
        .getElementById("add-profile")
        .addEventListener("click", () => {
            if (profileCount >= 4)
                return;
            profileCount++;
            refreshUI();
        });
    document
        .getElementById("remove-profile")
        .addEventListener("click", () => {
            if (profileCount <= 1)
                return;
            profileCount--;
            refreshUI();
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

function renderColorPanel() {

  const panel = document.getElementById("color-panel");

  panel.innerHTML = "";

  for (let i = 1; i <= profileCount; i++) {

    const slot = getProfileSlots(i);

    panel.insertAdjacentHTML(
      "beforeend",
      `
            <div class="color-group">

                <div class="color-group-label">
                    프로필 ${i}
                </div>

                <div class="color-picker-row">

                    ${slot.colors.map(color => `
                        <label class="color-swatch">

                            <input
                                type="color"
                                value="${DEFAULT_CIRCLE_COLOR}"
                                data-slot="${color}">

                            <span class="color-swatch-ring"></span>

                        </label>
                    `).join("")}

                </div>

            </div>
            `
    );

  }

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

function updateProfileCounter() {
  document.getElementById("profile-count").textContent = `${profileCount}명`;

  document.getElementById("remove-profile").disabled = profileCount === 1;
  document.getElementById("add-profile").disabled = profileCount === 4;
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

function renderControlPanel() {
  renderUploadPanel();
  renderColorPanel();
}

function refreshUI() {
    renderProfiles();
    renderControlPanel();
    initPanelUploads();
    initColorPickers();
    initCheckGroups();
    initEditableFields();
    updateProfileCounter();
}

refreshUI();
initExport();
initProfileButtons();