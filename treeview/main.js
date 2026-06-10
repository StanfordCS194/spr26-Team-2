    (async function treeviewApp() {
    const bootRes = await fetch("/api/bootstrap");
    if (!bootRes.ok) {
      document.body.innerHTML =
        '<div style="padding:2rem;font-family:sans-serif;color:#8c1515;">TreeView could not load dorm data. Run <code>npm run seed</code> and restart the server.</div>';
      return;
    }
    const boot = await bootRes.json();

    const ROOM_LABELS = boot.roomLabels;
    const HOUSES = boot.dorms;
    const DORM_COORDS = boot.dorms.map((d) => ({ id: d.id, lat: d.lat, lng: d.lng }));
    const QUIZ_QUESTIONS = boot.quizQuestions;
    const REASON_LABELS = boot.reasonLabels;
    const RANKINGS_SORT_OPTIONS = boot.rankingsSortOptions;
    const RANKINGS_FILTERS = boot.rankingsFilters;
    const MAIN_QUAD = boot.mainQuad;
    const CAMPUS_LANDMARKS = boot.landmarks;
    const WALK_SPEED_KMH = boot.walkSpeedKmh;
    const DETOUR_FACTOR = boot.detourFactor;

    const frosh = HOUSES.filter((h) => h.category === "frosh");
    const fourClass = HOUSES.filter((h) => h.category === "four_class");

    const tourCache = new Map();
    async function fetchTourConfig(dormId) {
      if (tourCache.has(dormId)) return tourCache.get(dormId);
      const res = await fetch("/api/dorms/" + encodeURIComponent(dormId) + "/tour");
      if (!res.ok) {
        tourCache.set(dormId, null);
        return null;
      }
      const data = await res.json();
      tourCache.set(dormId, data.config);
      return data.config;
    }

    function getVisitorId() {
      let id = localStorage.getItem("tv-visitor-id");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("tv-visitor-id", id);
      }
      return id;
    }

    let userProfile = null;
    async function loadUserProfile() {
      const res = await fetch("/api/profile/" + encodeURIComponent(getVisitorId()));
      if (!res.ok) return;
      userProfile = await res.json();

      const localFavs = JSON.parse(localStorage.getItem("tv-favorites") || "[]");
      if (!userProfile.shortlist.length && localFavs.length) {
        await saveUserProfile({ shortlist: localFavs });
      } else if (userProfile.shortlist.length) {
        localStorage.setItem("tv-favorites", JSON.stringify(userProfile.shortlist));
      }

      const localTheme = localStorage.getItem("tv-theme");
      if (userProfile.theme && userProfile.theme !== "system") {
        localStorage.setItem("tv-theme", userProfile.theme);
      } else if (localTheme) {
        await saveUserProfile({ theme: localTheme });
      }
    }

    async function saveUserProfile(patch) {
      const res = await fetch("/api/profile/" + encodeURIComponent(getVisitorId()), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) userProfile = await res.json();
    }

    await loadUserProfile();

    // Cached DOM nodes we touch on every interaction (avoids repeating getElementById everywhere)
    const dormSelect = document.getElementById("dorm-select");
    const dormHint = document.getElementById("dorm-hint");
    const roomLabel = document.getElementById("room-label");
    const pillsEl = document.getElementById("pills");
    const previewTitle = document.getElementById("preview-title");

    const designerUploadRoot = document.getElementById("designer-upload");
    const roomUploadForm = document.getElementById("room-upload-form");
    const roomNameInput = document.getElementById("room-name-input");
    const roomPhotosInput = document.getElementById("room-photos-input");
    const uploadDropzoneEl = document.getElementById("upload-dropzone");
    const uploadThumbsEl = document.getElementById("upload-thumbs");
    const uploadReqCountEl = document.getElementById("upload-req-count");
    const uploadReqFormatEl = document.getElementById("upload-req-format");
    const uploadReqSizeEl = document.getElementById("upload-req-size");
    const uploadReadyRowEl = document.getElementById("upload-ready-row");
    const uploadReadyTextEl = document.getElementById("upload-ready-text");
    const uploadReqAnnounceEl = document.getElementById("upload-req-announce");
    // === Panorama (single equirectangular image) alternative input ===
    const roomPanoInput = document.getElementById("room-pano-input");
    const panoPreviewEl = document.getElementById("pano-preview");
    const panoPreviewImg = document.getElementById("pano-preview-img");
    const panoPreviewNameEl = document.getElementById("pano-preview-name");
    const panoRemoveBtn = document.getElementById("pano-remove");
    // === Upload Result Elements ===
    // These elements show the outcome (success or error) after the user clicks "Create 3D room"
    const uploadSubmitEl = document.getElementById("upload-submit");
    const uploadSubmitTextEl = uploadSubmitEl.querySelector(".upload-submit-text");
    const uploadResultEl = document.getElementById("upload-result");
    const sharedUploadPanelEl = document.getElementById("shared-upload-panel");
    const room3dCopyLinkBtn = document.getElementById("room3d-copy-link-btn");
    const uploadNotFoundEl = document.getElementById("upload-not-found");
    const uploadNotFoundStartBtn = document.getElementById("upload-not-found-start");

    // API endpoint where we send the photos. Path is relative, so it resolves to
    // http://localhost:3000/api/upload (same domain, same port)
    const UPLOAD_ENDPOINT = "/api/upload";

    const ROOM_PHOTO_LABELS = [
      "1. North wall",
      "2. South wall",
      "3. East wall",
      "4. West wall",
      "5. Ceiling",
      "6. Floor",
    ];
    const WALL_SLOT_OPTIONS = [
      { value: 0, label: "North wall" },
      { value: 1, label: "South wall" },
      { value: 2, label: "East wall" },
      { value: 3, label: "West wall" },
      { value: 4, label: "Ceiling" },
      { value: 5, label: "Floor" },
    ];
    const MAX_ROOM_PHOTOS = ROOM_PHOTO_LABELS.length;
    const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
    const MAX_PANO_BYTES = 20 * 1024 * 1024; // panos run large; matches server's PANO_MAX_SIZE
    const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

    let roomPhotoEntries = [];
    // When set ({ file, url }), the user is in panorama mode instead of 6-photo
    // mode. The two are mutually exclusive — choosing one clears the other.
    let panoEntry = null;
    let activeSharedUploadMeta = null;
    let sharedUploadHydrated = false;
    let currentRoomUploadId = null;
    let lastFormatRejectNames = [];
    let lastSizeRejectNames = [];
    let lastCapSkip = false;

    function hasAllowedImageExtension(name) {
      return /\.(jpe?g|png|webp)$/i.test(name || "");
    }

    function isValidImageFile(file) {
      if (ALLOWED_IMAGE_MIME.has(file.type)) return true;
      return Boolean(!file.type && hasAllowedImageExtension(file.name));
    }

    function revokeRoomPhoto(entry) {
      if (entry && entry.url) URL.revokeObjectURL(entry.url);
    }

    function resetRoomPhotoEntries(entries = []) {
      roomPhotoEntries.forEach(revokeRoomPhoto);
      roomPhotoEntries = entries;
    }

    // --- Panorama mode ---------------------------------------------------------

    // Reflect pano vs 6-photo mode in the form: show the pano preview and hide
    // the six-photo machinery (thumbs + the "0 of 6" checklist) while in pano mode.
    function syncPanoUI() {
      const inPano = !!panoEntry;
      if (panoPreviewEl) panoPreviewEl.hidden = !inPano;
      if (inPano && panoEntry) {
        if (panoPreviewImg) panoPreviewImg.src = panoEntry.url;
        if (panoPreviewNameEl) panoPreviewNameEl.textContent = panoEntry.file.name;
      }
      if (uploadThumbsEl) uploadThumbsEl.hidden = inPano;
      if (uploadReqAnnounceEl) uploadReqAnnounceEl.hidden = inPano;
    }

    // Accept a single equirectangular image. Clears any 6-photo selection (the
    // two inputs are mutually exclusive), then refreshes the form.
    function setPanoFile(file) {
      if (!file) return;
      if (!isValidImageFile(file)) {
        lastFormatRejectNames = [file.name];
        renderRoomUploadUI();
        return;
      }
      if (file.size > MAX_PANO_BYTES) {
        lastSizeRejectNames = [file.name];
        renderRoomUploadUI();
        return;
      }
      lastFormatRejectNames = [];
      lastSizeRejectNames = [];
      lastCapSkip = false;
      resetRoomPhotoEntries([]); // leave 6-photo mode
      if (panoEntry) revokeRoomPhoto(panoEntry);
      panoEntry = { file, url: URL.createObjectURL(file) };
      renderRoomUploadUI();
    }

    function clearPano() {
      if (panoEntry) revokeRoomPhoto(panoEntry);
      panoEntry = null;
      if (roomPanoInput) roomPanoInput.value = "";
      renderRoomUploadUI();
    }

    // When designing a stock dorm room (no upload), this carries the dorm,
    // scene, and shareable designId. Any upload flow clears it.
    let dormRoomContext = null;
    // Set by the room builder IIFE so view switching can resize/sync the stage.
    let roomStageApi = null;

    function setCurrentRoomUploadId(uploadId) {
      currentRoomUploadId = uploadId || null;
      dormRoomContext = null;
      if (room3dCopyLinkBtn) {
        room3dCopyLinkBtn.disabled = !currentRoomUploadId;
        room3dCopyLinkBtn.textContent = "Copy share link";
      }
    }

    function hideUploadNotFoundScreen() {
      if (!uploadNotFoundEl) return;
      uploadNotFoundEl.hidden = true;
    }

    function showUploadNotFoundScreen(message) {
      hideSharedUploadPanel();
      setCurrentRoomUploadId(null);
      activeSharedUploadMeta = null;
      sharedUploadHydrated = false;
      designerUploadRoot.hidden = true;
      roomUploadForm.hidden = true;
      const stage = document.getElementById("room3d-stage");
      if (stage) stage.hidden = true;
      if (uploadNotFoundEl) {
        const copy = uploadNotFoundEl.querySelector(".upload-not-found-copy");
        if (copy) copy.textContent = message || "This shared room link may be invalid, expired, deleted, or mistyped.";
        uploadNotFoundEl.hidden = false;
      }
    }

    function beginNewRoomUpload() {
      activeSharedUploadMeta = null;
      sharedUploadHydrated = false;
      setCurrentRoomUploadId(null);
      resetRoomPhotoEntries([]);
      if (panoEntry) { revokeRoomPhoto(panoEntry); panoEntry = null; }
      if (roomPanoInput) roomPanoInput.value = "";
      roomNameInput.value = "My Room";
      clearUploadResult();
      hideSharedUploadPanel();
      hideUploadNotFoundScreen();
      renderRoomUploadUI();
      designerUploadRoot.hidden = false;
      roomUploadForm.hidden = false;
      const stage = document.getElementById("room3d-stage");
      if (stage) stage.hidden = true;
    }

    if (uploadNotFoundStartBtn) {
      uploadNotFoundStartBtn.addEventListener("click", () => {
        beginNewRoomUpload();
        designerUploadRoot.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    function formatPhotoSize(bytes) {
      if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
      return Math.max(1, Math.round(bytes / 1024)) + " KB";
    }

    function ingestRoomPhotos(fileList) {
      if (panoEntry) clearPano(); // adding wall photos leaves panorama mode
      const incoming = Array.from(fileList);
      lastFormatRejectNames = [];
      lastSizeRejectNames = [];
      lastCapSkip = false;
      loop: for (const file of incoming) {
        if (roomPhotoEntries.length >= MAX_ROOM_PHOTOS) {
          lastCapSkip = true;
          break loop;
        }
        if (!isValidImageFile(file)) {
          lastFormatRejectNames.push(file.name);
          continue;
        }
        if (file.size > MAX_PHOTO_BYTES) {
          lastSizeRejectNames.push(file.name);
          continue;
        }
        roomPhotoEntries.push({ file, url: URL.createObjectURL(file) });
      }
      renderRoomUploadUI();
    }

    function renderRoomUploadUI() {
      const n = roomPhotoEntries.length;
      let countText = `${n} of ${MAX_ROOM_PHOTOS} photos selected`;
      if (lastCapSkip)
        countText += " — some files weren't added (limit is six photos total).";
      uploadReqCountEl.textContent = countText;
      uploadReqCountEl.classList.toggle("is-ok", n === MAX_ROOM_PHOTOS);
      uploadReqCountEl.classList.toggle("is-bad", n !== MAX_ROOM_PHOTOS);

      if (lastFormatRejectNames.length > 0) {
        uploadReqFormatEl.classList.remove("is-ok");
        uploadReqFormatEl.classList.add("is-bad");
        const list = lastFormatRejectNames.slice(0, 2).join(", ");
        const suffix = lastFormatRejectNames.length > 2 ? "… " : "";
        const verb =
          lastFormatRejectNames.length === 1 ? " isn't JPG, PNG, or WebP" : " aren't JPG, PNG, or WebP";
        uploadReqFormatEl.textContent = list + suffix + verb;
      } else {
        uploadReqFormatEl.classList.remove("is-bad");
        uploadReqFormatEl.classList.add("is-ok");
        uploadReqFormatEl.textContent = "Only JPG, PNG, or WebP";
      }

      if (lastSizeRejectNames.length > 0) {
        uploadReqSizeEl.classList.remove("is-ok");
        uploadReqSizeEl.classList.add("is-bad");
        const list = lastSizeRejectNames.slice(0, 2).join(", ");
        const suffix = lastSizeRejectNames.length > 2 ? "… " : "";
        const verb = lastSizeRejectNames.length === 1 ? " is over 10 MB" : " are over 10 MB";
        uploadReqSizeEl.textContent = list + suffix + verb;
      } else {
        uploadReqSizeEl.classList.remove("is-bad");
        uploadReqSizeEl.classList.add("is-ok");
        uploadReqSizeEl.textContent = "Max 10 MB per photo";
      }

      uploadThumbsEl.classList.toggle("has-items", n > 0);
      uploadThumbsEl.replaceChildren();

      roomPhotoEntries.forEach((entry, idx) => {
        const thumb = document.createElement("article");
        thumb.className = "upload-thumb";
        // Draggable so users can rearrange which photo is which wall/ceiling/floor.
        // The slot the photo lands in (idx) decides its face \u2014 labels follow position.
        thumb.draggable = true;
        thumb.dataset.index = String(idx);
        thumb.setAttribute("aria-label", `${ROOM_PHOTO_LABELS[idx]}: ${entry.file.name}. Drag to reorder.`);
        const preview = document.createElement("div");
        preview.className = "upload-thumb-preview";
        const img = document.createElement("img");
        img.alt = ROOM_PHOTO_LABELS[idx];
        img.width = 480;
        img.height = 360;
        img.decoding = "async";
        img.draggable = false; // let the whole tile own the drag, not the <img>
        img.src = entry.url;
        // Wall assignment menu (top-left) — pick which face this photo maps to
        const slotPicker = document.createElement("div");
        slotPicker.className = "upload-thumb-slot-picker";
        const slotTrigger = document.createElement("button");
        slotTrigger.type = "button";
        slotTrigger.className = "upload-thumb-slot-trigger";
        slotTrigger.dataset.slotTrigger = String(idx);
        slotTrigger.setAttribute("aria-haspopup", "menu");
        slotTrigger.setAttribute("aria-expanded", "false");
        slotTrigger.setAttribute("aria-label", `Assign ${entry.file.name} to wall`);
        slotTrigger.textContent = WALL_SLOT_OPTIONS[idx].label;
        const slotMenu = document.createElement("div");
        slotMenu.className = "upload-thumb-slot-menu";
        slotMenu.setAttribute("role", "menu");
        WALL_SLOT_OPTIONS.forEach((opt) => {
          const item = document.createElement("button");
          item.type = "button";
          item.className = "upload-thumb-slot-option";
          item.classList.toggle("is-selected", opt.value === idx);
          item.dataset.slotValue = String(opt.value);
          item.setAttribute("role", "menuitem");
          item.textContent = opt.label;
          slotMenu.appendChild(item);
        });
        slotPicker.addEventListener("mousedown", (ev) => ev.stopPropagation());
        slotPicker.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const item = ev.target.closest("[data-slot-value]");
          if (item) {
            const newSlot = Number.parseInt(item.dataset.slotValue, 10);
            closeWallSlotMenus();
            if (!Number.isNaN(newSlot) && newSlot !== idx) moveRoomPhoto(idx, newSlot);
            return;
          }
          const trigger = ev.target.closest("[data-slot-trigger]");
          if (trigger) {
            const open = !slotPicker.classList.contains("is-open");
            closeWallSlotMenus();
            slotPicker.classList.toggle("is-open", open);
            slotTrigger.setAttribute("aria-expanded", open ? "true" : "false");
          }
        });
        slotPicker.append(slotTrigger, slotMenu);
        const lbl = document.createElement("p");
        lbl.className = "upload-thumb-label";
        lbl.textContent = entry.file.name;
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "upload-thumb-remove";
        removeBtn.dataset.removeIndex = String(idx);
        removeBtn.setAttribute(
          "aria-label",
          `Remove photo ${ROOM_PHOTO_LABELS[idx]}, ${entry.file.name}`,
        );
        removeBtn.appendChild(document.createTextNode("\u00d7"));
        preview.append(img, slotPicker, lbl, removeBtn);
        const meta = document.createElement("div");
        meta.className = "upload-thumb-meta";
        // Reorder controls \u2014 drag works on desktop; these arrows are the touch/keyboard path
        const reorder = document.createElement("div");
        reorder.className = "upload-thumb-reorder";
        const movePrev = document.createElement("button");
        movePrev.type = "button";
        movePrev.className = "upload-thumb-move";
        movePrev.dataset.moveIndex = String(idx);
        movePrev.dataset.moveDir = "-1";
        movePrev.disabled = idx === 0;
        movePrev.setAttribute("aria-label", `Move ${entry.file.name} to previous slot`);
        movePrev.appendChild(document.createTextNode("\u25c0"));
        const moveNext = document.createElement("button");
        moveNext.type = "button";
        moveNext.className = "upload-thumb-move";
        moveNext.dataset.moveIndex = String(idx);
        moveNext.dataset.moveDir = "1";
        moveNext.disabled = idx === roomPhotoEntries.length - 1;
        moveNext.setAttribute("aria-label", `Move ${entry.file.name} to next slot`);
        moveNext.appendChild(document.createTextNode("\u25b6"));
        reorder.append(movePrev, moveNext);
        const sizeEl = document.createElement("div");
        sizeEl.className = "upload-thumb-size";
        sizeEl.textContent = formatPhotoSize(entry.file.size);
        meta.append(reorder, sizeEl);
        thumb.append(preview, meta);
        uploadThumbsEl.appendChild(thumb);
      });

      syncPanoUI();
      const ready = panoEntry ? true : n === MAX_ROOM_PHOTOS;
      uploadSubmitEl.disabled = !ready;
      uploadSubmitEl.setAttribute("aria-disabled", ready ? "false" : "true");
      uploadReadyRowEl.classList.toggle("is-ready", ready);
      if (panoEntry) uploadReadyTextEl.textContent = "360° panorama ready";
      else if (ready) uploadReadyTextEl.textContent = "Ready to upload";
      else if (n === 0) uploadReadyTextEl.textContent = "Add photos to continue";
      else uploadReadyTextEl.textContent = "Select more photos";
    }

    function closeWallSlotMenus() {
      uploadThumbsEl.querySelectorAll(".upload-thumb-slot-picker.is-open").forEach((picker) => {
        picker.classList.remove("is-open");
        const trigger = picker.querySelector("[data-slot-trigger]");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      });
    }

    // Event delegation — same pattern as the room-type pills (`pillsEl` listener below)
    designerUploadRoot.addEventListener("click", (e) => {
      const copyBtn = e.target.closest("[data-action='copy-share-link']");
      if (copyBtn) {
        const id = copyBtn.getAttribute("data-upload-id");
        if (id) copyUploadShareLink(id, copyBtn);
        return;
      }
      if (e.target.closest("[data-action='pick-photos']")) {
        roomPhotosInput.click();
        return;
      }
      if (e.target.closest("[data-action='pick-pano']")) {
        roomPanoInput.click();
        return;
      }
      const removeBtn = e.target.closest("[data-remove-index]");
      if (removeBtn && designerUploadRoot.contains(removeBtn)) {
        const idx = Number.parseInt(removeBtn.getAttribute("data-remove-index"), 10);
        if (!Number.isNaN(idx) && roomPhotoEntries[idx]) {
          revokeRoomPhoto(roomPhotoEntries[idx]);
          roomPhotoEntries.splice(idx, 1);
          renderRoomUploadUI();
        }
        return;
      }
      // Touch/keyboard reorder via the ◀ ▶ arrows on each thumb
      const moveBtn = e.target.closest("[data-move-index]");
      if (moveBtn && designerUploadRoot.contains(moveBtn)) {
        const from = Number.parseInt(moveBtn.getAttribute("data-move-index"), 10);
        const dir = Number.parseInt(moveBtn.getAttribute("data-move-dir"), 10);
        moveRoomPhoto(from, from + dir);
        return;
      }
      if (e.target.closest("[data-action='open-dropzone']")) roomPhotosInput.click();
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".upload-thumb-slot-picker")) closeWallSlotMenus();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeWallSlotMenus();
    });

    // Move a photo from one slot to another, re-rendering so the face labels follow.
    function moveRoomPhoto(from, to) {
      if (
        Number.isNaN(from) || Number.isNaN(to) ||
        from < 0 || to < 0 ||
        from >= roomPhotoEntries.length || to >= roomPhotoEntries.length ||
        from === to
      ) {
        return;
      }
      const [moved] = roomPhotoEntries.splice(from, 1);
      roomPhotoEntries.splice(to, 0, moved);
      renderRoomUploadUI();
    }

    // Swap two photos directly — used by drag-and-drop so dropping A onto B
    // exchanges just those two slots, instead of shoving everything between them
    // down by one (which moveRoomPhoto's splice-reinsert would do).
    function swapRoomPhoto(from, to) {
      if (
        Number.isNaN(from) || Number.isNaN(to) ||
        from < 0 || to < 0 ||
        from >= roomPhotoEntries.length || to >= roomPhotoEntries.length ||
        from === to
      ) {
        return;
      }
      const tmp = roomPhotoEntries[from];
      roomPhotoEntries[from] = roomPhotoEntries[to];
      roomPhotoEntries[to] = tmp;
      renderRoomUploadUI();
    }

    // === Drag-and-drop reordering of the thumbnails (desktop) ===
    // We track the index of the tile being dragged; on drop we splice it into the
    // target slot. The dropzone's file-drop handlers live on a separate element,
    // so these never collide.
    let dragFromIndex = null;

    function thumbIndexFromEvent(e) {
      const thumb = e.target.closest(".upload-thumb");
      if (!thumb || !uploadThumbsEl.contains(thumb)) return null;
      const idx = Number.parseInt(thumb.dataset.index, 10);
      return Number.isNaN(idx) ? null : idx;
    }

    uploadThumbsEl.addEventListener("dragstart", (e) => {
      const idx = thumbIndexFromEvent(e);
      if (idx === null) return;
      dragFromIndex = idx;
      e.dataTransfer.effectAllowed = "move";
      // Firefox requires data to be set for the drag to start
      try { e.dataTransfer.setData("text/plain", String(idx)); } catch { /* empty */ }
      e.target.closest(".upload-thumb").classList.add("is-dragging");
    });

    uploadThumbsEl.addEventListener("dragover", (e) => {
      if (dragFromIndex === null) return;
      e.preventDefault(); // allow drop
      e.dataTransfer.dropEffect = "move";
      const thumb = e.target.closest(".upload-thumb");
      uploadThumbsEl.querySelectorAll(".upload-thumb.is-drop-target").forEach((el) => {
        if (el !== thumb) el.classList.remove("is-drop-target");
      });
      if (thumb && uploadThumbsEl.contains(thumb)) thumb.classList.add("is-drop-target");
    });

    uploadThumbsEl.addEventListener("drop", (e) => {
      if (dragFromIndex === null) return;
      e.preventDefault();
      const to = thumbIndexFromEvent(e);
      const from = dragFromIndex;
      dragFromIndex = null;
      if (to !== null) swapRoomPhoto(from, to);
      else renderRoomUploadUI();
    });

    uploadThumbsEl.addEventListener("dragend", () => {
      dragFromIndex = null;
      uploadThumbsEl.querySelectorAll(".is-dragging, .is-drop-target").forEach((el) =>
        el.classList.remove("is-dragging", "is-drop-target"),
      );
    });

    ["dragenter", "dragover"].forEach((type) =>
      uploadDropzoneEl.addEventListener(type, (e) => {
        e.preventDefault();
        try {
          e.dataTransfer.dropEffect = "copy";
        } catch {
          /* empty */
        }
        uploadDropzoneEl.classList.add("is-dragover");
      }),
    );

    uploadDropzoneEl.addEventListener("dragleave", (e) => {
      if (!uploadDropzoneEl.contains(e.relatedTarget)) uploadDropzoneEl.classList.remove("is-dragover");
    });

    uploadDropzoneEl.addEventListener("dragend", () => uploadDropzoneEl.classList.remove("is-dragover"));

    uploadDropzoneEl.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadDropzoneEl.classList.remove("is-dragover");
      if (e.dataTransfer?.files?.length) ingestRoomPhotos(e.dataTransfer.files);
    });

    roomPhotosInput.addEventListener("change", () => {
      if (roomPhotosInput.files?.length) ingestRoomPhotos(roomPhotosInput.files);
      roomPhotosInput.value = "";
    });

    if (roomPanoInput) {
      roomPanoInput.addEventListener("change", () => {
        if (roomPanoInput.files?.length) setPanoFile(roomPanoInput.files[0]);
        roomPanoInput.value = "";
      });
    }
    if (panoRemoveBtn) panoRemoveBtn.addEventListener("click", clearPano);

    // === Helper Functions for Upload ===

    // Security: Escape HTML special characters before injecting into innerHTML
    // Prevents XSS attacks if the server response contains malicious content
    // e.g., server sends uploadId "abc<img src=x>", we convert to "abc&lt;img src=x&gt;"
    function escapeUploadHtml(str) {
      return String(str).replace(/[&<>"']/g, (ch) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[ch]));
    }

    // Show the result banner (success or error) with a message
    // kind: "success" or "error" determines the styling (green vs red)
    function showUploadResult(kind, html) {
      uploadResultEl.hidden = false; // Unhide the banner
      uploadResultEl.classList.remove("is-success", "is-error");
      uploadResultEl.classList.add(kind === "success" ? "is-success" : "is-error");
      uploadResultEl.innerHTML = html; // Inject the message (escaped by caller)
    }

    // Hide the result banner (called at the start of submit to clear old messages)
    function clearUploadResult() {
      uploadResultEl.hidden = true;
      uploadResultEl.classList.remove("is-success", "is-error");
      uploadResultEl.textContent = "";
    }

    function buildShareUrl(uploadId) {
      return (
        window.location.origin +
        window.location.pathname +
        "?upload=" +
        encodeURIComponent(uploadId)
      );
    }

    // Match server filenames (01-north.jpg, etc.) to the same labels as the upload form
    const SHARED_PHOTO_PREFIXES = [
      "01-north",
      "02-south",
      "03-east",
      "04-west",
      "05-ceiling",
      "06-floor",
    ];

    function labelForSharedPhoto(filename) {
      for (let i = 0; i < SHARED_PHOTO_PREFIXES.length; i++) {
        if (filename.startsWith(SHARED_PHOTO_PREFIXES[i])) return ROOM_PHOTO_LABELS[i];
      }
      return filename;
    }

    function formatSharedDate(iso) {
      try {
        return new Date(iso).toLocaleString();
      } catch {
        return iso || "";
      }
    }

    function showSharedPanelError(msg) {
      sharedUploadPanelEl.hidden = false;
      sharedUploadPanelEl.classList.add("is-error");
      sharedUploadPanelEl.innerHTML =
        `<p class="shared-upload-error">${escapeUploadHtml(msg)}</p>`;
    }

    function photoUrlsForSharedUpload(meta) {
      const uploadId = meta.uploadId;
      return (meta.savedFiles || []).map((filename) =>
        "/api/uploads/" +
        encodeURIComponent(uploadId) +
        "/photos/" +
        encodeURIComponent(filename)
      );
    }

    function hideSharedUploadPanel() {
      sharedUploadPanelEl.classList.remove("is-error");
      sharedUploadPanelEl.hidden = true;
      sharedUploadPanelEl.textContent = "";
    }

    function renderSharedUploadSkybox(meta) {
      const roomName = (meta.roomName || "").trim() || "Shared 3D room";
      const urls = photoUrlsForSharedUpload(meta);

      if (meta.kind === "pano") {
        if (!urls.length || typeof window.renderRoomBuilderPano !== "function") return;
        window.renderRoomBuilderPano(urls[0], roomName);
        setActiveView("designer");
        return;
      }

      if (urls.length < MAX_ROOM_PHOTOS || typeof window.renderRoomBuilderSkybox !== "function") return;
      window.renderRoomBuilderSkybox(urls, roomName);
      setActiveView("designer");
    }

    async function hydrateSharedUploadForEditing(meta) {
      const photoUrls = photoUrlsForSharedUpload(meta);
      const savedFiles = meta.savedFiles || [];

      // Panorama: pull the single image back into pano mode for re-editing.
      if (meta.kind === "pano") {
        if (!photoUrls.length) throw new Error("This shared panorama is missing its image.");
        const res = await fetch(photoUrls[0]);
        if (!res.ok) throw new Error("Could not load the shared panorama.");
        const blob = await res.blob();
        const fileName = savedFiles[0] || "shared-pano.jpg";
        const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
        resetRoomPhotoEntries([]);
        if (panoEntry) revokeRoomPhoto(panoEntry);
        panoEntry = { file, url: URL.createObjectURL(file) };
        roomNameInput.value = (meta.roomName || "").trim() || "Shared 3D room";
        lastFormatRejectNames = [];
        lastSizeRejectNames = [];
        lastCapSkip = false;
        renderRoomUploadUI();
        sharedUploadHydrated = true;
        return;
      }

      if (photoUrls.length < MAX_ROOM_PHOTOS) {
        throw new Error("This shared upload does not have all six room photos.");
      }

      const entries = await Promise.all(photoUrls.slice(0, MAX_ROOM_PHOTOS).map(async (url, i) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Could not load shared photo " + (i + 1) + ".");
        const blob = await res.blob();
        const fileName = savedFiles[i] || ("shared-room-" + (i + 1) + ".jpg");
        const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
        return { file, url: URL.createObjectURL(file) };
      }));

      resetRoomPhotoEntries(entries);
      roomNameInput.value = (meta.roomName || "").trim() || "Shared 3D room";
      lastFormatRejectNames = [];
      lastSizeRejectNames = [];
      lastCapSkip = false;
      renderRoomUploadUI();
      sharedUploadHydrated = true;
    }

    function buildDesignShareUrl(designId) {
      return (
        window.location.origin +
        window.location.pathname +
        "?design=" +
        encodeURIComponent(designId)
      );
    }

    async function copyShareLink(url, btn) {
      try {
        await navigator.clipboard.writeText(url);
        const prev = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.textContent = prev;
        }, 2000);
      } catch {
        window.prompt("Copy this link to share your 3D room:", url);
      }
    }

    function copyUploadShareLink(uploadId, btn) {
      return copyShareLink(buildShareUrl(uploadId), btn);
    }

    // ?design=<uuid> — someone's shared dorm-room design. Rebuild the
    // panorama from the tour config and open it in the Room Designer.
    async function loadSharedDesignIfPresent() {
      const designId = new URLSearchParams(window.location.search).get("design");
      if (!designId) return;

      try {
        const res = await fetch("/api/dorm-designs/" + encodeURIComponent(designId));
        let data = null;
        try { data = await res.json(); } catch { /* non-JSON error body */ }
        if (!res.ok || !data || !data.success) {
          throw new Error((data && data.error) || "Server returned " + res.status);
        }
        const scene = sceneFromConfig(await fetchTourConfig(data.dormId), data.sceneId);
        if (!scene) throw new Error("The dorm tour behind this design is unavailable.");
        openDormRoomInStudio(data.dormId, scene, designId);
      } catch (err) {
        setActiveView("designer");
        showUploadNotFoundScreen(err.message || "Could not load this shared design.");
      }
    }

    async function loadSharedUploadIfPresent() {
      const uploadId = new URLSearchParams(window.location.search).get("upload");
      if (!uploadId) return;

      designerUploadRoot.hidden = true;
      roomUploadForm.hidden = true;
      hideSharedUploadPanel();

      try {
        const res = await fetch("/api/uploads/" + encodeURIComponent(uploadId));
        let data = null;
        try {
          data = await res.json();
        } catch {
          /* empty */
        }
        if (!res.ok || !data || !data.success) {
          const msg = (data && data.error) || "Server returned " + res.status;
          if (res.status === 400 || res.status === 404) {
            showUploadNotFoundScreen(msg);
            return;
          }
          throw new Error(msg);
        }
        activeSharedUploadMeta = data;
        sharedUploadHydrated = false;
        setCurrentRoomUploadId(data.uploadId);
        designerUploadRoot.hidden = true;
        roomUploadForm.hidden = true;
        hideUploadNotFoundScreen();
        hideSharedUploadPanel();
        renderSharedUploadSkybox(data);
      } catch (err) {
        showUploadNotFoundScreen(err.message || "Could not load this upload.");
      }
    }

    // Centralized logic for toggling the submit button's "uploading" state
    // Updates button text, disables/enables button, shows/hides spinner
    // This ensures the button state stays consistent throughout the upload process
    function setUploadSubmitting(isSubmitting) {
      uploadSubmitEl.classList.toggle("is-loading", isSubmitting); // Show spinner
      // Enabled when a panorama is selected OR all six photos are present.
      const haveInput = panoEntry ? true : roomPhotoEntries.length === MAX_ROOM_PHOTOS;
      uploadSubmitEl.disabled = isSubmitting || !haveInput;
      uploadSubmitEl.setAttribute(
        "aria-disabled",
        uploadSubmitEl.disabled ? "true" : "false",
      );
      uploadSubmitTextEl.textContent = isSubmitting ? "Uploading..." : "Create 3D room";
    }

    // === Form Submit Handler ===
    // When user clicks "Create 3D room", this function:
    // 1. Packages the 6 selected photos + dorm/room metadata
    // 2. POSTs to the backend (/api/upload)
    // 3. Shows success (with upload ID) or error message
    roomUploadForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // Don't actually submit the form (we handle it with fetch)

      // Safety check: need either a panorama or all six photos, and an enabled button.
      if (uploadSubmitEl.disabled) return;
      if (!panoEntry && roomPhotoEntries.length !== MAX_ROOM_PHOTOS) return;

      clearUploadResult(); // Hide any previous success/error message
      setUploadSubmitting(true); // Show spinner, disable button, change text to "Uploading..."

      // === Panorama path: one equirectangular image → /api/upload-pano ===
      if (panoEntry) {
        const panoRoomName = (roomNameInput.value || "").trim() || "My Room";
        uploadReadyTextEl.textContent = "Uploading panorama to server...";
        // Render locally right away from the in-memory image (no round-trip wait).
        if (window.renderRoomBuilderPano) window.renderRoomBuilderPano(panoEntry.url, panoRoomName);
        try {
          const panoForm = new FormData();
          panoForm.append("panorama", panoEntry.file, panoEntry.file.name);
          panoForm.append("roomName", panoRoomName);
          panoForm.append("dormId", houseId);
          panoForm.append("roomType", roomType);
          const res = await fetch("/api/upload-pano", { method: "POST", body: panoForm });
          let data = null;
          try { data = await res.json(); } catch { /* non-JSON error body */ }
          if (!res.ok || !data || !data.success) {
            throw new Error((data && data.error) || `Server returned ${res.status}`);
          }
          setCurrentRoomUploadId(data.uploadId);
          activeSharedUploadMeta = null;
          sharedUploadHydrated = false;
          hideUploadNotFoundScreen();
          clearUploadResult();
          designerUploadRoot.hidden = true;
          roomUploadForm.hidden = true;
        } catch (err) {
          showUploadResult("error", `Upload failed: ${escapeUploadHtml(err.message)}. The room below is rendered from your local photo — retry to save it and get a share link.`);
          uploadReadyTextEl.textContent = "360° panorama ready";
          // The 3D stage grabbed the scroll when it rendered — bring the error into view.
          uploadResultEl.scrollIntoView({ behavior: "smooth", block: "center" });
        } finally {
          setUploadSubmitting(false);
        }
        return;
      }

      uploadReadyTextEl.textContent = "Uploading photos to server...";

      // User-chosen display name for this room (falls back to a sensible default)
      const roomName = (roomNameInput.value || "").trim() || "My Room";

      // Snapshot the ordered photo URLs now, while roomPhotoEntries is still full.
      // Order is the on-screen slot order: North, South, East, West, Ceiling, Floor.
      // The renderer maps these to cube faces itself.
      const orderedUrls = roomPhotoEntries.map((entry) => entry.url);

      // Render the 3D room immediately from the local photos — no need to wait
      // for the upload round-trip. (We never revoke these object URLs; Three.js
      // keeps referencing them for the skybox textures.)
      if (window.renderRoomBuilderSkybox) {
        window.renderRoomBuilderSkybox(orderedUrls, roomName);
      }

      try {
        // === Build the request ===
        // FormData is a special object that can hold both files and text fields
        // It gets encoded as multipart/form-data (the format for file uploads)
        const formData = new FormData();

        // Add all 6 photos with field name "photos"
        // Server's multer middleware will receive them as req.files
        roomPhotoEntries.forEach((entry) => {
          formData.append("photos", entry.file, entry.file.name);
        });

        // Add metadata: the room's display name plus dorm/room context (the latter
        // still flows through for storage; the designer screen is name-driven now)
        formData.append("roomName", roomName);
        formData.append("dormId", houseId);
        formData.append("roomType", roomType);

        // === Send the request ===
        // fetch sends a POST to /api/upload with the FormData as the body
        const res = await fetch(UPLOAD_ENDPOINT, {
          method: "POST",
          body: formData,
          // Note: don't set Content-Type header — browser auto-sets it for FormData
        });

        // === Parse the response ===
        // Server sends back JSON like { success: true, uploadId: "..." }
        let data = null;
        try {
          data = await res.json();
        } catch {
          // If response isn't JSON (e.g., plain text error), data stays null
          // We'll handle it below with the res.ok check
        }

        // === Check for errors ===
        // res.ok is false if status is 4xx or 5xx
        // data.success is false if server rejected the upload (e.g., wrong file count)
        if (!res.ok || !data || !data.success) {
          const msg = (data && data.error) || `Server returned ${res.status}`;
          throw new Error(msg);
        }

        setCurrentRoomUploadId(data.uploadId);
        activeSharedUploadMeta = null;
        sharedUploadHydrated = false;
        hideUploadNotFoundScreen();
        clearUploadResult();
        designerUploadRoot.hidden = true;
        roomUploadForm.hidden = true;
      } catch (err) {
        // === Error handling ===
        // Show error message to user
        showUploadResult(
          "error",
          `Upload failed: ${escapeUploadHtml(err.message)}. The room below is rendered from your local photos — retry to save it and get a share link.`,
        );
        // Photos remain selected, so user can retry by clicking submit again
        uploadReadyTextEl.textContent = "Ready to upload";
        // The 3D stage grabbed the scroll when it rendered — bring the error into view.
        uploadResultEl.scrollIntoView({ behavior: "smooth", block: "center" });
      } finally {
        // === Cleanup ===
        // This runs whether success or error — restore button to normal state
        setUploadSubmitting(false); // Hide spinner, update button text
      }
    });

    renderRoomUploadUI();

    // “Current” dorm + room type — houseId matches HOUSES[].id; roomType matches ROOM_LABELS keys
    let houseId = "zap";
    let roomType = getHouse(houseId).roomTypes[0];

    function getHouse(id) {
      // Safety net if something weird gets into houseId (shouldn’t happen, but avoids a blank UI)
      return HOUSES.find((h) => h.id === id) || HOUSES[0];
    }

    /* Builds both <optgroup>s from the HOUSES array — no hardcoded <option> tags in the HTML */
    function fillDormDropdown() {
      dormSelect.innerHTML = "";
      const g1 = document.createElement("optgroup");
      g1.label = "First-year designated";
      frosh.forEach((h) => {
        const o = document.createElement("option");
        o.value = h.id;
        o.textContent = h.name;
        g1.appendChild(o);
      });
      dormSelect.appendChild(g1);
      const g2 = document.createElement("optgroup");
      g2.label = "Four-class undergraduate";
      fourClass.forEach((h) => {
        const o = document.createElement("option");
        o.value = h.id;
        o.textContent = h.name;
        g2.appendChild(o);
      });
      dormSelect.appendChild(g2);
      dormSelect.value = houseId;
    }

    /*
     * Wipes and rebuilds the room-type buttons whenever the dorm changes.
     * The active pill gets .is-on so CSS can style it like a selected state.
     */
    function renderPills() {
      const house = getHouse(houseId);
      if (!house.roomTypes.includes(roomType)) roomType = house.roomTypes[0];
      roomLabel.textContent = "Room categories, " + house.name;
      pillsEl.replaceChildren();
      house.roomTypes.forEach((rt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pill-btn" + (rt === roomType ? " is-on" : "");
        btn.textContent = ROOM_LABELS[rt];
        btn.dataset.rt = rt;
        pillsEl.appendChild(btn);
      });
    }

    /* Runs whenever dorm or room type changes: refresh hint + preview title */
    function updatePreview() {
      const house = getHouse(houseId);
      dormHint.textContent =
        house.category === "frosh"
          ? "Undergraduate residence designated for first-year students."
          : "Four-class undergraduate residence; first-year students may be assigned here.";
      previewTitle.textContent = house.name + ", " + ROOM_LABELS[roomType];
      syncDesignDormBtn();
    }

    /* ===== Design a default dorm room =====
     * Pipes a dorm tour panorama into the Room Designer tab (same pipeline as
     * uploaded panoramas), so users can furnish a real dorm room without
     * uploading photos. Designs persist per dorm scene and are shareable via
     * a server-side designId (?design=<uuid>).
     */
    const designDormBtn = document.getElementById("design-dorm-btn");

    // Stable share/persistence id for this browser's design of a dorm scene.
    function dormDesignIdFor(dormId, sceneId) {
      const key = "treeview:dormdesignid:" + dormId + ":" + sceneId;
      let id = localStorage.getItem(key);
      if (!id) {
        id = crypto.randomUUID();
        try { localStorage.setItem(key, id); } catch (_) { /* fine, session-only id */ }
      }
      return id;
    }

    function sceneFromConfig(config, sceneId) {
      if (!config || !config.scenes) return null;
      const id = sceneId || (config.default && config.default.firstScene);
      const scene = id ? config.scenes[id] : null;
      if (!scene || !scene.panorama) return null;
      return { id, panorama: scene.panorama, title: scene.title || "" };
    }

    // Loads a dorm scene into the Room Designer tab. designId is only passed
    // when opening someone's shared design; otherwise this browser's own id
    // for that scene is used (created on first visit).
    function openDormRoomInStudio(dormId, scene, designId) {
      if (typeof window.renderRoomBuilderPano !== "function") return;
      const house = getHouse(dormId);
      setCurrentRoomUploadId(null);
      dormRoomContext = {
        dormId,
        sceneId: scene.id,
        designId: designId || dormDesignIdFor(dormId, scene.id),
      };
      window.renderRoomBuilderPano(
        scene.panorama,
        house.name + (scene.title ? " · " + scene.title : ""),
        { dormRoom: true }
      );
      setActiveView("studio");
    }

    function syncDesignDormBtn() {
      if (!designDormBtn) return;
      designDormBtn.hidden = !hasDormTour(houseId);
    }

    if (designDormBtn) {
      designDormBtn.addEventListener("click", async () => {
        designDormBtn.disabled = true;
        try {
          const config = await fetchTourConfig(houseId);
          // Design the scene the user is currently standing in, not always
          // the first one — they may have walked deeper into the tour.
          let sceneId = null;
          if (
            panoramaViewerDormId === houseId &&
            panoramaViewer &&
            typeof panoramaViewer.getScene === "function"
          ) {
            sceneId = panoramaViewer.getScene();
          }
          const scene = sceneFromConfig(config, sceneId);
          if (scene) openDormRoomInStudio(houseId, scene);
        } finally {
          designDormBtn.disabled = false;
        }
      });
    }

    /* ===== Room Designer empty state: dorm chooser + create CTA ===== */
    const studioDormList = document.getElementById("studio-dorm-list");
    const studioCreateBtn = document.getElementById("studio-create-btn");

    if (studioDormList) {
      HOUSES.filter((h) => h.hasTour).forEach((h) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "room3d-action-btn studio-dorm-btn";
        b.textContent = h.name;
        b.addEventListener("click", async () => {
          b.disabled = true;
          try {
            const scene = sceneFromConfig(await fetchTourConfig(h.id), null);
            if (scene) openDormRoomInStudio(h.id, scene);
          } finally {
            b.disabled = false;
          }
        });
        studioDormList.appendChild(b);
      });
    }

    if (studioCreateBtn) {
      studioCreateBtn.addEventListener("click", () => setActiveView("designer"));
    }

    // Event delegation: one listener on the container instead of per-pill listeners after each re-render
    pillsEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".pill-btn");
      if (!btn || !pillsEl.contains(btn)) return;
      roomType = btn.dataset.rt;
      renderPills();
      updatePreview();
    });

    /* New dorm => reset room type to that dorm’s first available category, then redraw pills */
    dormSelect.addEventListener("change", () => {
      houseId = dormSelect.value;
      roomType = getHouse(houseId).roomTypes[0];
      renderPills();
      updatePreview();
      if (panoramaViewerDormId || activeDashboardView === "residences") {
        loadMainPanoramaForDorm(houseId);
      }
    });

    // The single entry point for programmatic dorm changes (map pin select,
    // rankings row, quiz result, shortlist chip, share links). Dispatching a
    // real `change` event means every dorm-change listener — pills, preview,
    // panorama, walk distances, notes, reviews, rankings highlight, fav star —
    // updates exactly as if the user picked from the dropdown.
    function selectDorm(id) {
      if (!HOUSES.some((h) => h.id === id)) return;
      dormSelect.value = id;
      dormSelect.dispatchEvent(new Event("change"));
    }

    // First paint: populate controls from defaults (first house + its first room type)
    fillDormDropdown();
    renderPills();
    updatePreview();

    function buildNoTourMarkup(dormName) {
      return (
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:20px;text-align:center;color:rgba(255,255,255,0.78);font-family:var(--font-ui);font-size:0.95rem;background:linear-gradient(145deg, rgba(25,33,44,0.92) 0%, rgba(18,24,34,0.95) 100%);">' +
        "No 360 photos yet for " + dormName + "." +
        "</div>"
      );
    }

    function hasDormTour(dormId) {
      const house = getHouse(dormId);
      return Boolean(house && house.hasTour);
    }

    // Boot the 360 viewer — initialized lazily when the residences tab becomes active
    let panoramaViewer = null;
    let panoramaViewerDormId = null;
    let panoramaLoadSeq = 0; // guards against out-of-order tour fetches on fast dorm switches
    async function loadMainPanoramaForDorm(dormId) {
      const panoHost = document.getElementById("treeview-panorama");
      const house = getHouse(dormId);
      const mySeq = ++panoramaLoadSeq;
      const config = await fetchTourConfig(dormId);
      if (mySeq !== panoramaLoadSeq) return; // a newer dorm switch superseded this load

      if (panoramaViewerDormId === dormId && panoramaViewer) return;

      if (panoramaViewer) {
        panoramaViewer.destroy();
        panoramaViewer = null;
      }

      panoramaViewerDormId = dormId;
      panoHost.innerHTML = "";

      if (!config) {
        panoHost.innerHTML = buildNoTourMarkup(house.name);
        return;
      }

      panoramaViewer = pannellum.viewer("treeview-panorama", config);
    }
    function initPanoramaViewer() {
      loadMainPanoramaForDorm(houseId);
    }
    /*
     * Pannellum doesn’t always reflow on its own when the window resizes.
     * Debouncing with setTimeout avoids calling resize() dozens of times while someone drags the edge.
     */
    let resizePanoramaTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizePanoramaTimer);
      resizePanoramaTimer = setTimeout(() => {
        if (panoramaViewer && activeDashboardView === "residences") panoramaViewer.resize();
        if (campusMap && activeDashboardView === "map") campusMap.resize();
      }, 120);
    });

    // ===== FEATURE 1: Dark Mode Toggle =====
    const themeToggles = document.querySelectorAll(".theme-toggle");

    function applyTheme(theme, persist) {
      document.documentElement.setAttribute("data-theme", theme);
      themeToggles.forEach((btn) => {
        btn.innerHTML = theme === "dark" ? "&#9788;" : "&#9790;";
        btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      });
      localStorage.setItem("tv-theme", theme);
      // Only PUT the profile on a real toggle — not when restoring at boot.
      if (persist !== false) saveUserProfile({ theme });
    }

    themeToggles.forEach((btn) => {
      btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "light";
        applyTheme(current === "dark" ? "light" : "dark");
      });
    });

    const savedTheme = localStorage.getItem("tv-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(savedTheme, false);

    // ===== Dashboard view switching =====
    const DASHBOARD_VIEWS = ["home", "residences", "map", "rankings", "designer", "studio", "school"];
    const VIEW_HASHES = {
      home: "#home",
      map: "#map",
      residences: "#residences",
      rankings: "#rankings",
      designer: "#designer",
      studio: "#studio",
      school: "#school",
    };
    const HASH_TO_VIEW = Object.fromEntries(
      Object.entries(VIEW_HASHES).map(([view, hash]) => [hash, view])
    );
    // Legacy hash: walking distances now live inside the dorm detail view.
    HASH_TO_VIEW["#distance"] = "residences";
    let activeDashboardView = "home";
    const sidebarNavButtons = document.querySelectorAll(".sidebar-nav-btn");
    const appSidebarEl = document.getElementById("app-sidebar");
    const sidebarMenuBtnEl = document.getElementById("sidebar-menu-btn");

    function viewFromHash() {
      return HASH_TO_VIEW[window.location.hash.toLowerCase()] || null;
    }

    function updateViewHash(viewId) {
      const hash = VIEW_HASHES[viewId];
      if (!hash || window.location.hash === hash) return;
      history.replaceState(null, "", window.location.pathname + window.location.search + hash);
    }

    function resizeMainPanorama() {
      clearTimeout(resizePanoramaTimer);
      resizePanoramaTimer = setTimeout(() => {
        if (panoramaViewer) panoramaViewer.resize();
      }, 120);
    }

    function setActiveView(viewId, options = {}) {
      const { updateHash = true } = options;
      if (!DASHBOARD_VIEWS.includes(viewId)) return;
      activeDashboardView = viewId;
      document.querySelectorAll(".dashboard-view").forEach((el) => {
        const on = el.dataset.view === viewId;
        el.classList.toggle("is-active", on);
        el.hidden = !on;
      });
      sidebarNavButtons.forEach((btn) => {
        const on = btn.dataset.view === viewId;
        btn.classList.toggle("is-active", on);
        if (on) btn.setAttribute("aria-current", "page");
        else btn.removeAttribute("aria-current");
      });
      if (viewId === "map" && typeof campusMap !== "undefined" && campusMap) {
        requestAnimationFrame(() => campusMap.resize());
      }
      if (viewId === "residences") {
        initPanoramaViewer();
        resizeMainPanorama();
        if (typeof loadReviewsForCurrentDorm === "function") loadReviewsForCurrentDorm();
      }
      // The 3D stage canvas has zero size while its tab is hidden — resize it
      // once the destination view has laid out.
      if ((viewId === "studio" || viewId === "designer") && roomStageApi) {
        requestAnimationFrame(() => {
          if (viewId === "studio") roomStageApi.syncStudioEmpty();
          roomStageApi.resize();
        });
      }
      if (updateHash) {
        updateViewHash(viewId);
      }
      if (window.innerWidth <= 768 && appSidebarEl) {
        appSidebarEl.classList.remove("is-nav-open");
        if (sidebarMenuBtnEl) sidebarMenuBtnEl.setAttribute("aria-expanded", "false");
        const backdrop = document.getElementById("sidebar-backdrop");
        if (backdrop) backdrop.classList.remove("is-visible");
      }
    }

    sidebarNavButtons.forEach((btn) => {
      btn.addEventListener("click", () => setActiveView(btn.dataset.view));
    });

    window.addEventListener("hashchange", () => {
      setActiveView(viewFromHash() || "home", { updateHash: false });
    });

    // Home view intent cards: route the user to the right starting point.
    document.querySelectorAll("[data-home-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.homeAction;
        if (action === "quiz") {
          openQuiz();
        } else {
          setActiveView(action);
        }
      });
    });

    if (sidebarMenuBtnEl && appSidebarEl) {
      sidebarMenuBtnEl.addEventListener("click", () => {
        const open = appSidebarEl.classList.toggle("is-nav-open");
        sidebarMenuBtnEl.setAttribute("aria-expanded", open ? "true" : "false");
        const backdrop = document.getElementById("sidebar-backdrop");
        if (backdrop) backdrop.classList.toggle("is-visible", open);
      });
    }

    const sidebarBackdropEl = document.getElementById("sidebar-backdrop");
    if (sidebarBackdropEl && appSidebarEl && sidebarMenuBtnEl) {
      sidebarBackdropEl.addEventListener("click", () => {
        appSidebarEl.classList.remove("is-nav-open");
        sidebarBackdropEl.classList.remove("is-visible");
        sidebarMenuBtnEl.setAttribute("aria-expanded", "false");
      });
    }

    // ===== FEATURE 2: Favorites / Shortlist =====
    const favBtn = document.getElementById("fav-btn");
    const shortlistSection = document.getElementById("shortlist-section");
    const shortlistChips = document.getElementById("shortlist-chips");

    function getFavorites() {
      if (userProfile && userProfile.shortlist && userProfile.shortlist.length) {
        return userProfile.shortlist;
      }
      try {
        return JSON.parse(localStorage.getItem("tv-favorites") || "[]");
      } catch { return []; }
    }

    function saveFavorites(favs) {
      localStorage.setItem("tv-favorites", JSON.stringify(favs));
      saveUserProfile({ shortlist: favs });
    }

    function isFavorite(id) {
      return getFavorites().includes(id);
    }

    function toggleFavorite(id) {
      let favs = getFavorites();
      if (favs.includes(id)) {
        favs = favs.filter((f) => f !== id);
      } else {
        favs.push(id);
      }
      saveFavorites(favs);
      renderFavUI();
    }

    function renderFavUI() {
      const favs = getFavorites();
      const currentIsFav = favs.includes(houseId);
      favBtn.innerHTML = currentIsFav ? "&#9733;" : "&#9734;";
      favBtn.classList.toggle("is-fav", currentIsFav);
      favBtn.setAttribute("aria-label", currentIsFav ? "Remove from shortlist" : "Add to shortlist");

      shortlistSection.classList.toggle("has-items", favs.length > 0);
      shortlistChips.replaceChildren();

      favs.forEach((favId) => {
        const house = getHouse(favId);
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "shortlist-chip";
        chip.innerHTML =
          '<span class="shortlist-chip-star">&#9733;</span>' +
          '<span>' + house.name + '</span>' +
          '<span class="shortlist-chip-remove" data-remove-fav="' + favId + '">&times;</span>';
        chip.addEventListener("click", (e) => {
          if (e.target.closest("[data-remove-fav]")) {
            toggleFavorite(favId);
            return;
          }
          selectDorm(favId);
          setActiveView("residences");
        });
        shortlistChips.appendChild(chip);
      });
    }

    favBtn.addEventListener("click", () => {
      toggleFavorite(houseId);
    });

    dormSelect.addEventListener("change", () => {
      renderFavUI();
    });

    renderFavUI();

    // ===== FEATURE 3: Dorm Comparison =====
    const compareToggle = document.getElementById("compare-toggle");
    const comparePanel = document.getElementById("compare-panel");
    const compareA = document.getElementById("compare-a");
    const compareB = document.getElementById("compare-b");
    const compareGrid = document.getElementById("compare-grid");

    function fillCompareSelect(sel, selectedId) {
      sel.innerHTML = "";
      const g1 = document.createElement("optgroup");
      g1.label = "First-year designated";
      frosh.forEach((h) => {
        const o = document.createElement("option");
        o.value = h.id;
        o.textContent = h.name;
        g1.appendChild(o);
      });
      sel.appendChild(g1);
      const g2 = document.createElement("optgroup");
      g2.label = "Four-class undergraduate";
      fourClass.forEach((h) => {
        const o = document.createElement("option");
        o.value = h.id;
        o.textContent = h.name;
        g2.appendChild(o);
      });
      sel.appendChild(g2);
      sel.value = selectedId;
    }

    function renderComparison() {
      const a = getHouse(compareA.value);
      const b = getHouse(compareB.value);
      const sharedRooms = new Set(a.roomTypes.filter((rt) => b.roomTypes.includes(rt)));

      function buildCol(house) {
        const col = document.createElement("div");
        col.className = "compare-col";

        const name = document.createElement("p");
        name.className = "compare-col-name";
        name.textContent = house.name;
        col.appendChild(name);

        const catLabel = document.createElement("p");
        catLabel.className = "compare-row-label";
        catLabel.textContent = "Category";
        col.appendChild(catLabel);

        const catVal = document.createElement("p");
        catVal.className = "compare-row-value";
        catVal.textContent = house.category === "frosh" ? "First-year designated" : "Four-class";
        col.appendChild(catVal);

        const rtLabel = document.createElement("p");
        rtLabel.className = "compare-row-label";
        rtLabel.textContent = "Room types (" + house.roomTypes.length + ")";
        col.appendChild(rtLabel);

        const rtList = document.createElement("ul");
        rtList.className = "compare-room-list";
        house.roomTypes.forEach((rt) => {
          const li = document.createElement("li");
          const tag = document.createElement("span");
          tag.className = "compare-room-tag" + (sharedRooms.has(rt) ? " is-shared" : "");
          tag.textContent = ROOM_LABELS[rt];
          li.appendChild(tag);
          rtList.appendChild(li);
        });
        col.appendChild(rtList);

        return col;
      }

      compareGrid.replaceChildren(buildCol(a), buildCol(b));
    }

    compareToggle.addEventListener("click", () => {
      const isOpen = comparePanel.classList.toggle("is-open");
      compareToggle.classList.toggle("is-on", isOpen);
      compareToggle.innerHTML = isOpen ? "&#8644; Hide comparison" : "&#8644; Compare dorms";
      if (isOpen) {
        const secondId = HOUSES[1] ? HOUSES[1].id : HOUSES[0].id;
        fillCompareSelect(compareA, houseId);
        fillCompareSelect(compareB, houseId === secondId ? HOUSES[0].id : secondId);
        renderComparison();
      }
    });

    compareA.addEventListener("change", renderComparison);
    compareB.addEventListener("change", renderComparison);

    // ===== FEATURE 4: Interactive Campus Map =====
    const STANFORD_CENTER = { lat: 37.4241, lng: -122.1661 };
    const MAP_DEFAULT_ZOOM = 14.8;
    const MAP_FLY_ZOOM = 17.5;

    let campusMap = null;
    let mapPanoViewer = null;
    let mapMarkers = [];
    let activePopup = null;

    const mapBackBtn = document.getElementById("map-back-btn");
    const mapOverlay = document.getElementById("map-overlay");
    const mapOverlayTitle = document.getElementById("map-overlay-title");
    const mapOverlaySelect = document.getElementById("map-overlay-select");
    const mapOverlayClose = document.getElementById("map-overlay-close");

    function createMarkerSVG() {
      const el = document.createElement("div");
      el.className = "dorm-marker";
      el.innerHTML = `<div class="dorm-marker-pin">
        <svg viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 10.667 14.4 23.04 15.04 23.616a1.333 1.333 0 001.92 0C17.6 39.04 32 26.667 32 16 32 7.163 24.837 0 16 0z" fill="#8c1515"/>
          <circle cx="16" cy="15" r="6.5" fill="#fff"/>
          <circle cx="16" cy="15" r="3.5" fill="#8c1515"/>
        </svg>
      </div>`;
      return el;
    }

    async function initCampusMap() {
      const container = document.getElementById("campus-map");

      try {
        const res = await fetch("/api/mapbox-token");
        if (!res.ok) throw new Error();
        const { token } = await res.json();
        mapboxgl.accessToken = token;
      } catch {
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.justifyContent = "center";
        container.style.background = "linear-gradient(145deg, #2a3238 0%, #1a2228 40%, #252d35 100%)";
        container.innerHTML = '<p style="color:rgba(255,255,255,0.6);font-family:var(--font-ui);font-size:0.9rem;text-align:center;padding:2rem;">Set MAPBOX_TOKEN in your <code>.env</code> file to enable the campus map.</p>';
        return;
      }

      campusMap = new mapboxgl.Map({
        container: "campus-map",
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [STANFORD_CENTER.lng, STANFORD_CENTER.lat],
        zoom: MAP_DEFAULT_ZOOM,
        pitch: 45,
        bearing: -15,
        antialias: true,
      });

      campusMap.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");
      campusMap.addControl(new mapboxgl.FullscreenControl({ container: document.querySelector(".campus-map-container") }), "top-right");

      campusMap.on("load", () => {
        DORM_COORDS.forEach((dorm) => {
          const house = getHouse(dorm.id);
          if (!house) return;

          const el = createMarkerSVG();

          el.addEventListener("click", (e) => {
            e.stopPropagation();
            if (activePopup) activePopup.remove();
            flyToDorm(dorm, house);
          });

          const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
            .setLngLat([dorm.lng, dorm.lat])
            .addTo(campusMap);

          mapMarkers.push({ marker, dorm, house });
        });
        if (activeDashboardView === "map") {
          requestAnimationFrame(() => campusMap.resize());
        }
      });
    }

    let flySeq = 0; // invalidates stale moveend popups when pins are clicked mid-flight
    function flyToDorm(dorm, house) {
      if (activePopup) { activePopup.remove(); activePopup = null; }
      const mySeq = ++flySeq;

      campusMap.flyTo({
        center: [dorm.lng, dorm.lat],
        zoom: MAP_FLY_ZOOM,
        pitch: 60,
        bearing: 0,
        duration: 2200,
        essential: true,
        curve: 1.42,
      });

      mapBackBtn.classList.add("is-visible");

      campusMap.once("moveend", () => {
        // A newer pin click superseded this flight — don't pop the old dorm.
        if (mySeq !== flySeq) return;
        const categoryLabel = house.category === "frosh"
          ? "First-year designated"
          : "Four-class residence";

        const popupHTML = hasDormTour(house.id)
          ? `
          <p class="map-popup-name">${house.name}</p>
          <p class="map-popup-category">${categoryLabel}</p>
          <button class="map-popup-explore" data-dorm-id="${house.id}">
            Explore 360° &#8594;
          </button>`
          : `
          <p class="map-popup-name">${house.name}</p>
          <p class="map-popup-category">${categoryLabel}</p>
          <p class="map-popup-category" style="margin-top:6px;">No 360 photos yet for this dorm.</p>`;

        const popup = new mapboxgl.Popup({
          offset: [0, -42],
          closeOnClick: false,
          maxWidth: "220px",
        })
          .setLngLat([dorm.lng, dorm.lat])
          .setHTML(popupHTML)
          .addTo(campusMap);

        activePopup = popup;

        const popupEl = popup.getElement();
        popupEl.addEventListener("click", (e) => {
          const exploreBtn = e.target.closest("[data-dorm-id]");
          if (exploreBtn) {
            showMapPanorama(house);
          }
        });
      });
    }

    async function showMapPanorama(house) {
      mapOverlayTitle.textContent = house.name + " — 360° Tour";
      mapOverlay.classList.add("is-visible");

      if (mapPanoViewer) {
        mapPanoViewer.destroy();
        mapPanoViewer = null;
      }

      const mapPanoHost = document.getElementById("map-panorama");
      mapPanoHost.innerHTML = "";
      const config = await fetchTourConfig(house.id);
      if (!config) {
        mapPanoHost.innerHTML = buildNoTourMarkup(house.name);
      } else {
        mapPanoViewer = pannellum.viewer("map-panorama", config);
      }
      mapOverlaySelect.dataset.dormId = house.id;
    }

    function closeMapPanorama() {
      mapOverlay.classList.remove("is-visible");
      if (mapPanoViewer) {
        mapPanoViewer.destroy();
        mapPanoViewer = null;
      }
    }

    function resetMapView() {
      flySeq++; // cancel any pending dorm popup from an in-flight fly-to
      closeMapPanorama();
      if (activePopup) { activePopup.remove(); activePopup = null; }
      mapBackBtn.classList.remove("is-visible");

      if (campusMap) {
        campusMap.flyTo({
          center: [STANFORD_CENTER.lng, STANFORD_CENTER.lat],
          zoom: MAP_DEFAULT_ZOOM,
          pitch: 45,
          bearing: -15,
          duration: 1800,
          essential: true,
        });
      }
    }

    mapBackBtn.addEventListener("click", resetMapView);
    mapOverlayClose.addEventListener("click", () => {
      closeMapPanorama();
    });

    mapOverlaySelect.addEventListener("click", () => {
      const selectedId = mapOverlaySelect.dataset.dormId;
      if (selectedId) {
        selectDorm(selectedId);
        closeMapPanorama();
        resetMapView();
        setActiveView("residences");
      }
    });

    initCampusMap();

    // ===== FEATURE 5: Walking Distance Panel =====
    const walkListEl = document.getElementById("walk-list");
    const walkDormChip = document.getElementById("walk-dorm-chip");

    /*
     * Haversine formula: calculates the great-circle distance between two
     * points on a sphere given their latitudes and longitudes.
     *
     * Why Haversine and not Euclidean? Lat/lng are coordinates on a curved
     * surface. A naive sqrt((lat2-lat1)^2 + (lng2-lng1)^2) would give wrong
     * results because 1° of longitude shrinks as you move away from the
     * equator. Haversine accounts for Earth's curvature.
     *
     * Returns distance in kilometers.
     */
    function haversineKm(lat1, lng1, lat2, lng2) {
      const R = 6371;
      const toRad = (deg) => (deg * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /*
     * Looks up the selected dorm's lat/lng from DORM_COORDS (the campus map
     * data), then computes walking time to each landmark. Sorts by distance
     * so the closest spot is always first.
     */
    function renderWalkDistances() {
      const house = getHouse(houseId);
      walkDormChip.textContent = house.name;

      const dormCoord = DORM_COORDS.find((d) => d.id === houseId);
      if (!dormCoord) {
        walkListEl.innerHTML = '<p style="color:var(--muted);font-size:0.88rem;">Location data not available for this dorm.</p>';
        return;
      }

      const distances = CAMPUS_LANDMARKS.map((lm) => {
        const km = haversineKm(dormCoord.lat, dormCoord.lng, lm.lat, lm.lng);
        const walkKm = km * DETOUR_FACTOR;
        const minutes = Math.round((walkKm / WALK_SPEED_KMH) * 60);
        return { ...lm, km: walkKm, minutes: Math.max(1, minutes) };
      });

      distances.sort((a, b) => a.km - b.km);

      const maxMinutes = Math.max(...distances.map((d) => d.minutes));

      walkListEl.replaceChildren();

      distances.forEach((d) => {
        const item = document.createElement("div");
        item.className = "walk-item";

        const barPct = Math.round((d.minutes / maxMinutes) * 100);
        const distLabel = d.km < 1
          ? Math.round(d.km * 1000) + " m"
          : d.km.toFixed(1) + " km";

        item.innerHTML =
          '<span class="walk-icon">' + d.emoji + '</span>' +
          '<div class="walk-info">' +
            '<p class="walk-name">' + d.name + '</p>' +
            '<p class="walk-dist">' + distLabel + ' walk</p>' +
          '</div>' +
          '<div class="walk-time-wrap">' +
            '<span class="walk-minutes">' + d.minutes + ' <span>min</span></span>' +
            '<div class="walk-bar">' +
              '<div class="walk-bar-fill" style="width:' + barPct + '%"></div>' +
            '</div>' +
          '</div>';

        walkListEl.appendChild(item);
      });
    }

    // Re-render whenever the dorm changes (hooks into existing dormSelect listener)
    dormSelect.addEventListener("change", renderWalkDistances);
    // Initial render
    renderWalkDistances();

    // ===== FEATURE 6: Dorm Rankings Dashboard =====

    let rankingsSort = "overall";
    let rankingsFilter = "all";

    const rankingsSortPills = document.getElementById("rankings-sort-pills");
    const rankingsFilterPills = document.getElementById("rankings-filter-pills");
    const rankingsTable = document.getElementById("rankings-table");

    /*
     * Computes a normalised 0–100 score for each dorm on every criterion.
     * All inputs are real data, not placeholders:
     *   - rating:    average star rating from resident reviews (from MongoDB)
     *   - proximity: true haversine walking distance to Main Quad
     *   - variety:   actual count of room types offered (Stanford R&DE data)
     *   - community: theme-house / program-house designations (R&DE)
     *
     * Overall = 0.30 rating + 0.30 proximity + 0.20 variety + 0.20 community.
     * Dorms with no star ratings yet score a neutral 50 on rating so they
     * aren't punished for missing data.
     */
    function computeRankingsData() {
      const rawData = HOUSES.map((house) => {
        const coord = DORM_COORDS.find((d) => d.id === house.id);
        const distToQuad = coord
          ? haversineKm(coord.lat, coord.lng, MAIN_QUAD.lat, MAIN_QUAD.lng)
          : 2;

        const variety = house.roomTypes.length;
        const communityRaw = variety + (house.communityBonus || 0);

        return {
          house,
          variety,
          distToQuad,
          communityRaw,
          avgRating: typeof house.avgRating === "number" ? house.avgRating : null,
          ratingCount: house.ratingCount || 0,
        };
      });

      // Find min/max for normalisation
      const maxVariety   = Math.max(...rawData.map((d) => d.variety));
      const minVariety   = Math.min(...rawData.map((d) => d.variety));
      const maxDist      = Math.max(...rawData.map((d) => d.distToQuad));
      const minDist      = Math.min(...rawData.map((d) => d.distToQuad));
      const maxCommunity = Math.max(...rawData.map((d) => d.communityRaw));
      const minCommunity = Math.min(...rawData.map((d) => d.communityRaw));

      function norm(val, min, max) {
        return max === min ? 50 : Math.round(((val - min) / (max - min)) * 100);
      }

      return rawData.map((d) => {
        const varietyScore   = norm(d.variety, minVariety, maxVariety);
        // Invert distance: closer = higher score
        const proximityScore = norm(maxDist - d.distToQuad, 0, maxDist - minDist);
        const communityScore = norm(d.communityRaw, minCommunity, maxCommunity);
        // 1-5 stars maps linearly onto 0-100; unrated dorms sit at neutral 50.
        const ratingScore = d.avgRating === null
          ? 50
          : Math.round(((d.avgRating - 1) / 4) * 100);
        const overallScore = Math.round(
          ratingScore * 0.30 + proximityScore * 0.30 + varietyScore * 0.20 + communityScore * 0.20
        );

        return {
          house: d.house,
          avgRating: d.avgRating,
          ratingCount: d.ratingCount,
          scores: {
            overall:   overallScore,
            rating:    ratingScore,
            variety:   varietyScore,
            proximity: proximityScore,
            community: communityScore,
          },
        };
      });
    }

    function renderRankingsPills() {
      rankingsSortPills.replaceChildren();
      RANKINGS_SORT_OPTIONS.forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "rankings-pill" + (rankingsSort === opt.key ? " is-active" : "");
        btn.textContent = opt.label;
        btn.addEventListener("click", () => {
          rankingsSort = opt.key;
          renderRankingsPills();
          renderRankingsTable();
        });
        rankingsSortPills.appendChild(btn);
      });

      rankingsFilterPills.replaceChildren();
      RANKINGS_FILTERS.forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "rankings-filter-pill" + (rankingsFilter === opt.key ? " is-active" : "");
        btn.textContent = opt.label;
        btn.addEventListener("click", () => {
          rankingsFilter = opt.key;
          renderRankingsPills();
          renderRankingsTable();
        });
        rankingsFilterPills.appendChild(btn);
      });
    }

    function renderRankingsTable() {
      let data = computeRankingsData();

      // Filter
      if (rankingsFilter !== "all") {
        data = data.filter((d) => d.house.category === rankingsFilter);
      }

      // Sort descending by the chosen criterion
      data.sort((a, b) => b.scores[rankingsSort] - a.scores[rankingsSort]);

      rankingsTable.replaceChildren();

      if (data.length === 0) {
        rankingsTable.innerHTML = '<div class="rankings-empty">No dorms match this filter.</div>';
        return;
      }

      // Header row
      const sortLabel = RANKINGS_SORT_OPTIONS.find((o) => o.key === rankingsSort).label;
      const header = document.createElement("div");
      header.className = "rankings-header-row";
      header.setAttribute("role", "row");
      header.innerHTML =
        '<span class="rankings-header-cell">#</span>' +
        '<span class="rankings-header-cell">Residence</span>' +
        '<span class="rankings-header-cell">' + sortLabel + '</span>' +
        '<span class="rankings-header-cell">Score</span>';
      rankingsTable.appendChild(header);

      // Data rows
      data.forEach((entry, i) => {
        const score = entry.scores[rankingsSort];
        const row = document.createElement("div");
        row.className = "rankings-row";
        if (entry.house.id === houseId) row.classList.add("is-selected");
        row.setAttribute("role", "row");
        row.style.animationDelay = Math.min(i * 0.04, 0.6) + "s";

        const tierClass =
          i === 0 ? "tier-gold" :
          i === 1 ? "tier-silver" :
          i === 2 ? "tier-bronze" : "tier-normal";

        const categoryLabel = entry.house.category === "frosh"
          ? "First-year" : "Four-class";

        // When ranking by resident rating, show the real star average (and
        // review count) instead of the abstract 0-100 score.
        const scoreLabel =
          rankingsSort === "rating"
            ? (entry.avgRating === null
                ? "—"
                : entry.avgRating.toFixed(1) + "★ (" + entry.ratingCount + ")")
            : String(score);

        row.innerHTML =
          '<span class="rankings-rank">' + (i + 1) + '</span>' +
          '<div class="rankings-dorm-info">' +
            '<span class="rankings-dorm-name">' + entry.house.name + '</span>' +
            '<span class="rankings-dorm-category">' + categoryLabel + '</span>' +
          '</div>' +
          '<div class="rankings-score-bar-wrap">' +
            '<div class="rankings-score-bar">' +
              '<div class="rankings-score-bar-fill ' + tierClass + '" style="width:' + score + '%"></div>' +
            '</div>' +
          '</div>' +
          '<span class="rankings-score-value">' + scoreLabel + '</span>';

        row.addEventListener("click", () => {
          selectDorm(entry.house.id);
          setActiveView("residences");
        });

        rankingsTable.appendChild(row);
      });
    }

    renderRankingsPills();
    renderRankingsTable();

    // Re-render when dorm changes so the "is-selected" highlight follows
    dormSelect.addEventListener("change", renderRankingsTable);

    // =====================================================================
    // FEATURE 7: Per-dorm notes (Noah)
    // Same localStorage pattern Laolu used for favorites/theme. One key per
    // dorm so each dorm's notes are independent. Saves on input (debounced).
    // =====================================================================
    const notesTextarea = document.getElementById("dorm-notes");
    const notesStatus = document.getElementById("notes-status");
    const notesLabel = document.getElementById("notes-label");

    // We namespace localStorage keys so we don't collide with other features.
    function notesKey(id) {
      return "tv-notes:" + id;
    }

    function loadNotesForCurrentDorm() {
      const fromApi = userProfile && userProfile.notes ? userProfile.notes[houseId] : undefined;
      const saved = fromApi !== undefined
        ? fromApi
        : (localStorage.getItem(notesKey(houseId)) || "");
      notesTextarea.value = saved;
      notesLabel.textContent = "Notes for " + getHouse(houseId).name;
    }

    // Debounce so we don't hammer localStorage on every keystroke.
    let notesSaveTimer;
    let notesStatusTimer;
    function scheduleNotesSave() {
      clearTimeout(notesSaveTimer);
      notesSaveTimer = setTimeout(() => {
        const value = notesTextarea.value;
        if (value) {
          localStorage.setItem(notesKey(houseId), value);
          const notes = userProfile && userProfile.notes ? { ...userProfile.notes } : {};
          notes[houseId] = value;
          saveUserProfile({ notes });
        } else {
          localStorage.removeItem(notesKey(houseId));
          const notes = userProfile && userProfile.notes ? { ...userProfile.notes } : {};
          delete notes[houseId];
          saveUserProfile({ notes });
        }
        // Flash a "Saved" indicator next to the label.
        notesStatus.textContent = "Saved";
        notesStatus.classList.add("is-visible");
        clearTimeout(notesStatusTimer);
        notesStatusTimer = setTimeout(() => {
          notesStatus.classList.remove("is-visible");
        }, 1200);
      }, 350);
    }

    notesTextarea.addEventListener("input", scheduleNotesSave);

    // When the dorm changes, swap to that dorm's notes. We re-use the existing
    // dormSelect change pattern — Laolu's renderFavUI listener and the pills
    // listener already fire on the same event; ours just adds to that chain.
    dormSelect.addEventListener("change", loadNotesForCurrentDorm);

    // First paint.
    loadNotesForCurrentDorm();

    // =====================================================================
    // FEATURE: Resident reviews — public, crowdsourced per-dorm feedback.
    //
    // Each dorm is seeded with curated quotes (Reddit/Roomsurf/Stanford Daily,
    // flagged `curated`) and anyone can post their own via the form. Reviews
    // can be anonymous. GET/POST hit /api/dorms/:dormId/reviews. We re-fetch on
    // every dorm change and whenever the Residences view becomes active.
    // =====================================================================
    const reviewsListEl = document.getElementById("reviews-list");
    const reviewsDormNameEl = document.getElementById("reviews-dorm-name");
    const reviewsSummaryEl = document.getElementById("reviews-summary");
    const reviewForm = document.getElementById("review-form");
    const reviewAuthorInput = document.getElementById("review-author");
    const reviewAnonInput = document.getElementById("review-anonymous");
    const reviewBodyInput = document.getElementById("review-body");
    const reviewStarsEl = document.getElementById("review-stars");
    const reviewSubmitBtn = document.getElementById("review-submit");
    const reviewStatusEl = document.getElementById("review-status");
    const reviewToggleBtn = document.getElementById("review-toggle");
    const reviewFormEl = document.getElementById("review-form");

    // Form is collapsed by default so the reviews stay a quiet, secondary
    // section. The toggle mirrors the existing "Compare dorms" pattern.
    function setReviewFormOpen(open) {
      reviewFormEl.hidden = !open;
      reviewToggleBtn.classList.toggle("is-on", open);
      reviewToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
      reviewToggleBtn.innerHTML = open ? "\u2715 Cancel" : "\u270E Write a review";
      if (open) reviewBodyInput.focus();
    }

    let reviewRating = 0;             // 0 = no rating chosen
    let loadedReviewsDormId = null;   // avoid redundant re-fetches

    function starString(n) {
      const filled = Math.max(0, Math.min(5, Math.round(n)));
      return "\u2605".repeat(filled) + "\u2606".repeat(5 - filled);
    }

    // Build the interactive 1–5 star picker in the form. Clicking the current
    // top star again clears the rating (back to "no rating").
    function buildReviewStars() {
      reviewStarsEl.replaceChildren();
      for (let i = 1; i <= 5; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "review-star";
        btn.dataset.value = String(i);
        btn.setAttribute("role", "radio");
        btn.setAttribute("aria-label", i + " star" + (i === 1 ? "" : "s"));
        btn.textContent = "\u2605";
        btn.addEventListener("click", () => {
          reviewRating = (reviewRating === i) ? 0 : i;
          syncReviewStars();
        });
        reviewStarsEl.appendChild(btn);
      }
      syncReviewStars();
    }

    function syncReviewStars() {
      reviewStarsEl.querySelectorAll(".review-star").forEach((btn) => {
        const on = Number(btn.dataset.value) <= reviewRating;
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-checked", on ? "true" : "false");
      });
    }

    function setReviewStatus(kind, msg) {
      if (!msg) {
        reviewStatusEl.hidden = true;
        reviewStatusEl.textContent = "";
        reviewStatusEl.classList.remove("is-error", "is-success");
        return;
      }
      reviewStatusEl.hidden = false;
      reviewStatusEl.textContent = msg;
      reviewStatusEl.classList.toggle("is-error", kind === "error");
      reviewStatusEl.classList.toggle("is-success", kind === "success");
    }

    function formatReviewDate(iso) {
      if (!iso) return "";
      try {
        return new Date(iso).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return "";
      }
    }

    function renderReviewsSummary(reviews) {
      const rated = reviews.filter((r) => typeof r.rating === "number" && r.rating >= 1);
      if (!rated.length) {
        reviewsSummaryEl.hidden = true;
        reviewsSummaryEl.replaceChildren();
        return;
      }
      const avg = rated.reduce((sum, r) => sum + r.rating, 0) / rated.length;
      reviewsSummaryEl.hidden = false;
      reviewsSummaryEl.replaceChildren();
      const stars = document.createElement("span");
      stars.className = "reviews-summary-stars";
      stars.textContent = starString(avg);
      const text = document.createElement("span");
      text.textContent =
        avg.toFixed(1) + " avg · " + rated.length + " rating" + (rated.length === 1 ? "" : "s");
      reviewsSummaryEl.append(stars, text);
    }

    function renderReviewCard(review) {
      const card = document.createElement("article");
      card.className = "review-card";

      const head = document.createElement("div");
      head.className = "review-card-head";

      const author = document.createElement("span");
      author.className = "review-card-author";
      author.textContent = review.displayName || "Anonymous";
      head.appendChild(author);

      if (typeof review.rating === "number" && review.rating >= 1) {
        const stars = document.createElement("span");
        stars.className = "review-card-stars";
        stars.setAttribute("aria-label", review.rating + " out of 5 stars");
        stars.textContent = starString(review.rating);
        head.appendChild(stars);
      }

      if (review.curated) {
        const badge = document.createElement("span");
        badge.className = "review-card-badge";
        badge.textContent = "Sourced";
        head.appendChild(badge);
      }

      if (review.createdAt && !review.curated) {
        const date = document.createElement("span");
        date.className = "review-card-date";
        date.textContent = formatReviewDate(review.createdAt);
        head.appendChild(date);
      }

      const body = document.createElement("p");
      body.className = "review-card-body";
      body.textContent = review.body;

      card.append(head, body);

      if (review.curated && review.source) {
        const src = document.createElement("p");
        src.className = "review-card-source";
        src.textContent = review.source;
        card.appendChild(src);
      }

      return card;
    }

    function renderReviewsList(reviews) {
      reviewsListEl.replaceChildren();
      if (!reviews.length) {
        const empty = document.createElement("p");
        empty.className = "reviews-empty";
        empty.textContent = "No reviews yet — be the first to share your experience.";
        reviewsListEl.appendChild(empty);
        return;
      }
      reviews.forEach((review) => reviewsListEl.appendChild(renderReviewCard(review)));
    }

    async function loadReviewsForCurrentDorm() {
      const dormId = houseId;
      reviewsDormNameEl.textContent = getHouse(dormId).name;
      if (loadedReviewsDormId === dormId) return;
      loadedReviewsDormId = dormId;

      reviewsListEl.replaceChildren();
      const loading = document.createElement("p");
      loading.className = "reviews-empty";
      loading.textContent = "Loading reviews…";
      reviewsListEl.appendChild(loading);

      const res = await fetch("/api/dorms/" + encodeURIComponent(dormId) + "/reviews");
      if (loadedReviewsDormId !== dormId) return; // dorm changed mid-flight
      if (!res.ok) {
        renderReviewsList([]);
        renderReviewsSummary([]);
        return;
      }
      const data = await res.json();
      const reviews = (data && data.reviews) || [];
      renderReviewsList(reviews);
      renderReviewsSummary(reviews);
    }

    reviewAnonInput.addEventListener("change", () => {
      reviewAuthorInput.disabled = reviewAnonInput.checked;
      if (reviewAnonInput.checked) reviewAuthorInput.value = "";
    });

    reviewForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const body = reviewBodyInput.value.trim();
      if (!body) {
        setReviewStatus("error", "Please write a few words before posting.");
        return;
      }

      const payload = {
        body,
        anonymous: reviewAnonInput.checked,
        author: reviewAnonInput.checked ? "" : reviewAuthorInput.value.trim(),
      };
      if (reviewRating >= 1) payload.rating = reviewRating;

      const dormId = houseId;
      reviewSubmitBtn.disabled = true;
      setReviewStatus("", "");

      const res = await fetch("/api/dorms/" + encodeURIComponent(dormId) + "/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      reviewSubmitBtn.disabled = false;

      let data = null;
      try { data = await res.json(); } catch { /* non-JSON error body */ }

      if (!res.ok || !data || !data.success) {
        setReviewStatus("error", (data && data.error) || "Could not post your review. Please try again.");
        return;
      }

      // Reset the form, then refresh so the new review appears at the top.
      reviewBodyInput.value = "";
      reviewAuthorInput.value = "";
      reviewAnonInput.checked = false;
      reviewAuthorInput.disabled = false;
      reviewRating = 0;
      syncReviewStars();
      setReviewStatus("success", "Thanks! Your review is now public.");

      // Only prepend if still viewing the same dorm; otherwise just invalidate.
      if (houseId === dormId) {
        loadedReviewsDormId = null;
        await loadReviewsForCurrentDorm();
      } else {
        loadedReviewsDormId = null;
      }
    });

    reviewToggleBtn.addEventListener("click", () => {
      setReviewFormOpen(reviewFormEl.hidden);
    });

    dormSelect.addEventListener("change", () => {
      setReviewStatus("", "");
      setReviewFormOpen(false);
      loadReviewsForCurrentDorm();
    });

    buildReviewStars();
    loadReviewsForCurrentDorm();

    // =====================================================================
    // FEATURE 6 (Noah): Shareable shortlist links
    //
    // The favorites Laolu built live in localStorage, so they only exist
    // on the device that starred them. This feature lets the user copy a
    // link that encodes their shortlist + current dorm/room so a roommate
    // can open the link and see the same selection.
    //
    // URL shape:
    //   /?shortlist=<base64-csv-of-dorm-ids>&dorm=<id>&room=<roomType>
    //
    // Tech: URLSearchParams reads/writes the query string, btoa/atob
    // base64-encodes the list (compact + harder to fat-finger), and
    // navigator.clipboard.writeText copies the link to the user's
    // clipboard. The "shortlist" param is validated against HOUSES so
    // a tampered link can't poison the favorites with unknown ids.
    // =====================================================================
    const shareBtn = document.getElementById("share-shortlist-btn");
    const shareBtnText = shareBtn.querySelector(".share-shortlist-text");

    // On page load: if the URL includes ?shortlist=..., decode + apply it.
    function loadShortlistFromURL() {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get("shortlist");
      if (encoded) {
        try {
          const ids = atob(encoded).split(",").filter((id) => HOUSES.some((h) => h.id === id));
          if (ids.length) {
            saveFavorites(ids);
            renderFavUI();
          }
        } catch {
          // Malformed base64 — silently ignore, the user's own shortlist (if any) stays.
        }
      }
      const dormParam = params.get("dorm");
      const roomParam = params.get("room");
      if (dormParam && HOUSES.some((h) => h.id === dormParam)) {
        selectDorm(dormParam);
        // The change handler resets the room type to the dorm's first option;
        // honor the shared link's room choice when it's valid for this dorm.
        const house = getHouse(houseId);
        if (roomParam && house.roomTypes.includes(roomParam)) {
          roomType = roomParam;
          renderPills();
          updatePreview();
        }
      }
    }

    async function copyShortlistShareLink() {
      const favs = getFavorites();
      if (favs.length === 0) {
        // Friendly nudge instead of copying an empty link
        shareBtnText.textContent = "Star a dorm first";
        clearTimeout(copyShortlistShareLink._t);
        copyShortlistShareLink._t = setTimeout(() => {
          shareBtnText.textContent = "Share my shortlist";
        }, 1800);
        return;
      }
      const params = new URLSearchParams();
      params.set("shortlist", btoa(favs.join(",")));
      params.set("dorm", houseId);
      params.set("room", roomType);
      const url = window.location.origin + window.location.pathname + "?" + params.toString();

      try {
        await navigator.clipboard.writeText(url);
        shareBtn.classList.add("is-copied");
        shareBtnText.textContent = "Link copied";
      } catch {
        // Clipboard API can fail (insecure context, denied permission) — fall back to prompt
        window.prompt("Copy this link to share your shortlist:", url);
        shareBtnText.textContent = "Share my shortlist";
        return;
      }
      clearTimeout(copyShortlistShareLink._t);
      copyShortlistShareLink._t = setTimeout(() => {
        shareBtn.classList.remove("is-copied");
        shareBtnText.textContent = "Share my shortlist";
      }, 1800);
    }

    shareBtn.addEventListener("click", copyShortlistShareLink);

    // Apply any URL-encoded shortlist now that all helpers are defined.
    loadShortlistFromURL();

    // =====================================================================
    // FEATURE 7 (Noah): Dorm match quiz
    //
    // Seven-question quiz that scores every dorm by tag overlap with the
    // user's answers, then surfaces the top 3 matches with explanations.
    //
    // How scoring works:
    //   1. Each answer in a quiz question contributes 0..N "tags" to the
    //      user's profile (a Set).
    //   2. Each dorm has a derived tag set (from its HOUSES data plus a
    //      DORM_EXTRA_TAGS map for things HOUSES doesn't cover — theme
    //      house designations, neighborhood/location, vibe, special
    //      status — all researched from Stanford R&DE and resed.stanford.edu).
    //   3. score(dorm) = |userTags ∩ dormTags|. Higher = better match.
    //   4. We sort by score, break ties by random shuffle so identical
    //      scores don't always show the same dorm first, then take top 3.
    // =====================================================================
    // Builds the full tag set for a dorm by combining HOUSES data with extraTags from MongoDB.
    const _dormTagCache = new Map();
    function getDormTagSet(dorm) {
      if (_dormTagCache.has(dorm.id)) return _dormTagCache.get(dorm.id);
      const tags = new Set(["category:" + dorm.category]);
      dorm.roomTypes.forEach((rt) => tags.add("has:" + rt));
      tags.add(dorm.roomTypes.length >= 4 ? "variety:high" : "variety:low");
      const extras = dorm.extraTags || [];
      extras.forEach((t) => tags.add(t));
      if (!extras.includes("theme:yes")) tags.add("theme:no");
      _dormTagCache.set(dorm.id, tags);
      return tags;
    }

    // ---------- Quiz state machine ----------
    const quizOverlay = document.getElementById("quiz-overlay");
    const quizStepEl = document.getElementById("quiz-step");
    const quizTitleEl = document.getElementById("quiz-title");
    const quizOptionsEl = document.getElementById("quiz-options");
    const quizResultsEl = document.getElementById("quiz-results");
    const quizProgressBar = document.getElementById("quiz-progress-bar");
    const quizBackBtn = document.getElementById("quiz-back");
    const quizRetakeBtn = document.getElementById("quiz-retake");
    const quizCloseBtn = document.getElementById("quiz-close");
    const openQuizBtn = document.getElementById("open-quiz-btn");

    let quizStep = 0;          // 0..QUIZ_QUESTIONS.length-1 are questions; length = results page
    let quizAnswerTags = [];   // parallel array — tags chosen at each step

    function openQuiz() {
      quizStep = 0;
      quizAnswerTags = [];
      quizOverlay.hidden = false;
      document.body.style.overflow = "hidden"; // prevent background scroll
      renderQuiz();
    }

    function closeQuiz() {
      quizOverlay.hidden = true;
      document.body.style.overflow = "";
    }

    function renderQuiz() {
      const total = QUIZ_QUESTIONS.length;
      if (quizStep < total) {
        const q = QUIZ_QUESTIONS[quizStep];
        quizStepEl.textContent = "Question " + (quizStep + 1) + " of " + total;
        quizTitleEl.textContent = q.text;
        quizOptionsEl.hidden = false;
        quizResultsEl.hidden = true;
        quizOptionsEl.replaceChildren();
        q.options.forEach((opt, idx) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "quiz-option";
          btn.dataset.idx = String(idx);
          btn.innerHTML =
            '<span class="quiz-option-bullet" aria-hidden="true"></span>' +
            '<span>' + opt.label + '</span>';
          quizOptionsEl.appendChild(btn);
        });
        quizProgressBar.style.width = (quizStep / total) * 100 + "%";
        quizBackBtn.hidden = quizStep === 0;
        quizRetakeBtn.hidden = true;
      } else {
        // Results page
        quizStepEl.textContent = "Your matches";
        quizTitleEl.textContent = "Top 3 dorms for you";
        quizOptionsEl.hidden = true;
        quizResultsEl.hidden = false;
        renderQuizResults();
        quizProgressBar.style.width = "100%";
        quizBackBtn.hidden = false;
        quizRetakeBtn.hidden = false;
      }
    }

    function renderQuizResults() {
      // Flatten all picked tags into one Set
      const userTags = new Set();
      quizAnswerTags.forEach((tags) => tags.forEach((t) => userTags.add(t)));

      // Score every dorm
      const scored = HOUSES.map((dorm) => {
        const dormTags = getDormTagSet(dorm);
        const matched = [];
        userTags.forEach((t) => {
          if (dormTags.has(t)) matched.push(t);
        });
        return { dorm, score: matched.length, matched };
      });
      // Sort by score desc; randomise within ties so it doesn't always pick
      // the same alphabetically-first dorm on identical scores.
      scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);
      const top = scored.slice(0, 3);

      quizResultsEl.replaceChildren();
      top.forEach((entry, i) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "quiz-result";
        card.dataset.dormId = entry.dorm.id;
        // Build reasons string from the matched tags
        const reasons = entry.matched
          .map((t) => REASON_LABELS[t])
          .filter(Boolean)
          .slice(0, 4)
          .join(" · ");
        card.innerHTML =
          '<span class="quiz-result-rank">' + (i + 1) + '</span>' +
          '<div class="quiz-result-body">' +
            '<p class="quiz-result-name">' + entry.dorm.name + '</p>' +
            '<p class="quiz-result-reasons">' + (reasons || "Closest available match for your preferences") + '</p>' +
          '</div>' +
          '<span class="quiz-result-score">' + entry.score + ' match' + (entry.score === 1 ? '' : 'es') + '</span>';
        quizResultsEl.appendChild(card);
      });
    }

    // Option click → record tags, advance
    quizOptionsEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".quiz-option");
      if (!btn) return;
      const idx = Number(btn.dataset.idx);
      const opt = QUIZ_QUESTIONS[quizStep].options[idx];
      quizAnswerTags[quizStep] = opt.tags;
      quizStep++;
      renderQuiz();
    });

    // Result click → preselect that dorm in the dropdown, close the quiz
    quizResultsEl.addEventListener("click", (e) => {
      const card = e.target.closest(".quiz-result");
      if (!card) return;
      const id = card.dataset.dormId;
      if (!HOUSES.some((h) => h.id === id)) return;
      selectDorm(id);
      closeQuiz();
      setActiveView("residences");
    });

    quizBackBtn.addEventListener("click", () => {
      if (quizStep > 0) {
        quizStep--;
        renderQuiz();
      }
    });

    quizRetakeBtn.addEventListener("click", () => {
      quizStep = 0;
      quizAnswerTags = [];
      renderQuiz();
    });

    quizCloseBtn.addEventListener("click", closeQuiz);

    // Click on the overlay background closes the modal
    quizOverlay.addEventListener("click", (e) => {
      if (e.target === quizOverlay) closeQuiz();
    });

    // Esc closes the modal when it's open
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !quizOverlay.hidden) closeQuiz();
    });

    openQuizBtn.addEventListener("click", openQuiz);

    /* ===== Room builder — inline inverted-cube skybox (Create 3D Room tab) =====
     * Builds a real 6-sided room from the user's photos: an inside-out cube the
     * camera sits inside, one photo per face. Exposes window.renderRoomBuilderSkybox
     * which the upload submit handler calls with the six photo URLs (in slot order:
     * North, South, East, West, Ceiling, Floor) plus the room name.
     */
    (function initRoomBuilder3D() {
      const stage        = document.getElementById("room3d-stage");
      const titleEl      = document.getElementById("room3d-title");
      const canvas       = document.getElementById("room3d-canvas");
      const editBtn      = document.getElementById("room3d-edit-btn");
      const newUploadBtn = document.getElementById("room3d-new-upload-btn");
      const copyLinkBtn  = document.getElementById("room3d-copy-link-btn");
      const zoomInBtn    = document.getElementById("room3d-zoom-in");
      const zoomOutBtn   = document.getElementById("room3d-zoom-out");
      const fullscreenBtn = document.getElementById("room3d-fullscreen");
      const designerForm = document.getElementById("designer-upload");

      // The stage node moves between these hosts: Create tab = viewer only,
      // Room Designer (studio) tab = design tools on.
      const createHost  = document.getElementById("create-stage-host");
      const studioHost  = document.getElementById("studio-stage-host");
      const studioEmpty = document.getElementById("studio-empty");

      // Design-mode controls (Tier 1 scale + Tier 2 floor mapping)
      const designBtn   = document.getElementById("room3d-design-btn");
      const designPanel = document.getElementById("room3d-design-panel");
      const heightRange = document.getElementById("rdp-height-range");
      const heightNum   = document.getElementById("rdp-height");
      const showRefChk  = document.getElementById("rdp-show-ref");
      const traceBtn    = document.getElementById("rdp-trace-btn");
      const undoBtn     = document.getElementById("rdp-undo-btn");
      const clearBtn    = document.getElementById("rdp-clear-btn");
      const dimsEl      = document.getElementById("rdp-dims");
      const catalogEl   = document.getElementById("rdp-catalog");
      const selectedRow = document.getElementById("rdp-selected-row");
      const rotateBtn   = document.getElementById("rdp-rotate-btn");
      const deleteBtn   = document.getElementById("rdp-delete-btn");

      // No-op if Three.js failed to load — the upload still works, just no 3D.
      if (typeof THREE === "undefined") {
        const warn = function () {
          console.warn("[room3d] THREE.js unavailable — skipping 3D render.");
        };
        window.renderRoomBuilderSkybox = warn;
        window.renderRoomBuilderPano = warn;
        return;
      }

      // Look-around tuning (this is a room, so full 360° yaw is allowed)
      const PITCH_LIMIT_RAD  = THREE.MathUtils.degToRad(85);
      const DRAG_SENSITIVITY = 0.0025;
      const INERTIA          = 0.88;
      const MIN_FOV = 40, MAX_FOV = 100, DEFAULT_FOV = 78, ZOOM_STEP = 4;

      // BoxGeometry material order is [+X, -X, +Y, -Y, +Z, -Z]. We face -Z first,
      // so North sits on -Z (the wall you see on open). src = index into the
      // slot-ordered url array [North, South, East, West, Ceiling, Floor].
      const FACE_ORDER = [
        { key: "East",    src: 2, rotation: 0 },          // +X
        { key: "West",    src: 3, rotation: 0 },          // -X
        { key: "Ceiling", src: 4, rotation: 0 },          // +Y
        { key: "Floor",   src: 5, rotation: 0 },          // -Y
        { key: "South",   src: 1, rotation: 0 },          // +Z
        { key: "North",   src: 0, rotation: 0 },          // -Z
      ];

      let renderer, scene, camera, skyMesh, texLoader;
      let yaw = 0, pitch = 0, velYaw = 0, velPitch = 0;
      const lookTarget = new THREE.Vector3();
      let initialized = false, animFrame = null, resizeTimer = null;
      let dragging = false, lastX = 0, lastY = 0, downX = 0, downY = 0;

      // Design-mode state. The scene is reinterpreted in METERS: the camera
      // sits at the origin and the real floor is a horizontal plane at
      // y = -cameraHeightM. floorVerts holds the normalized look directions of
      // each tapped corner (y < 0); their metric (x,z) is reprojected whenever
      // the height changes, so corners stay locked to photo features while the
      // scale updates. See the room designer discussion for the derivation.
      let designMode = false, tracing = false, cameraHeightM = 1.4;
      let floorVerts = [];
      let designGroup = null, markerGroup = null, refSquare = null, traceLine = null;
      const designRaycaster = new THREE.Raycaster();
      const designNdc = new THREE.Vector2();
      const CLICK_SLOP = 6;       // px of movement under which a press is a tap, not a drag
      const MAX_FLOOR_DIST = 30;  // ignore taps that project absurdly far (near the horizon)

      // Furniture (Kenney CC0 GLB models, loaded via window.GLTFLoader). The
      // models carry global-THREE-incompatible nothing — same 0.149 version, so
      // they drop straight into this scene. Each is scaled to a real-world
      // target dimension so it lands at true scale on the calibrated floor.
      let furnitureGroup = null, selectedItem = null, draggingItem = null, selBox = null;
      let furnitureGesture = false;        // current gesture grabbed a model (not look-around)
      const gltfCache = {};                // file -> Promise<gltf.scene template>
      const furnRaycaster = new THREE.Raycaster();
      const ROTATE_STEP = Math.PI / 12;    // 15° per rotate press
      const FURNITURE_GROUPS = [
        { id: "sleep",  label: "Sleep" },
        { id: "work",   label: "Work & study" },
        { id: "lounge", label: "Lounge" },
        { id: "decor",  label: "Decor & extras" },
      ];
      const FURNITURE_CATALOG = [
        { id: "bed",       label: "Bed",         file: "bedSingle.glb",         target: 1.90, axis: "xz", group: "sleep"  },
        { id: "bedDouble", label: "Double bed",  file: "bedDouble.glb",         target: 2.00, axis: "xz", group: "sleep"  },
        { id: "desk",      label: "Desk",        file: "desk.glb",              target: 1.10, axis: "xz", group: "work"   },
        { id: "chair",     label: "Desk chair",  file: "chairDesk.glb",         target: 0.55, axis: "xz", group: "work"   },
        { id: "bookcase",  label: "Bookcase",    file: "bookcaseOpen.glb",      target: 1.60, axis: "y",  group: "work"   },
        { id: "books",     label: "Books",       file: "books.glb",             target: 0.30, axis: "xz", group: "work"   },
        { id: "armchair",  label: "Armchair",    file: "chairModernCushion.glb",target: 0.75, axis: "xz", group: "lounge" },
        { id: "stool",     label: "Stool",       file: "stoolBar.glb",          target: 0.75, axis: "y",  group: "lounge" },
        { id: "sofa",      label: "Sofa",        file: "loungeSofa.glb",        target: 2.00, axis: "xz", group: "lounge" },
        { id: "coffee",    label: "Coffee table",file: "tableCoffee.glb",       target: 1.10, axis: "xz", group: "lounge" },
        { id: "sideTable", label: "Side table",  file: "sideTable.glb",         target: 0.50, axis: "xz", group: "lounge" },
        { id: "tvStand",   label: "TV stand",    file: "cabinetTelevision.glb", target: 1.40, axis: "xz", group: "lounge" },
        { id: "tv",        label: "TV",          file: "televisionModern.glb",  target: 1.20, axis: "xz", group: "lounge" },
        { id: "fridge",    label: "Mini fridge", file: "kitchenFridgeSmall.glb",target: 0.85, axis: "y",  group: "lounge" },
        { id: "lamp",      label: "Floor lamp",  file: "lampSquareFloor.glb",   target: 1.50, axis: "y",  group: "decor"  },
        { id: "tableLamp", label: "Table lamp",  file: "lampRoundTable.glb",    target: 0.50, axis: "y",  group: "decor"  },
        { id: "coatRack",  label: "Coat rack",   file: "coatRackStanding.glb",  target: 1.70, axis: "y",  group: "decor"  },
        { id: "plant",     label: "Potted plant",file: "pottedPlant.glb",       target: 0.60, axis: "y",  group: "decor"  },
        { id: "plantSmall",label: "Small plant", file: "plantSmall1.glb",       target: 0.35, axis: "y",  group: "decor"  },
        { id: "trashcan",  label: "Trash can",   file: "trashcan.glb",          target: 0.50, axis: "y",  group: "decor"  },
        { id: "rug",       label: "Rug",         file: "rugRectangle.glb",      target: 1.60, axis: "xz", group: "decor"  },
        { id: "rugRound",  label: "Round rug",   file: "rugRound.glb",          target: 1.60, axis: "xz", group: "decor"  },
      ];

      function updateCamera() {
        lookTarget.set(
          Math.sin(yaw) * Math.cos(pitch),
          Math.sin(pitch),
          -Math.cos(yaw) * Math.cos(pitch)
        );
        camera.lookAt(lookTarget);
      }

      function clampPitch() {
        if (pitch < -PITCH_LIMIT_RAD)     { pitch = -PITCH_LIMIT_RAD; velPitch = 0; }
        else if (pitch > PITCH_LIMIT_RAD) { pitch =  PITCH_LIMIT_RAD; velPitch = 0; }
      }

      function setFov(fov) {
        camera.fov = Math.min(MAX_FOV, Math.max(MIN_FOV, fov));
        camera.updateProjectionMatrix();
      }

      function sizeRendererToCanvas() {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (!w || !h) return; // hidden — skip to avoid a 0×0 framebuffer
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }

      // One face: load the texture, un-mirror it for the inside view, return material.
      function loadFace(url, rotation) {
        const tex = texLoader.load(url);
        tex.encoding = THREE.sRGBEncoding;
        // Camera sees the BackSide of the cube, which mirrors the texture
        // horizontally — flip it back so any text/orientation reads correctly.
        tex.wrapS = THREE.RepeatWrapping;
        tex.repeat.x = -1;
        tex.center.set(0.5, 0.5);
        tex.rotation = rotation;
        return new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
      }

      // Tear down whichever skybox is active (cube = material array, pano sphere
      // = single material), disposing geometry + textures so we don't leak GPU
      // memory across re-renders.
      function disposeSky() {
        if (!skyMesh) return;
        scene.remove(skyMesh);
        skyMesh.geometry.dispose();
        const mats = Array.isArray(skyMesh.material) ? skyMesh.material : [skyMesh.material];
        mats.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
        skyMesh = null;
      }

      function buildCube(urls) {
        disposeSky();
        const geom = new THREE.BoxGeometry(10, 10, 10);
        const materials = FACE_ORDER.map((f) => loadFace(urls[f.src], f.rotation));
        skyMesh = new THREE.Mesh(geom, materials);
        scene.add(skyMesh);
      }

      // Equirectangular panorama path: map the single 2:1 image onto an inverted
      // sphere (the standard Three.js 360 viewer). geometry.scale(-1,1,1) turns it
      // inside-out so the camera at the centre sees it un-mirrored — no per-face
      // flip/rotation calibration needed (unlike a cubemap conversion).
      function buildSphere(url) {
        disposeSky();
        const geom = new THREE.SphereGeometry(10, 60, 40);
        geom.scale(-1, 1, 1);
        const tex = texLoader.load(url);
        tex.encoding = THREE.sRGBEncoding;
        skyMesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ map: tex }));
        scene.add(skyMesh);
      }

      function init() {
        if (initialized) return;
        initialized = true;

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(DEFAULT_FOV, 1, 0.1, 100);
        camera.position.set(0, 0, 0); // dead center of the room

        // Lights for furniture only — the skybox is MeshBasicMaterial (unlit),
        // so these leave the photo untouched and just shade the placed models.
        scene.add(new THREE.AmbientLight(0xffffff, 0.85));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.55);
        dirLight.position.set(3, 8, 4);
        scene.add(dirLight);

        texLoader = new THREE.TextureLoader();
        texLoader.setCrossOrigin("anonymous");

        bindEvents();
        bindDesignEvents();
        bindFullscreenTools();
        updateCamera();
      }

      function bindEvents() {
        canvas.addEventListener("pointerdown", (e) => {
          downX = e.clientX; downY = e.clientY;
          // In design mode, a press on a furniture model grabs it for dragging
          // instead of starting a look-around. tryGrabFurniture also handles
          // tap-to-deselect on empty space.
          furnitureGesture = designMode && tryGrabFurniture(e);
          if (furnitureGesture) {
            canvas.setPointerCapture(e.pointerId);
            return;
          }
          dragging = true;
          velYaw = velPitch = 0;
          lastX = e.clientX; lastY = e.clientY;
          canvas.setPointerCapture(e.pointerId);
        });

        canvas.addEventListener("pointermove", (e) => {
          if (!dragging) return;
          const dx = e.clientX - lastX, dy = e.clientY - lastY;
          lastX = e.clientX; lastY = e.clientY;
          velYaw   = dx * DRAG_SENSITIVITY;
          velPitch = dy * DRAG_SENSITIVITY;
          yaw   += velYaw;
          pitch -= velPitch; // drag down = look down
          clampPitch();
          updateCamera();
        });

        const endDrag = (e) => {
          dragging = false;
          if (e && e.pointerId !== undefined && canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
          }
        };
        canvas.addEventListener("pointerup", endDrag);
        canvas.addEventListener("pointercancel", endDrag);

        canvas.addEventListener("wheel", (e) => {
          e.preventDefault();
          setFov(camera.fov + (e.deltaY > 0 ? ZOOM_STEP : -ZOOM_STEP));
        }, { passive: false });

        zoomInBtn.addEventListener("click",  () => setFov(camera.fov - ZOOM_STEP));
        zoomOutBtn.addEventListener("click", () => setFov(camera.fov + ZOOM_STEP));

        fullscreenBtn.addEventListener("click", () => {
          const target = canvas.closest(".room3d-viewport") || canvas;
          if (!document.fullscreenElement) {
            target.requestFullscreen().catch((err) => console.warn("[room3d] fullscreen:", err));
          } else {
            document.exitFullscreen();
          }
        });
        document.addEventListener("fullscreenchange", () => {
          setTimeout(sizeRendererToCanvas, 50);
          syncFullscreenTools();
        });

        editBtn.addEventListener("click", async () => {
          const prevText = editBtn.textContent;
          editBtn.disabled = true;
          try {
            if (activeSharedUploadMeta && !sharedUploadHydrated) {
              editBtn.textContent = "Loading photos...";
              await hydrateSharedUploadForEditing(activeSharedUploadMeta);
            }
            if (designerUploadRoot) designerUploadRoot.hidden = false;
            if (roomUploadForm) roomUploadForm.hidden = false;
            stage.hidden = true;
            stop();
            placeStage("create"); // editing photos is a Create-tab activity
            setActiveView("designer");
            if (designerForm) designerForm.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch (err) {
            if (designerUploadRoot) designerUploadRoot.hidden = false;
            if (roomUploadForm) roomUploadForm.hidden = false;
            showUploadResult("error", `Could not load shared photos for editing: ${escapeUploadHtml(err.message || "Please try again.")}`);
          } finally {
            editBtn.disabled = false;
            editBtn.textContent = prevText;
          }
        });

        newUploadBtn.addEventListener("click", () => {
          beginNewRoomUpload();
          stop();
          placeStage("create");
          setActiveView("designer");
          if (designerForm) designerForm.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        copyLinkBtn.addEventListener("click", async () => {
          if (currentRoomUploadId) {
            copyUploadShareLink(currentRoomUploadId, copyLinkBtn);
            return;
          }
          if (!dormRoomContext) return;
          // Make sure the design record exists server-side before handing out
          // the link (saves are debounced, and a never-saved design would 404).
          clearTimeout(designSaveTimer);
          try { await pushDesignToServer(); } catch (_) { /* link still copies */ }
          copyShareLink(buildDesignShareUrl(dormRoomContext.designId), copyLinkBtn);
        });
      }

      /* ===== Design mode: metric scale (Tier 1) + floor mapping (Tier 2) =====
       * Gated entirely behind the "Design this room" button — the plain viewer
       * is untouched until the user opts in.
       */

      // Convert a normalized look direction into a metric floor point, or null
      // if it doesn't point at the floor (above the horizon) or lands too far.
      function projectToFloor(dir, h) {
        if (dir.y >= -1e-4) return null;
        const t = -h / dir.y;
        const x = dir.x * t, z = dir.z * t;
        if (Math.hypot(x, z) > MAX_FLOOR_DIST) return null;
        return new THREE.Vector3(x, -h, z);
      }

      // Look direction (from the camera at the origin) under a pointer event.
      function dirFromEvent(e) {
        const rect = canvas.getBoundingClientRect();
        designNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        designNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        designRaycaster.setFromCamera(designNdc, camera);
        return designRaycaster.ray.direction.clone().normalize();
      }

      function ensureDesignGroup() {
        if (designGroup) return;
        designGroup = new THREE.Group();
        markerGroup = new THREE.Group();
        designGroup.add(markerGroup);
        scene.add(designGroup);
      }

      /* ----- Room bounds: keep furniture inside the traced walls ----- */

      const FALLBACK_RADIUS = 5;     // metres — cap before any floor is traced
      const BUMP_COOLDOWN_MS = 450;  // min gap between wall-bump effects
      const WALL_FLASH_MS = 420;
      const TRACE_COLOR = 0xffb000, WALL_HIT_COLOR = 0xff4d4d;
      let lastBumpAt = 0;
      let wallFlashMesh = null, wallFlashTimer = null, traceFlashTimer = null;

      function pointInPolygon(x, z, pts) {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const xi = pts[i].x, zi = pts[i].z, xj = pts[j].x, zj = pts[j].z;
          if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) {
            inside = !inside;
          }
        }
        return inside;
      }

      // Closest point to (x,z) on the polygon boundary; also reports the
      // segment so the bump effect can light up the wall that was hit.
      function closestBoundaryPoint(x, z, pts) {
        let best = null;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          const abx = b.x - a.x, abz = b.z - a.z;
          const len2 = abx * abx + abz * abz;
          const t = len2 > 1e-9 ? Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / len2)) : 0;
          const px = a.x + abx * t, pz = a.z + abz * t;
          const d2 = (x - px) * (x - px) + (z - pz) * (z - pz);
          if (!best || d2 < best.d2) best = { x: px, z: pz, d2, a, b };
        }
        return best;
      }

      // Clamp a floor point so a footprint of halfW stays inside the room.
      // With a traced polygon the point clamps to the boundary and nudges
      // toward the centroid; before tracing, a generous circle around the
      // camera applies. Returns { x, z, clamped, wall }.
      function clampToRoom(x, z, halfW) {
        const pts = metricPoints();
        const margin = Math.min(Math.max(halfW || 0, 0.05), 0.6);
        if (pts.length >= 3) {
          if (pointInPolygon(x, z, pts)) return { x, z, clamped: false, wall: null };
          const hit = closestBoundaryPoint(x, z, pts);
          let cx = 0, cz = 0;
          pts.forEach((p) => { cx += p.x; cz += p.z; });
          cx /= pts.length; cz /= pts.length;
          const dx = cx - hit.x, dz = cz - hit.z;
          const d = Math.hypot(dx, dz);
          const push = Math.min(margin, d);
          return {
            x: hit.x + (d > 1e-6 ? (dx / d) * push : 0),
            z: hit.z + (d > 1e-6 ? (dz / d) * push : 0),
            clamped: true,
            wall: { a: hit.a, b: hit.b },
          };
        }
        const r = Math.hypot(x, z), max = FALLBACK_RADIUS - margin;
        if (r <= max) return { x, z, clamped: false, wall: null };
        const s = max / r;
        return { x: x * s, z: z * s, clamped: true, wall: null };
      }

      // "You hit the wall" feedback: shake the viewport, flash the traced
      // outline red, and light up the wall segment that was hit. Throttled so
      // dragging along a wall doesn't strobe.
      function wallBump(wall) {
        const now = performance.now();
        if (now - lastBumpAt < BUMP_COOLDOWN_MS) return;
        lastBumpAt = now;

        const viewport = canvas.closest(".room3d-viewport");
        if (viewport) {
          viewport.classList.remove("is-wall-bump");
          void viewport.offsetWidth; // restart the animation if mid-flight
          viewport.classList.add("is-wall-bump");
          setTimeout(() => viewport.classList.remove("is-wall-bump"), 350);
        }

        if (traceLine) {
          traceLine.visible = true; // reveal even if hidden by Stop tracing
          traceLine.material.color.setHex(WALL_HIT_COLOR);
          clearTimeout(traceFlashTimer);
          traceFlashTimer = setTimeout(() => {
            if (traceLine) {
              traceLine.material.color.setHex(TRACE_COLOR);
              applyTraceVisibility();
            }
          }, WALL_FLASH_MS);
        }

        if (wall) flashWallSegment(wall);
      }

      function clearWallFlash() {
        clearTimeout(wallFlashTimer);
        if (wallFlashMesh && designGroup) {
          designGroup.remove(wallFlashMesh);
          disposeObj(wallFlashMesh);
        }
        wallFlashMesh = null;
      }

      // Translucent red panel standing on the violated wall edge for a moment.
      function flashWallSegment(wall) {
        ensureDesignGroup();
        clearWallFlash();
        const len = Math.hypot(wall.b.x - wall.a.x, wall.b.z - wall.a.z);
        if (len < 1e-3) return;
        const wallHeight = 1.2;
        const geom = new THREE.PlaneGeometry(len, wallHeight);
        const mat = new THREE.MeshBasicMaterial({
          color: WALL_HIT_COLOR, transparent: true, opacity: 0.28,
          side: THREE.DoubleSide, depthTest: false,
        });
        wallFlashMesh = new THREE.Mesh(geom, mat);
        wallFlashMesh.position.set(
          (wall.a.x + wall.b.x) / 2,
          -cameraHeightM + wallHeight / 2,
          (wall.a.z + wall.b.z) / 2
        );
        wallFlashMesh.rotation.y = Math.atan2(-(wall.b.z - wall.a.z), wall.b.x - wall.a.x);
        wallFlashMesh.renderOrder = 997;
        designGroup.add(wallFlashMesh);
        wallFlashTimer = setTimeout(clearWallFlash, WALL_FLASH_MS);
      }

      function disposeObj(o) {
        if (!o) return;
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      }

      function metricPoints() {
        return floorVerts.map((d) => projectToFloor(d, cameraHeightM)).filter(Boolean);
      }

      // Green 1 m square that floats on the floor a short distance in front of
      // the camera — a true-scale yardstick the user matches against a known
      // feature to dial in the camera height. Built centred on the local origin
      // so positionRefSquare() can slide + spin it to track the camera's yaw
      // each frame (see tick), keeping it ahead of you as you look around.
      const REF_SQUARE_DIST = 1.8; // metres ahead of the camera
      function rebuildRefSquare() {
        ensureDesignGroup();
        if (refSquare) { designGroup.remove(refSquare); disposeObj(refSquare); refSquare = null; }
        updateDesignSteps(); // the checkbox doubles as the step-1 "done" signal
        if (!showRefChk.checked) return;
        const half = 0.5;
        const corners = [
          new THREE.Vector3(-half, 0, -half),
          new THREE.Vector3( half, 0, -half),
          new THREE.Vector3( half, 0,  half),
          new THREE.Vector3(-half, 0,  half),
        ];
        const g = new THREE.BufferGeometry().setFromPoints(corners);
        const m = new THREE.LineBasicMaterial({ color: 0x3dd68c, depthTest: false });
        refSquare = new THREE.LineLoop(g, m);
        refSquare.renderOrder = 998;
        positionRefSquare();
        designGroup.add(refSquare);
      }

      // Keep the reference square on the floor, centred REF_SQUARE_DIST ahead of
      // wherever the camera is currently facing (horizontal yaw only). The y is
      // pulled from cameraHeightM every frame, so height changes track for free.
      function positionRefSquare() {
        if (!refSquare) return;
        refSquare.position.set(
          Math.sin(yaw) * REF_SQUARE_DIST,
          -cameraHeightM + 0.01,
          -Math.cos(yaw) * REF_SQUARE_DIST
        );
        refSquare.rotation.y = yaw;
      }

      // Redraw the traced outline + corner markers and refresh the readout.
      function rebuildTrace() {
        ensureDesignGroup();
        const pts = metricPoints();

        if (traceLine) { designGroup.remove(traceLine); disposeObj(traceLine); traceLine = null; }
        if (pts.length >= 2) {
          const lifted = pts.map((p) => new THREE.Vector3(p.x, p.y + 0.01, p.z));
          const g = new THREE.BufferGeometry().setFromPoints(lifted);
          const m = new THREE.LineBasicMaterial({ color: TRACE_COLOR, depthTest: false });
          traceLine = pts.length >= 3 ? new THREE.LineLoop(g, m) : new THREE.Line(g, m);
          traceLine.renderOrder = 999;
          designGroup.add(traceLine);
        }

        while (markerGroup.children.length) {
          const c = markerGroup.children.pop();
          disposeObj(c);
        }
        pts.forEach((p) => {
          const s = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xffb000, depthTest: false })
          );
          s.position.set(p.x, p.y + 0.01, p.z);
          s.renderOrder = 1000;
          markerGroup.add(s);
        });

        applyTraceVisibility();
        updateDims(pts);
        undoBtn.disabled = floorVerts.length === 0;
        clearBtn.disabled = floorVerts.length === 0;
        updateDesignSteps();
      }

      // The outline + corner dots only show while actively tracing — after
      // "Stop tracing" the polygon keeps clamping furniture invisibly (a wall
      // bump still flashes it red for a moment).
      function applyTraceVisibility() {
        if (traceLine) traceLine.visible = tracing;
        if (markerGroup) markerGroup.visible = tracing;
      }

      function updateDims(pts) {
        if (pts.length < 3) {
          dimsEl.textContent = floorVerts.length === 0
            ? "Tap each floor corner to map the room."
            : floorVerts.length + " point" + (floorVerts.length > 1 ? "s" : "") + " · keep tapping the corners";
          return;
        }
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, area2 = 0;
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i], q = pts[(i + 1) % pts.length];
          minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
          minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
          area2 += p.x * q.z - q.x * p.z;
        }
        const w = maxX - minX, d = maxZ - minZ, area = Math.abs(area2) / 2;
        dimsEl.textContent = "≈ " + w.toFixed(1) + " m × " + d.toFixed(1) + " m · " + area.toFixed(1) + " m²";
      }

      function placeVertex(e) {
        const dir = dirFromEvent(e);
        if (!projectToFloor(dir, cameraHeightM)) return; // tapped above the floor
        floorVerts.push(dir);
        rebuildTrace();
        saveDesign();
      }

      function syncHeightInputs() {
        heightRange.value = String(cameraHeightM);
        heightNum.value = cameraHeightM.toFixed(2);
      }

      function onHeightChange() {
        // positionRefSquare (called every frame from tick) re-reads cameraHeightM,
        // so the reference square follows height changes without a rebuild here.
        rebuildTrace();
        reseatFurniture();
        saveDesign();
      }

      function setTracing(on) {
        tracing = on;
        traceBtn.classList.toggle("is-active", on);
        traceBtn.textContent = on ? "■ Stop tracing" : "▢ Trace floor";
        canvas.style.cursor = on ? "crosshair" : "";
        applyTraceVisibility();
        updateDesignSteps();
      }

      // Highlight the design-panel step the user is most likely on: scale
      // until the 1 m square is dismissed, trace until a polygon exists,
      // then furnish. Purely a guide — every control stays usable.
      function updateDesignSteps() {
        const heads = designPanel.querySelectorAll(".rdp-step-head");
        if (!heads.length) return;
        let active = 0;
        if (tracing) active = 1;
        else if (floorVerts.length >= 3) active = 2;
        else if (!showRefChk.checked) active = 1;
        heads.forEach((h, i) => h.classList.toggle("is-active", i === active));
      }

      // Design mode is now equivalent to "the stage lives in the Room
      // Designer tab" — the Create tab is a plain viewer. Room data loading
      // is presentStage's job, not this toggle's.
      function setDesignMode(on) {
        designMode = on;
        designPanel.hidden = !on;
        if (on) {
          ensureDesignGroup();
        } else {
          setTracing(false);
          selectFurniture(null);
        }
        if (designGroup) designGroup.visible = on; // overlays only while designing
        syncFullscreenTools();
      }

      /* ----- Stage placement: Create tab (viewer) vs Room Designer tab ----- */

      let stageLocation = "create";

      // Reparenting the canvas keeps the WebGL context — same node, new home.
      function placeStage(where) {
        stageLocation = where;
        const host = where === "studio" ? studioHost : createHost;
        if (host && stage.parentElement !== host) host.appendChild(stage);
        designBtn.hidden = where === "studio"; // already in the designer
        // "Change room" only makes sense inside the designer's room chooser flow.
        if (backToRoomsBtn) backToRoomsBtn.hidden = where !== "studio";
        setDesignMode(where === "studio");
        syncStudioEmpty();
      }

      // "← Change room": flush any pending save, close the current room, and
      // return to the studio's room chooser (design is kept and will reload).
      const backToRoomsBtn = document.getElementById("room3d-back-btn");
      if (backToRoomsBtn) {
        backToRoomsBtn.addEventListener("click", () => {
          clearTimeout(designSaveTimer);
          pushDesignToServer().catch(() => {});
          stop();
          stage.hidden = true;
          syncStudioEmpty();
        });
      }

      // The studio shows its room chooser whenever it doesn't hold a live room.
      function syncStudioEmpty() {
        if (!studioEmpty) return;
        studioEmpty.hidden = stageLocation === "studio" && !stage.hidden;
      }

      // Hooks for the view-switching code outside this IIFE.
      roomStageApi = {
        resize: () => { if (!stage.hidden) sizeRendererToCanvas(); },
        syncStudioEmpty,
      };

      // Per-room persistence (local only for now — cross-device sharing would
      // need this state added to the upload payload).
      function designKey() {
        return (
          "treeview:roomdesign:" +
          (currentRoomUploadId || (dormRoomContext && dormRoomContext.designId) || "local")
        );
      }

      function designPayload() {
        return {
          h: cameraHeightM,
          verts: floorVerts.map((d) => [+d.x.toFixed(5), +d.y.toFixed(5), +d.z.toFixed(5)]),
          items: serializeFurniture(),
        };
      }

      // Immediate server write of the current design (uploads and dorm rooms
      // hit different endpoints). Returns a promise so the share-link copy
      // can flush before handing out the URL.
      function pushDesignToServer() {
        const payload = designPayload();
        const body = {
          cameraHeight: payload.h,
          floorVerts: payload.verts,
          items: payload.items,
        };
        if (currentRoomUploadId) {
          return fetch("/api/uploads/" + encodeURIComponent(currentRoomUploadId) + "/design", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }
        if (dormRoomContext) {
          body.dormId = dormRoomContext.dormId;
          body.sceneId = dormRoomContext.sceneId;
          return fetch("/api/dorm-designs/" + encodeURIComponent(dormRoomContext.designId), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }
        return Promise.resolve();
      }

      // Flash a visible "Saved" confirmation so users know their work persists.
      const saveStatusEl = document.getElementById("room3d-save-status");
      let saveStatusTimer = null;
      function flashSaveStatus(text) {
        if (!saveStatusEl) return;
        saveStatusEl.textContent = text;
        saveStatusEl.classList.add("is-visible");
        clearTimeout(saveStatusTimer);
        saveStatusTimer = setTimeout(() => saveStatusEl.classList.remove("is-visible"), 1600);
      }

      let designSaveTimer = null;
      function saveDesign() {
        try {
          localStorage.setItem(designKey(), JSON.stringify(designPayload()));
        } catch (_) { /* storage unavailable */ }
        // Debounce the server PUT — the height slider calls saveDesign on
        // every input tick, which would otherwise fire a request per pixel.
        clearTimeout(designSaveTimer);
        designSaveTimer = setTimeout(() => {
          pushDesignToServer()
            .then(() => flashSaveStatus("✓ Saved"))
            .catch((err) => {
              flashSaveStatus("✓ Saved on this device");
              console.warn("[design] server save failed (kept locally):", err);
            });
        }, 500);
      }

      let designLoadSeq = 0; // guards against interleaved loads on fast room switches
      async function loadDesign() {
        const mySeq = ++designLoadSeq;
        clearTimeout(designSaveTimer); // a pending save belongs to the previous room
        clearFurniture();
        floorVerts = [];
        cameraHeightM = 1.4;
        let items = [];
        let data = null;

        let serverUrl = null;
        if (currentRoomUploadId) {
          serverUrl = "/api/uploads/" + encodeURIComponent(currentRoomUploadId) + "/design";
        } else if (dormRoomContext) {
          serverUrl = "/api/dorm-designs/" + encodeURIComponent(dormRoomContext.designId);
        }

        if (serverUrl) {
          try {
            const res = await fetch(serverUrl);
            if (res.ok) {
              const body = await res.json();
              if (body.design) {
                data = {
                  h: body.design.cameraHeight,
                  verts: body.design.floorVerts,
                  items: body.design.items,
                };
              }
            }
          } catch (_) { /* fall back to localStorage */ }
          if (mySeq !== designLoadSeq) return; // superseded while fetching
        }

        if (!data) {
          try {
            const raw = localStorage.getItem(designKey());
            if (raw) data = JSON.parse(raw);
          } catch (_) { /* ignore malformed state */ }
        }

        if (data) {
          if (typeof data.h === "number" && isFinite(data.h)) cameraHeightM = data.h;
          if (Array.isArray(data.verts)) {
            floorVerts = data.verts.map((a) => new THREE.Vector3(a[0], a[1], a[2]));
          }
          if (Array.isArray(data.items)) items = data.items;
        }
        syncHeightInputs();
        rebuildRefSquare();
        rebuildTrace();
        items.forEach((it) => {
          const cat = FURNITURE_CATALOG.find((c) => c.id === it.id);
          if (cat) addFurniture(cat, { x: it.x, z: it.z, rotY: it.rotY, silent: true });
        });
      }

      /* ----- Furniture: load, scale to true size, place, drag, persist ----- */

      function ensureFurnitureGroup() {
        if (furnitureGroup) return;
        furnitureGroup = new THREE.Group();
        scene.add(furnitureGroup);
      }

      // Load (and cache) a GLB's scene. Waits for the module loader if the user
      // clicks before the import has resolved.
      function loadGLTFScene(file) {
        if (gltfCache[file]) return gltfCache[file];
        const p = new Promise((resolve, reject) => {
          const start = () => new window.GLTFLoader().load(
            "models/" + file, (g) => resolve(g.scene), undefined, reject
          );
          if (window.GLTFLoader) start();
          else window.addEventListener("treeview-gltfloader-ready", start, { once: true });
        });
        gltfCache[file] = p;
        return p;
      }

      function boxOf(obj) { return new THREE.Box3().setFromObject(obj); }

      async function addFurniture(cat, opts) {
        opts = opts || {};
        ensureFurnitureGroup();
        let template;
        try { template = await loadGLTFScene(cat.file); }
        catch (err) { console.warn("[furniture] failed to load", cat.file, err); return null; }

        const obj = template.clone(true);

        // Uniform-scale to the real-world target (preserves the stylized look).
        const size = new THREE.Vector3();
        boxOf(obj).getSize(size);
        const ref = cat.axis === "y" ? size.y : Math.max(size.x, size.z);
        obj.scale.setScalar(ref > 1e-4 ? cat.target / ref : 1);

        // Center on (cx,cz) and seat the base on the floor plane y = -h.
        let cx = (opts.x !== undefined) ? opts.x : 0;
        let cz = (opts.z !== undefined) ? opts.z : -2;
        // New placements stay inside the walls; silent restores keep their
        // saved spot untouched (it was clamped when placed).
        if (!opts.silent) {
          const preBox = boxOf(obj);
          const preSize = new THREE.Vector3();
          preBox.getSize(preSize);
          const c = clampToRoom(cx, cz, Math.max(preSize.x, preSize.z) / 2);
          cx = c.x; cz = c.z;
        }
        const box = boxOf(obj);
        const center = new THREE.Vector3();
        box.getCenter(center);
        obj.position.x += cx - center.x;
        obj.position.z += cz - center.z;
        obj.position.y += (-cameraHeightM) - box.min.y;
        obj.rotation.y = opts.rotY || 0;
        obj.userData = { catId: cat.id, file: cat.file, cx: cx, cz: cz };
        furnitureGroup.add(obj);

        if (!opts.silent) { selectFurniture(obj); saveDesign(); }
        return obj;
      }

      // Drop a catalog item ~2 m in front of wherever the camera is facing, so
      // it lands in view (near the reference square) instead of at a fixed world
      // spot that may be behind you once you've turned around.
      const PLACE_DIST = 2.0;
      function placeInView(cat) {
        return addFurniture(cat, {
          x: Math.sin(yaw) * PLACE_DIST,
          z: -Math.cos(yaw) * PLACE_DIST,
        });
      }

      // Show/hide the green 1 m reference square (the "Done" button and the
      // fullscreen guide toggle both route through here).
      function setReferenceVisible(on) {
        showRefChk.checked = on;
        rebuildRefSquare();
      }

      function selectFurniture(obj) {
        selectedItem = obj;
        selectedRow.hidden = !obj;
        if (selBox && furnitureGroup) { furnitureGroup.remove(selBox); disposeObj(selBox); }
        selBox = null;
        if (obj && furnitureGroup) {
          try {
            selBox = new THREE.BoxHelper(obj, 0x3d9a8c);
            if (selBox.material) selBox.material.depthTest = false;
            selBox.renderOrder = 1001;
            furnitureGroup.add(selBox);
          } catch (err) { selBox = null; }
        }
      }

      // Ray from the camera (origin) through the pointer; select the first
      // furniture hit and grab it, or deselect on empty space.
      function tryGrabFurniture(e) {
        if (!furnitureGroup || !furnitureGroup.children.length) return false;
        furnRaycaster.set(camera.position, dirFromEvent(e));
        const targets = furnitureGroup.children.filter((o) => o.userData && o.userData.catId);
        const hits = furnRaycaster.intersectObjects(targets, true);
        if (!hits.length) { selectFurniture(null); return false; }
        let root = hits[0].object;
        while (root.parent && root.parent !== furnitureGroup) root = root.parent;
        selectFurniture(root);
        draggingItem = root;
        return true;
      }

      function moveFurniture(e) {
        if (!draggingItem) return;
        const p = projectToFloor(dirFromEvent(e), cameraHeightM);
        if (!p) return;
        const box = boxOf(draggingItem);
        const size = new THREE.Vector3();
        box.getSize(size);
        // Keep the whole footprint inside the walls, not just the center.
        const c = clampToRoom(p.x, p.z, Math.max(size.x, size.z) / 2);
        if (c.clamped) wallBump(c.wall);
        const center = new THREE.Vector3();
        box.getCenter(center);
        draggingItem.position.x += c.x - center.x;
        draggingItem.position.z += c.z - center.z;
        draggingItem.userData.cx = c.x;
        draggingItem.userData.cz = c.z;
        if (selBox) selBox.update();
      }

      function rotateSelected() {
        if (!selectedItem) return;
        selectedItem.rotation.y += ROTATE_STEP;
        if (selBox) selBox.update();
        saveDesign();
      }

      function deleteSelected() {
        if (!selectedItem) return;
        furnitureGroup.remove(selectedItem);
        selectFurniture(null);
        saveDesign();
      }

      // When the camera height changes the floor moves, so re-seat every model.
      function reseatFurniture() {
        if (!furnitureGroup) return;
        furnitureGroup.children.forEach((o) => {
          if (!o.userData || !o.userData.catId) return;
          o.position.y += (-cameraHeightM) - boxOf(o).min.y;
        });
        if (selBox) selBox.update();
      }

      function clearFurniture() {
        selectFurniture(null);
        if (!furnitureGroup) return;
        furnitureGroup.children
          .filter((o) => o.userData && o.userData.catId)
          .forEach((o) => furnitureGroup.remove(o));
      }

      function serializeFurniture() {
        if (!furnitureGroup) return [];
        return furnitureGroup.children
          .filter((o) => o.userData && o.userData.catId)
          .map((o) => ({
            id: o.userData.catId,
            x: +o.userData.cx.toFixed(3),
            z: +o.userData.cz.toFixed(3),
            rotY: +o.rotation.y.toFixed(3),
          }));
      }

      function bindDesignEvents() {
        // "Design this room" sends the stage to the Room Designer tab; the
        // Create tab returns to its upload form (photos stay loaded).
        designBtn.addEventListener("click", () => {
          if (designerUploadRoot) designerUploadRoot.hidden = false;
          if (roomUploadForm) roomUploadForm.hidden = false;
          placeStage("studio");
          setActiveView("studio");
        });
        traceBtn.addEventListener("click", () => setTracing(!tracing));
        undoBtn.addEventListener("click", () => { floorVerts.pop(); rebuildTrace(); saveDesign(); });
        clearBtn.addEventListener("click", () => { floorVerts = []; rebuildTrace(); saveDesign(); });
        showRefChk.addEventListener("change", rebuildRefSquare);
        rotateBtn.addEventListener("click", rotateSelected);
        deleteBtn.addEventListener("click", deleteSelected);

        // "Done" with height calibration — hide the 1 m reference square so it's
        // out of the way while placing furniture.
        const heightDoneBtn = document.getElementById("rdp-height-done");
        if (heightDoneBtn) heightDoneBtn.addEventListener("click", () => setReferenceVisible(false));

        heightRange.addEventListener("input", () => {
          const v = parseFloat(heightRange.value);
          cameraHeightM = isFinite(v) ? v : 1.4;
          heightNum.value = cameraHeightM.toFixed(2);
          onHeightChange();
        });
        heightNum.addEventListener("change", () => {
          let v = parseFloat(heightNum.value);
          if (!isFinite(v)) v = 1.4;
          cameraHeightM = Math.min(3, Math.max(0.3, v));
          syncHeightInputs();
          onHeightChange();
        });

        // Furniture catalog buttons, grouped by category.
        FURNITURE_GROUPS.forEach((grp) => {
          const items = FURNITURE_CATALOG.filter((c) => c.group === grp.id);
          if (!items.length) return;
          const wrap = document.createElement("div");
          wrap.className = "rdp-cat-group";
          const head = document.createElement("span");
          head.className = "rdp-cat-group-label";
          head.textContent = grp.label;
          wrap.appendChild(head);
          const row = document.createElement("div");
          row.className = "rdp-cat-group-items";
          items.forEach((cat) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "rdp-cat-btn";
            b.textContent = cat.label;
            b.addEventListener("click", async () => {
              b.disabled = true;
              await placeInView(cat);
              b.disabled = false;
            });
            row.appendChild(b);
          });
          wrap.appendChild(row);
          catalogEl.appendChild(wrap);
        });

        // Furniture drag: a grabbed model follows the floor; release saves.
        canvas.addEventListener("pointermove", (e) => { if (draggingItem) moveFurniture(e); });
        canvas.addEventListener("pointerup", () => { if (draggingItem) { draggingItem = null; saveDesign(); } });

        // Keyboard: rotate / delete the selection (ignored while typing height).
        window.addEventListener("keydown", (e) => {
          if (!designMode || !selectedItem) return;
          const tag = e.target && e.target.tagName;
          if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
          if (e.key === "r" || e.key === "R") rotateSelected();
          else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelected(); }
        });

        // A near-stationary press while tracing drops a corner; a real drag
        // still looks around. Skip if this gesture grabbed furniture.
        canvas.addEventListener("pointerup", (e) => {
          if (furnitureGesture || !designMode || !tracing) return;
          if (Math.hypot(e.clientX - downX, e.clientY - downY) <= CLICK_SLOP) placeVertex(e);
        });
      }

      // Fullscreen design toolbar: a top-left dropdown to add furniture plus
      // rotate/delete for the current selection, so the room is fully designable
      // in fullscreen (where the panel below the canvas isn't visible).
      function bindFullscreenTools() {
        const addBtn   = document.getElementById("room3d-fs-add-btn");
        const menu     = document.getElementById("room3d-fs-menu");
        const guideBtn = document.getElementById("room3d-fs-guide");
        const rotBtn   = document.getElementById("room3d-fs-rotate");
        const delBtn   = document.getElementById("room3d-fs-delete");
        if (!addBtn || !menu) return;

        // Build the menu from the same catalog as the side panel (with the
        // same category groupings). Clicking an item enables design mode (so
        // it can be moved/selected) and drops it in front of the current view.
        FURNITURE_GROUPS.forEach((grp) => {
          const items = FURNITURE_CATALOG.filter((c) => c.group === grp.id);
          if (!items.length) return;
          const head = document.createElement("span");
          head.className = "room3d-fs-menu-group";
          head.textContent = grp.label;
          menu.appendChild(head);
          items.forEach((cat) => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "room3d-fs-menu-item";
            item.setAttribute("role", "menuitem");
            item.textContent = cat.label;
            item.addEventListener("click", async () => {
              closeFsMenu();
              item.disabled = true;
              await placeInView(cat);
              item.disabled = false;
            });
            menu.appendChild(item);
          });
        });

        addBtn.addEventListener("click", () => { menu.hidden ? openFsMenu() : closeFsMenu(); });
        // Click anywhere outside the dropdown closes the menu.
        document.addEventListener("pointerdown", (e) => {
          if (!menu.hidden && !e.target.closest(".room3d-fs-dropdown")) closeFsMenu();
        });

        if (guideBtn) guideBtn.addEventListener("click", () => setReferenceVisible(!showRefChk.checked));
        if (rotBtn) rotBtn.addEventListener("click", rotateSelected);
        if (delBtn) delBtn.addEventListener("click", deleteSelected);
      }

      function openFsMenu() {
        const addBtn = document.getElementById("room3d-fs-add-btn");
        const menu   = document.getElementById("room3d-fs-menu");
        if (!menu) return;
        menu.hidden = false;
        if (addBtn) addBtn.setAttribute("aria-expanded", "true");
      }
      function closeFsMenu() {
        const addBtn = document.getElementById("room3d-fs-add-btn");
        const menu   = document.getElementById("room3d-fs-menu");
        if (!menu) return;
        menu.hidden = true;
        if (addBtn) addBtn.setAttribute("aria-expanded", "false");
      }

      // Show the fullscreen toolbar only while this room's viewport is the
      // fullscreen element AND design mode is on — the Create tab's viewer
      // has no design affordances, fullscreen included.
      function syncFullscreenTools() {
        const fsTools = document.getElementById("room3d-fs-tools");
        if (!fsTools) return;
        const viewport = canvas.closest(".room3d-viewport");
        const inFs = !!document.fullscreenElement && document.fullscreenElement === viewport;
        fsTools.hidden = !inFs || !designMode;
        if (fsTools.hidden) closeFsMenu();
      }

      function tick() {
        animFrame = requestAnimationFrame(tick);
        if (!dragging && (Math.abs(velYaw) > 0.00005 || Math.abs(velPitch) > 0.00005)) {
          yaw   += velYaw;
          pitch -= velPitch;
          clampPitch();
          velYaw   *= INERTIA;
          velPitch *= INERTIA;
          updateCamera();
        }
        // Reference square chases the camera's yaw so it stays on the floor ahead
        // of you while designing (covers both inertial glide and active drag).
        if (designMode && refSquare) positionRefSquare();
        renderer.render(scene, camera);
      }

      function start() {
        if (animFrame === null) tick();
      }

      function stop() {
        if (animFrame !== null) {
          cancelAnimationFrame(animFrame);
          animFrame = null;
        }
      }

      // Shared tail for both skybox kinds: reset the design overlays, recentre the
      // view, reveal the stage, and start rendering once layout has settled.
      function presentStage(roomName, opts) {
        opts = opts || {};
        titleEl.textContent = roomName || "Your 3D room";

        // Stock dorm rooms have no photos to edit; designs of them are still
        // shareable via their designId, so the share button stays.
        editBtn.hidden = !!opts.dormRoom;
        copyLinkBtn.hidden = false;
        if (opts.dormRoom) copyLinkBtn.disabled = false;

        setTracing(false);
        selectFurniture(null);
        stage.hidden = false;
        // Dorm rooms open straight in the Room Designer tab (the user clicked
        // a design action); uploads present as a plain viewer in Create.
        placeStage(opts.dormRoom ? "studio" : "create");
        // Restore this room's saved design — furniture renders in the viewer
        // too; only the design *tools* are studio-gated.
        loadDesign();

        // Reset the view to face front at the default zoom.
        yaw = 0; pitch = 0; velYaw = 0; velPitch = 0;
        setFov(DEFAULT_FOV);
        updateCamera();

        // Canvas had no size while hidden — size it once layout settles, then run.
        requestAnimationFrame(() => {
          sizeRendererToCanvas();
          start();
          stage.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }

      window.renderRoomBuilderSkybox = function (urls, roomName) {
        if (!Array.isArray(urls) || urls.length < 6) {
          console.warn("[room3d] need 6 photo URLs, got", urls);
          return;
        }
        init();
        buildCube(urls);
        presentStage(roomName);
      };

      // Equirectangular-panorama entry point: one image → inverted-sphere skybox.
      // opts.dormRoom marks a stock dorm room (per-dorm persistence, no share).
      window.renderRoomBuilderPano = function (url, roomName, opts) {
        if (typeof url !== "string" || !url) {
          console.warn("[room3d] renderRoomBuilderPano needs an image URL, got", url);
          return;
        }
        init();
        buildSphere(url);
        presentStage(roomName, opts);
      };

      window.addEventListener("resize", () => {
        if (!initialized || stage.hidden) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(sizeRendererToCanvas, 120);
      });
    })();

    // =====================================================================
    // FEATURE: Multi-school TreeView — create your school, add residences,
    // upload 360° room panoramas, and browse them, all backed by the API.
    // =====================================================================
    (function initSchoolView() {
      const listEl = document.getElementById("school-list");
      const createForm = document.getElementById("school-create-form");
      const nameInput = document.getElementById("school-name-input");
      const locationInput = document.getElementById("school-location-input");
      const createBtn = document.getElementById("school-create-btn");
      const createStatus = document.getElementById("school-create-status");
      const pickStep = document.getElementById("school-step-pick");
      const activePanel = document.getElementById("school-active");
      const activeName = document.getElementById("school-active-name");
      const switchBtn = document.getElementById("school-switch-btn");
      const dormForm = document.getElementById("school-dorm-form");
      const dormInput = document.getElementById("school-dorm-input");
      const dormStatus = document.getElementById("school-dorm-status");
      const dormGrid = document.getElementById("school-dorm-grid");
      const panoInput = document.getElementById("school-pano-input");
      const panoOverlay = document.getElementById("school-pano-overlay");
      const panoTitle = document.getElementById("school-pano-title");
      const panoClose = document.getElementById("school-pano-close");

      let schools = [];
      let activeSchool = null;       // { slug, name, location, dorms }
      let uploadsByDorm = {};        // dormId -> [{uploadId, kind, savedFiles, roomName}]
      let pendingUploadDormId = null;
      let schoolPanoViewer = null;
      let loadedOnce = false;

      function setStatus(el, kind, msg) {
        if (!msg) {
          el.hidden = true;
          el.textContent = "";
          el.classList.remove("is-error", "is-success");
          return;
        }
        el.hidden = false;
        el.textContent = msg;
        el.classList.toggle("is-error", kind === "error");
        el.classList.toggle("is-success", kind === "success");
      }

      async function fetchSchools() {
        const res = await fetch("/api/schools");
        if (!res.ok) return;
        const data = await res.json();
        schools = data.schools || [];
        renderSchoolList();
      }

      function renderSchoolList() {
        listEl.replaceChildren();
        if (!schools.length) {
          const empty = document.createElement("p");
          empty.className = "school-list-empty";
          empty.textContent = "No schools yet — yours can be the first.";
          listEl.appendChild(empty);
          return;
        }
        schools.forEach((s) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "school-chip";
          btn.innerHTML =
            '<span class="school-chip-name"></span><span class="school-chip-meta"></span>';
          btn.querySelector(".school-chip-name").textContent = s.name;
          btn.querySelector(".school-chip-meta").textContent =
            (s.location ? s.location + " · " : "") + s.dorms.length + " residence" + (s.dorms.length === 1 ? "" : "s");
          btn.addEventListener("click", () => selectSchool(s.slug));
          listEl.appendChild(btn);
        });
      }

      async function selectSchool(slug) {
        const res = await fetch("/api/schools/" + encodeURIComponent(slug));
        if (!res.ok) return;
        const data = await res.json();
        activeSchool = data.school;
        uploadsByDorm = data.uploadsByDorm || {};
        pickStep.hidden = true;
        activePanel.hidden = false;
        activeName.textContent = activeSchool.name + (activeSchool.location ? " — " + activeSchool.location : "");
        renderDormGrid();
      }

      function renderDormGrid() {
        dormGrid.replaceChildren();
        if (!activeSchool.dorms.length) {
          const empty = document.createElement("p");
          empty.className = "school-list-empty";
          empty.textContent = "No residences yet — add your first one above.";
          dormGrid.appendChild(empty);
          return;
        }

        activeSchool.dorms.forEach((dorm) => {
          const card = document.createElement("div");
          card.className = "school-dorm-card";

          const head = document.createElement("div");
          head.className = "school-dorm-card-head";
          const title = document.createElement("h4");
          title.className = "school-dorm-card-name";
          title.textContent = dorm.name;
          head.appendChild(title);

          const uploadBtn = document.createElement("button");
          uploadBtn.type = "button";
          uploadBtn.className = "school-upload-btn";
          uploadBtn.textContent = "⬆ Upload 360° room";
          uploadBtn.addEventListener("click", () => {
            pendingUploadDormId = dorm.id;
            panoInput.click();
          });
          head.appendChild(uploadBtn);
          card.appendChild(head);

          const rooms = (uploadsByDorm[dorm.id] || []).filter((u) => u.kind === "pano");
          const roomsWrap = document.createElement("div");
          roomsWrap.className = "school-room-list";
          if (!rooms.length) {
            const none = document.createElement("p");
            none.className = "school-room-empty";
            none.textContent = "No rooms uploaded yet.";
            roomsWrap.appendChild(none);
          } else {
            rooms.forEach((room) => {
              const roomBtn = document.createElement("button");
              roomBtn.type = "button";
              roomBtn.className = "school-room-btn";
              const photoUrl =
                "/api/uploads/" + room.uploadId + "/photos/" + (room.savedFiles[0] || "");
              roomBtn.innerHTML =
                '<img class="school-room-thumb" alt="" loading="lazy" />' +
                '<span class="school-room-label"></span>';
              roomBtn.querySelector("img").src = photoUrl;
              roomBtn.querySelector(".school-room-label").textContent =
                (room.roomName || "Room") + " · view 360°";
              roomBtn.addEventListener("click", () =>
                openSchoolPano(dorm.name + " — " + (room.roomName || "Room"), photoUrl)
              );
              roomsWrap.appendChild(roomBtn);
            });
          }
          card.appendChild(roomsWrap);
          dormGrid.appendChild(card);
        });
      }

      function openSchoolPano(title, url) {
        panoTitle.textContent = title;
        panoOverlay.hidden = false;
        if (schoolPanoViewer) {
          schoolPanoViewer.destroy();
          schoolPanoViewer = null;
        }
        schoolPanoViewer = pannellum.viewer("school-panorama", {
          type: "equirectangular",
          panorama: url,
          autoLoad: true,
          showControls: true,
          showFullscreenCtrl: true,
        });
      }

      function closeSchoolPano() {
        panoOverlay.hidden = true;
        if (schoolPanoViewer) {
          schoolPanoViewer.destroy();
          schoolPanoViewer = null;
        }
      }

      panoClose.addEventListener("click", closeSchoolPano);
      panoOverlay.addEventListener("click", (e) => {
        if (e.target === panoOverlay) closeSchoolPano();
      });

      createForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        if (name.length < 2) {
          setStatus(createStatus, "error", "Enter your school's name first.");
          return;
        }
        createBtn.disabled = true;
        setStatus(createStatus, null, "");
        const res = await fetch("/api/schools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, location: locationInput.value.trim() }),
        });
        const data = await res.json();
        createBtn.disabled = false;
        if (!res.ok && res.status !== 409) {
          setStatus(createStatus, "error", data.error || "Could not create the school.");
          return;
        }
        nameInput.value = "";
        locationInput.value = "";
        await fetchSchools();
        await selectSchool(data.school.slug);
      });

      dormForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = dormInput.value.trim();
        if (name.length < 2) {
          setStatus(dormStatus, "error", "Enter a residence name first.");
          return;
        }
        setStatus(dormStatus, null, "");
        const res = await fetch("/api/schools/" + encodeURIComponent(activeSchool.slug) + "/dorms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus(dormStatus, "error", data.error || "Could not add the residence.");
          return;
        }
        dormInput.value = "";
        activeSchool = data.school;
        renderDormGrid();
        setStatus(dormStatus, "success", "Added! Now upload a 360° room photo for it.");
      });

      panoInput.addEventListener("change", async () => {
        const file = panoInput.files && panoInput.files[0];
        panoInput.value = "";
        if (!file || !pendingUploadDormId || !activeSchool) return;

        const form = new FormData();
        form.append("panorama", file);
        form.append("schoolSlug", activeSchool.slug);
        form.append("dormId", pendingUploadDormId);
        form.append("roomType", "room");
        form.append("roomName", file.name.replace(/\.[^.]+$/, "").slice(0, 60));

        setStatus(dormStatus, null, "Uploading…");
        const res = await fetch("/api/upload-pano", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
          setStatus(dormStatus, "error", data.error || "Upload failed — try a smaller JPG/PNG/WebP.");
          return;
        }
        setStatus(dormStatus, "success", "Room uploaded!");
        await selectSchool(activeSchool.slug);
      });

      switchBtn.addEventListener("click", () => {
        activeSchool = null;
        activePanel.hidden = true;
        pickStep.hidden = false;
        fetchSchools();
      });

      // Lazy-load the school list the first time the view becomes visible.
      const schoolViewEl = document.getElementById("view-school");
      new MutationObserver(() => {
        if (!schoolViewEl.hidden && !loadedOnce) {
          loadedOnce = true;
          fetchSchools();
        }
      }).observe(schoolViewEl, { attributes: true, attributeFilter: ["hidden"] });
    })();

    // Set initial view on load. Shared upload links land on Create 3D Room;
    // shared design links land on the Room Designer.
    const bootParams = new URLSearchParams(window.location.search);
    setActiveView(
      bootParams.has("design")
        ? "studio"
        : bootParams.has("upload")
          ? "designer"
          : viewFromHash() || "home",
      { updateHash: false }
    );
    loadSharedUploadIfPresent();
    loadSharedDesignIfPresent();
    })();
