class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.achievements = new Map();
        this.unlockedAchievements = new Set();
        this.setupAchievements();
    }

    setupAchievements() {
        this.addAchievement('first_property', {
            name: 'Początkujący Inwestor',
            description: 'Kup swoją pierwszą nieruchomość',
            icon: '🏠',
            reward: 1000,
            maxProgress: 1
        });

        this.addAchievement('first_vehicle', {
            name: 'Mobilność',
            description: 'Kup swój pierwszy pojazd',
            icon: '🚗',
            reward: 500,
            maxProgress: 1
        });

        this.addAchievement('property_mogul', {
            name: 'Magnat Nieruchomości',
            description: 'Posiadaj 5 nieruchomości jednocześnie',
            icon: '👑',
            reward: 5000,
            maxProgress: 5
        });

        this.addAchievement('rich_investor', {
            name: 'Bogaty Inwestor',
            description: 'Osiągnij majątek 1,000,000 zł',
            icon: '💰',
            reward: 10000,
            maxProgress: 1000000
        });

        this.addAchievement('vehicle_collector', {
            name: 'Kolekcjoner Pojazdów',
            description: 'Posiadaj 3 różne pojazdy',
            icon: '🏎️',
            reward: 2000,
            maxProgress: 3
        });

        this.addAchievement('loan_master', {
            name: 'Mistrz Kredytów',
            description: 'Spłać pożyczkę przed terminem',
            icon: '🏦',
            reward: 1500,
            maxProgress: 1
        });

        this.addAchievement('rental_income', {
            name: 'Pasywny Dochód',
            description: 'Osiągnij miesięczny dochód 10,000 zł',
            icon: '💸',
            reward: 3000,
            maxProgress: 10000
        });

        this.addAchievement('time_survivor', {
            name: 'Długoterminowy Inwestor',
            description: 'Przetrwaj 12 miesięcy w grze',
            icon: '⏰',
            reward: 2500,
            maxProgress: 12
        });

        this.addAchievement('property_empire', {
            name: 'Imperium Nieruchomości',
            description: 'Posiadaj 10 nieruchomości',
            icon: '🏙️',
            reward: 15000,
            maxProgress: 10
        });

        this.addAchievement('millionaire', {
            name: 'Milioner',
            description: 'Posiadaj 1,000,000 zł gotówki',
            icon: '💎',
            reward: 25000,
            maxProgress: 1000000
        });
    }

    addAchievement(id, achievement) {
        this.achievements.set(id, {
            ...achievement,
            id,
            unlocked: false,
            progress: 0,
            maxProgress: achievement.maxProgress || 1
        });
    }

    unlockAchievement(id) {
        const achievement = this.achievements.get(id);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            achievement.progress = achievement.maxProgress;
            this.unlockedAchievements.add(id);
            
            // Przyznaj nagrodę
            this.game.gameState.player.money += achievement.reward;
            
            // Pokaż powiadomienie
            this.game.uiManager.showNotification(
                `🏆 Osiągnięcie odblokowane: ${achievement.name}\nNagroda: ${achievement.reward} zł`,
                'success'
            );

            // Aktualizuj UI
            this.game.uiManager.updateAchievementsList();
        }
    }

    updateProgress(id, progress) {
        const achievement = this.achievements.get(id);
        if (achievement && !achievement.unlocked) {
            achievement.progress = Math.min(progress, achievement.maxProgress);
            if (achievement.progress >= achievement.maxProgress) {
                this.unlockAchievement(id);
            }
            this.game.uiManager.updateAchievementsList();
        }
    }

    checkAchievements() {
        const { gameState } = this.game;
        
        // Sprawdź osiągnięcia związane z nieruchomościami
        this.updateProgress('first_property', gameState.properties.length > 0 ? 1 : 0);
        this.updateProgress('property_mogul', gameState.properties.length);
        this.updateProgress('property_empire', gameState.properties.length);

        // Sprawdź osiągnięcia związane z pojazdami
        this.updateProgress('first_vehicle', gameState.vehicles.length > 0 ? 1 : 0);
        this.updateProgress('vehicle_collector', gameState.vehicles.length);

        // Sprawdź osiągnięcia związane z majątkiem
        const totalWealth = gameState.player.money + 
            gameState.properties.reduce((sum, prop) => sum + prop.value, 0) +
            gameState.vehicles.reduce((sum, vehicle) => sum + vehicle.value, 0);
        
        this.updateProgress('rich_investor', totalWealth);
        this.updateProgress('millionaire', gameState.player.money);

        // Sprawdź osiągnięcia związane z dochodem
        const monthlyIncome = gameState.player.monthlyIncome;
        this.updateProgress('rental_income', monthlyIncome);

        // Sprawdź osiągnięcia związane z czasem gry
        const monthsPlayed = Math.floor((gameState.currentDate - gameState.startDate) / (30 * 24 * 60 * 60 * 1000));
        this.updateProgress('time_survivor', monthsPlayed);

        // Sprawdź osiągnięcie związane z pożyczkami
        const completedLoans = gameState.loans.filter(loan => 
            loan.remainingAmount === 0 && loan.endDate < loan.plannedEndDate
        ).length;
        this.updateProgress('loan_master', completedLoans);
    }

    getAchievementsList() {
        return Array.from(this.achievements.values());
    }

    getUnlockedCount() {
        return this.unlockedAchievements.size;
    }

    getTotalCount() {
        return this.achievements.size;
    }
}

export { AchievementSystem };
