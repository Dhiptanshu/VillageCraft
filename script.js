
import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/DragControls.js';

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10).normalize();
scene.add(light);

// Add Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 50, 100);
controls.update();

// Load PNG Texture and Create Terrain
async function loadPNGTexture(url) {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(url);
  return texture;
}

const draggableObjects = [];
async function createTerrain() {
  // Load texture (replace with the actual PNG texture file path)
  const texture = await loadPNGTexture('./lalpur_c.png');

  const width = 100;  // Terrain width in Three.js world units
  const height = 100; // Terrain height in Three.js world units
  const segments = 256; // Number of segments

  const geometry = new THREE.PlaneGeometry(width, height, segments - 1, segments - 1);
  geometry.rotateX(-Math.PI / 2);  // Rotate the plane to lie flat on the XY plane

  // Apply texture to the material
  const material = new THREE.MeshStandardMaterial({
    map: texture, // Apply the loaded texture
    roughness: 1, // Texture properties (optional)
    metalness: 0
  });

  const terrain = new THREE.Mesh(geometry, material);
  scene.add(terrain);
// Variables to track OrbitControls state
let controlsEnabled = true;

// Function to enable/disable controls
function toggleControls(enable) {
  controls.enabled = enable; // Enable or disable OrbitControls
}

// Add event listeners for menus
// const topMenu = document.querySelector('.top-menu');
// const bottomMenu = document.querySelector('.bottom-menu');

// Disable controls when hovering over menus
// topMenu.addEventListener('mouseenter', () => toggleControls(false));
// topMenu.addEventListener('mouseleave', () => toggleControls(true));
// bottomMenu.addEventListener('mouseenter', () => toggleControls(false));
// bottomMenu.addEventListener('mouseleave', () => toggleControls(true));
  // Add some draggable objects
  
  // for (let i = 0; i < 1; i++) {
  //   const box = new THREE.Mesh(
  //     new THREE.BoxGeometry(10, 30, 10),
  //     new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
  //   );
  //   box.position.set(Math.random() * 50 - 25, 5, Math.random() * 50 - 25);
  //   draggableObjects.push(box);
  //   scene.add(box);
  // }

  // Enable DragControls
  const dragControls = new DragControls(draggableObjects, camera, renderer.domElement);

  // Disable OrbitControls when dragging
  dragControls.addEventListener('dragstart', function () {
    controls.enabled = false;
  });

  dragControls.addEventListener('dragend', function () {
    controls.enabled = true;
  });
}

// Call the function to generate the terrain
createTerrain();

// Assign a click event


// Render Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Updates the camera controls
  renderer.render(scene, camera); // Renders the scene
}
animate();

function drawPath(point1, point2) {
  // Create a geometry from the two points
  const geometry = new THREE.BufferGeometry().setFromPoints([point1, point2]);

  // Create a basic line material
  const material = new THREE.LineBasicMaterial({ color: 0x0000ff });

  // Create a line with the geometry and material
  const line = new THREE.Line(geometry, material);

  // Add the line to the scene
  scene.add(line);
}
function addNewMesh() {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
    );

    const dragControls = new DragControls(draggableObjects, camera, renderer.domElement);

  // Disable OrbitControls when dragging
    dragControls.addEventListener('dragstart', function () {
        controls.enabled = false;
    });

    dragControls.addEventListener('dragend', function () {
        controls.enabled = true;
    });
    box.position.set(Math.random() * 50 - 25, 5, Math.random() * 50 - 25);
    draggableObjects.push(box); // Add to the draggable objects array
    scene.add(box);
  
    // Update DragControls if already initialized
    if (dragControls) {
      dragControls.objects.push(box); // Add the new object to DragControls
    }
  
    console.log('New mesh added to the scene.');
  }

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

// Camera position
camera.position.z = 30;
}
  document.addEventListener('DOMContentLoaded', () => {
    // Fetch the button element
    document.getElementById('NewPlan').addEventListener('click', addNewMesh);
    document.getElementById('Road').addEventListener('click', myFun);

    // const button = document.getElementById('NewPlan');
    // // Assign a click event
    // button.addEventListener('click', () => {
    //     console.log('Button clicked!');
    //     addNewMesh();
    // });
  });


const addMeshButton = document.createElement('button');
addMeshButton.textContent = 'Add New Mesh';
addMeshButton.style.position = 'fixed';
addMeshButton.style.bottom = '100px';
addMeshButton.style.right = '20px';
addMeshButton.style.padding = '10px 20px';
addMeshButton.style.backgroundColor = '#f59e0b';
addMeshButton.style.color = 'white';
addMeshButton.style.border = 'none';
addMeshButton.style.borderRadius = '5px';
addMeshButton.style.cursor = 'pointer';
document.body.appendChild(addMeshButton);
addMeshButton.addEventListener('click', addNewMesh);
