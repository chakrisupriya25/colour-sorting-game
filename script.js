class ColourSortingGame {
    constructor() {
        this.tubes = [];
        this.selectedTube = null;
        this.score = 0;
        this.moves = 0;
        this.level = 1;
        this.gameStatus = document.getElementById('gameStatus');
        this.difficulty = 'medium';
        this.colors = [];
        this.maxTubes = 6;
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.startNewGame();
    }

    attachEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.startNewGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('levelSelect').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.startNewGame();
        });
    }

    getDifficultySettings() {
        const settings = {
            easy: { tubes: 4, emptyTubes: 2, colorCount: 4 },
            medium: { tubes: 6, emptyTubes: 2, colorCount: 6 },
            hard: { tubes: 8, emptyTubes: 2, colorCount: 8 }
        };
        return settings[this.difficulty];
    }

    getColors() {
        const allColors = [
            '#FF6B6B', // Red
            '#4ECDC4', // Teal
            '#FFE66D', // Yellow
            '#95E1D3', // Mint
            '#F38181', // Pink
            '#AA96DA', // Purple
            '#FCBAD3', // Light Pink
            '#A8D8EA'  // Light Blue
        ];
        const settings = this.getDifficultySettings();
        return allColors.slice(0, settings.colorCount);
    }

    startNewGame() {
        const settings = this.getDifficultySettings();
        this.maxTubes = settings.tubes;
        this.colors = this.getColors();
        this.tubes = this.generateTubes(settings);
        this.selectedTube = null;
        this.moves = 0;
        this.updateStats();
        this.render();
        this.clearStatus();
    }

    generateTubes(settings) {
        const tubes = [];
        const colorCount = settings.colorCount;

        // Create tubes with 4 units of each color
        for (let i = 0; i < colorCount; i++) {
            const tube = {
                id: i,
                colors: [
                    this.colors[i],
                    this.colors[i],
                    this.colors[i],
                    this.colors[i]
                ]
            };
            tubes.push(tube);
        }

        // Shuffle the colors within tubes
        tubes.forEach(tube => {
            for (let i = tube.colors.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [tube.colors[i], tube.colors[j]] = [tube.colors[j], tube.colors[i]];
            }
        });

        // Add empty tubes
        for (let i = 0; i < settings.emptyTubes; i++) {
            tubes.push({ id: colorCount + i, colors: [] });
        }

        // Shuffle tube positions
        for (let i = tubes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tubes[i], tubes[j]] = [tubes[j], tubes[i]];
        }

        return tubes;
    }

    render() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';

        this.tubes.forEach((tube, index) => {
            const tubeElement = document.createElement('div');
            tubeElement.className = 'tube';
            if (this.selectedTube && this.selectedTube.id === tube.id) {
                tubeElement.classList.add('selected');
            }

            const liquidDiv = document.createElement('div');
            liquidDiv.className = 'liquid';

            // Create color blocks
            for (let i = 0; i < 4; i++) {
                const colorBlock = document.createElement('div');
                colorBlock.className = 'color-block';
                if (i < tube.colors.length) {
                    colorBlock.style.backgroundColor = tube.colors[i];
                } else {
                    colorBlock.style.backgroundColor = 'transparent';
                }
                liquidDiv.appendChild(colorBlock);
            }

            tubeElement.appendChild(liquidDiv);
            tubeElement.addEventListener('click', () => this.selectTube(tube));
            gameBoard.appendChild(tubeElement);
        });
    }

    selectTube(tube) {
        // If clicking the same tube, deselect
        if (this.selectedTube && this.selectedTube.id === tube.id) {
            this.selectedTube = null;
            this.render();
            return;
        }

        // If no tube is selected, select this one (if it has colors)
        if (!this.selectedTube) {
            if (tube.colors.length > 0) {
                this.selectedTube = tube;
                this.render();
            } else {
                this.setStatus('Select a tube with colors!', 'error');
            }
            return;
        }

        // Try to pour from selected tube to this tube
        if (this.canPour(this.selectedTube, tube)) {
            this.pourColor(this.selectedTube, tube);
            this.moves++;
            this.updateStats();
            this.selectedTube = null;
            this.render();

            // Check if game is won
            if (this.isGameWon()) {
                this.handleGameWon();
            }
        } else {
            this.setStatus('Cannot pour! Tube is full or colors don\'t match.', 'error');
        }
    }

    canPour(fromTube, toTube) {
        // Can't pour if source is empty
        if (fromTube.colors.length === 0) return false;

        // Can't pour if destination is full
        if (toTube.colors.length >= 4) return false;

        // If destination is empty, can pour
        if (toTube.colors.length === 0) return true;

        // Can only pour if top color matches
        const topSourceColor = fromTube.colors[fromTube.colors.length - 1];
        const topDestColor = toTube.colors[toTube.colors.length - 1];

        return topSourceColor === topDestColor;
    }

    pourColor(fromTube, toTube) {
        const topColor = fromTube.colors[fromTube.colors.length - 1];
        let colorsToPour = 1;

        // Count consecutive colors at the top that match
        for (let i = fromTube.colors.length - 2; i >= 0; i--) {
            if (fromTube.colors[i] === topColor && toTube.colors.length + colorsToPour < 4) {
                colorsToPour++;
            } else {
                break;
            }
        }

        // Pour the colors
        for (let i = 0; i < colorsToPour; i++) {
            toTube.colors.push(fromTube.colors.pop());
        }
    }

    isGameWon() {
        return this.tubes.every(tube => {
            // Each tube should be either empty or have 4 of the same color
            if (tube.colors.length === 0) return true;
            if (tube.colors.length !== 4) return false;
            const firstColor = tube.colors[0];
            return tube.colors.every(color => color === firstColor);
        });
    }

    handleGameWon() {
        this.score += 100 - (this.moves * 2);
        this.level++;
        this.updateStats();
        this.setStatus(`🎉 Level Complete! Score: ${this.score}`, 'success');
        
        setTimeout(() => {
            if (confirm('You won! Play next level?')) {
                this.startNewGame();
            }
        }, 1500);
    }

    updateStats() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
        document.getElementById('level').textContent = this.level;
    }

    setStatus(message, type = 'success') {
        this.gameStatus.textContent = message;
        this.gameStatus.className = `game-status ${type}`;
    }

    clearStatus() {
        this.gameStatus.textContent = '';
        this.gameStatus.className = 'game-status';
    }

    resetGame() {
        this.score = 0;
        this.level = 1;
        this.moves = 0;
        this.selectedTube = null;
        this.updateStats();
        this.startNewGame();
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new ColourSortingGame();
});