import * as THREE from 'three';

class SceneManager {
    constructor() {
        this.scene = null;
        this.buildings = [];
        this.lots = [];
        this.vehicles = [];
        this.terrain = null;
    }

    init(scene) {
        this.scene = scene;
    }

    createTerrain() {
        // Główny teren
        const terrainGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
        
        // Dodaj wysokości do terenu
        const vertices = terrainGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = Math.random() * 2 - 1; // Wysokość Z
        }
        terrainGeometry.attributes.position.needsUpdate = true;
        terrainGeometry.computeVertexNormals();

        const terrainMaterial = new THREE.MeshStandardMaterial({
            color: 0x7cba3d,
            roughness: 0.8,
            metalness: 0.1
        });

        this.terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);

        // Dodaj drogi
        this.createRoads();
        
        // Dodaj wodę (jezioro)
        this.createWater();
        
        // Dodaj drzewa
        this.createTrees();
    }

    createRoads() {
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.9
        });

        // Główna droga pozioma
        const mainRoadH = new THREE.PlaneGeometry(200, 8);
        const roadH = new THREE.Mesh(mainRoadH, roadMaterial);
        roadH.rotation.x = -Math.PI / 2;
        roadH.position.y = 0.01;
        this.scene.add(roadH);

        // Główna droga pionowa
        const mainRoadV = new THREE.PlaneGeometry(8, 200);
        const roadV = new THREE.Mesh(mainRoadV, roadMaterial);
        roadV.rotation.x = -Math.PI / 2;
        roadV.position.y = 0.01;
        this.scene.add(roadV);

        // Mniejsze drogi
        for (let i = -3; i <= 3; i++) {
            if (i === 0) continue;
            
            // Drogi poziome
            const smallRoadH = new THREE.PlaneGeometry(80, 4);
            const sRoadH = new THREE.Mesh(smallRoadH, roadMaterial);
            sRoadH.rotation.x = -Math.PI / 2;
            sRoadH.position.set(0, 0.01, i * 25);
            this.scene.add(sRoadH);

            // Drogi pionowe
            const smallRoadV = new THREE.PlaneGeometry(4, 80);
            const sRoadV = new THREE.Mesh(smallRoadV, roadMaterial);
            sRoadV.rotation.x = -Math.PI / 2;
            sRoadV.position.set(i * 25, 0.01, 0);
            this.scene.add(sRoadV);
        }

        // Dodaj linie na drogach
        this.addRoadMarkings();
    }

    addRoadMarkings() {
        const lineMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff
        });

        // Linie na głównych drogach
        for (let i = -90; i <= 90; i += 10) {
            // Linia pozioma
            const lineH = new THREE.PlaneGeometry(6, 0.3);
            const markH = new THREE.Mesh(lineH, lineMaterial);
            markH.rotation.x = -Math.PI / 2;
            markH.position.set(i, 0.02, 0);
            this.scene.add(markH);

            // Linia pionowa
            const lineV = new THREE.PlaneGeometry(0.3, 6);
            const markV = new THREE.Mesh(lineV, lineMaterial);
            markV.rotation.x = -Math.PI / 2;
            markV.position.set(0, 0.02, i);
            this.scene.add(markV);
        }
    }

    createWater() {
        const waterGeometry = new THREE.CircleGeometry(15, 32);
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x006994,
            transparent: true,
            opacity: 0.8,
            roughness: 0.1,
            metalness: 0.1
        });

        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.set(60, 0.1, 60);
        this.scene.add(water);

        // Dodaj plażę wokół jeziora
        const beachGeometry = new THREE.RingGeometry(15, 20, 32);
        const beachMaterial = new THREE.MeshStandardMaterial({
            color: 0xf4e4bc
        });

        const beach = new THREE.Mesh(beachGeometry, beachMaterial);
        beach.rotation.x = -Math.PI / 2;
        beach.position.set(60, 0.05, 60);
        this.scene.add(beach);
    }

    createTrees() {
        const treePositions = [
            // Wokół jeziora
            { x: 45, z: 45 }, { x: 75, z: 45 }, { x: 45, z: 75 }, { x: 75, z: 75 },
            // Losowe pozycje
            { x: -60, z: -60 }, { x: -40, z: -70 }, { x: -80, z: -40 },
            { x: 70, z: -60 }, { x: 85, z: -45 }, { x: 60, z: -80 },
            { x: -70, z: 60 }, { x: -85, z: 75 }, { x: -60, z: 80 }
        ];

        treePositions.forEach(pos => {
            const tree = this.createTree();
            tree.position.set(pos.x, 0, pos.z);
            this.scene.add(tree);
        });
    }

    createTree() {
        const tree = new THREE.Group();

        // Pień
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 4);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 2;
        trunk.castShadow = true;
        tree.add(trunk);

        // Korona
        const crownGeometry = new THREE.SphereGeometry(3, 8, 6);
        const crownMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = 5;
        crown.castShadow = true;
        tree.add(crown);

        return tree;
    }

    createInitialBuildings() {
        // Centrum miasta - wysokie budynki
        this.createDowntown();
        
        // Dzielnica mieszkalna
        this.createResidentialArea();
        
        // Strefa komercyjna
        this.createCommercialArea();
    }

    createDowntown() {
        const downtownBuildings = [
            { x: -20, z: -20, height: 40, width: 8, depth: 8, color: 0x87CEEB },
            { x: -10, z: -25, height: 35, width: 6, depth: 6, color: 0x9370DB },
            { x: -30, z: -15, height: 45, width: 10, depth: 10, color: 0x4682B4 },
            { x: -15, z: -10, height: 30, width: 7, depth: 7, color: 0x708090 }
        ];

        downtownBuildings.forEach(building => {
            const mesh = this.createBuildingMesh(building);
            mesh.userData = { type: 'downtown', building: building };
            this.scene.add(mesh);
            this.buildings.push(mesh);
        });
    }

    createResidentialArea() {
        const residentialBuildings = [
            { x: 30, z: 30, height: 8, width: 10, depth: 8, color: 0xDEB887 },
            { x: 45, z: 25, height: 6, width: 8, depth: 6, color: 0xF5DEB3 },
            { x: 25, z: 45, height: 10, width: 12, depth: 10, color: 0xD2B48C },
            { x: 50, z: 40, height: 7, width: 9, depth: 7, color: 0xBC8F8F }
        ];

        residentialBuildings.forEach(building => {
            const mesh = this.createBuildingMesh(building);
            mesh.userData = { type: 'residential', building: building };
            this.scene.add(mesh);
            this.buildings.push(mesh);
        });
    }

    createCommercialArea() {
        const commercialBuildings = [
            { x: -40, z: 30, height: 12, width: 15, depth: 10, color: 0xFFB6C1 },
            { x: -25, z: 35, height: 8, width: 12, depth: 8, color: 0xFFA07A },
            { x: -50, z: 45, height: 6, width: 20, depth: 12, color: 0xF0E68C }
        ];

        commercialBuildings.forEach(building => {
            const mesh = this.createBuildingMesh(building);
            mesh.userData = { type: 'commercial', building: building };
            this.scene.add(mesh);
            this.buildings.push(mesh);
        });
    }

    createBuildingMesh(building) {
        const geometry = new THREE.BoxGeometry(building.width, building.height, building.depth);
        const material = new THREE.MeshStandardMaterial({
            color: building.color,
            roughness: 0.7,
            metalness: 0.1
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(building.x, building.height / 2, building.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Dodaj okna
        this.addWindows(mesh, building);

        return mesh;
    }

    addWindows(buildingMesh, building) {
        const windowGeometry = new THREE.PlaneGeometry(0.8, 0.8);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.7,
            emissive: 0x444444,
            emissiveIntensity: 0.2
        });

        const windowSpacing = 2;
        const windowsPerRow = Math.floor(building.width / windowSpacing) - 1;
        const floors = Math.floor(building.height / 2.5);

        for (let floor = 0; floor < floors; floor++) {
            for (let i = 0; i < windowsPerRow; i++) {
                // Przód
                const windowFront = new THREE.Mesh(windowGeometry, windowMaterial);
                windowFront.position.set(
                    -building.width/2 + (i+1) * windowSpacing,
                    -building.height/2 + (floor+1) * 2.5,
                    building.depth/2 + 0.01
                );
                buildingMesh.add(windowFront);

                // Tył
                const windowBack = new THREE.Mesh(windowGeometry, windowMaterial);
                windowBack.position.set(
                    -building.width/2 + (i+1) * windowSpacing,
                    -building.height/2 + (floor+1) * 2.5,
                    -building.depth/2 - 0.01
                );
                windowBack.rotation.y = Math.PI;
                buildingMesh.add(windowBack);
            }
        }
    }

    addBuilding(building, position) {
        const mesh = this.createBuildingMesh({
            x: position.x,
            z: position.z,
            height: building.height || 8,
            width: building.width || 10,
            depth: building.depth || 8,
            color: building.color || 0xcccccc
        });

        mesh.userData = { type: 'player_building', building: building };
        this.scene.add(mesh);
        this.buildings.push(mesh);

        return mesh;
    }

    removeBuilding(buildingId) {
        const index = this.buildings.findIndex(b => 
            b.userData.building && b.userData.building.id === buildingId
        );
        
        if (index !== -1) {
            this.scene.remove(this.buildings[index]);
            this.buildings.splice(index, 1);
        }
    }

    addVehicle(vehicle, position) {
        const vehicleMesh = this.createVehicleMesh(vehicle);
        vehicleMesh.position.set(position.x, 0.5, position.z);
        vehicleMesh.userData = { type: 'vehicle', vehicle: vehicle };
        
        this.scene.add(vehicleMesh);
        this.vehicles.push(vehicleMesh);

        return vehicleMesh;
    }

    createVehicleMesh(vehicle) {
        const group = new THREE.Group();

        // Karoseria
        const bodyGeometry = new THREE.BoxGeometry(4, 1.5, 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: vehicle.color || 0xff0000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        group.add(body);

        // Koła
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

        const wheelPositions = [
            { x: -1.3, y: 0.4, z: 0.8 },
            { x: 1.3, y: 0.4, z: 0.8 },
            { x: -1.3, y: 0.4, z: -0.8 },
            { x: 1.3, y: 0.4, z: -0.8 }
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.rotation.z = Math.PI / 2;
            group.add(wheel);
        });

        return group;
    }

    update(deltaTime) {
        // Animacje (np. ruch pojazdów, migające światła w oknach)
        this.animateVehicles(deltaTime);
        this.animateBuildings(deltaTime);
    }

    animateVehicles(deltaTime) {
        // Prosty ruch pojazdów po drogach
        this.vehicles.forEach(vehicle => {
            if (vehicle.userData.vehicle.isMoving) {
                vehicle.position.x += Math.sin(Date.now() * 0.001) * 0.1;
            }
        });
    }

    animateBuildings(deltaTime) {
        // Migające światła w oknach wieczorem
        const time = Date.now() * 0.001;
        this.buildings.forEach(building => {
            building.children.forEach(child => {
                if (child.material && child.material.emissive) {
                    child.material.emissiveIntensity = 0.1 + Math.sin(time + child.position.x) * 0.1;
                }
            });
        });
    }
}

export { SceneManager };
