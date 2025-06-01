class GameState {
    constructor(game) {
        this.game = game;
        this.player = {
            money: 100000,
            monthlyIncome: 0,
            reputation: 50,
            level: 1,
            experience: 0
        };

        this.time = {
            currentDate: new Date(2024, 0, 1), // Styczeń 2024
            gameStartDate: new Date(2024, 0, 1),
            daysPassed: 0,
            speed: 1
        };

        this.properties = [];
        this.vehicles = [];
        this.loans = [];
        this.availableProperties = this.generateInitialProperties();
        this.availableLots = this.generateInitialLots();
        
        this.statistics = {
            totalPropertiesBought: 0,
            totalMoneyEarned: 0,
            totalMoneySpent: 0,
            buildingsConstructed: 0
        };

        this.achievements = [];
        this.notifications = [];
    }

    generateInitialProperties() {
        const properties = [];
        const propertyTypes = [
            { type: 'apartment', name: 'Mieszkanie', basePrice: 80000, baseRent: 1200 },
            { type: 'house', name: 'Dom', basePrice: 150000, baseRent: 2000 },
            { type: 'villa', name: 'Willa', basePrice: 300000, baseRent: 4000 },
            { type: 'commercial', name: 'Lokal komercyjny', basePrice: 200000, baseRent: 3000 }
        ];

        const districts = [
            { name: 'Centrum', priceMultiplier: 1.5, demandMultiplier: 1.3 },
            { name: 'Przedmieścia', priceMultiplier: 1.0, demandMultiplier: 1.0 },
            { name: 'Dzielnica biznesowa', priceMultiplier: 1.8, demandMultiplier: 1.1 },
            { name: 'Nad jeziorem', priceMultiplier: 2.0, demandMultiplier: 1.4 }
        ];

        for (let i = 0; i < 20; i++) {
            const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
            const district = districts[Math.floor(Math.random() * districts.length)];
            
            const condition = Math.random() * 100;
            const conditionMultiplier = condition > 80 ? 1.2 : condition > 50 ? 1.0 : 0.8;
            
            properties.push({
                id: `prop_${i}`,
                type: propertyType.type,
                name: `${propertyType.name} - ${district.name}`,
                price: Math.round(propertyType.basePrice * district.priceMultiplier * conditionMultiplier),
                monthlyRent: Math.round(propertyType.baseRent * district.priceMultiplier * conditionMultiplier),
                condition: Math.round(condition),
                district: district.name,
                position: {
                    x: (Math.random() - 0.5) * 80,
                    z: (Math.random() - 0.5) * 80
                },
                isRented: Math.random() > 0.3,
                tenant: null,
                maintenanceCost: Math.round(propertyType.baseRent * 0.1)
            });
        }

        return properties;
    }

    generateInitialLots() {
        const lots = [];
        
        for (let i = 0; i < 15; i++) {
            const size = Math.random() * 500 + 200; // 200-700 m²
            const pricePerSqm = Math.random() * 200 + 100; // 100-300 zł/m²
            
            lots.push({
                id: `lot_${i}`,
                size: Math.round(size),
                pricePerSqm: Math.round(pricePerSqm),
                totalPrice: Math.round(size * pricePerSqm),
                position: {
                    x: (Math.random() - 0.5) * 90,
                    z: (Math.random() - 0.5) * 90
                },
                zoning: Math.random() > 0.7 ? 'commercial' : 'residential',
                hasUtilities: Math.random() > 0.3
            });
        }

        return lots;
    }

    update(deltaTime) {
        // Aktualizacja czasu gry (1 sekunda = 1 dzień w grze przy normalnej prędkości)
        const daysToAdd = (deltaTime / 1000) * this.time.speed;
        this.time.daysPassed += daysToAdd;
        
        // Aktualizacja daty
        const newDate = new Date(this.time.gameStartDate);
        newDate.setDate(newDate.getDate() + Math.floor(this.time.daysPassed));
        this.time.currentDate = newDate;

        // Miesięczne przychody (co 30 dni)
        if (Math.floor(this.time.daysPassed) % 30 === 0 && Math.floor(this.time.daysPassed) > 0) {
            this.processMonthlyIncome();
        }
    }

    processMonthlyIncome() {
        let totalIncome = 0;
        let totalExpenses = 0;

        // Przychody z wynajmu
        this.properties.forEach(property => {
            if (property.isRented) {
                totalIncome += property.monthlyRent;
                totalExpenses += property.maintenanceCost;
            }
        });

        // Spłaty pożyczek
        this.loans.forEach(loan => {
            const monthlyPayment = this.calculateMonthlyLoanPayment(loan);
            totalExpenses += monthlyPayment;
            loan.remainingAmount -= monthlyPayment;
            
            if (loan.remainingAmount <= 0) {
                this.loans = this.loans.filter(l => l.id !== loan.id);
            }
        });

        const netIncome = totalIncome - totalExpenses;
        this.player.money += netIncome;
        this.player.monthlyIncome = netIncome;

        // Aktualizacja statystyk
        if (netIncome > 0) {
            this.statistics.totalMoneyEarned += netIncome;
        }

        // Powiadomienie o miesięcznym rozliczeniu
        this.addNotification(
            `Miesięczne rozliczenie: ${netIncome >= 0 ? '+' : ''}${netIncome.toLocaleString()} zł`,
            netIncome >= 0 ? 'success' : 'warning'
        );
    }

    calculateMonthlyLoanPayment(loan) {
        const monthlyRate = loan.interestRate / 100 / 12;
        const numPayments = loan.termMonths;
        
        if (monthlyRate === 0) {
            return loan.amount / numPayments;
        }
        
        return loan.amount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
               (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    addProperty(property) {
        this.properties.push(property);
        this.statistics.totalPropertiesBought++;
        
        // Usuń z dostępnych nieruchomości
        this.availableProperties = this.availableProperties.filter(p => p.id !== property.id);
    }

    addVehicle(vehicle) {
        this.vehicles.push(vehicle);
    }

    addLoan(amount, interestRate, termMonths = 240, monthlyPayment = null) { // 20 lat domyślnie
        const startDate = new Date(this.time.currentDate);
        const plannedEndDate = new Date(startDate);
        plannedEndDate.setMonth(plannedEndDate.getMonth() + termMonths);

        const loan = {
            id: `loan_${Date.now()}`,
            amount: amount,
            remainingAmount: amount,
            interestRate: interestRate,
            termMonths: termMonths,
            monthlyPayment: monthlyPayment,
            startDate: startDate,
            plannedEndDate: plannedEndDate,
            endDate: null,
            paymentsMade: 0,
            totalInterestPaid: 0
        };
        
        this.loans.push(loan);
        this.player.money += amount;
        
        return loan;
    }

    addNotification(message, type = 'info') {
        const notification = {
            id: Date.now(),
            message: message,
            type: type,
            timestamp: new Date()
        };
        
        this.notifications.push(notification);
        
        // Usuń stare powiadomienia (max 10)
        if (this.notifications.length > 10) {
            this.notifications = this.notifications.slice(-10);
        }
        
        return notification;
    }

    canAfford(amount) {
        return this.player.money >= amount;
    }

    spendMoney(amount, description = '') {
        if (this.canAfford(amount)) {
            this.player.money -= amount;
            this.statistics.totalMoneySpent += amount;
            
            if (description) {
                this.addNotification(`Wydano ${amount.toLocaleString()} zł na ${description}`, 'info');
            }
            
            return true;
        }
        return false;
    }

    getFormattedDate() {
        const months = [
            'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
            'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
        ];
        
        return `${months[this.time.currentDate.getMonth()]} ${this.time.currentDate.getFullYear()}`;
    }

    serialize() {
        return {
            player: this.player,
            time: {
                ...this.time,
                currentDate: this.time.currentDate.toISOString(),
                gameStartDate: this.time.gameStartDate.toISOString()
            },
            properties: this.properties,
            vehicles: this.vehicles,
            loans: this.loans,
            availableProperties: this.availableProperties,
            availableLots: this.availableLots,
            statistics: this.statistics,
            achievements: this.achievements
        };
    }

    deserialize(data) {
        this.player = data.player;
        this.time = {
            ...data.time,
            currentDate: new Date(data.time.currentDate),
            gameStartDate: new Date(data.time.gameStartDate)
        };
        this.properties = data.properties;
        this.vehicles = data.vehicles;
        this.loans = data.loans;
        this.availableProperties = data.availableProperties;
        this.availableLots = data.availableLots;
        this.statistics = data.statistics;
        this.achievements = data.achievements;
        this.notifications = [];
    }
}

export { GameState };
