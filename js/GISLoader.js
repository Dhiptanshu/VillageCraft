import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';

export class GISLoader {
    constructor(scene, terrainManager) {
        this.scene = scene;
        this.terrain = terrainManager;
        console.log("GIS: Initialized (Procedural Mode)");
    }

    async loadBuildings(url) {
        try {
            const response = await fetch(url);
            const json = await response.json();
            if (json.features) this.processFeatures(json.features);
        } catch (e) {
            console.error("GIS Fail", e);
        }
    }

    processFeatures(features) {
        if (!this.terrain.bounds) return;

        const { north, south, east, west } = this.terrain.bounds;
        const mapWidth = east - west;
        const mapHeight = north - south;
        const halfSize = this.terrain.worldSize / 2;

        let count = 0;

        features.forEach((feature) => {
            const geom = feature.geometry;
            if (!geom) return;

            // We need all rings for the shape
            // Polygon: [ [outer], [hole], [hole]... ]
            let rings = [];
            if (geom.type === 'Polygon') {
                rings = geom.coordinates;
            } else if (geom.type === 'MultiPolygon') {
                // Flatten MultiPolygon to simple separate shapes for now
                // Just take first polygon's rings
                rings = geom.coordinates[0];
                // Ideally we loop continuously but let's keep it simple
            } else return;

            if (rings.length === 0) return;

            // 1. Create Shape from Outer Ring (rings[0])
            const shape = new THREE.Shape();
            let firstPoint = true;

            let cx = 0, cy = 0; // Centroid for color sampling
            let pts = 0;

            rings[0].forEach(coord => {
                const gx = coord[0];
                const gy = coord[1];

                // Accumulate for centroid
                cx += gx; cy += gy; pts++;

                // Map to World
                // u = (gx - west) / width
                // worldX = (u * size) - half
                const u = (gx - west) / mapWidth;
                const worldX = (u * this.terrain.worldSize) - halfSize;

                // v = (gy - south) / height
                // worldY = -((v * size) - half); // In 2D Shape, Y is "Up" (North)
                // Wait, in 3D: Z is "Down" (South).
                // Let's draw the shape in X-Y plane using standard map 2D coords.
                // X = Easting. Y = Northing.
                // Then we extrude along Z? No, Extrude extrudes along Z usually.
                // If we draw in X-Y (Top Down), we then rotate -90.

                // In 2D shape space:
                // x = worldX
                // y = ? 
                // In 3D world: Z maps to -Northing usually.
                // Let's convert Northing to a "Shape Y" that corresponds to World -Z.
                // v = (gy - south) / height (0=South, 1=North).
                // WorldZ = half - (v * size). (Positive=South, Negative=North).
                // So let ShapeY = -WorldZ = (v*size) - half.

                const v = (gy - south) / mapHeight;
                const worldZ = halfSize - (v * this.terrain.worldSize);

                // Shape X,Y corresponds to World X,-Z
                const shapeX = worldX;
                const shapeY = -worldZ; // Invert Z so North is +Y in shape space

                if (firstPoint) {
                    shape.moveTo(shapeX, shapeY);
                    firstPoint = false;
                } else {
                    shape.lineTo(shapeX, shapeY);
                }
            });

            // 2. Extrude
            const extrudeSettings = {
                steps: 1,
                depth: 4, // Height of building (4 meters?)
                bevelEnabled: false
            };

            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

            // 3. Color
            cx /= pts;
            cy /= pts;
            // Check bounds (centroid)
            if (cx < west || cx > east || cy < south || cy > north) return;

            // Get color from map at centroid
            // Convert centroid to world X,Z
            const cu = (cx - west) / mapWidth;
            const cv = (cy - south) / mapHeight;
            const cWorldX = (cu * this.terrain.worldSize) - halfSize;
            const cWorldZ = halfSize - (cv * this.terrain.worldSize);

            let color = new THREE.Color(0xdddddd);
            if (this.terrain.getColorAt) {
                color = this.terrain.getColorAt(cWorldX, cWorldZ);

                // Brighten it a bit? Roofs might be dark
                color.multiplyScalar(1.2);
            }

            const material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.8,
                metalness: 0.1
            });

            const mesh = new THREE.Mesh(geometry, material);

            // 4. Transform
            // ExtrudeGeometry generates in X-Y plane, extruding in +Z.
            // Our ShapeY was -WorldZ.
            // So (x, y, z_extrude) -> (WorldX, -WorldZ, Up).
            // We want Up to be WorldY.
            // Currently:
            // Mesh X = Shape X = World X.
            // Mesh Y = Shape Y = -World Z.
            // Mesh Z = Extrusion = Height (4).

            // We need:
            // World X = Mesh X
            // World Z = -Mesh Y
            // World Y = Mesh Z

            mesh.rotation.x = -Math.PI / 2; // Rotates +Y to -Z. +Z to +Y.

            // Verify:
            // Original +Z (Height) -> Becomes +Y (World Up). CORRECT.
            // Original +Y (Shape Y/North) -> Becomes -Z (World North). CORRECT.

            // Position shift?
            // Extrude geometry is local.
            // Centroid mapping relies on Shape coords being relative to 0,0?
            // No, we built the shape using World Coords directly in the loop.
            // So the mesh origin is 0,0,0, and vertices are at World positions.

            // Standard Terrain Height
            const baseHeight = this.terrain.terrainMesh ? this.terrain.terrainMesh.position.y : 0;
            mesh.position.y = baseHeight;

            mesh.userData.isGIS = true;
            this.scene.add(mesh);
            count++;
        });

        console.log(`GIS: Generated ${count} procedural buildings.`);
        if (window.ui) window.ui.toast(`Generated ${count} Buildings`);
    }
}
