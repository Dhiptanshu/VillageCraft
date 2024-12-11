// Import Three.js and controls
import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/DragControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js';

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Updated camera position for closer initial view
camera.position.set(0, 100, 0); // Adjust based on your map's dimensions
camera.lookAt(0, 0, 0); // Look at the map's center

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10).normalize();
scene.add(light);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Updated controls to focus on the map's center
controls.target.set(0, 0, 0); // Adjust if needed based on the map's center
controls.update();

// Optional: Adjust zoom for a closer perspective
camera.zoom = 8; // Adjust the zoom level
camera.updateProjectionMatrix();

// Grid Helper
const gridSize = 100;
const gridDivisions = 10;
const gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
scene.add(gridHelper);

// Draggable Objects Array
const draggableObjects = [];
const roads = []; // To track roads for deletion
let dragControls;

// Snapping to Grid
const snapGridSize = 10;
function snapToGrid(value) {
  return Math.round(value / snapGridSize) * snapGridSize;
}

// Raycaster and Mouse Vector
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let selectedObject = null;

// Mouse Click Handler
function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(draggableObjects, true);
  if (intersects.length > 0) {
    selectedObject = intersects[0].object;
    console.log('Object selected:', selectedObject);
  } else {
    selectedObject = null;
    console.log('No object selected');
  }
}

// // Delete Selected Object
// function deleteSelectedObject() {
//   if (selectedObject) {
//     scene.remove(selectedObject);
//     const index = draggableObjects.indexOf(selectedObject);
//     if (index > -1) draggableObjects.splice(index, 1);
//     console.log('Object deleted:', selectedObject);
//     selectedObject = null;
//   } else {
//     console.log('No object selected to delete');
//   }
// }
// Delete the last object added to the scene
function deleteLastObject() {
  if (draggableObjects.length > 0) {
    const lastObject = draggableObjects.pop(); // Remove the last object from the array
    scene.remove(lastObject); // Remove it from the scene
    console.log('Last object deleted:', lastObject);
  } else {
    console.log('No objects to delete');
  }
}


// Add Event Listener for Mouse Clicks
window.addEventListener('click', onMouseClick);

// Initialize Drag Controls
function initializeDragControls() {
  dragControls = new DragControls(draggableObjects, camera, renderer.domElement);

  dragControls.addEventListener('dragstart', () => {
    controls.enabled = false;
  });

  dragControls.addEventListener('dragend', (event) => {
    controls.enabled = true;
    const object = event.object;
    object.position.x = snapToGrid(object.position.x);
    object.position.z = snapToGrid(object.position.z);
  });
}

// Terrain Creation
async function createTerrain() {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('./lalpur_c.png');
  const geometry = new THREE.PlaneGeometry(100, 100, 256 - 1, 256 - 1);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 1,
    metalness: 0,
  });

  const terrain = new THREE.Mesh(geometry, material);
  scene.add(terrain);

  initializeDragControls();
}

// Add Block Functionality
function addNewMesh() {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(5, 5, 5),
    new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
  );
  box.position.set(Math.random() * 50 - 25, 5, Math.random() * 50 - 25);
  draggableObjects.push(box);
  scene.add(box);

  dragControls.objects.push(box);
  console.log('New block added to the scene.');
}

// Save and Load State
function saveState() {
  const state = draggableObjects.map((object) => ({
    position: object.position.clone(),
    color: object.material.color.getHex(),
  }));
  localStorage.setItem('sceneState', JSON.stringify(state));
  console.log('State saved:', state);
}

function loadState() {
  const savedState = JSON.parse(localStorage.getItem('sceneState'));
  if (savedState) {
    savedState.forEach((data) => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(5, 5, 5),
        new THREE.MeshStandardMaterial({ color: data.color })
      );
      box.position.copy(data.position);
      draggableObjects.push(box);
      scene.add(box);
    });
    console.log('State loaded:', savedState);
  }
}

// Add Model Functionality
function addModel(url, position = { x: 0, y: 0, z: 0 }) {
  const loader = new GLTFLoader();
  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene;
      model.position.set(position.x, position.y, position.z);
      draggableObjects.push(model);
      scene.add(model);
    },
    undefined,
    (error) => console.error('Error loading model:', error)
  );
}

// Toolbar
const toolbar = document.createElement('div');
toolbar.style.position = 'fixed';
toolbar.style.top = '10px';
toolbar.style.left = '10px';
toolbar.style.backgroundColor = '#333';
toolbar.style.color = 'white';
toolbar.style.padding = '10px';
toolbar.style.borderRadius = '5px';
toolbar.style.display = 'flex';
toolbar.style.gap = '10px';
toolbar.style.alignItems = 'center';
document.body.appendChild(toolbar);

// Dropdown for Model Selection
const dropdown = document.createElement('select');
dropdown.style.display = 'none';
dropdown.style.marginTop = '10px';
dropdown.style.backgroundColor = '#555';
dropdown.style.color = 'white';
dropdown.style.border = 'none';
dropdown.style.padding = '5px';
dropdown.style.borderRadius = '5px';
dropdown.style.cursor = 'pointer';
dropdown.addEventListener('change', (event) => {
  const modelUrl = event.target.value;
  if (modelUrl) {
    addModel(modelUrl);
    dropdown.value = '';
  }
});

// Predefined Models
const models = [
  { name: 'Car', url: './models/car.glb' },
  { name: 'Tree', url: './models/tree.glb' },
  { name: 'House', url: './models/brick_house.glb' },
];

// Populate Dropdown
models.forEach((model) => {
  const option = document.createElement('option');
  option.value = model.url;
  option.textContent = model.name;
  dropdown.appendChild(option);
});

// Create Toolbar Button
function createToolbarButton(label, onClick) {
  const button = document.createElement('button');
  button.textContent = label;
  button.style.backgroundColor = '#555';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.padding = '5px 10px';
  button.style.cursor = 'pointer';
  button.style.borderRadius = '5px';
  button.addEventListener('click', onClick);
  toolbar.appendChild(button);
}

// Toolbar Buttons
createToolbarButton('Add Block', addNewMesh);
createToolbarButton('Add Model', () => {
  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
});
createToolbarButton('Save State', saveState);
createToolbarButton('Load State', loadState);
createToolbarButton('Delete Object', deleteLastObject);

// Append Dropdown to Toolbar
toolbar.appendChild(dropdown);

// PWA Install Button Logic
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  createToolbarButton('Install App', () => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      console.log('User choice:', choiceResult.outcome);
      deferredPrompt = null;
    });
  });
});

function myFun()
{
  const tree1 = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);
tree1.position.set(-10, 0, 0);
scene.add(tree1);

const tree2 = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);
tree2.position.set(10, 0, 0);
scene.add(tree2);

// Use the function to draw the path between the trees
drawPath(tree1.position, tree2.position);

// Create a popup modal for model selection
function showModelPopup() {
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '50%';
  modal.style.left = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
  modal.style.backgroundColor = '#333';
  modal.style.color = 'white';
  modal.style.padding = '20px';
  modal.style.borderRadius = '10px';
  modal.style.zIndex = '1000';
  modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
  modal.style.textAlign = 'center';

  const heading = document.createElement('h3');
  heading.textContent = 'Select a Model';
  modal.appendChild(heading);

  models.forEach((model) => {
    const button = document.createElement('button');
    button.textContent = model.name;
    button.style.backgroundColor = '#555';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.padding = '10px 20px';
    button.style.margin = '5px';
    button.style.cursor = 'pointer';
    button.style.borderRadius = '5px';
    button.addEventListener('click', () => {
      addModel(model.url);
      document.body.removeChild(modal);
    });
    modal.appendChild(button);
  });

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.backgroundColor = '#555';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.padding = '10px 20px';
  closeButton.style.margin = '5px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.borderRadius = '5px';
  closeButton.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  modal.appendChild(closeButton);

  document.body.appendChild(modal);
}

// Camera position
camera.position.z = 30;
}
  document.addEventListener('DOMContentLoaded', () => {
    // Fetch the button element
    document.getElementById('NewPlan').addEventListener('click', addNewMesh);
    document.getElementById('Road').addEventListener('click', myFun);
    document.getElementById('Save').addEventListener('click', saveState);
    document.getElementById('Load').addEventListener('click', loadState);
    document.getElementById('Delete').addEventListener('click', deleteLastObject);

    // const button = document.getElementById('NewPlan');
    // // Assign a click event
    // button.addEventListener('click', () => {
    //     console.log('Button clicked!');
    //     addNewMesh();
    // });
  });

// Render Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Initialize Terrain
createTerrain();
  