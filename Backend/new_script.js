
            //   let fullData = []; // Store all fetched data for filtering
            
            //   async function getData() {
            //     const url = 'https://glsmoodle.in/vaat/viewplace.php';
            
            //     try {
            //       const response = await fetch(url);
            
            //       if (!response.ok) {
            //         throw new Error('Network response was not ok');
            //       }
            
            //       const data = await response.json();
            //       console.log('Fetched data:', data);
            
            //       fullData = data; // Save the entire dataset globally
            
            //       const tableBody = document.querySelector('#data-table tbody');
            //       const userDropdown =document.querySelector('#userDropdown');
            //       tableBody.innerHTML = '';
            
            //       // Extract unique user IDs
            //       const uniqueUserIds = [...new Set(data.map(item => item.user_id))];
            //       console.log('Unique user IDs:', uniqueUserIds);
            
            //       // Populate dropdown with unique user IDs and an "All" option
            //       userDropdown.innerHTML = '';
            //       const allOption = document.createElement('option');
            //       allOption.value = 'all';
            //       allOption.textContent = 'All';
            //       userDropdown.appendChild(allOption);
            
            //       uniqueUserIds.forEach(userId => {
            //         const option = document.createElement('option');
            //         option.value = userId;
            //         option.textContent = userId;
            //         userDropdown.appendChild(option);
            //       });
            
            //       // Populate table with all data on initial load
            //       populateTable(fullData);
            
            //       // Add event listener to handle dropdown changes
            //       userDropdown.addEventListener('change', handleFilter);
            //     } catch (error) {
            //       console.error('Error fetching data:', error);
            //     }
            //   }
            
            //   function populateTable(data) {
            //     const tableBody = document.querySelector('#data-table tbody');
            //     tableBody.innerHTML = '';
            
            //     data.forEach(item => {
            //       const row = document.createElement('tr');
            
            //       const user_idCell = document.createElement('td');
            //       user_idCell.textContent = item.user_id;
            
            //       const placeCell = document.createElement('td');
            //       placeCell.textContent = item.place;
            
            //       const X_Cell = document.createElement('td');
            //       X_Cell.textContent = item.point_x;
            
            //       const Y_Cell = document.createElement('td');
            //       Y_Cell.textContent = item.point_y;
            
            //       row.appendChild(user_idCell);
            //       row.appendChild(placeCell);
            //       row.appendChild(X_Cell);
            //       row.appendChild(Y_Cell);
            
            //       tableBody.appendChild(row);
            //     });
            //   }
            
            //   function handleFilter() {
            //     const userDropdown = document.querySelector('#userDropdown');
            //     const selectedUserId = userDropdown.value;
            
            //     if (selectedUserId === 'all') {
            //       // Show all rows if "All" is selected
            //       populateTable(fullData);
            //     } else {
            //       // Filter only the data for the selected user ID
            //       const filteredData = fullData.filter(item => item.user_id == selectedUserId);
            //       populateTable(filteredData);
            //     }
            //   }
            
            //   // Ensure the function runs after the DOM has loaded
            //   window.onload = () => getData();


            let fullData = []; // Store all fetched data globally
let draggableObjects = []; // Store 3D objects for drag operations

// THREE.js Scene Setup
import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/DragControls.js';

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const div1 = document.getElementById('bhakti');
renderer.setSize(div1.offsetWidth, div1.offsetHeight);
div1.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10).normalize();
scene.add(light);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 50, 100);
controls.update();

// Add Terrain
async function loadPNGTexture(url) {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(url);
  return texture;
}

async function createTerrain() {
  const texture = await loadPNGTexture('/lalpur_35.png');
  const width = 100, height = 100, segments = 256;
  const geometry = new THREE.PlaneGeometry(width, height, segments - 1, segments - 1);
  geometry.rotateX(-Math.PI / 2);
  
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 1,
    metalness: 0
  });

  const terrain = new THREE.Mesh(geometry, material);
  scene.add(terrain);

  const dragControls = new DragControls(draggableObjects, camera, renderer.domElement);
  dragControls.addEventListener('dragstart', () => { controls.enabled = false; });
  dragControls.addEventListener('dragend', () => { controls.enabled = true; });
}

// Add draggable meshes to the scene
function addNewMesh(userId, count) {
  const size = 5;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
  );

  mesh.position.set(Math.random() * 50 - 25, 5, Math.random() * 50 - 25);

  draggableObjects.push(mesh);
  scene.add(mesh);

  const dragControls = new DragControls([mesh], camera, renderer.domElement);
  dragControls.addEventListener('dragstart', () => { controls.enabled = false; });
  dragControls.addEventListener('dragend', () => { controls.enabled = true; });
}

// Render loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Fetch initial data for filtering and dropdown functionality
async function getData() {
  const url = 'https://glsmoodle.in/vaat/viewplace.php';

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    console.log('Fetched data:', data);

    fullData = data; // Save globally
    setupUserDropdown(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Populate dropdown with unique user IDs
function setupUserDropdown(data) {
  const userDropdown = document.querySelector('#userDropdown');
  userDropdown.innerHTML = '';
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All';
  userDropdown.appendChild(allOption);

  const uniqueUserIds = [...new Set(data.map(item => item.user_id))];
  uniqueUserIds.forEach(userId => {
    const option = document.createElement('option');
    option.value = userId;
    option.textContent = userId;
    userDropdown.appendChild(option);
  });

  userDropdown.addEventListener('change', handleFilter);
  populateScene(data); // Populate initial data into the 3D scene
}

// Handle user selection changes for filtering
function handleFilter() {
  const userDropdown = document.querySelector('#userDropdown');
  const selectedUserId = userDropdown.value;

  if (selectedUserId === 'all') {
    populateScene(fullData);
  } else {
    const filteredData = fullData.filter(item => item.user_id === selectedUserId);
    populateScene(filteredData);
  }
}

// Populate 3D visualization with draggable objects based on the data
function populateScene(data) {
  // Clear previous draggable objects from the scene
  draggableObjects.forEach(obj => scene.remove(obj));
  draggableObjects = [];

  data.forEach(item => {
    addNewMesh(item.user_id, 1); // Map fetched items to draggable boxes
  });
}

// Initialize all logic
async function init() {
  await createTerrain();
  await getData();
}

init();
