(() => {
    "use strict";

    const STORAGE_KEY = "pair-simple-save-v1";

    const DB_NAME = "pair-simple-db";
    const DB_VERSION = 2;
    const STORE_NAME = "images";
    const TRANSFORM_STORE = "transforms";

    let db = null;
    let restoringImages = false;
    let restoringTransforms = false;

    function openDB() {
        return new Promise((resolve, reject) => {

            if (db) {
                resolve(db);
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {

                const database = request.result;

                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    database.createObjectStore(STORE_NAME);
                }

                if (!database.objectStoreNames.contains(TRANSFORM_STORE)) {
                    database.createObjectStore(TRANSFORM_STORE);
                }

            };

            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };

            request.onerror = () => reject(request.error);

        });
    }

    function collectState() {
        return {
            savedAt: Date.now(),

            text: [...document.querySelectorAll(".editable")].map(el => el.innerHTML),

            checks: [...document.querySelectorAll(".check-group")].map(group => {
                const selected = group.querySelector(".check-option.is-selected");
                return selected
                    ? [...group.querySelectorAll(".check-option")].indexOf(selected)
                    : -1;
            }),

            colors: [...document.querySelectorAll('input[type="color"]')]
                .map(input => input.value)
        };
    }

    function applyState(state) {
        if (!state) return;

        if (Array.isArray(state.text)) {
            document
                .querySelectorAll(".editable")
                .forEach((el, i) => {
                    if (state.text[i] !== undefined) {
                        el.innerHTML = state.text[i];
                    }
                });
        }

        if (Array.isArray(state.checks)) {

            document.querySelectorAll(".check-group").forEach((group, groupIndex) => {

                const selectedIndex = state.checks[groupIndex];

                if (selectedIndex < 0) return;

                const options = [...group.querySelectorAll(".check-option")];

                options[selectedIndex]?.click();

            });

        }

        if (Array.isArray(state.colors)) {

            document
                .querySelectorAll('input[type="color"]')
                .forEach((input, i) => {

                    if (!state.colors[i]) return;

                    input.value = state.colors[i];

                    input.dispatchEvent(
                        new Event("input", { bubbles: true })
                    );

                });

        }
    }

    function saveState() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(collectState())
            );
        } catch (e) {
            console.error(e);
        }
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            applyState(JSON.parse(raw));

        } catch (e) {
            console.error(e);
        }
    }

    // 처음 열렸을 때 복원
    window.addEventListener("load", loadState);

    // 페이지를 떠날 때 저장
    window.addEventListener("beforeunload", saveState);

    // 입력할 때마다 자동저장
    document.addEventListener("input", e => {
        if (e.target.classList.contains("editable")) {
            saveState();
        }
    });

    document.addEventListener("click", e => {

        if (e.target.closest(".check-option")) {
            saveState();
        }

    });

    document.addEventListener("input", e => {

        if (e.target.matches('input[type="color"]')) {
            saveState();
        }

    });

    openDB().then(async () => {

        loadState();

        watchImages();

        await restoreImages();

        console.log("[IndexedDB] ready");

    });

    async function saveImage(slot, src) {

        const database = await openDB();

        return new Promise((resolve, reject) => {

            const tx = database.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);

            store.put({
                src: src,
                fileName: null
            }, slot);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);

        });

    }

    async function saveTransform(slot, transform) {

        console.log("[Transform Saved]", slot, transform);

        const database = await openDB();

        return new Promise((resolve, reject) => {

            const tx = database.transaction(
                TRANSFORM_STORE,
                "readwrite"
            );

            tx.objectStore(TRANSFORM_STORE)
                .put(transform, slot);

            tx.oncomplete = resolve;

            tx.onerror = () => reject(tx.error);

        });

    }

    async function deleteImage(slot) {

        const database = await openDB();

        return new Promise((resolve, reject) => {

            const tx = database.transaction(STORE_NAME, "readwrite");

            const store = tx.objectStore(STORE_NAME);

            store.delete(slot);

            tx.oncomplete = () => resolve();

            tx.onerror = () => reject(tx.error);

        });

    }

    async function deleteTransform(slot) {

        const database = await openDB();

        return new Promise((resolve, reject) => {

            const tx = database.transaction(
                TRANSFORM_STORE,
                "readwrite"
            );

            tx.objectStore(TRANSFORM_STORE)
                .delete(slot);

            tx.oncomplete = resolve;

            tx.onerror = () => reject(tx.error);

        });

    }

    async function loadImage(slot) {

        const database = await openDB();

        return new Promise((resolve, reject) => {

            const tx = database.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);

            const request = store.get(slot);

            request.onsuccess = () => resolve(request.result);

            request.onerror = () => reject(request.error);

        });

    }

    async function loadTransform(slot) {

        const database = await openDB();

        return new Promise((resolve, reject) => {

            const tx = database.transaction(
                TRANSFORM_STORE,
                "readonly"
            );

            const req = tx
                .objectStore(TRANSFORM_STORE)
                .get(slot);

            req.onsuccess = () => {
                console.log("[Transform Loaded]", slot, req.result);
                resolve(req.result);
            };

            req.onerror = () => reject(req.error);

        });

    }

    async function restoreImages() {

        restoringImages = true;
        restoringTransforms = true;

        const slots = [
            "head-a",
            "head-b",
            "outfit-a",
            "outfit-b",
            "reference"
        ];

        for (const slot of slots) {

            const data = await loadImage(slot);

            if (!data) continue;

            if (typeof data === "string") {

                setSlotImage(
                    slot,
                    data,
                    "복원된 이미지"
                );

            } else {

                setSlotImage(
                    slot,
                    data.src,
                    data.fileName || "복원된 이미지",
                    true
                );

            }

        }

        restoringImages = false;
        restoringTransforms = false;

    }

    window.StorageAPI = {

        saveTransform,

        loadTransform,

        deleteTransform,

        isRestoringTransform() {
            return restoringTransforms;
        }

    };

    function watchImages() {

        document
            .querySelectorAll(".image-slot img")
            .forEach(img => {

                const slot =
                    img.closest(".image-slot").dataset.slot;

                const observer = new MutationObserver(async mutations => {

                    for (const mutation of mutations) {

                        if (mutation.attributeName !== "src")
                            continue;

                        if (restoringImages)
                            continue;

                        if (!img.src)
                            continue;

                        await saveImage(
                            slot,
                            {
                                src: img.src,
                                fileName: img.dataset.filename || ""
                            }
                        );

                    }

                });

                observer.observe(img, {
                    attributes: true,
                    attributeFilter: ["src"]
                });

            });

    }

})();