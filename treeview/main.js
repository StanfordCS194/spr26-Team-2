    /*
     * Maps internal keys (what we store in data / HOUSES) to human-readable labels on buttons.
     * Example: one_room_double -> “1-room doubles”
     */
    const ROOM_LABELS = {
      single: "Singles",
      one_room_double: "1-room doubles",
      two_room_double: "2-room doubles",
      one_room_triple: "1-room triples",
      two_room_triple: "2-room triples",
      three_room_triple: "3-room triples",
    };

    /*
     * Master list of dorms for the class project.
     * category: "frosh" = first-year designated halls; "four_class" = might mix class years.
     * roomTypes is which pill buttons to show for that building (not every dorm has triples, etc.).
     */
    const HOUSES = [
      { id: "branner", name: "Branner", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double", "one_room_triple", "two_room_triple"] },
      { id: "crothers", name: "Crothers", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double", "one_room_triple"] },
      { id: "alondra", name: "Alondra", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double"] },
      { id: "mirlo", name: "Mirlo", category: "frosh", roomTypes: ["single", "one_room_double"] },
      { id: "castano", name: "Castaño", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double", "one_room_triple", "two_room_triple", "three_room_triple"] },
      { id: "lantana", name: "Lantana", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double", "one_room_triple"] },
      { id: "robinson", name: "Robinson", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double", "one_room_triple", "three_room_triple"] },
      { id: "schiff", name: "Schiff", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double", "one_room_triple", "two_room_triple", "three_room_triple"] },
      { id: "west-lagunita", name: "West Lagunita", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double"] },
      { id: "donner", name: "Donner", category: "frosh", roomTypes: ["single", "one_room_double"] },
      { id: "larkin", name: "Larkin", category: "frosh", roomTypes: ["single", "one_room_double"] },
      { id: "arroyo", name: "Arroyo", category: "frosh", roomTypes: ["single", "one_room_double"] },
      { id: "cedro", name: "Cedro", category: "frosh", roomTypes: ["single", "one_room_double"] },
      { id: "rinconada", name: "Rinconada", category: "frosh", roomTypes: ["single", "one_room_double"] },
      { id: "soto", name: "Soto", category: "frosh", roomTypes: ["single", "one_room_double"] },
      { id: "cardenal", name: "Cardenal", category: "four_class", roomTypes: ["single", "one_room_double", "two_room_double"] },
      { id: "potter", name: "Potter", category: "four_class", roomTypes: ["single", "one_room_double", "two_room_double", "one_room_triple"] },
      { id: "ujamaa", name: "Ujamaa", category: "four_class", roomTypes: ["single", "one_room_double", "two_room_double"] },
      { id: "burbank", name: "Burbank", category: "four_class", roomTypes: ["single", "one_room_double"] },
      { id: "zap", name: "ZAP", category: "four_class", roomTypes: ["single", "one_room_double"] },
      { id: "casa-zapata", name: "Casa Zapata", category: "four_class", roomTypes: ["single", "one_room_double"] },
      { id: "sally-ride", name: "Sally Ride", category: "four_class", roomTypes: ["single", "one_room_double"] },
      { id: "junipero", name: "Junipero", category: "four_class", roomTypes: ["single", "one_room_double"] },
      { id: "okada", name: "Okada", category: "four_class", roomTypes: ["single", "one_room_double"] },
      { id: "otero", name: "Otero", category: "four_class", roomTypes: ["single", "one_room_double"] },
    ];

    /* Split for the two <optgroup>s in the dropdown — keeps the markup readable */
    const frosh = HOUSES.filter((h) => h.category === "frosh");
    const fourClass = HOUSES.filter((h) => h.category === "four_class");

    /*
     * Panorama sources:
     * - ZAP uses treeview/photos (main website assets)
     * - Other dorm test tours use dorm-tour-pannellum/otherPhotos
     */
    const ZAP_PANORAMA_BASE = "https://raw.githubusercontent.com/StanfordCS194/spr26-Team-2/main/treeview/photos/";
    const OTHER_DORM_PANORAMA_BASE = "https://raw.githubusercontent.com/StanfordCS194/spr26-Team-2/main/dormPhotos/";
    function pano(base, file) {
      return base + file;
    }

    /*
     * Pannellum “tour” config — mirrored from dorm-tour-pannellum/index.html.
     * Each scene is one equirectangular photo; hotSpots jump between scene ids.
     */
    function getDemoTourConfig(dormId) {
      const HOTSPOT_DEBUG = false;
      const baseScene = {
        type: "equirectangular",
        autoLoad: true,
        hfov: 70,
        minHfov: 50,
        maxHfov: 90,
        haov: 110,
        vaov: 45,
        vOffset: 0,
        yaw: 0,
        pitch: 0,
        minYaw: -55,
        maxYaw: 55,
        minPitch: -22,
        maxPitch: 22,
        avoidShowingBackground: true,
      };

      const withDefaults = (firstScene, scenes) => ({
        default: {
          firstScene,
          autoLoad: true,
          sceneFadeDuration: 800,
          showControls: true,
          showFullscreenCtrl: true,
          hotSpotDebug: HOTSPOT_DEBUG,
        },
        scenes,
      });

      const dormTours = {
        zap: withDefaults("zapOne", {
          zapOne: { ...baseScene, title: "ZAP One", panorama: pano(ZAP_PANORAMA_BASE, "ZAP_One.jpeg"), hotSpots: [{ pitch: 3.5, yaw: -18, type: "scene", text: "Go to ZAP Two", sceneId: "zapTwo" }] },
          zapTwo: { ...baseScene, title: "ZAP Two", panorama: pano(ZAP_PANORAMA_BASE, "ZAP_Two.jpeg"), hotSpots: [{ pitch: 2, yaw: 45, type: "scene", text: "Back to ZAP One", sceneId: "zapOne" }, { pitch: 3, yaw: -42, type: "scene", text: "Go to ZAP Three", sceneId: "zapThree" }] },
          zapThree: { ...baseScene, title: "ZAP Three", panorama: pano(ZAP_PANORAMA_BASE, "ZAP_Three.jpeg"), hotSpots: [{ pitch: 2, yaw: 45, type: "scene", text: "Back to ZAP Two", sceneId: "zapTwo" }, { pitch: 2, yaw: 24, type: "scene", text: "Go to ZAP Four", sceneId: "zapFour" }] },
          zapFour: { ...baseScene, title: "ZAP Four", panorama: pano(ZAP_PANORAMA_BASE, "ZAP_Four.jpeg"), hotSpots: [{ pitch: 3, yaw: -31, type: "scene", text: "Back to ZAP Three", sceneId: "zapThree" }, { pitch: 3, yaw: 4, type: "scene", text: "Go to ZAP Five", sceneId: "zapFive" }] },
          zapFive: { ...baseScene, title: "ZAP Five", panorama: pano(ZAP_PANORAMA_BASE, "ZAP_Five.jpeg"), hotSpots: [{ pitch: 3, yaw: 50, type: "scene", text: "Back to ZAP Four", sceneId: "zapFour" }] },
        }),

        okada: withDefaults("okadaOne", {
          okadaOne: { ...baseScene, title: "Okada One", panorama: pano(OTHER_DORM_PANORAMA_BASE, "okada_one.jpeg"), hotSpots: [{ pitch: 1.85, yaw: -1.13, type: "scene", text: "Go to Okada Two", sceneId: "okadaTwo" }] },
          okadaTwo: { ...baseScene, title: "Okada Two", panorama: pano(OTHER_DORM_PANORAMA_BASE, "okada_two.jpeg"), hotSpots: [{ pitch: -2.42, yaw: 44.58, type: "scene", text: "Back to Okada One", sceneId: "okadaOne" }, { pitch: 1.21, yaw: -11.68, type: "scene", text: "Go to Okada Three", sceneId: "okadaThree" }] },
          okadaThree: { ...baseScene, title: "Okada Three", panorama: pano(OTHER_DORM_PANORAMA_BASE, "okada_three.jpeg"), hotSpots: [{ pitch: 4.5, yaw: 26.95, type: "scene", text: "Back to Okada Two", sceneId: "okadaTwo" }] },
        }),

        rinconada: withDefaults("rinconadaOne", {
          rinconadaOne: { ...baseScene, title: "Rinconada One", panorama: pano(OTHER_DORM_PANORAMA_BASE, "rinconada_one.jpeg"), hotSpots: [{ pitch: 0.16, yaw: -9.22, type: "scene", text: "Go to Rinconada Two", sceneId: "rinconadaTwo" }] },
          rinconadaTwo: { ...baseScene, title: "Rinconada Two", panorama: pano(OTHER_DORM_PANORAMA_BASE, "rinconada_two.jpeg"), hotSpots: [{ pitch: 2.31, yaw: 54.01, type: "scene", text: "Back to Rinconada One", sceneId: "rinconadaOne" }, { pitch: 0.4, yaw: -4.92, type: "scene", text: "Go to Rinconada Three", sceneId: "rinconadaThree" }] },
          rinconadaThree: { ...baseScene, title: "Rinconada Three", panorama: pano(OTHER_DORM_PANORAMA_BASE, "rinconada_three.jpeg"), hotSpots: [{ pitch: 1.37, yaw: -19.98, type: "scene", text: "Back to Rinconada Two", sceneId: "rinconadaTwo" }] },
        }),

        soto: withDefaults("sotoOne", {
          sotoOne: { ...baseScene, title: "Soto One", panorama: pano(OTHER_DORM_PANORAMA_BASE, "soto_one.jpeg"), hotSpots: [{ pitch: 3.22, yaw: -10.97, type: "scene", text: "Go to Soto Two", sceneId: "sotoTwo" }] },
          sotoTwo: { ...baseScene, title: "Soto Two", panorama: pano(OTHER_DORM_PANORAMA_BASE, "soto_two.jpeg"), hotSpots: [{ pitch: 0.75, yaw: 45.2, type: "scene", text: "Back to Soto One", sceneId: "sotoOne" }, { pitch: 2.54, yaw: -11.48, type: "scene", text: "Go to Soto Three", sceneId: "sotoThree" }] },
          sotoThree: { ...baseScene, title: "Soto Three", panorama: pano(OTHER_DORM_PANORAMA_BASE, "soto_three.jpeg"), hotSpots: [{ pitch: 2.1, yaw: 9.12, type: "scene", text: "Back to Soto Two", sceneId: "sotoTwo" }] },
        }),

        "sally-ride": withDefaults("sallyRideOne", {
          sallyRideOne: { ...baseScene, title: "Sally Ride One", panorama: pano(OTHER_DORM_PANORAMA_BASE, "sallyride_one.jpeg"), hotSpots: [{ pitch: 1.02, yaw: -24.9, type: "scene", text: "Go to Sally Ride Two", sceneId: "sallyRideTwo" }] },
          sallyRideTwo: { ...baseScene, title: "Sally Ride Two", panorama: pano(OTHER_DORM_PANORAMA_BASE, "sallyride_two.jpeg"), hotSpots: [{ pitch: 1.33, yaw: 43.56, type: "scene", text: "Back to Sally Ride One", sceneId: "sallyRideOne" }, { pitch: 5.12, yaw: -35.15, type: "scene", text: "Go to Sally Ride Three", sceneId: "sallyRideThree" }] },
          sallyRideThree: { ...baseScene, title: "Sally Ride Three", panorama: pano(OTHER_DORM_PANORAMA_BASE, " sallyride_three.jpeg"), hotSpots: [{ pitch: 8.74, yaw: 28.08, type: "scene", text: "Back to Sally Ride Two", sceneId: "sallyRideTwo" }] },
        }),

        lantana: withDefaults("lantanaOne", {
          lantanaOne: { ...baseScene, title: "Lantana One", panorama: pano(OTHER_DORM_PANORAMA_BASE, "launtana_one.jpeg"), hotSpots: [{ pitch: -0.78, yaw: -33.2, type: "scene", text: "Go to Lantana Two", sceneId: "lantanaTwo" }] },
          lantanaTwo: { ...baseScene, title: "Lantana Two", panorama: pano(OTHER_DORM_PANORAMA_BASE, "launtana_two.jpeg"), hotSpots: [{ pitch: 3.97, yaw: 49.7, type: "scene", text: "Back to Lantana One", sceneId: "lantanaOne" }, { pitch: 1.71, yaw: 22.96, type: "scene", text: "Go to Lantana Three", sceneId: "lantanaThree" }] },
          lantanaThree: { ...baseScene, title: "Lantana Three", panorama: pano(OTHER_DORM_PANORAMA_BASE, "launtana_three.jpeg"), hotSpots: [{ pitch: 0.13, yaw: -43.86, type: "scene", text: "Back to Lantana Two", sceneId: "lantanaTwo" }] },
        }),
      };

      return dormTours[dormId] || null;
    }

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
    const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

    let roomPhotoEntries = [];
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

    function setCurrentRoomUploadId(uploadId) {
      currentRoomUploadId = uploadId || null;
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

      const ready = n === MAX_ROOM_PHOTOS;
      uploadSubmitEl.disabled = !ready;
      uploadSubmitEl.setAttribute("aria-disabled", ready ? "false" : "true");
      uploadReadyRowEl.classList.toggle("is-ready", ready);
      if (ready) uploadReadyTextEl.textContent = "Ready to upload";
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
      if (to !== null) moveRoomPhoto(from, to);
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
      const photoUrls = photoUrlsForSharedUpload(meta);
      if (photoUrls.length < MAX_ROOM_PHOTOS || typeof window.renderRoomBuilderSkybox !== "function") return;
      const roomName = (meta.roomName || "").trim() || "Shared 3D room";
      window.renderRoomBuilderSkybox(photoUrls, roomName);
      setActiveView("designer");
    }

    async function hydrateSharedUploadForEditing(meta) {
      const photoUrls = photoUrlsForSharedUpload(meta);
      const savedFiles = meta.savedFiles || [];
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

    async function copyUploadShareLink(uploadId, btn) {
      const url = buildShareUrl(uploadId);
      try {
        await navigator.clipboard.writeText(url);
        const prev = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.textContent = prev;
        }, 2000);
      } catch {
        window.prompt("Copy this link to share your 3D room upload:", url);
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
      uploadSubmitEl.disabled =
        isSubmitting || roomPhotoEntries.length !== MAX_ROOM_PHOTOS; // Disable if uploading OR missing photos
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

      // Safety check: ensure exactly 6 photos are selected and button is enabled
      if (roomPhotoEntries.length !== MAX_ROOM_PHOTOS || uploadSubmitEl.disabled) return;

      clearUploadResult(); // Hide any previous success/error message
      setUploadSubmitting(true); // Show spinner, disable button, change text to "Uploading..."
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
          `Upload failed: ${escapeUploadHtml(err.message)}. Please try again.`,
        );
        // Photos remain selected, so user can retry by clicking submit again
        uploadReadyTextEl.textContent = "Ready to upload";
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
      return Boolean(getDemoTourConfig(dormId));
    }

    // Boot the 360 viewer — initialized lazily when the residences tab becomes active
    let panoramaViewer = null;
    let panoramaViewerDormId = null;
    function loadMainPanoramaForDorm(dormId) {
      const panoHost = document.getElementById("treeview-panorama");
      const house = getHouse(dormId);
      const config = getDemoTourConfig(dormId);

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

    function applyTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      themeToggles.forEach((btn) => {
        btn.innerHTML = theme === "dark" ? "&#9788;" : "&#9790;";
        btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      });
      localStorage.setItem("tv-theme", theme);
    }

    themeToggles.forEach((btn) => {
      btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "light";
        applyTheme(current === "dark" ? "light" : "dark");
      });
    });

    const savedTheme = localStorage.getItem("tv-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(savedTheme);

    // ===== Dashboard view switching =====
    const DASHBOARD_VIEWS = ["residences", "map", "walk", "rankings", "designer"];
    const VIEW_HASHES = {
      map: "#map",
      residences: "#residences",
      walk: "#distance",
      rankings: "#rankings",
      designer: "#designer",
    };
    const HASH_TO_VIEW = Object.fromEntries(
      Object.entries(VIEW_HASHES).map(([view, hash]) => [hash, view])
    );
    let activeDashboardView = "map";
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
        btn.setAttribute("aria-current", on ? "page" : "false");
      });
      if (viewId === "map" && typeof campusMap !== "undefined" && campusMap) {
        requestAnimationFrame(() => campusMap.resize());
      }
      if (viewId === "residences") {
        initPanoramaViewer();
        resizeMainPanorama();
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
      setActiveView(viewFromHash() || "map", { updateHash: false });
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
      try {
        return JSON.parse(localStorage.getItem("tv-favorites") || "[]");
      } catch { return []; }
    }

    function saveFavorites(favs) {
      localStorage.setItem("tv-favorites", JSON.stringify(favs));
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
          dormSelect.value = favId;
          houseId = favId;
          roomType = getHouse(favId).roomTypes[0];
          renderPills();
          updatePreview();
          renderFavUI();
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
    const DORM_COORDS = [
      { id: "branner", lat: 37.4255, lng: -122.1629 },
      { id: "crothers", lat: 37.4258, lng: -122.1647 },
      { id: "alondra", lat: 37.4222, lng: -122.1718 },
      { id: "mirlo", lat: 37.4218, lng: -122.1723 },
      { id: "castano", lat: 37.4250, lng: -122.1610 },
      { id: "lantana", lat: 37.4257, lng: -122.1608 },
      { id: "robinson", lat: 37.4254, lng: -122.1795 },
      { id: "schiff", lat: 37.4251, lng: -122.1800 },
      { id: "west-lagunita", lat: 37.4250, lng: -122.1768 },
      { id: "donner", lat: 37.4243, lng: -122.1662 },
      { id: "larkin", lat: 37.4250, lng: -122.1658 },
      { id: "arroyo", lat: 37.4243, lng: -122.1626 },
      { id: "cedro", lat: 37.4241, lng: -122.1623 },
      { id: "rinconada", lat: 37.4238, lng: -122.1640 },
      { id: "soto", lat: 37.4244, lng: -122.1639 },
      { id: "cardenal", lat: 37.4220, lng: -122.1715 },
      { id: "potter", lat: 37.4256, lng: -122.1793 },
      { id: "ujamaa", lat: 37.4248, lng: -122.1758 },
      { id: "burbank", lat: 37.4242, lng: -122.1653 },
      { id: "zap", lat: 37.4213, lng: -122.1619 },
      { id: "casa-zapata", lat: 37.4239, lng: -122.1656 },
      { id: "sally-ride", lat: 37.4240, lng: -122.1662 },
      { id: "junipero", lat: 37.4235, lng: -122.1624 },
      { id: "okada", lat: 37.4235, lng: -122.1629 },
      { id: "otero", lat: 37.4236, lng: -122.1637 },
    ];

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

    function flyToDorm(dorm, house) {
      if (activePopup) { activePopup.remove(); activePopup = null; }

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

    function showMapPanorama(house) {
      mapOverlayTitle.textContent = house.name + " — 360° Tour";
      mapOverlay.classList.add("is-visible");

      if (mapPanoViewer) {
        mapPanoViewer.destroy();
        mapPanoViewer = null;
      }

      const mapPanoHost = document.getElementById("map-panorama");
      mapPanoHost.innerHTML = "";
      const config = getDemoTourConfig(house.id);
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
        houseId = selectedId;
        roomType = getHouse(houseId).roomTypes[0];
        dormSelect.value = houseId;
        renderPills();
        updatePreview();
        renderFavUI();
        closeMapPanorama();
        resetMapView();
        setActiveView("residences");
      }
    });

    initCampusMap();

    // ===== FEATURE 5: Walking Distance Panel =====
    //
    // Shows estimated walking times from the currently selected dorm to five
    // key Stanford landmarks. Uses the Haversine formula to calculate the
    // straight-line distance between two lat/lng points on Earth's surface,
    // then converts to walking time at ~5 km/h with a 1.3x detour factor
    // (paths aren't straight lines — you follow sidewalks and turns).

    const CAMPUS_LANDMARKS = [
      { name: "Main Quad",          emoji: "🏛️", lat: 37.4275, lng: -122.1700 },
      { name: "Green Library",      emoji: "📚", lat: 37.4264, lng: -122.1672 },
      { name: "Arrillaga Dining",   emoji: "🍽️", lat: 37.4260, lng: -122.1736 },
      { name: "Tresidder Union",    emoji: "☕", lat: 37.4243, lng: -122.1710 },
      { name: "Maples Pavilion",    emoji: "🏀", lat: 37.4347, lng: -122.1610 },
    ];

    const WALK_SPEED_KMH = 5;
    const DETOUR_FACTOR = 1.3;

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
    //
    // Interactive leaderboard that scores and ranks all 25 dorms across
    // four criteria. Users can sort by any criterion and filter by dorm
    // category. Scores are computed from the HOUSES data + DORM_COORDS,
    // reusing existing data structures — no new data sources needed.
    //
    // Scoring criteria:
    //   - Room variety:   count of distinct room types (more = higher)
    //   - Closest to Quad: inverse walking distance to Main Quad (closer = higher)
    //   - Community score: composite of room variety + theme house status
    //   - Overall:        weighted average of all three above

    const RANKINGS_SORT_OPTIONS = [
      { key: "overall",   label: "Overall" },
      { key: "variety",   label: "Room variety" },
      { key: "proximity", label: "Closest to Quad" },
      { key: "community", label: "Community" },
    ];

    const RANKINGS_FILTERS = [
      { key: "all",        label: "All" },
      { key: "frosh",      label: "First-year" },
      { key: "four_class", label: "Four-class" },
    ];

    /*
     * Dorms known for distinctive community identity — theme houses,
     * self-ops, and program houses get bonus community points.
     * Values sourced from Stanford R&DE theme house designations.
     */
    const COMMUNITY_BONUS = {
      ujamaa: 3,         // Ethnic theme house
      "casa-zapata": 3,  // Ethnic theme house
      okada: 3,          // Ethnic theme house
      burbank: 2,        // ITALIC arts theme
      potter: 2,         // Explore Energy theme
      otero: 2,          // Public Service theme
      zap: 2,            // Self-operated row house
      "sally-ride": 1,   // Sophomore-only community
      lantana: 1,        // Community-service focus
    };

    const MAIN_QUAD = { lat: 37.4275, lng: -122.1700 };

    let rankingsSort = "overall";
    let rankingsFilter = "all";

    const rankingsSortPills = document.getElementById("rankings-sort-pills");
    const rankingsFilterPills = document.getElementById("rankings-filter-pills");
    const rankingsTable = document.getElementById("rankings-table");

    /*
     * Computes a normalised 0–100 score for each dorm on every criterion.
     *
     * Normalisation: for each metric, find the min and max across all dorms,
     * then scale each dorm's raw value into 0–100. This ensures every
     * criterion contributes equally regardless of its raw range.
     *
     * Overall = 0.35 * variety + 0.35 * proximity + 0.30 * community
     */
    function computeRankingsData() {
      const rawData = HOUSES.map((house) => {
        const coord = DORM_COORDS.find((d) => d.id === house.id);
        const distToQuad = coord
          ? haversineKm(coord.lat, coord.lng, MAIN_QUAD.lat, MAIN_QUAD.lng)
          : 2;

        const variety = house.roomTypes.length;
        const communityRaw = variety + (COMMUNITY_BONUS[house.id] || 0);

        return {
          house,
          variety,
          distToQuad,
          communityRaw,
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
        const overallScore   = Math.round(
          varietyScore * 0.35 + proximityScore * 0.35 + communityScore * 0.30
        );

        return {
          house: d.house,
          scores: {
            overall:   overallScore,
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
          '<span class="rankings-score-value">' + score + '</span>';

        row.addEventListener("click", () => {
          houseId = entry.house.id;
          roomType = getHouse(houseId).roomTypes[0];
          dormSelect.value = houseId;
          renderPills();
          updatePreview();
          renderFavUI();
          renderWalkDistances();
          renderRankingsTable();
          if (typeof loadNotesForCurrentDorm === "function") loadNotesForCurrentDorm();
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
      const saved = localStorage.getItem(notesKey(houseId)) || "";
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
        } else {
          // Empty textarea — clean up the key instead of storing "".
          localStorage.removeItem(notesKey(houseId));
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
        houseId = dormParam;
        const house = getHouse(houseId);
        roomType = house.roomTypes.includes(roomParam) ? roomParam : house.roomTypes[0];
        dormSelect.value = houseId;
        renderPills();
        updatePreview();
        renderFavUI();
        // Also refresh the notes for the new dorm
        if (typeof loadNotesForCurrentDorm === "function") loadNotesForCurrentDorm();
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
    const QUIZ_QUESTIONS = [
      {
        text: "Which year status are you applying for?",
        options: [
          { label: "First-year (mostly first-year residents)", tags: ["category:frosh"] },
          { label: "Four-class (any year, mixed students)", tags: ["category:four_class"] },
          { label: "Either is fine", tags: [] },
        ],
      },
      {
        text: "How many people in your room?",
        options: [
          { label: "Just me — I want a single", tags: ["has:single"] },
          { label: "Me and one other — a double", tags: ["has:one_room_double", "has:two_room_double"] },
          { label: "Three of us — a triple", tags: ["has:one_room_triple", "has:two_room_triple", "has:three_room_triple"] },
          { label: "Flexible / not sure", tags: [] },
        ],
      },
      {
        text: "If you're sharing, do you want one room or connected rooms?",
        options: [
          { label: "Everyone in one room together", tags: ["has:one_room_double", "has:one_room_triple"] },
          { label: "Separate connected rooms with a shared common area", tags: ["has:two_room_double", "has:two_room_triple", "has:three_room_triple"] },
          { label: "Doesn't matter to me", tags: [] },
        ],
      },
      {
        text: "How much variety do you want in the building?",
        options: [
          { label: "Lots of options (4+ different room types in one building)", tags: ["variety:high"] },
          { label: "Simpler is fine (fewer room types per building)", tags: ["variety:low"] },
          { label: "No preference", tags: [] },
        ],
      },
      {
        text: "Are you interested in a themed or focus community house?",
        options: [
          { label: "Yes — a cultural / ethnic theme house (Ujamaa, Casa Zapata, Okada)", tags: ["theme:yes", "theme:ethnic"] },
          { label: "Yes — an academic theme house (Burbank arts, Potter energy, Otero public service)", tags: ["theme:yes", "theme:academic"] },
          { label: "No, regular residence is what I want", tags: ["theme:no"] },
          { label: "Just show me what fits otherwise", tags: [] },
        ],
      },
      {
        text: "What's your social vibe?",
        options: [
          { label: "Big, lively, lots of common-area energy", tags: ["vibe:social"] },
          { label: "Small, cozy, close-knit community", tags: ["vibe:cozy"] },
          { label: "Somewhere in the middle", tags: [] },
        ],
      },
      {
        text: "Where on campus would you like to live?",
        options: [
          { label: "East Campus (Branner, Stern, Wilbur — near the science quad)", tags: ["location:east"] },
          { label: "Central (Lagunita, Florence Moore, Crothers — close to main quad)", tags: ["location:central"] },
          { label: "West Campus (Governor's Corner, Wisteria — quieter, near the foothills)", tags: ["location:west"] },
          { label: "The Row (smaller, character-rich houses)", tags: ["location:row"] },
          { label: "No preference", tags: [] },
        ],
      },
    ];

    // Per-dorm metadata sourced from Stanford R&DE + Residential Education
    // (resed.stanford.edu / rde.stanford.edu). Each tag is something we can
    // explain to the user — see REASON_LABELS below for human-readable forms.
    //
    // Theme designations:
    //   "theme:ethnic"   — officially designated Ethnic Theme House
    //                      (Ujamaa, Casa Zapata, Okada)
    //   "theme:academic" — academic / focus theme house
    //                      (Burbank=ITALIC arts, Potter=Explore Energy,
    //                       Otero=Public Service & Civic Engagement)
    //   "program:sle"    — hosts the Structured Liberal Education program
    //                      (Alondra, Cardenal — NOT a theme house, but a
    //                       program house, kept distinct for accuracy)
    //   "focus:service"  — community-service focus house (Lantana)
    //   "self-op"        — self-operated row house (ZAP)
    //
    // Location buckets (approximate, based on neighborhood groupings):
    //   "location:east"    — East Campus: Branner standalone, Stern Hall,
    //                        Wilbur Hall
    //   "location:central" — Crothers, Lagunita Court, Florence Moore
    //   "location:west"    — Sterling Quad (Governor's Corner), Gerhard
    //                        Casper Quad (Wisteria F)
    //   "location:row"     — The Row (ZAP)
    //
    // Vibe tags are conservative — only the dorms with clearly distinctive
    // size or culture get them. Most dorms stay neutral.
    const DORM_EXTRA_TAGS = {
      // Ethnic theme houses (officially designated)
      ujamaa: ["theme:yes", "theme:ethnic", "location:central"],
      "casa-zapata": ["theme:yes", "theme:ethnic", "location:east"],
      okada: ["theme:yes", "theme:ethnic", "location:east"],

      // Academic theme houses
      burbank: ["theme:yes", "theme:academic", "location:east"],  // ITALIC+Arts
      potter: ["theme:yes", "theme:academic", "location:west"],   // Explore Energy
      otero: ["theme:yes", "theme:academic", "location:east"],    // Public Service & Civic Engagement

      // SLE program (academic, not a theme house but program-based)
      alondra: ["program:sle", "location:central"],
      cardenal: ["program:sle", "location:central"],

      // The Row — self-operated, smaller community
      zap: ["self-op", "vibe:cozy", "location:row"],

      // Sally Ride is all-sophomore per Stanford (more restrictive than four-class)
      "sally-ride": ["year:sophomore", "location:east"],

      // Large frosh dorms known for social energy
      branner: ["vibe:social", "location:east"],
      crothers: ["vibe:social", "location:central"],

      // Lantana has a community-service focus (not an official theme house)
      lantana: ["focus:service", "location:west"],

      // Location tags for the rest — vibe stays neutral where unclear
      "west-lagunita": ["location:central"],
      castano: ["location:west"],
      schiff: ["location:west"],
      robinson: ["location:west"],
      mirlo: ["location:central"],
      donner: ["location:east"],
      larkin: ["location:east"],
      arroyo: ["location:east"],
      cedro: ["location:east"],
      rinconada: ["location:east"],
      soto: ["location:east"],
      junipero: ["location:east"],
    };

    // Builds the full tag set for a dorm by combining HOUSES data with the
    // extras above. Memoised so we don't recompute per-question.
    const _dormTagCache = new Map();
    function getDormTagSet(dorm) {
      if (_dormTagCache.has(dorm.id)) return _dormTagCache.get(dorm.id);
      const tags = new Set(["category:" + dorm.category]);
      dorm.roomTypes.forEach((rt) => tags.add("has:" + rt));
      tags.add(dorm.roomTypes.length >= 4 ? "variety:high" : "variety:low");
      const extras = DORM_EXTRA_TAGS[dorm.id] || [];
      extras.forEach((t) => tags.add(t));
      // Default theme:no for dorms that aren't tagged as themed
      if (!extras.includes("theme:yes")) tags.add("theme:no");
      _dormTagCache.set(dorm.id, tags);
      return tags;
    }

    // Human-readable reasons for the results card
    const REASON_LABELS = {
      "category:frosh": "First-year designated",
      "category:four_class": "Four-class undergraduate",
      "has:single": "offers singles",
      "has:one_room_double": "offers 1-room doubles",
      "has:two_room_double": "offers 2-room doubles",
      "has:one_room_triple": "offers 1-room triples",
      "has:two_room_triple": "offers 2-room triples",
      "has:three_room_triple": "offers 3-room triples",
      "variety:high": "lots of room type options",
      "variety:low": "simpler room type lineup",
      "theme:yes": "themed / focus house",
      "theme:no": "regular residence",
      "theme:ethnic": "ethnic / cultural theme house",
      "theme:academic": "academic theme house",
      "program:sle": "Structured Liberal Education program house",
      "focus:service": "community-service focus house",
      "self-op": "self-operated row house",
      "year:sophomore": "all-sophomore residence",
      "vibe:social": "big, social energy",
      "vibe:cozy": "cozy, close-knit",
      "location:east": "East Campus location",
      "location:central": "central-campus location",
      "location:west": "West Campus location",
      "location:row": "in The Row",
    };

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
      houseId = id;
      const house = getHouse(id);
      roomType = house.roomTypes[0];
      dormSelect.value = id;
      renderPills();
      updatePreview();
      renderFavUI();
      if (typeof loadNotesForCurrentDorm === "function") loadNotesForCurrentDorm();
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

    /* ===== Designer mode — Three.js panorama substrate =====
     * Renders ZAP_One on an inside-out sphere so a real 3D scene exists for
     * future furniture/share work. v1 is read-only; Tour mode remains the default.
     */
    (function initTreeViewDesigner() {
      const tourBtn        = document.getElementById("mode-tour-btn");
      const designBtn      = document.getElementById("mode-design-btn");
      const canvas         = document.getElementById("design-canvas");
      const panoHost       = document.getElementById("treeview-panorama");
      const designControls = document.getElementById("design-controls");
      const zoomInBtn      = document.getElementById("design-zoom-in");
      const zoomOutBtn     = document.getElementById("design-zoom-out");
      const fullscreenBtn  = document.getElementById("design-fullscreen");

      // Graceful degradation: if the Three.js CDN is blocked, Tour mode still works.
      if (typeof THREE === "undefined") {
        console.warn("[designer] THREE.js failed to load — Design mode disabled.");
        designBtn.disabled = true;
        designBtn.title = "Design mode unavailable (3D library failed to load)";
        return;
      }

      const FIRST_SCENE_URL = pano(ZAP_PANORAMA_BASE, "ZAP_One.jpeg");
      // Match Pannellum baseScene (haov: 110, vaov: 45) — half-angles for yaw/pitch clamps.
      const YAW_LIMIT_RAD   = THREE.MathUtils.degToRad(55);
      const PITCH_LIMIT_RAD = THREE.MathUtils.degToRad(22.5);
      const DRAG_SENSITIVITY = 0.0025;
      const INERTIA = 0.88;    // velocity multiplied each frame after pointer release
      const MIN_FOV = 50;      // degrees — matches Pannellum minHfov
      const MAX_FOV = 90;      // degrees — matches Pannellum maxHfov
      const ZOOM_STEP = 3;     // degrees per button press or scroll tick

      let renderer, scene, camera;
      let yaw = 0, pitch = 0;
      let velYaw = 0, velPitch = 0;
      const lookTarget = new THREE.Vector3();
      let initialized = false;
      let animFrame = null;
      let resizeTimer = null;
      let dragging = false;
      let lastX = 0, lastY = 0;

      function updateCamera() {
        // Standard first-person spherical look: yaw around Y, pitch around X.
        // At yaw=0, pitch=0 the camera looks down -Z (center of the equirectangular image).
        lookTarget.set(
          Math.sin(yaw) * Math.cos(pitch),
          Math.sin(pitch),
          -Math.cos(yaw) * Math.cos(pitch)
        );
        camera.lookAt(lookTarget);
      }

      function clampAngles() {
        if (yaw < -YAW_LIMIT_RAD)         { yaw   = -YAW_LIMIT_RAD;   velYaw   = 0; }
        else if (yaw > YAW_LIMIT_RAD)     { yaw   =  YAW_LIMIT_RAD;   velYaw   = 0; }
        if (pitch < -PITCH_LIMIT_RAD)     { pitch = -PITCH_LIMIT_RAD; velPitch = 0; }
        else if (pitch > PITCH_LIMIT_RAD) { pitch =  PITCH_LIMIT_RAD; velPitch = 0; }
      }

      function setFov(fov) {
        camera.fov = Math.min(MAX_FOV, Math.max(MIN_FOV, fov));
        camera.updateProjectionMatrix();
      }

      function sizeRendererToCanvas() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return; // canvas hidden — skip to avoid a 0×0 framebuffer
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }

      function init() {
        if (initialized) return;
        initialized = true;

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
        camera.position.set(0, 0, 0); // camera at origin; sphere wraps around it

        // Inside-out sphere — scale.x = -1 flips face winding so the texture is
        // visible from inside, and the equirectangular UV wrapping reads left-to-right.
        const geom = new THREE.SphereGeometry(50, 64, 40);
        geom.scale(-1, 1, 1);

        const texLoader = new THREE.TextureLoader();
        texLoader.setCrossOrigin("anonymous");
        const texture = texLoader.load(FIRST_SCENE_URL);
        texture.encoding = THREE.sRGBEncoding;

        scene.add(new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ map: texture })));

        sizeRendererToCanvas();
        updateCamera();
        bindEvents();
      }

      function bindEvents() {
        // --- Pointer drag (look-around: drag right = pan right, matching Pannellum) ---
        canvas.addEventListener("pointerdown", (e) => {
          dragging = true;
          velYaw = velPitch = 0; // kill any coasting momentum on new grab
          lastX = e.clientX;
          lastY = e.clientY;
          canvas.setPointerCapture(e.pointerId);
        });

        canvas.addEventListener("pointermove", (e) => {
          if (!dragging) return;
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;
          velYaw   = dx * DRAG_SENSITIVITY; // store for inertia coast on release
          velPitch = dy * DRAG_SENSITIVITY;
          yaw   += velYaw;
          pitch -= velPitch; // drag down (dy > 0) = look down = pitch decreases
          clampAngles();
          updateCamera();
        });

        const endDrag = (e) => {
          dragging = false;
          if (e && e.pointerId !== undefined && canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
          }
        };
        canvas.addEventListener("pointerup",     endDrag);
        canvas.addEventListener("pointercancel", endDrag);

        // --- Scroll wheel zoom (matches Pannellum: scroll up = zoom in = smaller FOV) ---
        canvas.addEventListener("wheel", (e) => {
          e.preventDefault();
          setFov(camera.fov + (e.deltaY > 0 ? ZOOM_STEP : -ZOOM_STEP));
        }, { passive: false });

        // --- Zoom buttons ---
        zoomInBtn.addEventListener("click",  () => setFov(camera.fov - ZOOM_STEP));
        zoomOutBtn.addEventListener("click", () => setFov(camera.fov + ZOOM_STEP));

        // --- Fullscreen ---
        fullscreenBtn.addEventListener("click", () => {
          if (!document.fullscreenElement) {
            canvas.requestFullscreen().catch(err => console.warn("[designer] fullscreen:", err));
          } else {
            document.exitFullscreen();
          }
        });
        // Resize the renderer once the browser has settled into/out of fullscreen
        document.addEventListener("fullscreenchange", () =>
          setTimeout(sizeRendererToCanvas, 50)
        );
      }

      function tick() {
        animFrame = requestAnimationFrame(tick);
        // Inertia coast: apply decaying velocity after the pointer is released
        if (!dragging && (Math.abs(velYaw) > 0.00005 || Math.abs(velPitch) > 0.00005)) {
          yaw   += velYaw;
          pitch -= velPitch;
          clampAngles();
          velYaw   *= INERTIA;
          velPitch *= INERTIA;
          updateCamera();
        }
        renderer.render(scene, camera);
      }

      function start() {
        init();
        sizeRendererToCanvas();
        if (animFrame === null) tick();
      }

      function stop() {
        if (animFrame !== null) {
          cancelAnimationFrame(animFrame);
          animFrame = null;
        }
      }

      function setMode(mode) {
        const designOn = mode === "design";
        panoHost.hidden        = designOn;
        canvas.hidden          = !designOn;
        designControls.hidden  = !designOn;
        tourBtn.classList.toggle("is-active",  !designOn);
        designBtn.classList.toggle("is-active", designOn);
        tourBtn.setAttribute("aria-selected",  String(!designOn));
        designBtn.setAttribute("aria-selected", String(designOn));
        if (designOn) {
          start();
        } else {
          stop();
          // Pannellum needs a nudge after its host returns from display:none
          if (typeof panoramaViewer !== "undefined" && panoramaViewer) panoramaViewer.resize();
        }
      }

      tourBtn.addEventListener("click",  () => setMode("tour"));
      designBtn.addEventListener("click", () => setMode("design"));

      window.addEventListener("resize", () => {
        if (!initialized || canvas.hidden) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(sizeRendererToCanvas, 120);
      });
    })();

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
        window.renderRoomBuilderSkybox = function () {
          console.warn("[room3d] THREE.js unavailable — skipping 3D render.");
        };
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

      let renderer, scene, camera, cubeMesh, texLoader;
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
      const FURNITURE_CATALOG = [
        { id: "bed",      label: "Bed",      file: "bedSingle.glb",       target: 1.90, axis: "xz" },
        { id: "desk",     label: "Desk",     file: "desk.glb",            target: 1.10, axis: "xz" },
        { id: "chair",    label: "Chair",    file: "chairDesk.glb",       target: 0.55, axis: "xz" },
        { id: "lamp",     label: "Lamp",     file: "lampSquareFloor.glb", target: 1.50, axis: "y"  },
        { id: "bookcase", label: "Bookcase", file: "bookcaseOpen.glb",    target: 1.60, axis: "y"  },
        { id: "plant",    label: "Plant",    file: "pottedPlant.glb",     target: 0.60, axis: "y"  },
        { id: "rug",      label: "Rug",      file: "rugRectangle.glb",    target: 1.60, axis: "xz" },
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

      function disposeCube() {
        if (!cubeMesh) return;
        scene.remove(cubeMesh);
        cubeMesh.geometry.dispose();
        cubeMesh.material.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
        cubeMesh = null;
      }

      function buildCube(urls) {
        disposeCube();
        const geom = new THREE.BoxGeometry(10, 10, 10);
        const materials = FACE_ORDER.map((f) => loadFace(urls[f.src], f.rotation));
        cubeMesh = new THREE.Mesh(geom, materials);
        scene.add(cubeMesh);
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
        document.addEventListener("fullscreenchange", () => setTimeout(sizeRendererToCanvas, 50));

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
          if (designerForm) designerForm.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        copyLinkBtn.addEventListener("click", () => {
          if (!currentRoomUploadId) return;
          copyUploadShareLink(currentRoomUploadId, copyLinkBtn);
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

      function disposeObj(o) {
        if (!o) return;
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      }

      function metricPoints() {
        return floorVerts.map((d) => projectToFloor(d, cameraHeightM)).filter(Boolean);
      }

      // Green 1 m square on the floor ~1.8 m ahead — a true-scale yardstick the
      // user matches against a known feature to dial in the camera height.
      function rebuildRefSquare() {
        ensureDesignGroup();
        if (refSquare) { designGroup.remove(refSquare); disposeObj(refSquare); refSquare = null; }
        if (!showRefChk.checked) return;
        const y = -cameraHeightM + 0.01, cz = -1.8, half = 0.5;
        const corners = [
          new THREE.Vector3(-half, y, cz - half),
          new THREE.Vector3( half, y, cz - half),
          new THREE.Vector3( half, y, cz + half),
          new THREE.Vector3(-half, y, cz + half),
        ];
        const g = new THREE.BufferGeometry().setFromPoints(corners);
        const m = new THREE.LineBasicMaterial({ color: 0x3dd68c, depthTest: false });
        refSquare = new THREE.LineLoop(g, m);
        refSquare.renderOrder = 998;
        designGroup.add(refSquare);
      }

      // Redraw the traced outline + corner markers and refresh the readout.
      function rebuildTrace() {
        ensureDesignGroup();
        const pts = metricPoints();

        if (traceLine) { designGroup.remove(traceLine); disposeObj(traceLine); traceLine = null; }
        if (pts.length >= 2) {
          const lifted = pts.map((p) => new THREE.Vector3(p.x, p.y + 0.01, p.z));
          const g = new THREE.BufferGeometry().setFromPoints(lifted);
          const m = new THREE.LineBasicMaterial({ color: 0xffb000, depthTest: false });
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

        updateDims(pts);
        undoBtn.disabled = floorVerts.length === 0;
        clearBtn.disabled = floorVerts.length === 0;
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
        rebuildRefSquare();
        rebuildTrace();
        reseatFurniture();
        saveDesign();
      }

      function setTracing(on) {
        tracing = on;
        traceBtn.classList.toggle("is-active", on);
        traceBtn.textContent = on ? "■ Stop tracing" : "▢ Trace floor";
        canvas.style.cursor = on ? "crosshair" : "";
      }

      function setDesignMode(on) {
        designMode = on;
        designPanel.hidden = !on;
        designBtn.classList.toggle("is-active", on);
        designBtn.textContent = on ? "✓ Done designing" : "✦ Design this room";
        if (on) {
          ensureDesignGroup();
          loadDesign();
        } else {
          setTracing(false);
          selectFurniture(null);
        }
        if (designGroup) designGroup.visible = on; // overlays only while designing
      }

      // Per-room persistence (local only for now — cross-device sharing would
      // need this state added to the upload payload).
      function designKey() {
        return "treeview:roomdesign:" + (currentRoomUploadId || "local");
      }

      function saveDesign() {
        try {
          localStorage.setItem(designKey(), JSON.stringify({
            h: cameraHeightM,
            verts: floorVerts.map((d) => [+d.x.toFixed(5), +d.y.toFixed(5), +d.z.toFixed(5)]),
            items: serializeFurniture(),
          }));
        } catch (_) { /* storage unavailable — design just won't persist */ }
      }

      function loadDesign() {
        clearFurniture();
        floorVerts = [];
        cameraHeightM = 1.4;
        let items = [];
        try {
          const raw = localStorage.getItem(designKey());
          if (raw) {
            const data = JSON.parse(raw);
            if (typeof data.h === "number" && isFinite(data.h)) cameraHeightM = data.h;
            if (Array.isArray(data.verts)) {
              floorVerts = data.verts.map((a) => new THREE.Vector3(a[0], a[1], a[2]));
            }
            if (Array.isArray(data.items)) items = data.items;
          }
        } catch (_) { /* ignore malformed state */ }
        syncHeightInputs();
        rebuildRefSquare();
        rebuildTrace();
        items.forEach((it) => {
          const cat = FURNITURE_CATALOG.find((c) => c.id === it.id);
          if (cat) addFurniture(cat, { x: it.x, z: it.z, rotY: it.rotY, silent: true });
        });
      }

      // Called when a new room is rendered: drop back to the plain viewer but
      // restore any saved design (height/outline/furniture) so the room shows
      // its furniture even before the user re-enters design mode.
      function resetDesignForNewRoom() {
        setTracing(false);
        selectFurniture(null);
        designMode = false;
        designPanel.hidden = true;
        designBtn.classList.remove("is-active");
        designBtn.textContent = "✦ Design this room";
        loadDesign();
        if (designGroup) designGroup.visible = false; // overlays hidden until design mode
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
        const cx = (opts.x !== undefined) ? opts.x : 0;
        const cz = (opts.z !== undefined) ? opts.z : -2;
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
        const center = new THREE.Vector3();
        box.getCenter(center);
        draggingItem.position.x += p.x - center.x;
        draggingItem.position.z += p.z - center.z;
        draggingItem.userData.cx = p.x;
        draggingItem.userData.cz = p.z;
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
        designBtn.addEventListener("click", () => setDesignMode(!designMode));
        traceBtn.addEventListener("click", () => setTracing(!tracing));
        undoBtn.addEventListener("click", () => { floorVerts.pop(); rebuildTrace(); saveDesign(); });
        clearBtn.addEventListener("click", () => { floorVerts = []; rebuildTrace(); saveDesign(); });
        showRefChk.addEventListener("change", rebuildRefSquare);
        rotateBtn.addEventListener("click", rotateSelected);
        deleteBtn.addEventListener("click", deleteSelected);

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

        // Furniture catalog buttons.
        FURNITURE_CATALOG.forEach((cat) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "rdp-cat-btn";
          b.textContent = cat.label;
          b.addEventListener("click", async () => {
            b.disabled = true;
            await addFurniture(cat, { x: 0, z: -2 });
            b.disabled = false;
          });
          catalogEl.appendChild(b);
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

      window.renderRoomBuilderSkybox = function (urls, roomName) {
        if (!Array.isArray(urls) || urls.length < 6) {
          console.warn("[room3d] need 6 photo URLs, got", urls);
          return;
        }
        init();
        titleEl.textContent = roomName || "Your 3D room";
        buildCube(urls);
        resetDesignForNewRoom();

        // Reset the view to face the front (North) wall at the default zoom.
        yaw = 0; pitch = 0; velYaw = 0; velPitch = 0;
        setFov(DEFAULT_FOV);
        updateCamera();

        stage.hidden = false;
        // Canvas had no size while hidden — size it once layout settles, then run.
        requestAnimationFrame(() => {
          sizeRendererToCanvas();
          start();
          stage.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      };

      window.addEventListener("resize", () => {
        if (!initialized || stage.hidden) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(sizeRendererToCanvas, 120);
      });
    })();

    // Set initial view on load. Shared upload links always land on the designer.
    const hasSharedUploadParam = new URLSearchParams(window.location.search).has("upload");
    setActiveView(hasSharedUploadParam ? "designer" : (viewFromHash() || "map"), { updateHash: false });
    loadSharedUploadIfPresent();
