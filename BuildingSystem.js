import * as THREE from 'three';

class BuildingSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.buildingTypes = this.initializeBuildingTypes();
        this.constructionProjects = [];
    }

    initializeBuildingTypes() {
        return {
            house: {
                name: 'Dom jednorodzinny',
                cost: 150000,
                buildTime: 90, // dni
                maintenanceCost: 500,
                baseRent: 2000,
                model: {
                    width: 10,
                    height: 8,
                    depth: 10,
                    color: 0xcccccc
                }
            },
            apartment: {
                name: 'Blok mieszkalny',
                cost: 500000,
                buildTime: 180,
                maintenanceCost: 2000,
                baseRent: 8000,
                model: {
                    width: 20,
                    height: 30,
                    depth: 15,
                    color: 0xbbbbbb
                }
            },
            office: {
                name: 'Biurowiec',
                cost: 1000000,
                buildTime: 240,
                maintenanceCost: 5000,
                baseRent: 15000,
                model: {
                    width: 25,
                    height: 50,
                    depth: 25,
                    color: 0x87CEEB
                }
            },
            shop: {
                name: 'Sklep',
                cost: 200000,
                buildTime: 60,
                maintenanceCost: 1000,
                baseRent: 3000,
                model: {
                    width: 15,
                    height: 6,
                    depth: 15,
                    color: 0xf0f0f0
                }
            }
        };
    }

    createBuildingMesh(buildingType, position) {
        const type = this.buildingTypes[buildingType];
        if (!type) return null;

        const geometry = new THREE.BoxGeometry(
            type.model.width,
            type.model.height,
            type.model.depth
        );

        const material = new THREE.MeshStandardMaterial({
            color: type.model.color,
            roughness: 0.7,
            metalness: 0.1
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, type.model.height / 2, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Dodaj detale do budynku
        this.addBuildingDetails(mesh, type);

        return mesh;
    }

    addBuildingDetails(buildingMesh, type) {
        // Dodaj okna
        const windowGeometry = new THREE.PlaneGeometry(1, 1);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.7
        });

        const windowSpacingX = 2;
        const windowSpacingY = 2;
        const windowsPerFloor = Math.floor(type.model.width / windowSpacingX) - 1;
        const floors = Math.floor(type.model.height / windowSpacingY) - 1;

        for (let floor = 0; floor < floors; floor++) {
            for (let i = 0; i < windowsPerFloor; i++) {
                // Przód
                const windowFront = new THREE.Mesh(windowGeometry, windowMaterial);
                windowFront.position.set(
                    -type.model.width/2 + (i+1) * windowSpacingX,
                    -type.model.height/2 + (floor+1) * windowSpacingY,
                    type.model.depth/2 + 0.1
                );
                buildingMesh.add(windowFront);

                // Tył
                const windowBack = new THREE.Mesh(windowGeometry, windowMaterial);
                windowBack.position.set(
                    -type.model.width/2 + (i+1) * windowSpacingX,
                    -type.model.height/2 + (floor+1) * windowSpacingY,
                    -type.model.depth/2 - 0.1
                );
                windowBack.rotation.y = Math.PI;
                buildingMesh.add(windowBack);
            }
        }

        // Dodaj dach
        const roofGeometry = new THREE.ConeGeometry(
            type.model.width / 1.5,
            type.model.height / 4,
            4
        );
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = type.model.height / 2 + type.model.height / 8;
        roof.rotation.y = Math.PI / 4;
        buildingMesh.add(roof);
    }

    startConstruction(lotId, buildingType) {
        const lot = this.gameState.availableLots.find(l => l.id === lotId);
        if (!lot) {
            throw new Error('Działka nie istnieje');
        }

        const buildingInfo = this.buildingTypes[buildingType];
        if (!buildingInfo) {
            throw new Error('Nieprawidłowy typ budynku');
        }

        if (!this.gameState.canAfford(buildingInfo.cost)) {
            throw new Error('Niewystarczające środki');
        }

        // Sprawdź ograniczenia strefowe
        if (lot.zoning === 'residential' && buildingType === 'office') {
            throw new Error('Nie można budować biurowca w strefie mieszkalnej');
        }

        // Pobierz opłatę
        this.gameState.spendMoney(buildingInfo.cost, `Budowa: ${buildingInfo.name}`);

        // Utwórz projekt budowlany
        const constructionProject = {
            id: `const_${Date.now()}`,
            lotId: lotId,
            buildingType: buildingType,
            progress: 0,
            totalTime: buildingInfo.buildTime,
            position: lot.position,
            mesh: null
        };

        // Dodaj szkielet budynku
        constructionProject.mesh = this.createConstructionSiteMesh(lot.position);
        
        this.constructionProjects.push(constructionProject);
        
        // Usuń działkę z dostępnych
        this.gameState.availableLots = this.gameState.availableLots.filter(l => l.id !== lotId);

        return constructionProject;
    }

    createConstructionSiteMesh(position) {
        // Stwórz podstawę placu budowy
        const siteGeometry = new THREE.BoxGeometry(15, 0.5, 15);
        const siteMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const siteMesh = new THREE.Mesh(siteGeometry, siteMaterial);
        siteMesh.position.set(position.x, 0.25, position.z);

        // Dodaj ogrodzenie
        const fenceGeometry = new THREE.BoxGeometry(0.2, 2, 15);
        const fenceMaterial = new THREE.MeshStandardMaterial({ color: 0xFFA500 });

        const fences = [];
        for (let i = 0; i < 4; i++) {
            const fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
            fence.position.y = 1;
            if (i % 2 === 0) {
                fence.position.x = position.x + (i === 0 ? -7.5 : 7.5);
                fence.position.z = position.z;
            } else {
                fence.position.x = position.x;
                fence.position.z = position.z + (i === 1 ? -7.5 : 7.5);
                fence.rotation.y = Math.PI / 2;
            }
            fences.push(fence);
        }

        const constructionSite = new THREE.Group();
        constructionSite.add(siteMesh, ...fences);

        return constructionSite;
    }

    update(deltaTime) {
        // Aktualizuj projekty w budowie
        for (let i = this.constructionProjects.length - 1; i >= 0; i--) {
            const project = this.constructionProjects[i];
            project.progress += deltaTime / (1000 * 24); // Konwersja milisekund na dni

            // Aktualizuj wizualną reprezentację postępu
            this.updateConstructionVisuals(project);

            // Sprawdź czy budowa jest zakończona
            if (project.progress >= project.totalTime) {
                this.completeConstruction(project);
                this.constructionProjects.splice(i, 1);
            }
        }
    }

    updateConstructionVisuals(project) {
        const progress = project.progress / project.totalTime;
        const buildingType = this.buildingTypes[project.buildingType];
        
        // Aktualizuj wysokość "szkieletu" budynku
        if (project.mesh && project.mesh.children[0]) {
            const targetHeight = buildingType.model.height * progress;
            project.mesh.children[0].scale.y = Math.min(targetHeight / 0.5, 1);
            project.mesh.children[0].position.y = targetHeight / 2;
        }
    }

    completeConstruction(project) {
        const buildingType = this.buildingTypes[project.buildingType];
        
        // Utwórz nowy budynek
        const building = {
            id: `bld_${Date.now()}`,
            type: project.buildingType,
            name: buildingType.name,
            position: project.position,
            condition: 100,
            maintenanceCost: buildingType.maintenanceCost,
            monthlyRent: buildingType.baseRent,
            isRented: false,
            constructionDate: new Date(this.gameState.time.currentDate)
        };

        // Dodaj budynek do stanu gry
        this.gameState.properties.push(building);
        
        // Usuń plac budowy i dodaj gotowy budynek
        if (project.mesh && project.mesh.parent) {
            project.mesh.parent.remove(project.mesh);
        }

        // Powiadomienie o zakończeniu budowy
        this.gameState.addNotification(
            `Budowa ${buildingType.name} została zakończona!`,
            'success'
        );

        return building;
    }

    buyProperty(propertyId) {
        const property = this.gameState.availableProperties.find(p => p.id === propertyId);
        if (!property) {
            throw new Error('Nieruchomość nie istnieje');
        }

        if (!this.gameState.canAfford(property.price)) {
            throw new Error('Niewystarczające środki');
        }

        this.gameState.spendMoney(property.price, `Zakup: ${property.name}`);
        this.gameState.addProperty(property);

        return property;
    }

    renovateProperty(propertyId, level = 'basic') {
        const property = this.gameState.properties.find(p => p.id === propertyId);
        if (!property) {
            throw new Error('Nieruchomość nie istnieje');
        }

        const renovationCosts = {
            basic: property.price * 0.1,
            medium: property.price * 0.2,
            full: property.price * 0.3
        };

        const cost = renovationCosts[level];
        if (!this.gameState.canAfford(cost)) {
            throw new Error('Niewystarczające środki na remont');
        }

        const conditionImprovement = {
            basic: 20,
            medium: 40,
            full: 70
        };

        this.gameState.spendMoney(cost, `Remont ${property.name}`);
        property.condition = Math.min(100, property.condition + conditionImprovement[level]);
        
        // Zwiększ czynsz po remoncie
        const rentIncrease = {
            basic: 1.1,
            medium: 1.2,
            full: 1.3
        };
        property.monthlyRent = Math.round(property.monthlyRent * rentIncrease[level]);

        return property;
    }
}

export { BuildingSystem };
