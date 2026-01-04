import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js';
import { TerrainManager } from './Terrain.js';
import { GISLoader } from './GISLoader.js';

// --- CONFIGURATION ---
const CONFIG = {
  snap: 1, // Grid snap size (smaller for more freedom)
  scales: {
    house: 0.2, // Increased from 0.012
    large_house: 0.15, // Reduced to match relative scale better
    lamp: 0.1,  // Perfect as is
    tree: 0.3   // Reduced from 2.0
  },
  costs: {
    house: 5000,
    large_house: 8000,
    lamp: 1000,
    tree: 50,
    move: 50
  },
  happyIds: {
    house: 20,
    large_house: 30, // More happiness for big house
    lamp: 5,
    tree: 2
  }
};


// --- SINGLETONS ---
class GameState {
  constructor() {
    this.budget = 50000;
    this.happiness = 50;
    this.objects = []; // List of placed objects (Groups)
    this.isEditMode = false;
    this.passiveInterval = null;

    // Passive Income
    this.startPassiveIncome();
  }

  startPassiveIncome() {
    if (this.passiveInterval) clearInterval(this.passiveInterval);
    this.passiveInterval = setInterval(() => {
      const income = Math.floor(this.happiness * 0.5);
      if (income > 0) {
        this.budget += income;
        if (window.ui) window.ui.update(); // Safe access
      }
    }, 3000);
  }

  canAfford(cost) {
    return this.budget >= cost;
  }

  transaction(cost, happyChange = 0) {
    if (this.budget >= cost) {
      this.budget -= cost;
      this.happiness += happyChange;
      if (window.ui) window.ui.update();
      return true;
    }
    if (window.ui) window.ui.toast("Not enough funds!", true);
    return false;
  }
}

class InputManager {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.ghost = null; // Object being placed/moved
    this.activeData = null; // Metadata { type, cost, isMove, originalPos }

    // Bind Events
    this.renderer.domElement.addEventListener('mousemove', (e) => this.onMove(e));
    this.renderer.domElement.addEventListener('mousedown', (e) => this.onDown(e));
    this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
    document.addEventListener('keydown', (e) => this.onKey(e));

    // Right Click to Lock/Unlock
    this.isLocked = false; // Ensure initialized
    this.renderer.domElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.ghost) {
        this.isLocked = !this.isLocked;
        window.ui.toast(this.isLocked ? "Position Locked (Right-Click to Unlock)" : "Position Unlocked", true);
        console.log("Lock State:", this.isLocked);
      }
    });
  }

  getRayIntersection(e, objects = []) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (objects.length > 0) {
      return this.raycaster.intersectObjects(objects, true);
    }
    return [];
  }

  getGroundPoint(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Create a virtual ground plane for raycasting
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();

    if (this.raycaster.ray.intersectPlane(plane, target)) {
      return target;
    }
    return null;
  }

  startPlacement(type) {
    if (this.ghost) {
      // Cancel current
      this.cancelGhost();
    }

    this.activeData = {
      type: type,
      cost: CONFIG.costs[type],
      happy: CONFIG.happyIds[type],
      scale: CONFIG.scales[type],
      isMove: false
    };

    // Create Ghost
    window.assets.createObject(type, this.activeData.scale).then(obj => {
      this.ghost = obj;
      this.applyGhostMaterial(this.ghost);
      this.scene.add(this.ghost);
    });

    this.isLocked = false;
    window.ui.toast(`Placing ${type}... Right-Click to Lock Pos.`);
    window.ui.toggleBuildMenu(false);
    window.ui.toggleRotateSlider(true); // Show slider
  }

  onMove(e) {
    // Ghost Placement (Used for both New and Edit)
    if (this.ghost && !this.isLocked) {
      const point = this.getGroundPoint(e);
      if (!point) return;

      this.ghost.position.set(
        Math.round(point.x / CONFIG.snap) * CONFIG.snap,
        0,
        Math.round(point.z / CONFIG.snap) * CONFIG.snap
      );
    }
  }

  onKey(e) {
    if (e.key === 'Escape') {
      if (this.ghost) {
        this.cancelGhost();
        window.ui.toast("Cancelled", true);
      } else if (window.state.isEditMode) {
        window.ui.toggleEditMode();
      }
    }
  }

  onDown(e) {
    // Left empty or used for other drag init if needed
  }

  onClick(e) {
    if (e.target !== this.renderer.domElement) return;

    console.log("🖱️ CLICK! | Ghost:", !!this.ghost, "| Locked:", this.isLocked, "| EditMode:", window.state.isEditMode);

    // 1. DROP Logic (If holding ghost)
    if (this.ghost && this.activeData) {
      // Allow placement even if locked? User said "Lock... but can't place".
      // Allow placement even if locked (User Feedback)

      let cost = 0;
      let happy = 0;

      if (this.activeData.isMove) {
        const dist = this.ghost.position.distanceTo(this.activeData.originalPos);
        cost = dist > 0.1 ? this.activeData.cost : 0;
        happy = 0;
      } else {
        cost = this.activeData.cost;
        happy = this.activeData.happy;
      }

      console.log("💰 Transaction Cost:", cost);

      if (window.state.transaction(cost, happy)) {
        this.restoreMaterial(this.ghost);
        window.state.objects.push(this.ghost);
        if (this.activeData.isMove && cost > 0) window.ui.toast(`Moved (-${cost})`);

        this.ghost = null;
        this.activeData = null;
        window.ui.toggleRotateSlider(false);
        // Auto-exit Edit Mode?
        // window.ui.toggleEditMode(); // If desired
      } else {
        if (this.activeData.isMove) {
          this.ghost.position.copy(this.activeData.originalPos);
          this.restoreMaterial(this.ghost);
          window.state.objects.push(this.ghost);
          this.ghost = null;
          this.activeData = null;
          window.ui.toggleRotateSlider(false);
        } else {
          window.ui.toast("Insufficient Funds!");
        }
      }
      this.isLocked = false;
      return;
    }

    // 2. PICK UP Logic (If NOT holding ghost + Edit Mode)
    if (window.state.isEditMode && !this.ghost) {
      const intersects = this.getRayIntersection(e, window.state.objects);
      console.log("🔍 Raycast Hits:", intersects.length);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        let root = null;
        hit.traverseAncestors(a => { if (window.state.objects.includes(a)) root = a; });
        if (window.state.objects.includes(hit)) root = hit;

        if (root) {
          console.log("🏗️ Picking Up:", root.userData.type);
          this.activeData = {
            isMove: true,
            originalPos: root.position.clone(),
            cost: CONFIG.costs.move
          };

          this.ghost = root;
          const idx = window.state.objects.indexOf(root);
          if (idx > -1) window.state.objects.splice(idx, 1);

          this.applyGhostMaterial(this.ghost);
          window.ui.toast("Moving object... Right-Click to Lock.");
          window.ui.toggleRotateSlider(true);
          this.isLocked = false;
        }
      }
    }
  }

  onKey(e) {
    if (e.key === 'Escape') {
      if (this.ghost) {
        this.cancelGhost();
        window.ui.toast("Cancelled", true);
      } else if (window.state.isEditMode) {
        window.ui.toggleEditMode(); // Exit Edit Mode
      }
    }
  }

  cancelGhost() {
    if (this.ghost) {
      // If moving, revert
      if (this.activeData && this.activeData.isMove) {
        const ghost = this.ghost;
        ghost.position.copy(this.activeData.originalPos);
        this.restoreMaterial(ghost);
        window.state.objects.push(ghost);
      } else {
        window.scene.remove(this.ghost);
      }
      this.ghost = null;
      this.activeData = null;
      window.ui.toggleRotateSlider(false); // Ensure hidden
    }
  }

  applyGhostMaterial(obj) {
    obj.traverse(c => {
      if (c.isMesh) {
        if (!c.userData.orgMaterial) c.userData.orgMaterial = c.material; // Save original
        c.material = c.material.clone();
        c.material.transparent = true;
        c.material.opacity = 0.6;
        c.material.color.setHex(0x00FF00);
        c.material.emissive.setHex(0x004400);
      }
    });
  }

  restoreMaterial(obj) {
    obj.traverse(c => {
      if (c.isMesh && c.userData.orgMaterial) {
        c.material = c.userData.orgMaterial;
      }
    });
  }
}

class AssetManager {
  constructor() {
    this.loader = new GLTFLoader();
  }

  createObject(type, scale) {
    return new Promise((resolve) => {
      if (type === 'tree') {
        resolve(this.createProceduralTree(scale));
      } else {
        let url;
        if (type === 'house') url = './models/brickhouse.glb';
        else if (type === 'large_house') url = './models/house1.glb';
        else url = './models/street_lamp.glb';

        this.loader.load(url, (gltf) => {
          const model = gltf.scene;
          model.scale.set(scale, scale, scale);
          model.userData.type = type; // Store type for Save/Load
          // Enable Shadows
          model.traverse(c => {
            if (c.isMesh) {
              c.castShadow = true;
              c.receiveShadow = true;
            }
          });

          // Specific fix for very small models or offset centers?
          // (Optional: Recenter geometry)

          resolve(model);
        }, undefined, (err) => {
          console.error("Load Error:", err);
          window.ui.toast("Model Missing! Using Box Fallback.", true);
          resolve(this.createFallback(type, scale));
        });
      }
    });
  }

  createProceduralTree(scale) {
    const group = new THREE.Group();
    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.4, 2, 8),
      new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    trunk.position.y = 1;
    trunk.castShadow = true;

    // Leaves
    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x228B22 })
    );
    leaves.position.y = 2.5;
    leaves.castShadow = true;

    group.add(trunk, leaves);
    group.scale.set(scale, scale, scale);
    group.userData.type = 'tree'; // FIX: Ensure type is set

    // Ensure shadows for procedural too
    group.traverse(c => { c.castShadow = true; c.receiveShadow = true; });
    return group;
  }

  createFallback(type, scale) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0xFF0000 })
    );
    mesh.scale.set(scale, scale, scale);
    mesh.position.y = 1;
    mesh.userData.type = type; // FIX: Ensure type is set
    return mesh;
  }
}

class UIManager {
  constructor() {
    this.elBudget = document.getElementById('stat-budget');
    this.elHappy = document.getElementById('stat-happiness');
    this.elBuildMenu = document.getElementById('ui-build-menu');
    this.elToast = document.getElementById('ui-toast');
    this.elRotateContainer = document.getElementById('ui-rotate-container');
    this.elRotateSlider = document.getElementById('ui-rotate-slider');
    this.elMechanics = document.getElementById('ui-mechanics');

    // Rotation Slider
    this.elRotateSlider.addEventListener('input', (e) => {
      if (window.input.ghost) {
        window.input.ghost.rotation.y = parseFloat(e.target.value);
      }
    });

    // Buttons
    document.getElementById('btn-build').addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent canvas click
      this.toggleBuildMenu();
    });

    document.getElementById('btn-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleEditMode();
    });

    document.getElementById('btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.state.objects.length > 0) {
        const last = window.state.objects.pop();
        window.scene.remove(last);
        this.toast("Undid last action");
      }
    });

    document.getElementById('btn-save').addEventListener('click', (e) => {
      e.stopPropagation();
      this.saveGame();
    });

    document.getElementById('btn-load').addEventListener('click', (e) => {
      e.stopPropagation();
      this.loadGame();
    });

    // Build Items
    document.querySelectorAll('.build-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = item.getAttribute('data-type');
        window.input.startPlacement(type);
      });
    });
  }

  update() {
    if (this.elBudget) this.elBudget.innerText = window.state.budget.toLocaleString('en-IN');
    if (this.elHappy) this.elHappy.innerText = window.state.happiness;
  }

  toggleBuildMenu(force) {
    const isHidden = this.elBuildMenu.classList.contains('hidden');
    const shouldShow = force !== undefined ? force : isHidden;

    if (shouldShow) {
      this.elBuildMenu.classList.remove('hidden');
      document.getElementById('btn-build').classList.add('active');
    } else {
      this.elBuildMenu.classList.add('hidden');
      document.getElementById('btn-build').classList.remove('active');
    }
  }

  toggleEditMode() {
    window.state.isEditMode = !window.state.isEditMode;
    document.getElementById('btn-edit').classList.toggle('active', window.state.isEditMode);

    // Safety Reset
    if (window.input) window.input.isLocked = false;

    this.toast(window.state.isEditMode ? "Edit Mode Enabled (Picker)" : "Edit Mode Disabled");
    if (!window.state.isEditMode) this.toggleRotateSlider(false);

    // Cancel placement if active
    if (window.input.ghost) {
      window.input.cancelGhost();
      this.toast("Cancelled Action");
    }
  }

  async saveGame() {
    const data = window.state.objects.map(obj => {
      const type = obj.userData.type || 'tree';
      // Debug check
      if (!obj.userData.type) console.warn("Object missing type, defaulting to tree:", obj);
      return {
        pos: obj.position,
        type: type,
        rot: obj.rotation.y // SAVE ROTATION
      };
    });

    const saveData = {
      objects: data,
      budget: window.state.budget,
      happiness: window.state.happiness
    };

    const jsonString = JSON.stringify(saveData);

    // 1. Local Save
    localStorage.setItem('village_save', jsonString);

    // 2. Cloud Save
    const userId = localStorage.getItem('user_id');
    if (userId) {
      try {
        const params = new URLSearchParams();
        params.append('user_id', userId);
        params.append('place', jsonString); // Backend expects 'place'

        const response = await fetch('https://glsmoodle.in/vaat/newplace.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params
        });

        if (response.ok) {
          this.toast("Game Saved to Cloud & Local!");
        } else {
          console.warn("Cloud save failed:", response.status);
          this.toast("Saved Locally (Cloud Error)", true);
        }
      } catch (e) {
        console.error("Cloud save error:", e);
        this.toast("Saved Locally (Offline)", true);
      }
    } else {
      this.toast("Saved Locally (Not Logged In)");
    }
  }

  loadGame() {
    const json = localStorage.getItem('village_save');
    if (!json) {
      this.toast("No Save Found!", true);
      return;
    }

    const saveData = JSON.parse(json);

    // Clear existing
    window.state.objects.forEach(obj => window.scene.remove(obj));
    window.state.objects = [];

    // Restore Stats
    if (saveData.budget) window.state.budget = saveData.budget;
    if (saveData.happiness) window.state.happiness = saveData.happiness;
    this.update();

    // Restore Objects
    // Handle both legacy array format (if any) and new object format
    const objects = Array.isArray(saveData) ? saveData : (saveData.objects || []);

    objects.forEach(data => {
      // Re-create object
      // Use config scale or saved scale? Using config for consistency
      const scale = CONFIG.scales[data.type] || 1;

      window.assets.createObject(data.type, scale).then(obj => {
        obj.position.copy(data.pos);
        if (data.rot !== undefined) obj.rotation.y = data.rot; // LOAD ROTATION
        window.scene.add(obj);
        window.state.objects.push(obj);
      });
    });

    this.toast("Game Loaded!");
  }

  toast(msg, error = false) {
    this.elToast.innerText = msg;
    this.elToast.style.backgroundColor = error ? 'rgba(200, 50, 50, 0.9)' : 'rgba(0,0,0,0.8)';
    this.elToast.classList.remove('hidden');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.elToast.classList.add('hidden'), 3000);
  }

  toggleRotateSlider(show) {
    if (show) {
      this.elRotateContainer.classList.remove('hidden');
      // Update value
      if (window.input.ghost) {
        this.elRotateSlider.value = window.input.ghost.rotation.y % (Math.PI * 2);
      }
    } else {
      this.elRotateContainer.classList.add('hidden');
    }
    this.toggleMechanics(show);
  }

  toggleMechanics(show) {
    if (show) {
      this.elMechanics.classList.remove('hidden');
    } else {
      this.elMechanics.classList.add('hidden');
    }
  }

  syncSlider(val) {
    this.elRotateSlider.value = val % (Math.PI * 2);
  }
}

// --- INIT ---
// Make accessible globally for debugging & inter-class access
window.state = new GameState();
window.assets = new AssetManager();


// --- THREE JS SETUP ---
window.scene = new THREE.Scene();
window.scene.background = new THREE.Color(0x87CEEB);

window.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
window.camera.position.set(0, 40, 60);

window.renderer = new THREE.WebGLRenderer({ antialias: true });
window.renderer.setSize(window.innerWidth, window.innerHeight);
window.renderer.shadowMap.enabled = true;
document.getElementById('canvas-container').appendChild(window.renderer.domElement);

window.controls = new OrbitControls(window.camera, window.renderer.domElement);
window.controls.enableDamping = true;
window.controls.maxPolarAngle = Math.PI / 2 - 0.1;

// Lighting
window.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
window.scene.add(dirLight);

// Terrain
// Terrain
// Terrain
// Terrain
// Terrain
window.terrain = new TerrainManager(window.scene);
// Load Flat Map (null heightmap)
window.terrain.loadTerrain(null, './assets/lalpur_c.png').then(() => {
  console.log("Terrain Loaded. Initializing GIS...");
  window.gis = new GISLoader(window.scene, window.terrain);
  window.gis.loadBuildings('./assets/buildings.geojson');
});

// Initialize UI & Input LAST (so DOM is ready)
window.ui = new UIManager();
window.input = new InputManager(window.scene, window.camera, window.renderer);
window.ui.update(); // Initial Update

// Resize
window.addEventListener('resize', () => {
  window.camera.aspect = window.innerWidth / window.innerHeight;
  window.camera.updateProjectionMatrix();
  window.renderer.setSize(window.innerWidth, window.innerHeight);
});

// Loop
function animate() {
  requestAnimationFrame(animate);
  window.controls.update();
  window.renderer.render(window.scene, window.camera);
}
animate(); // Start Loop