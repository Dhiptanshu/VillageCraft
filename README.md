# VillageCraft

VillageCraft is a web-based 3D city-building simulation game that integrates real-world Geographic Information System (GIS) data to generate immersive environments. Users can plan, build, and manage a village economy within a browser-based 3D interface.

## Deployment

**Live Demo**: [Insert Vercel Link Here]

## Technologies Used

*   **Frontend**: HTML5, CSS3, JavaScript (ES6+)
*   **3D Engine**: Three.js
*   **Asset Loading**: GLTFLoader (3D Models)
*   **GIS Processing**: QGIS (Data preparation), GeoJSON (Vector data), geotiff (Raster data)
*   **Backend**: PHP (Cloud persistence)

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
    *   **Texture Map**: High-resolution satellite imagery is exported as a standard image file.
    *   **Building Footprints**: Real-world building data is exported as GeoJSON polygons.
3.  **Procedural Generation**:
    *   The application reads the GeoJSON data to understand the exact footprint of every building.
    *   It procedurally generates 3D geometry (extrusion) matching these footprints.
    *   To ensure visual consistency, the system samples the color of the satellite map at the location of each building and applies it to the roof of the generated 3D model.

### Game Mechanics

#### Economy System
The game features a dynamic economy driven by two main metrics:
*   **Budget**: The currency used to place new structures.
*   **Happiness**: A metric that determines passive income generation.
Players earn passive income over time based on the happiness level of their village.

#### Building and Placement
*   **Ghost System**: When selecting a building, a transparent "ghost" model follows the cursor, allowing players to visualize placement before committing funds.
*   **Collision and Validation**: The system checks for valid placement areas and prevents building out of bounds.
*   **Edit Mode**: Players can toggle Edit Mode to select, move, or remove existing structures. Moving an object incurs a small relocation cost.

#### Save and Load System
*   **Local Persistence**: Game state is automatically saved to the browser's Local Storage, allowing for quick resumption.
*   **Cloud Persistence**: For registered users, data is synchronized with a remote PHP backend, enabling cross-device progress tracking.

### Architecture
The codebase is structured around a modular class-based architecture to ensure maintainability:
*   **GameState**: Single source of truth for economy, inventory, and game rules.
*   **InputManager**: Handles complex mouse interactions, raycasting for 3D object selection, and state machines for placement logic.
*   **AssetManager**: Manages the asynchronous loading of 3D models (GLB/GLTF) and procedural generation fallback logic.
*   **TerrainManager**: Responsible for generating the ground plane and mapping GIS textures.
*   **GISLoader**: specialized module for parsing spatial data and procedurally generating the environment.
