import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GameState } from './GameState.js';
import { EconomySystem } from './EconomySystem.js';
import { BuildingSystem } from './BuildingSystem.js';
import { UIManager } from './UIManager.js';
import { SceneManager } from './SceneManager.js';
import { VehicleSystem } from './VehicleSystem.js';
import { AchievementSystem } from './AchievementSystem.js';

class Game {
    constructor() {
        this.gameState = new GameState(this);
        this.economySystem = new EconomySystem(this.gameState);
        this.buildingSystem = new BuildingSystem(this.gameState);
        this.vehicleSystem = new VehicleSystem(this.gameState);
        this.achievementSystem = new AchievementSystem(this);
        this.uiManager = new UIManager(this.gameState, this);
        this.sceneManager = new SceneManager();
        
        this.isRunning = false;
        this.gameSpeed = 1;
        this.lastUpdate = 0;
        
        this.init();
    }

    async init() {
        await this.showLoadingScreen();
        this.setupScene();
        this.setupEventListeners();
        this.startGame();
    }

    async showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const progressBar = document.querySelector('.loading-progress');
        
        const loadingSteps = [
            'Inicjalizacja silnika gry...',
            'Ładowanie modeli 3D...',
            'Przygotowywanie terenu...',
            'Konfiguracja systemów...',
            'Finalizacja...'
        ];

        for (let i = 0; i < loadingSteps.length; i++) {
            document.querySelector('#loadingScreen p').textContent = loadingSteps[i];
            progressBar.style.width = `${(i + 1) * 20}%`;
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        loadingScreen.style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
    }

    setupScene() {
        // Inicjalizacja sceny 3D
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);

        // Kamera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(30, 30, 30);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);

        // Kontrolki kamery
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        this.controls.maxPolarAngle = Math.PI / 2.1;

        // Oświetlenie
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        this.scene.add(directionalLight);

        // Inicjalizacja menedżera sceny
        this.sceneManager.init(this.scene);
        this.sceneManager.createTerrain();
        this.sceneManager.createInitialBuildings();
    }

    setupEventListeners() {
        // Obsługa zmiany rozmiaru okna
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Kontrolki czasu
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.gameSpeed = 0;
            this.updateTimeButtons();
        });

        document.getElementById('normalSpeedBtn').addEventListener('click', () => {
            this.gameSpeed = 1;
            this.updateTimeButtons();
        });

        document.getElementById('fastSpeedBtn').addEventListener('click', () => {
            this.gameSpeed = 3;
            this.updateTimeButtons();
        });

        // Obsługa kliknięć w obiekty 3D
        this.renderer.domElement.addEventListener('click', (event) => {
            this.handleObjectClick(event);
        });
    }

    updateTimeButtons() {
        document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
        
        if (this.gameSpeed === 0) {
            document.getElementById('pauseBtn').classList.add('active');
        } else if (this.gameSpeed === 1) {
            document.getElementById('normalSpeedBtn').classList.add('active');
        } else if (this.gameSpeed === 3) {
            document.getElementById('fastSpeedBtn').classList.add('active');
        }
    }

    handleObjectClick(event) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        const intersects = raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            this.handleBuildingClick(clickedObject);
        }
    }

    handleBuildingClick(object) {
        if (object.userData && object.userData.type === 'building') {
            this.uiManager.showBuildingDetails(object.userData.building);
        } else if (object.userData && object.userData.type === 'lot') {
            this.uiManager.showLotOptions(object.userData.lot);
        }
    }

    startGame() {
        this.isRunning = true;
        this.lastUpdate = Date.now();
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isRunning) return;

        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) * this.gameSpeed;
        this.lastUpdate = now;

        // Aktualizacja systemów gry
        if (this.gameSpeed > 0) {
            this.economySystem.update(deltaTime);
            this.buildingSystem.update(deltaTime);
            this.vehicleSystem.update(deltaTime);
            this.gameState.update(deltaTime);
            this.achievementSystem.checkAchievements();
        }

        // Aktualizacja UI
        this.uiManager.update();

        // Renderowanie sceny 3D
        this.controls.update();
        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(() => this.gameLoop());
    }

    // Metody publiczne dla interakcji z grą
    buyProperty(propertyId) {
        return this.buildingSystem.buyProperty(propertyId);
    }

    buildOnLot(lotId, buildingType) {
        return this.buildingSystem.buildOnLot(lotId, buildingType);
    }

    takeLoan(amount, interestRate) {
        return this.economySystem.takeLoan(amount, interestRate);
    }

    buyVehicle(vehicleType) {
        return this.vehicleSystem.buyVehicle(vehicleType);
    }

    saveGame() {
        const saveData = this.gameState.serialize();
        localStorage.setItem('realEstateTycoonSave', JSON.stringify(saveData));
        this.uiManager.showNotification('Gra została zapisana!', 'success');
    }

    loadGame() {
        const saveData = localStorage.getItem('realEstateTycoonSave');
        if (saveData) {
            this.gameState.deserialize(JSON.parse(saveData));
            this.uiManager.showNotification('Gra została wczytana!', 'success');
            return true;
        }
        return false;
    }
}

// Uruchomienie gry
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

export { Game };
