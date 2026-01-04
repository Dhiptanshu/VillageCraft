# VillageCraft

VillageCraft is a web-based 3D city-building simulation game that integrates real-world Geographic Information System (GIS) data to generate immersive environments. Users can plan, build, and manage a village economy within a browser-based 3D interface.

> **Smart India Hackathon 2024 – Grand Finale**
>
> Developed in response to **Problem Statement ID 1704**, presented by the **Ministry of Panchayati Raj**.

## Deployment

**Live Demo**: [https://village-craft.vercel.app/](https://village-craft.vercel.app/)

The application frontend is deployed on Vercel for high availability and performance.

**Backend Hosting**:
The backend infrastructure (Save/Load APIs) is hosted on the `glsmoodle` servers (Faculty of Engineering and Technology, **GLS University**) as of Jan 2026. This ensures secure and persistent data storage for all users.

## Technologies Used

*   **Frontend**: HTML5, CSS3, JavaScript (ES6+), Progressive Web App (PWA)
*   **3D Engine**: Three.js
*   **Asset Loading**: GLTFLoader (3D Models)
*   **GIS Processing**: QGIS (Data preparation), GeoJSON (Vector data)
*   **Backend**: PHP (Hosted on GLS University Servers)

## Mobile Support & PWA

VillageCraft is designed as a **Progressive Web App (PWA)**, providing a native-like experience on all devices.

*   **Mobile Optimized**: The interface is fully responsive, featuring touch-friendly controls and layout adjustments for smaller screens.
*   **Installable**: Users can add the game to their home screen on Android and iOS devices, allowing it to launch without a browser address bar.
*   **Offline Capability**: Essential assets are cached (depending on browser support) for faster loading.
*   **Cross-Platform Sync**: Thanks to the cloud backend, game progress can be synchronized between desktop and mobile sessions.

## Installation Guide

To run the project locally, follow these steps:

1.  **Clone the Repository**
    Clone the project files to your local machine.

2.  **Setup Local Server**
    Due to browser security policies regarding local file access (CORS), the application must be served via a local web server.
    
    If you have Python installed:
    ```bash
    python -m http.server 8000
    ```

    Alternatively, using Node.js `http-server`:
    ```bash
    npx http-server .
    ```

3.  **Launch**
    Open your web browser and navigate to `http://localhost:8000`.

## Features and Implementation

### GIS Integration and Real-World Maps
One of the core features of VillageCraft is the ability to render real-world locations. This is achieved through a multi-step pipeline:

1.  **Data Acquisition**: Satellite imagery and elevation data are sourced using QGIS.
2.  **Asset Generation**: 
    *   **Texture Map**: High-resolution satellite imagery is exported as a standard image file (`lalpur_c.png`).
    *   **Building Footprints**: Real-world building data is exported as GeoJSON polygons (`buildings.geojson`).
3.  **Procedural Generation**:
    *   The application reads the GeoJSON data to understand the exact footprint of every building.
    *   It procedurally generates 3D geometry (Extruded Polygons) matching these footprints.
    *   **Texture Mapping Integration**: Use of "Projective Texture Mapping" allows the system to wrap the satellite map texture onto the roofs of the 3D models. This ensures that even complex, merged, or multi-colored buildings retain their exact visual appearance from the real world.

### Game Mechanics

#### Economy & Passive Income
The game features a dynamic economy driven by two main metrics:
*   **Budget**: The liquid currency used to place new structures.
*   **Happiness**: A metric that determines the prosperity of the village.
*   **Passive Income**: Players earn money automatically over time. The rate of income is directly linked to the **Happiness** level—higher happiness yields faster income, incentivizing strategic city planning.

#### Building and Placement
*   **Ghost System**: When selecting a building from the menu, a transparent "ghost" model follows the cursor (or touch point), allowing players to visualize placement before committing.
*   **Collision and Validation**: The system checks for valid placement areas and prevents building out of bounds.
*   **Edit Mode**: Users can toggle "Edit Mode" to interact with existing objects. This allows for selecting, moving, or deleting buildings. Relocating a building incurs a strategic "Moving Cost".

#### Save and Load System
The persistence layer supports both local and cloud storage:
*   **Local Persistence**: Game state is automatically saved to the browser's Local Storage for immediate resumption.
*   **Cloud Persistence**: Data is securely synchronized with the GLS University backend (`newplace.php`). This allows students and faculty to access their village simulations from any device on the network.

### Architecture
The codebase is structured around a modular class-based architecture to ensure maintainability:
*   **GameState**: Single source of truth for economy, inventory, and game rules.
*   **InputManager**: Handles complex mouse/touch interactions, raycasting for 3D object selection, and state machines for placement logic.
*   **AssetManager**: Manages the asynchronous loading of 3D models (GLB/GLTF) and procedural generation fallback logic.
*   **TerrainManager**: Responsible for generating the ground plane and mapping GIS textures.
*   **GISLoader**: specialized module for parsing spatial data and procedurally generating the environment.
