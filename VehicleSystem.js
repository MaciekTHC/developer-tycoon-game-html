class VehicleSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.vehicleTypes = this.initializeVehicleTypes();
        this.playerVehicle = null;
    }

    initializeVehicleTypes() {
        return {
            bicycle: {
                name: 'Rower',
                price: 500,
                speed: 15,
                maintenanceCost: 10,
                color: 0x00ff00,
                description: 'Ekologiczny środek transportu'
            },
            scooter: {
                name: 'Skuter',
                price: 3000,
                speed: 45,
                maintenanceCost: 50,
                color: 0x0066cc,
                description: 'Szybki transport po mieście'
            },
            car: {
                name: 'Samochód osobowy',
                price: 25000,
                speed: 90,
                maintenanceCost: 200,
                color: 0xff0000,
                description: 'Wygodny transport dla całej rodziny'
            },
            van: {
                name: 'Furgonetka',
                price: 45000,
                speed: 70,
                maintenanceCost: 300,
                color: 0xffffff,
                description: 'Idealny do przewozu materiałów budowlanych'
            },
            truck: {
                name: 'Ciężarówka',
                price: 80000,
                speed: 60,
                maintenanceCost: 500,
                color: 0x888888,
                description: 'Duża ładowność, redukcja kosztów transportu'
            },
            luxury_car: {
                name: 'Samochód luksusowy',
                price: 150000,
                speed: 120,
                maintenanceCost: 800,
                color: 0x000000,
                description: 'Zwiększa prestiż i ułatwia negocjacje'
            }
        };
    }

    buyVehicle(vehicleType) {
        const vehicleInfo = this.vehicleTypes[vehicleType];
        if (!vehicleInfo) {
            throw new Error('Nieprawidłowy typ pojazdu');
        }

        if (!this.gameState.canAfford(vehicleInfo.price)) {
            throw new Error('Niewystarczające środki na zakup pojazdu');
        }

        // Sprawdź czy gracz ma już pojazd tego typu
        const existingVehicle = this.gameState.vehicles.find(v => v.type === vehicleType);
        if (existingVehicle) {
            throw new Error('Posiadasz już pojazd tego typu');
        }

        this.gameState.spendMoney(vehicleInfo.price, `Zakup: ${vehicleInfo.name}`);

        const vehicle = {
            id: `vehicle_${Date.now()}`,
            type: vehicleType,
            name: vehicleInfo.name,
            speed: vehicleInfo.speed,
            maintenanceCost: vehicleInfo.maintenanceCost,
            color: vehicleInfo.color,
            condition: 100,
            mileage: 0,
            purchaseDate: new Date(this.gameState.time.currentDate),
            position: { x: 0, z: 0 },
            isActive: false
        };

        this.gameState.addVehicle(vehicle);

        // Jeśli to pierwszy pojazd, ustaw jako aktywny
        if (this.gameState.vehicles.length === 1) {
            this.setActiveVehicle(vehicle.id);
        }

        this.gameState.addNotification(
            `Zakupiono ${vehicleInfo.name}!`,
            'success'
        );

        return vehicle;
    }

    setActiveVehicle(vehicleId) {
        // Dezaktywuj wszystkie pojazdy
        this.gameState.vehicles.forEach(v => v.isActive = false);

        // Aktywuj wybrany pojazd
        const vehicle = this.gameState.vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            vehicle.isActive = true;
            this.playerVehicle = vehicle;
            
            this.gameState.addNotification(
                `Aktywny pojazd: ${vehicle.name}`,
                'info'
            );
        }
    }

    sellVehicle(vehicleId) {
        const vehicleIndex = this.gameState.vehicles.findIndex(v => v.id === vehicleId);
        if (vehicleIndex === -1) {
            throw new Error('Pojazd nie istnieje');
        }

        const vehicle = this.gameState.vehicles[vehicleIndex];
        const vehicleInfo = this.vehicleTypes[vehicle.type];
        
        // Oblicz wartość pojazdu (deprecjacja)
        const age = this.gameState.time.daysPassed - 
                   ((new Date(this.gameState.time.currentDate) - vehicle.purchaseDate) / (1000 * 60 * 60 * 24));
        const conditionFactor = vehicle.condition / 100;
        const ageFactor = Math.max(0.3, 1 - (age / 365) * 0.15); // 15% deprecjacji rocznie
        
        const sellPrice = Math.round(vehicleInfo.price * conditionFactor * ageFactor);

        this.gameState.player.money += sellPrice;
        this.gameState.vehicles.splice(vehicleIndex, 1);

        // Jeśli sprzedany pojazd był aktywny, wybierz nowy
        if (vehicle.isActive && this.gameState.vehicles.length > 0) {
            this.setActiveVehicle(this.gameState.vehicles[0].id);
        } else if (this.gameState.vehicles.length === 0) {
            this.playerVehicle = null;
        }

        this.gameState.addNotification(
            `Sprzedano ${vehicle.name} za ${sellPrice.toLocaleString()} zł`,
            'success'
        );

        return sellPrice;
    }

    repairVehicle(vehicleId) {
        const vehicle = this.gameState.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
            throw new Error('Pojazd nie istnieje');
        }

        if (vehicle.condition >= 95) {
            throw new Error('Pojazd nie wymaga naprawy');
        }

        const vehicleInfo = this.vehicleTypes[vehicle.type];
        const repairCost = Math.round(vehicleInfo.price * 0.05 * (1 - vehicle.condition / 100));

        if (!this.gameState.canAfford(repairCost)) {
            throw new Error('Niewystarczające środki na naprawę');
        }

        this.gameState.spendMoney(repairCost, `Naprawa: ${vehicle.name}`);
        vehicle.condition = Math.min(100, vehicle.condition + 30);

        this.gameState.addNotification(
            `Naprawiono ${vehicle.name}`,
            'success'
        );

        return vehicle;
    }

    moveVehicle(targetPosition) {
        if (!this.playerVehicle) {
            throw new Error('Brak aktywnego pojazdu');
        }

        const distance = Math.sqrt(
            Math.pow(targetPosition.x - this.playerVehicle.position.x, 2) +
            Math.pow(targetPosition.z - this.playerVehicle.position.z, 2)
        );

        // Oblicz czas podróży
        const travelTime = distance / this.playerVehicle.speed; // w godzinach
        
        // Aktualizuj pozycję
        this.playerVehicle.position = { ...targetPosition };
        this.playerVehicle.mileage += distance;

        // Zużycie pojazdu
        const wearFactor = distance / 1000; // 1km = 0.1% zużycia
        this.playerVehicle.condition = Math.max(0, this.playerVehicle.condition - wearFactor);

        return {
            travelTime: travelTime,
            distance: distance,
            fuelCost: this.calculateFuelCost(distance)
        };
    }

    calculateFuelCost(distance) {
        if (!this.playerVehicle) return 0;

        const fuelConsumption = {
            bicycle: 0,
            scooter: 3, // l/100km
            car: 7,
            van: 10,
            truck: 15,
            luxury_car: 12
        };

        const consumption = fuelConsumption[this.playerVehicle.type] || 7;
        const fuelPrice = 6.5; // zł/litr
        
        return Math.round((distance / 100) * consumption * fuelPrice);
    }

    getVehicleEfficiency(vehicleType) {
        const vehicleInfo = this.vehicleTypes[vehicleType];
        if (!vehicleInfo) return null;

        // Oblicz efektywność na podstawie różnych czynników
        const speedScore = Math.min(vehicleInfo.speed / 120, 1); // Max 120 km/h
        const costScore = 1 - (vehicleInfo.maintenanceCost / 1000); // Im niższe koszty, tym lepiej
        const priceScore = 1 - (vehicleInfo.price / 200000); // Im niższa cena, tym lepiej

        return {
            overall: (speedScore + costScore + priceScore) / 3,
            speed: speedScore,
            economy: costScore,
            value: priceScore
        };
    }

    update(deltaTime) {
        // Miesięczne koszty utrzymania pojazdów
        const currentDay = Math.floor(this.gameState.time.daysPassed);
        if (currentDay % 30 === 0 && currentDay > 0) {
            this.processMonthlyMaintenance();
        }

        // Naturalne zużycie pojazdów
        this.gameState.vehicles.forEach(vehicle => {
            // Pojazdy tracą stan z czasem (bardzo powoli)
            const dailyWear = 0.01; // 0.01% dziennie
            vehicle.condition = Math.max(0, vehicle.condition - dailyWear * (deltaTime / (1000 * 24)));
        });
    }

    processMonthlyMaintenance() {
        let totalMaintenanceCost = 0;

        this.gameState.vehicles.forEach(vehicle => {
            const conditionMultiplier = 1 + (1 - vehicle.condition / 100); // Gorsze pojazdy kosztują więcej
            const monthlyCost = Math.round(vehicle.maintenanceCost * conditionMultiplier);
            
            totalMaintenanceCost += monthlyCost;
        });

        if (totalMaintenanceCost > 0) {
            this.gameState.player.money -= totalMaintenanceCost;
            this.gameState.addNotification(
                `Koszty utrzymania pojazdów: ${totalMaintenanceCost.toLocaleString()} zł`,
                'info'
            );
        }
    }

    getAvailableVehicles() {
        return Object.entries(this.vehicleTypes).map(([type, info]) => ({
            type,
            ...info,
            owned: this.gameState.vehicles.some(v => v.type === type),
            efficiency: this.getVehicleEfficiency(type)
        }));
    }

    getVehicleStats() {
        return {
            totalVehicles: this.gameState.vehicles.length,
            totalValue: this.gameState.vehicles.reduce((sum, vehicle) => {
                const vehicleInfo = this.vehicleTypes[vehicle.type];
                const age = (new Date(this.gameState.time.currentDate) - vehicle.purchaseDate) / (1000 * 60 * 60 * 24);
                const conditionFactor = vehicle.condition / 100;
                const ageFactor = Math.max(0.3, 1 - (age / 365) * 0.15);
                return sum + (vehicleInfo.price * conditionFactor * ageFactor);
            }, 0),
            monthlyMaintenance: this.gameState.vehicles.reduce((sum, vehicle) => 
                sum + vehicle.maintenanceCost, 0),
            activeVehicle: this.playerVehicle
        };
    }
}

export { VehicleSystem };
