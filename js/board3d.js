class Board3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.tileMeshes = [];
    this.pawnMeshes = [];
    this.houseMeshes = {};
    this.diceMeshes = [];
    this.dioramaGroup = null;
    this.boardSize = 22;
    this.tileSize = 2.2;
    this.tileCoords = [];
    this.cameraMode = "isometric";

    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.cameraDistance = 26;
    this.cameraAngleH = Math.PI / 4;
    this.cameraAngleV = Math.PI / 3.4;
    this.targetLookAt = new THREE.Vector3(0, 0, 0);

    this.init();
  }

  init() {
    if (!this.container || typeof THREE === "undefined") return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xF0EAE1);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 1000);
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.75);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.25);
    sunLight.position.set(16, 28, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 70;
    const d = 16;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x90caf9, 0.45);
    rimLight.position.set(-18, 12, -18);
    this.scene.add(rimLight);

    this.computeTileCoordinates();
    this.createBoardBase();
    this.createTileMeshes();
    this.createCentralDiorama();
    this.createPawns();
    this.createDice();

    this.setupInteractions();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener("resize", () => this.onWindowResize());
  }

  computeTileCoordinates() {
    const half = 9.5;
    const step = half * 2 / 10;

    this.tileCoords = [];
    for (let i = 0; i <= 10; i++) {
      const x = half - i * step;
      const z = half;
      this.tileCoords[i] = new THREE.Vector3(x, 0.1, z);
    }
    for (let i = 1; i <= 10; i++) {
      const x = -half;
      const z = half - i * step;
      this.tileCoords[10 + i] = new THREE.Vector3(x, 0.1, z);
    }
    for (let i = 1; i <= 10; i++) {
      const x = -half + i * step;
      const z = -half;
      this.tileCoords[20 + i] = new THREE.Vector3(x, 0.1, z);
    }
    for (let i = 1; i <= 9; i++) {
      const x = half;
      const z = -half + i * step;
      this.tileCoords[30 + i] = new THREE.Vector3(x, 0.1, z);
    }
  }

  createBoardBase() {
    const boardGroup = new THREE.Group();

    const frameGeo = new THREE.BoxGeometry(22.6, 0.7, 22.6);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x8D6E63,
      roughness: 0.35,
      metalness: 0.05
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.y = -0.35;
    frameMesh.receiveShadow = true;
    boardGroup.add(frameMesh);

    const boardGeo = new THREE.BoxGeometry(21.4, 0.2, 21.4);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0xFDFBF7,
      roughness: 0.6,
      metalness: 0.0
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.y = 0;
    boardMesh.receiveShadow = true;
    boardGroup.add(boardMesh);

    this.scene.add(boardGroup);
  }

  createTileMeshes() {
    this.tileMeshes = [];

    TILES.forEach((t, idx) => {
      const pos = this.tileCoords[idx];
      const isCorner = (idx % 10 === 0);
      const w = isCorner ? 2.4 : 1.7;
      const h = isCorner ? 2.4 : 1.7;

      const tileGeo = new THREE.BoxGeometry(w, 0.08, h);
      const canvasTex = this.createTileTexture(t, isCorner);
      const tileMat = new THREE.MeshStandardMaterial({
        map: canvasTex,
        roughness: 0.4,
        metalness: 0.05
      });

      const mesh = new THREE.Mesh(tileGeo, tileMat);
      mesh.position.copy(pos);
      mesh.position.y = 0.05;
      mesh.receiveShadow = true;
      mesh.userData = { tileId: idx, tileData: t };

      this.scene.add(mesh);
      this.tileMeshes.push(mesh);
    });
  }

  createTileTexture(tile, isCorner) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = "#E0E0E0";
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 248);

    if (isCorner) {
      ctx.fillStyle = tile.color || "#4CAF50";
      ctx.fillRect(8, 8, 240, 50);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(tile.nameEn || "CORNER", 128, 42);

      ctx.fillStyle = "#263238";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText(tile.name, 128, 140);
    } else {
      if (tile.color) {
        ctx.fillStyle = tile.color;
        ctx.fillRect(8, 8, 240, 55);
      }

      ctx.fillStyle = "#212121";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      
      const words = tile.name.split(" ");
      if (words.length > 2) {
        ctx.fillText(words.slice(0, 2).join(" "), 128, 115);
        ctx.fillText(words.slice(2).join(" "), 128, 145);
      } else {
        ctx.fillText(tile.name, 128, 125);
      }

      if (tile.price) {
        ctx.fillStyle = "#4CAF50";
        ctx.font = "bold 26px sans-serif";
        ctx.fillText(`$${tile.price}`, 128, 215);
      } else if (tile.amount) {
        ctx.fillStyle = "#E53935";
        ctx.font = "bold 26px sans-serif";
        ctx.fillText(`$${tile.amount}`, 128, 215);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    return tex;
  }

  createCentralDiorama() {
    this.dioramaGroup = new THREE.Group();

    const parkGeo = new THREE.BoxGeometry(13.8, 0.12, 13.8);
    const parkMat = new THREE.MeshStandardMaterial({
      color: 0x81C784,
      roughness: 0.65,
      metalness: 0.05
    });
    const parkMesh = new THREE.Mesh(parkGeo, parkMat);
    parkMesh.position.y = 0.06;
    parkMesh.receiveShadow = true;
    this.dioramaGroup.add(parkMesh);

    const towerGroup = new THREE.Group();
    const bankGeo = new THREE.BoxGeometry(3.6, 3.2, 3.6);
    const bankMat = new THREE.MeshStandardMaterial({ color: 0xFFF8E1, roughness: 0.3 });
    const bankMesh = new THREE.Mesh(bankGeo, bankMat);
    bankMesh.position.y = 1.6;
    bankMesh.castShadow = true;
    bankMesh.receiveShadow = true;
    towerGroup.add(bankMesh);

    const roofGeo = new THREE.ConeGeometry(2.8, 1.8, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x00897B, roughness: 0.25 });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.position.y = 4.1;
    roofMesh.castShadow = true;
    towerGroup.add(roofMesh);

    const vaneGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const vaneMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9, roughness: 0.1 });
    const vaneMesh = new THREE.Mesh(vaneGeo, vaneMat);
    vaneMesh.position.y = 5.2;
    towerGroup.add(vaneMesh);

    this.dioramaGroup.add(towerGroup);

    const treeOffsets = [
      { x: -4.5, z: -4.5 },
      { x: 4.5, z: -4.5 },
      { x: -4.5, z: 4.5 },
      { x: 4.5, z: 4.5 }
    ];

    treeOffsets.forEach(pos => {
      const tree = this.createLowPolyTree();
      tree.position.set(pos.x, 0.12, pos.z);
      this.dioramaGroup.add(tree);
    });

    const poolGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.2, 16);
    const poolMat = new THREE.MeshStandardMaterial({ color: 0x4FC3F7, roughness: 0.1, metalness: 0.2 });
    const poolMesh = new THREE.Mesh(poolGeo, poolMat);
    poolMesh.position.set(0, 0.18, 4.2);
    this.dioramaGroup.add(poolMesh);

    const b1 = this.createMiniSkyscraper(1.8, 4.5, 1.8, 0xFF7043);
    b1.position.set(-4.2, 0.1, 0);
    this.dioramaGroup.add(b1);

    const b2 = this.createMiniSkyscraper(1.8, 3.8, 1.8, 0x42A5F5);
    b2.position.set(4.2, 0.1, 0);
    this.dioramaGroup.add(b2);

    this.scene.add(this.dioramaGroup);
  }

  createLowPolyTree() {
    const treeGroup = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.9, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, roughness: 0.8 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.45;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const foliageGeo = new THREE.DodecahedronGeometry(0.85, 0);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x43A047,
      roughness: 0.4,
      flatShading: true
    });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = 1.35;
    foliage.castShadow = true;
    treeGroup.add(foliage);

    return treeGroup;
  }

  createMiniSkyscraper(w, h, d, color) {
    const group = new THREE.Group();
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = h / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    const roofGeo = new THREE.BoxGeometry(w * 0.8, 0.3, d * 0.8);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = h + 0.15;
    group.add(roof);

    return group;
  }

  createPawns() {
    this.pawnMeshes = [];
    const configs = PLAYER_CONFIGS;

    configs.forEach((cfg, idx) => {
      const pawnGroup = new THREE.Group();
      const pbrMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        metalness: cfg.metalness || 0.9,
        roughness: cfg.roughness || 0.18
      });

      if (cfg.token === "tophat") {
        const brimGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.08, 24);
        const brim = new THREE.Mesh(brimGeo, pbrMat);
        brim.castShadow = true;
        pawnGroup.add(brim);

        const crownGeo = new THREE.CylinderGeometry(0.38, 0.35, 0.7, 24);
        const crown = new THREE.Mesh(crownGeo, pbrMat);
        crown.position.y = 0.38;
        crown.castShadow = true;
        pawnGroup.add(crown);
      } else if (cfg.token === "car") {
        const bodyGeo = new THREE.BoxGeometry(0.55, 0.28, 0.9);
        const body = new THREE.Mesh(bodyGeo, pbrMat);
        body.position.y = 0.25;
        body.castShadow = true;
        pawnGroup.add(body);

        const cabinGeo = new THREE.BoxGeometry(0.42, 0.24, 0.45);
        const cabin = new THREE.Mesh(cabinGeo, pbrMat);
        cabin.position.set(0, 0.48, -0.05);
        cabin.castShadow = true;
        pawnGroup.add(cabin);
      } else if (cfg.token === "dog") {
        const dogBody = new THREE.BoxGeometry(0.4, 0.38, 0.65);
        const body = new THREE.Mesh(dogBody, pbrMat);
        body.position.y = 0.4;
        body.castShadow = true;
        pawnGroup.add(body);

        const dogHead = new THREE.BoxGeometry(0.32, 0.32, 0.32);
        const head = new THREE.Mesh(dogHead, pbrMat);
        head.position.set(0, 0.65, 0.3);
        head.castShadow = true;
        pawnGroup.add(head);
      } else {
        const hullGeo = new THREE.ConeGeometry(0.45, 0.9, 4);
        const hull = new THREE.Mesh(hullGeo, pbrMat);
        hull.rotation.x = Math.PI / 2;
        hull.position.y = 0.25;
        hull.castShadow = true;
        pawnGroup.add(hull);
      }

      const startPos = this.tileCoords[0].clone();
      const angle = (idx / 4) * Math.PI * 2;
      const r = 0.45;
      pawnGroup.position.set(startPos.x + Math.cos(angle) * r, 0.15, startPos.z + Math.sin(angle) * r);

      this.scene.add(pawnGroup);
      this.pawnMeshes.push(pawnGroup);
    });
  }

  createDice() {
    this.diceMeshes = [];
    for (let i = 0; i < 2; i++) {
      const diceGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const diceMat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.12,
        metalness: 0.05
      });
      const diceMesh = new THREE.Mesh(diceGeo, diceMat);
      diceMesh.castShadow = true;
      diceMesh.position.set(i === 0 ? -1.2 : 1.2, 0.7, 2.5);
      this.scene.add(diceMesh);
      this.diceMeshes.push(diceMesh);
    }
  }

  animateDiceRoll(val1, val2, onComplete) {
    if (this.diceMeshes.length < 2) return;

    const d1 = this.diceMeshes[0];
    const d2 = this.diceMeshes[1];
    const startTime = performance.now();
    const duration = 1100;

    const initialY = 4.5;
    d1.position.y = initialY;
    d2.position.y = initialY;

    const faceRotations = {
      1: { x: 0, z: 0 },
      2: { x: 0, z: Math.PI / 2 },
      3: { x: -Math.PI / 2, z: 0 },
      4: { x: Math.PI / 2, z: 0 },
      5: { x: 0, z: -Math.PI / 2 },
      6: { x: Math.PI, z: 0 }
    };

    const targetRot1 = faceRotations[val1] || { x: 0, z: 0 };
    const targetRot2 = faceRotations[val2] || { x: 0, z: 0 };

    const animateRoll = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      if (progress < 1.0) {
        const tumbleSpeed = (1.0 - progress) * 20;
        d1.rotation.x += 0.3 * tumbleSpeed;
        d1.rotation.y += 0.25 * tumbleSpeed;
        d1.rotation.z += 0.2 * tumbleSpeed;

        d2.rotation.x += 0.25 * tumbleSpeed;
        d2.rotation.y += 0.3 * tumbleSpeed;
        d2.rotation.z += 0.22 * tumbleSpeed;

        const bounce = Math.abs(Math.sin(progress * Math.PI * 3.5)) * (1.0 - progress) * 2.5;
        d1.position.y = 0.7 + bounce;
        d2.position.y = 0.7 + bounce;

        requestAnimationFrame(animateRoll);
      } else {
        d1.position.y = 0.7;
        d2.position.y = 0.7;
        d1.rotation.set(targetRot1.x, 0, targetRot1.z);
        d2.rotation.set(targetRot2.x, 0, targetRot2.z);
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(animateRoll);
  }

  animatePawnMove(playerIndex, fromTile, toTile, onStep, onComplete) {
    const pawn = this.pawnMeshes[playerIndex];
    if (!pawn) {
      if (onComplete) onComplete();
      return;
    }

    const totalSteps = (toTile - fromTile + 40) % 40;
    if (totalSteps === 0) {
      if (onComplete) onComplete();
      return;
    }

    let currentStep = 0;
    const stepDuration = 220;

    const hopNext = () => {
      if (currentStep >= totalSteps) {
        pawn.scale.set(1, 1, 1);
        if (onComplete) onComplete();
        return;
      }

      const stepTileIdx = (fromTile + currentStep + 1) % 40;
      const startCoord = this.tileCoords[(fromTile + currentStep) % 40];
      const endCoord = this.tileCoords[stepTileIdx];

      const angle = (playerIndex / 4) * Math.PI * 2;
      const r = 0.45;
      const offX = Math.cos(angle) * r;
      const offZ = Math.sin(angle) * r;

      const startTime = performance.now();

      const animateHop = (now) => {
        const elapsed = now - startTime;
        const p = Math.min(elapsed / stepDuration, 1.0);

        pawn.position.x = (startCoord.x + offX) + (endCoord.x - startCoord.x) * p;
        pawn.position.z = (startCoord.z + offZ) + (endCoord.z - startCoord.z) * p;

        const arcY = Math.sin(p * Math.PI) * 1.2;
        pawn.position.y = 0.15 + arcY;

        if (p < 0.5) {
          pawn.scale.set(0.85, 1.25, 0.85);
        } else {
          pawn.scale.set(1.18, 0.82, 1.18);
        }

        if (p < 1.0) {
          requestAnimationFrame(animateHop);
        } else {
          pawn.scale.set(1, 1, 1);
          currentStep++;
          if (onStep) onStep(stepTileIdx);
          hopNext();
        }
      };

      requestAnimationFrame(animateHop);
    };

    hopNext();
  }

  updateBuildings(tileId, houseCount) {
    if (this.houseMeshes[tileId]) {
      this.houseMeshes[tileId].forEach(m => this.scene.remove(m));
    }
    this.houseMeshes[tileId] = [];

    if (houseCount <= 0) return;

    const tilePos = this.tileCoords[tileId];
    if (!tilePos) return;

    if (houseCount === 5) {
      const hotel = this.createHotelMesh();
      hotel.position.set(tilePos.x, 0.25, tilePos.z);
      this.scene.add(hotel);
      this.houseMeshes[tileId].push(hotel);
    } else {
      for (let i = 0; i < houseCount; i++) {
        const house = this.createHouseMesh();
        const offsetX = (i - (houseCount - 1) / 2) * 0.45;
        house.position.set(tilePos.x + offsetX, 0.18, tilePos.z);
        this.scene.add(house);
        this.houseMeshes[tileId].push(house);
      }
    }
  }

  createHouseMesh() {
    const group = new THREE.Group();
    const wallGeo = new THREE.BoxGeometry(0.36, 0.26, 0.36);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.25 });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.castShadow = true;
    group.add(walls);

    const roofGeo = new THREE.ConeGeometry(0.28, 0.22, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.3 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.22;
    roof.castShadow = true;
    group.add(roof);

    return group;
  }

  createHotelMesh() {
    const group = new THREE.Group();
    const wallGeo = new THREE.BoxGeometry(0.68, 0.45, 0.5);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xE53935, roughness: 0.18, metalness: 0.05 });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.castShadow = true;
    group.add(walls);

    const roofGeo = new THREE.BoxGeometry(0.72, 0.18, 0.54);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xB71C1C, roughness: 0.25 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 0.31;
    roof.castShadow = true;
    group.add(roof);

    const chimGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 8);
    const chimMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 });
    const chim = new THREE.Mesh(chimGeo, chimMat);
    chim.position.set(0.2, 0.44, 0.1);
    group.add(chim);

    return group;
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    if (mode === "topdown") {
      this.cameraAngleV = 0.05;
      this.cameraDistance = 28;
    } else if (mode === "isometric") {
      this.cameraAngleV = Math.PI / 3.4;
      this.cameraAngleH = Math.PI / 4;
      this.cameraDistance = 26;
    }
    this.updateCameraPosition();
  }

  updateCameraPosition() {
    if (!this.camera) return;
    const x = this.targetLookAt.x + this.cameraDistance * Math.sin(this.cameraAngleV) * Math.sin(this.cameraAngleH);
    const y = this.targetLookAt.y + this.cameraDistance * Math.cos(this.cameraAngleV);
    const z = this.targetLookAt.z + this.cameraDistance * Math.sin(this.cameraAngleV) * Math.cos(this.cameraAngleH);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.targetLookAt);
  }

  setupInteractions() {
    const el = this.renderer.domElement;

    const onStart = (clientX, clientY) => {
      this.isDragging = true;
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onMove = (clientX, clientY) => {
      if (!this.isDragging) return;
      const deltaX = clientX - this.previousMousePosition.x;
      const deltaY = clientY - this.previousMousePosition.y;

      this.cameraAngleH -= deltaX * 0.007;
      this.cameraAngleV = Math.max(0.1, Math.min(Math.PI / 2.1, this.cameraAngleV - deltaY * 0.007));

      this.updateCameraPosition();
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onEnd = () => {
      this.isDragging = false;
    };

    el.addEventListener("mousedown", (e) => onStart(e.clientX, e.clientY));
    window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
    window.addEventListener("mouseup", onEnd);

    el.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener("touchend", onEnd);

    el.addEventListener("wheel", (e) => {
      this.cameraDistance = Math.max(14, Math.min(38, this.cameraDistance + e.deltaY * 0.02));
      this.updateCameraPosition();
      e.preventDefault();
    }, { passive: false });
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  animate() {
    requestAnimationFrame(this.animate);
    if (this.dioramaGroup) {
      const t = performance.now() * 0.001;
      this.dioramaGroup.position.y = Math.sin(t * 1.5) * 0.02;
    }
    this.renderer.render(this.scene, this.camera);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { Board3D };
}
