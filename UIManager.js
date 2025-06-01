class UIManager {
    constructor(gameState, game) {
        this.gameState = gameState;
        this.game = game;
        this.activeModals = new Set();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Przyciski menu głównego
        document.getElementById('propertiesBtn').addEventListener('click', () => this.showModal('propertiesModal'));
        document.getElementById('buildBtn').addEventListener('click', () => this.showModal('buildModal'));
        document.getElementById('bankBtn').addEventListener('click', () => this.showModal('bankModal'));
        document.getElementById('vehiclesBtn').addEventListener('click', () => this.showModal('vehiclesModal'));
        document.getElementById('achievementsBtn').addEventListener('click', () => {
            this.showModal('achievementsModal');
            this.updateAchievementsList();
        });

        // Przyciski zamykania modali
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Obsługa kliknięć poza modalem
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') {
                this.hideAllModals();
            }
        });

        // Zakładki w modalu nieruchomości
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchPropertiesTab(tab);
            });
        });

        // Obsługa pożyczek
        document.querySelectorAll('.loan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rate = parseFloat(e.target.dataset.rate);
                const amount = parseFloat(document.getElementById('loanAmount').value);
                const termMonths = parseInt(document.getElementById('loanTerm').value);
                this.handleLoanRequest(amount, rate, termMonths);
            });
        });

        // Aktualizacja szacowanej raty przy zmianie kwoty lub okresu
        const loanAmountInput = document.getElementById('loanAmount');
        const loanTermSelect = document.getElementById('loanTerm');
        
        if (loanAmountInput && loanTermSelect) {
            const updateEstimatedPayment = () => {
                const amount = parseFloat(loanAmountInput.value) || 0;
                const termMonths = parseInt(loanTermSelect.value);
                const rate = 3.5; // 3.5% rocznie
                
                if (amount > 0) {
                    const monthlyPayment = this.calculateMonthlyPayment(amount, rate, termMonths);
                    const estimatedPaymentElement = document.getElementById('estimatedPayment');
                    if (estimatedPaymentElement) {
                        estimatedPaymentElement.textContent = `Szacowana rata miesięczna: ${monthlyPayment.toLocaleString()} zł`;
                    }
                }
            };
            
            loanAmountInput.addEventListener('input', updateEstimatedPayment);
            loanTermSelect.addEventListener('change', updateEstimatedPayment);
            
            // Oblicz początkową ratę
            updateEstimatedPayment();
        }
    }

    update() {
        this.updateMoneyDisplay();
        this.updateDateDisplay();
        this.updatePropertyCounts();
        this.updateAchievementsCount();
        this.updateActiveModals();
    }

    updateMoneyDisplay() {
        const moneyDisplay = document.getElementById('playerMoney');
        const incomeDisplay = document.getElementById('monthlyIncome');
        
        if (moneyDisplay) {
            moneyDisplay.textContent = `${this.gameState.player.money.toLocaleString()} zł`;
        }
        
        if (incomeDisplay) {
            const income = this.gameState.player.monthlyIncome;
            const sign = income >= 0 ? '+' : '';
            incomeDisplay.textContent = `${sign}${income.toLocaleString()} zł/miesiąc`;
            incomeDisplay.style.color = income >= 0 ? '#4CAF50' : '#f44336';
        }
    }

    updateDateDisplay() {
        const dateDisplay = document.getElementById('gameDate');
        if (dateDisplay) {
            dateDisplay.textContent = this.gameState.getFormattedDate();
        }
    }

    updatePropertyCounts() {
        const propertiesCount = document.getElementById('propertiesCount');
        const vehiclesCount = document.getElementById('vehiclesCount');
        
        if (propertiesCount) {
            propertiesCount.textContent = this.gameState.properties.length;
        }
        
        if (vehiclesCount) {
            vehiclesCount.textContent = this.gameState.vehicles.length;
        }
    }

    updateAchievementsCount() {
        const achievementsCount = document.getElementById('achievementsCount');
        if (achievementsCount && this.game.achievementSystem) {
            const unlockedCount = this.game.achievementSystem.getUnlockedCount();
            const totalCount = this.game.achievementSystem.getTotalCount();
            achievementsCount.textContent = `${unlockedCount}/${totalCount}`;
        }
    }

    updateActiveModals() {
        this.activeModals.forEach(modalId => {
            switch (modalId) {
                case 'propertiesModal':
                    this.updatePropertiesList();
                    break;
                case 'bankModal':
                    this.updateBankInfo();
                    break;
                case 'buildModal':
                    this.updateBuildOptions();
                    break;
                case 'vehiclesModal':
                    this.updateVehiclesList();
                    break;
                case 'achievementsModal':
                    this.updateAchievementsList();
                    break;
            }
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('modalOverlay');
        
        if (modal && overlay) {
            overlay.style.display = 'block';
            modal.style.display = 'block';
            this.activeModals.add(modalId);
            this.updateActiveModals();
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            this.activeModals.delete(modalId);
            
            if (this.activeModals.size === 0) {
                document.getElementById('modalOverlay').style.display = 'none';
            }
        }
    }

    hideAllModals() {
        this.activeModals.forEach(modalId => this.hideModal(modalId));
        this.activeModals.clear();
        document.getElementById('modalOverlay').style.display = 'none';
    }

    updatePropertiesList() {
        const propertiesList = document.getElementById('propertiesList');
        if (!propertiesList) return;

        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        propertiesList.innerHTML = '';
        
        switch (activeTab) {
            case 'owned':
                // Lista posiadanych nieruchomości
                if (this.gameState.properties.length === 0) {
                    propertiesList.innerHTML = '<div class="empty-state">Nie posiadasz jeszcze żadnych nieruchomości</div>';
                    return;
                }
                this.gameState.properties.forEach(property => {
                    const propertyElement = this.createPropertyElement(property);
                    propertiesList.appendChild(propertyElement);
                });
                break;

            case 'market':
                // Lista dostępnych nieruchomości na rynku
                if (this.gameState.availableProperties.length === 0) {
                    propertiesList.innerHTML = '<div class="empty-state">Brak dostępnych nieruchomości na rynku</div>';
                    return;
                }
                this.gameState.availableProperties.forEach(property => {
                    const element = document.createElement('div');
                    element.className = 'property-item available';
                    element.innerHTML = `
                        <div class="property-header">
                            <h3>${property.name}</h3>
                            <span class="price">${property.price.toLocaleString()} zł</span>
                        </div>
                        <div class="property-details">
                            <p>Lokalizacja: ${property.district}</p>
                            <p>Stan: ${property.condition}%</p>
                            <p>Potencjalny czynsz: ${property.monthlyRent.toLocaleString()} zł/miesiąc</p>
                        </div>
                        <div class="property-actions">
                            <button class="action-btn buy-btn" onclick="game.buildingSystem.buyProperty('${property.id}')">
                                🏠 Kup nieruchomość
                            </button>
                        </div>
                    `;
                    propertiesList.appendChild(element);
                });
                break;

            case 'lots':
                // Lista dostępnych działek
                if (this.gameState.availableLots.length === 0) {
                    propertiesList.innerHTML = '<div class="empty-state">Brak dostępnych działek</div>';
                    return;
                }
                this.gameState.availableLots.forEach(lot => {
                    const element = document.createElement('div');
                    element.className = 'property-item lot';
                    element.innerHTML = `
                        <div class="property-header">
                            <h3>Działka ${lot.size}m²</h3>
                            <span class="price">${lot.totalPrice.toLocaleString()} zł</span>
                        </div>
                        <div class="property-details">
                            <p>Cena za m²: ${lot.pricePerSqm.toLocaleString()} zł</p>
                            <p>Strefa: ${lot.zoning === 'residential' ? 'Mieszkalna' : 'Komercyjna'}</p>
                            <p>Media: ${lot.hasUtilities ? 'Tak' : 'Nie'}</p>
                        </div>
                        <div class="property-actions">
                            <button class="action-btn buy-btn" onclick="game.buildingSystem.startConstruction('${lot.id}', 'house')">
                                🏗️ Rozpocznij budowę
                            </button>
                        </div>
                    `;
                    propertiesList.appendChild(element);
                });
                break;
        }
    }

    createPropertyElement(property) {
        const element = document.createElement('div');
        element.className = 'property-item';
        
        const rentStatus = property.isRented ? 
            `<span class="status rented">Wynajęte</span>` : 
            `<span class="status available">Dostępne</span>`;

        element.innerHTML = `
            <div class="property-header">
                <h3>${property.name}</h3>
                ${rentStatus}
            </div>
            <div class="property-details">
                <p>Stan: ${property.condition}%</p>
                <p>Czynsz: ${property.monthlyRent.toLocaleString()} zł/miesiąc</p>
                <p>Koszty: ${property.maintenanceCost.toLocaleString()} zł/miesiąc</p>
            </div>
            <div class="property-actions">
                <button class="action-btn" onclick="game.buildingSystem.renovateProperty('${property.id}')">
                    🔧 Remont
                </button>
                <button class="action-btn" onclick="game.uiManager.showPropertyDetails('${property.id}')">
                    📊 Szczegóły
                </button>
            </div>
        `;

        return element;
    }

    updateBankInfo() {
        const loansList = document.getElementById('loansList');
        if (!loansList) return;

        if (this.gameState.loans.length === 0) {
            loansList.innerHTML = '<p>Brak aktywnych pożyczek</p>';
            return;
        }

        loansList.innerHTML = this.gameState.loans.map(loan => {
            const monthlyPayment = loan.monthlyPayment || this.calculateMonthlyPayment(loan.amount, loan.interestRate, loan.termMonths);
            const progressPercent = (1 - loan.remainingAmount / loan.amount) * 100;
            const remainingMonths = Math.ceil(loan.remainingAmount / monthlyPayment);
            
            return `
                <div class="loan-item">
                    <div class="loan-header">
                        <h4>Pożyczka ${loan.amount.toLocaleString()} zł</h4>
                        <span class="loan-date">
                            ${new Date(loan.startDate).toLocaleDateString()}
                        </span>
                    </div>
                    <div class="loan-details">
                        <p>Pozostało: ${loan.remainingAmount.toLocaleString()} zł</p>
                        <p>Oprocentowanie: ${loan.interestRate}%</p>
                        <p>Rata miesięczna: ${monthlyPayment.toLocaleString()} zł</p>
                        <p>Pozostało miesięcy: ${remainingMonths}</p>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${progressPercent}%"></div>
                        </div>
                        <span class="progress-text">${progressPercent.toFixed(1)}% spłacone</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateBuildOptions() {
        const buildingOptions = document.getElementById('buildingOptions');
        if (!buildingOptions) return;

        const availableLots = this.gameState.availableLots;
        
        buildingOptions.innerHTML = availableLots.map(lot => `
            <div class="lot-option">
                <h4>Działka ${lot.size}m²</h4>
                <p>Cena: ${lot.totalPrice.toLocaleString()} zł</p>
                <p>Strefa: ${lot.zoning === 'residential' ? 'Mieszkalna' : 'Komercyjna'}</p>
                <p>Media: ${lot.hasUtilities ? 'Tak' : 'Nie'}</p>
                <button class="buy-btn" onclick="game.buildingSystem.startConstruction('${lot.id}', 'house')">
                    🏗️ Rozpocznij budowę
                </button>
            </div>
        `).join('');
    }

    showNotification(message, type = 'info') {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Dodaj ikonę w zależności od typu
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        notification.innerHTML = `<span class="notification-icon">${icon}</span> ${message}`;
        
        notifications.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateVehiclesList() {
        const vehiclesList = document.getElementById('vehiclesList');
        const vehicleShop = document.getElementById('vehicleShop');
        
        if (!vehiclesList || !vehicleShop) return;

        // Lista posiadanych pojazdów
        if (this.gameState.vehicles.length === 0) {
            vehiclesList.innerHTML = '<div class="empty-state">Nie posiadasz jeszcze żadnych pojazdów</div>';
        } else {
            vehiclesList.innerHTML = this.gameState.vehicles.map(vehicle => `
                <div class="vehicle-item ${vehicle.isActive ? 'active' : ''}">
                    <div class="vehicle-header">
                        <h3>${vehicle.name}</h3>
                        <span class="vehicle-status">${vehicle.isActive ? 'Aktywny' : 'Nieaktywny'}</span>
                    </div>
                    <div class="vehicle-details">
                        <p>Stan: ${vehicle.condition.toFixed(1)}%</p>
                        <p>Przebieg: ${vehicle.mileage.toFixed(0)} km</p>
                        <p>Prędkość: ${vehicle.speed} km/h</p>
                        <p>Koszty: ${vehicle.maintenanceCost} zł/miesiąc</p>
                    </div>
                    <div class="vehicle-actions">
                        ${!vehicle.isActive ? `<button class="action-btn" onclick="game.vehicleSystem.setActiveVehicle('${vehicle.id}')">🚗 Aktywuj</button>` : ''}
                        <button class="action-btn" onclick="game.vehicleSystem.repairVehicle('${vehicle.id}')">🔧 Napraw</button>
                        <button class="action-btn sell-btn" onclick="game.vehicleSystem.sellVehicle('${vehicle.id}')">💰 Sprzedaj</button>
                    </div>
                </div>
            `).join('');
        }

        // Sklep z pojazdami
        const availableVehicles = this.game.vehicleSystem.getAvailableVehicles();
        vehicleShop.innerHTML = availableVehicles.map(vehicle => `
            <div class="vehicle-shop-item ${vehicle.owned ? 'owned' : ''}">
                <div class="vehicle-header">
                    <h3>${vehicle.name}</h3>
                    <span class="price">${vehicle.price.toLocaleString()} zł</span>
                </div>
                <div class="vehicle-details">
                    <p>${vehicle.description}</p>
                    <p>Prędkość: ${vehicle.speed} km/h</p>
                    <p>Utrzymanie: ${vehicle.maintenanceCost} zł/miesiąc</p>
                </div>
                <div class="vehicle-actions">
                    ${!vehicle.owned ? 
                        `<button class="action-btn buy-btn" onclick="game.vehicleSystem.buyVehicle('${vehicle.type}')">🚗 Kup pojazd</button>` :
                        `<span class="owned-label">Posiadasz</span>`
                    }
                </div>
            </div>
        `).join('');
    }

    handleLoanRequest(amount, rate, termMonths) {
        try {
            if (amount < 10000 || amount > 500000) {
                throw new Error('Kwota pożyczki musi być między 10,000 zł a 500,000 zł');
            }

            const monthlyPayment = this.calculateMonthlyPayment(amount, rate, termMonths);
            const loan = this.game.economySystem.takeLoan(amount, rate, termMonths, monthlyPayment);
            
            this.showNotification(`Pożyczka ${amount.toLocaleString()} zł została przyznana! Rata miesięczna: ${monthlyPayment.toLocaleString()} zł`, 'success');
            this.updateBankInfo();
            this.updateMoneyDisplay();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    showPropertyDetails(propertyId) {
        const property = this.gameState.properties.find(p => p.id === propertyId);
        if (!property) return;

        // Tutaj można dodać szczegółowy widok nieruchomości
        this.showNotification('Funkcja w budowie', 'info');
    }

    switchPropertiesTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Aktualizacja zawartości w zależności od wybranej zakładki
        this.updatePropertiesList();
    }

    updateAchievementsList() {
        const achievementsContainer = document.getElementById('achievementsList');
        if (!achievementsContainer) return;

        const achievements = this.game.achievementSystem.getAchievementsList();
        const unlockedCount = this.game.achievementSystem.getUnlockedCount();
        const totalCount = this.game.achievementSystem.getTotalCount();

        // Aktualizuj licznik osiągnięć w menu
        const achievementsCount = document.getElementById('achievementsCount');
        if (achievementsCount) {
            achievementsCount.textContent = `${unlockedCount}/${totalCount}`;
        }

        // Wyświetl listę osiągnięć
        achievementsContainer.innerHTML = achievements.map(achievement => `
            <div class="achievement-item ${achievement.unlocked ? 'unlocked' : ''}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
                    ${achievement.unlocked ? 
                        `<span class="achievement-complete">✓ Ukończone</span>` :
                        `<div class="achievement-progress">
                            <div class="progress-bar">
                                <div class="progress" style="width: ${(achievement.progress / achievement.maxProgress) * 100}%"></div>
                            </div>
                            <span class="progress-text">${Math.floor((achievement.progress / achievement.maxProgress) * 100)}%</span>
                        </div>`
                    }
                </div>
                <div class="achievement-reward">
                    <span class="reward-amount">+${achievement.reward.toLocaleString()} zł</span>
                </div>
            </div>
        `).join('');
    }

    showAchievementsModal() {
        this.showModal('achievementsModal');
        this.updateAchievementsList();
    }

    calculateMonthlyPayment(amount, yearlyRate, termMonths) {
        const monthlyRate = yearlyRate / 100 / 12;
        if (monthlyRate === 0) {
            return amount / termMonths;
        }
        return Math.round(amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
               (Math.pow(1 + monthlyRate, termMonths) - 1));
    }
}

export { UIManager };
