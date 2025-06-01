class EconomySystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.marketConditions = this.initializeMarketConditions();
        this.lastMonthlyUpdate = 0;
    }

    initializeMarketConditions() {
        return {
            propertyMarket: {
                demandLevel: 0.7, // 0-1, wpływa na szansę wynajmu
                priceMultiplier: 1.0, // bazowy mnożnik cen
                trend: 0.01 // miesięczna zmiana cen (1% wzrost)
            },
            economy: {
                inflation: 0.02, // roczna inflacja
                interestRate: 0.035, // bazowa stopa procentowa
                economicGrowth: 0.03 // roczny wzrost gospodarczy
            },
            districts: {
                'Centrum': { popularity: 0.9, growth: 0.02 },
                'Przedmieścia': { popularity: 0.7, growth: 0.03 },
                'Dzielnica biznesowa': { popularity: 0.8, growth: 0.015 },
                'Nad jeziorem': { popularity: 0.85, growth: 0.025 }
            }
        };
    }

    update(deltaTime) {
        // Aktualizacja co miesiąc (30 dni)
        const currentDay = Math.floor(this.gameState.time.daysPassed);
        if (currentDay > this.lastMonthlyUpdate + 30) {
            this.lastMonthlyUpdate = currentDay;
            this.updateMarketConditions();
            this.updatePropertyValues();
            this.processRents();
            this.updateLoans();
        }
    }

    updateMarketConditions() {
        // Symulacja zmian rynkowych
        const market = this.marketConditions.propertyMarket;
        
        // Losowa zmiana popytu
        market.demandLevel += (Math.random() - 0.5) * 0.1;
        market.demandLevel = Math.max(0.3, Math.min(1, market.demandLevel));

        // Aktualizacja trendu cenowego
        market.trend += (Math.random() - 0.5) * 0.005;
        market.trend = Math.max(-0.02, Math.min(0.02, market.trend));

        // Aktualizacja mnożnika cen
        market.priceMultiplier *= (1 + market.trend);

        // Aktualizacja dzielnic
        for (const district in this.marketConditions.districts) {
            const districtData = this.marketConditions.districts[district];
            districtData.popularity += (Math.random() - 0.5) * 0.05;
            districtData.popularity = Math.max(0.5, Math.min(1, districtData.popularity));
        }

        // Aktualizacja wskaźników ekonomicznych
        const economy = this.marketConditions.economy;
        economy.interestRate += (Math.random() - 0.5) * 0.001;
        economy.interestRate = Math.max(0.02, Math.min(0.06, economy.interestRate));
    }

    updatePropertyValues() {
        const market = this.marketConditions.propertyMarket;

        this.gameState.properties.forEach(property => {
            const district = this.marketConditions.districts[property.district];
            if (!district) return;

            // Oblicz zmianę wartości nieruchomości
            const baseChange = market.trend;
            const districtEffect = district.growth;
            const conditionEffect = (property.condition - 50) / 1000; // Wpływ stanu technicznego
            
            const totalChange = baseChange + districtEffect + conditionEffect;
            
            // Aktualizuj cenę i czynsz
            property.price *= (1 + totalChange);
            property.monthlyRent *= (1 + totalChange);

            // Zaokrąglij wartości
            property.price = Math.round(property.price);
            property.monthlyRent = Math.round(property.monthlyRent);
        });
    }

    processRents() {
        this.gameState.properties.forEach(property => {
            if (!property.isRented) {
                // Szansa na znalezienie najemcy
                const district = this.marketConditions.districts[property.district];
                const baseChance = this.marketConditions.propertyMarket.demandLevel;
                const districtChance = district ? district.popularity : 0.5;
                const conditionFactor = property.condition / 100;

                const rentChance = baseChance * districtChance * conditionFactor;

                if (Math.random() < rentChance) {
                    property.isRented = true;
                    property.tenant = this.generateTenant();
                    this.gameState.addNotification(
                        `Znaleziono najemcę dla ${property.name}!`,
                        'success'
                    );
                }
            } else {
                // Szansa na utratę najemcy
                const leaveChance = 0.02 * (1 - property.condition / 100);
                if (Math.random() < leaveChance) {
                    property.isRented = false;
                    property.tenant = null;
                    this.gameState.addNotification(
                        `Najemca wyprowadził się z ${property.name}.`,
                        'warning'
                    );
                }
            }
        });
    }

    generateTenant() {
        const names = ['Jan Kowalski', 'Anna Nowak', 'Piotr Wiśniewski', 'Maria Wójcik'];
        const types = ['Rodzina', 'Student', 'Para', 'Singiel', 'Firma'];
        
        return {
            name: names[Math.floor(Math.random() * names.length)],
            type: types[Math.floor(Math.random() * types.length)],
            rating: Math.random() * 5 + 3, // 3-8 gwiazdek
            moveInDate: new Date(this.gameState.time.currentDate)
        };
    }

    updateLoans() {
        this.gameState.loans.forEach(loan => {
            if (loan.remainingAmount > 0) {
                // Naliczanie odsetek
                const monthlyRate = loan.interestRate / 12;
                const interest = loan.remainingAmount * monthlyRate;
                
                // Oblicz miesięczną ratę
                const monthlyPayment = this.calculateMonthlyPayment(loan);
                
                // Sprawdź czy gracz ma wystarczająco pieniędzy
                if (this.gameState.player.money >= monthlyPayment) {
                    // Spłać ratę
                    this.gameState.player.money -= monthlyPayment;
                    
                    // Część raty to odsetki, część to kapitał
                    const principalPayment = monthlyPayment - interest;
                    loan.remainingAmount -= principalPayment;
                    
                    // Sprawdź czy pożyczka została spłacona
                    if (loan.remainingAmount <= 0) {
                        loan.remainingAmount = 0;
                        loan.endDate = new Date();
                        
                        // Sprawdź czy spłacono przed terminem
                        if (loan.endDate < loan.plannedEndDate) {
                            // Powiadom system osiągnięć o wcześniejszej spłacie
                            if (this.gameState.game && this.gameState.game.achievementSystem) {
                                this.gameState.game.achievementSystem.updateProgress('loan_master', 1);
                            }
                        }
                    }
                } else {
                    // Brak środków na spłatę - nalicz tylko odsetki
                    loan.remainingAmount += interest;
                    
                    // Powiadomienie o problemach finansowych
                    this.gameState.addNotification(
                        'Brak środków na spłatę raty kredytu!',
                        'error'
                    );
                }
            }
        });
    }

    takeLoan(amount, interestRate, termMonths = 240, monthlyPayment = null) {
        // Sprawdź zdolność kredytową
        const monthlyIncome = this.gameState.player.monthlyIncome;
        const existingLoans = this.gameState.loans.reduce((sum, loan) => 
            sum + (loan.monthlyPayment || this.calculateMonthlyPayment(loan)), 0);
        
        const newLoanPayment = monthlyPayment || this.calculateMonthlyPayment({
            amount: amount,
            interestRate: interestRate / 100,
            termMonths: termMonths
        });

        // Maksymalnie 40% dochodu na raty (ale minimum 1000 zł dla pierwszej pożyczki)
        const maxAllowedPayment = Math.max(1000, monthlyIncome * 0.4);
        if ((existingLoans + newLoanPayment) > maxAllowedPayment) {
            throw new Error('Zbyt niska zdolność kredytowa');
        }

        return this.gameState.addLoan(amount, interestRate, termMonths, newLoanPayment);
    }

    calculateMonthlyPayment(loan) {
        const monthlyRate = loan.interestRate / 12;
        const numPayments = loan.termMonths;
        
        return loan.amount * monthlyRate * Math.pow(1 + monthlyRate, numPayments) / 
               (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    getPropertyValue(property) {
        const district = this.marketConditions.districts[property.district];
        if (!district) return property.price;

        const baseValue = property.price;
        const districtMultiplier = district.popularity;
        const conditionMultiplier = property.condition / 100;
        const marketMultiplier = this.marketConditions.propertyMarket.priceMultiplier;

        return Math.round(baseValue * districtMultiplier * conditionMultiplier * marketMultiplier);
    }

    getMarketSummary() {
        return {
            demandLevel: this.marketConditions.propertyMarket.demandLevel,
            marketTrend: this.marketConditions.propertyMarket.trend,
            baseInterestRate: this.marketConditions.economy.interestRate,
            districtPerformance: Object.entries(this.marketConditions.districts)
                .map(([name, data]) => ({
                    name,
                    popularity: data.popularity,
                    growth: data.growth
                }))
        };
    }
}

export { EconomySystem };
