const GRID_SIZE = 5;
const START = { r: 0, c: 0 };
const END = { r: 4, c: 4 };
const BLOCKS = [
    { r: 1, c: 1 },
    { r: 2, c: 2 },
    { r: 3, c: 3 }
];

// Actions: 0: UP, 1: RIGHT, 2: DOWN, 3: LEFT
const dx = [-1, 0, 1, 0];
const dy = [0, 1, 0, -1];
const ARROW_CLASSES = ['fa-arrow-up', 'fa-arrow-right', 'fa-arrow-down', 'fa-arrow-left'];
const ARROW_POS = ['arrow-up', 'arrow-right', 'arrow-down', 'arrow-left'];

let V = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
let Policy = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
let iterationCount = 0;
let isAnimating = false;
let animationInterval = null;

const gridElement = document.getElementById('grid');
const statusText = document.getElementById('status-text');

function initGridDOM() {
    gridElement.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${r}-${c}`;

            if (isStart(r, c)) cell.classList.add('start');
            if (isEnd(r, c)) cell.classList.add('end');
            if (isBlock(r, c)) cell.classList.add('blocked');

            gridElement.appendChild(cell);
        }
    }
}

function isStart(r, c) { return r === START.r && c === START.c; }
function isEnd(r, c) { return r === END.r && c === END.c; }
function isBlock(r, c) {
    return BLOCKS.some(b => b.r === r && b.c === c);
}

function setActiveStep(step) {
    document.querySelectorAll('.step-card').forEach(c => c.classList.remove('active'));
    if (step) document.getElementById(`step${step}-card`).classList.add('active');
}

function initRandomPolicy() {
    stopAnimation();
    iterationCount = 0;
    V = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (isBlock(r, c) || isEnd(r, c)) continue;
            // Generate random action 0-3
            Policy[r][c] = Math.floor(Math.random() * 4);
        }
    }

    updateGridDOM('隨機政策已初始化。請使用單步或自動收斂進行價值迭代。');
    clearPath();

    document.getElementById('btn-step').disabled = false;
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-path').disabled = true;
    setActiveStep(2);
}

function updateGridDOM(message = '') {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.getElementById(`cell-${r}-${c}`);
            cell.innerHTML = ''; // clear cell content

            if (isStart(r, c)) cell.innerHTML += `<div style="font-size:0.6rem; position:absolute; top:2px; left:2px;">START</div>`;
            if (isEnd(r, c)) cell.innerHTML += `<div style="font-weight:bold;">END</div>`;

            if (!isBlock(r, c) && !isEnd(r, c)) {
                // Determine Value
                const val = V[r][c].toFixed(2);
                cell.innerHTML += `<div class="value">${val}</div>`;

                // Determine Arrow
                const action = Policy[r][c];
                const iconClass = ARROW_CLASSES[action];
                const posClass = ARROW_POS[action];
                cell.innerHTML += `<i class="fa-solid ${iconClass} arrow ${posClass}"></i>`;
            }
            // Trigger animation
            cell.classList.remove('updated');
            void cell.offsetWidth; // trigger reflow
            if (!isBlock(r, c)) cell.classList.add('updated');
        }
    }
    statusText.textContent = `Iteration: ${iterationCount}. ${message}`;
}

function stepVI() {
    clearPath();
    const gamma = parseFloat(document.getElementById('input-gamma').value) || 0.9;
    const stepReward = parseFloat(document.getElementById('input-reward').value) || -1.0;
    const endReward = 10.0;

    let newV = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    let maxDelta = 0;

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (isBlock(r, c) || isEnd(r, c)) {
                newV[r][c] = V[r][c]; // End stays 0, block stays 0
                continue;
            }

            let bestVal = -Infinity;
            let bestAction = 0;

            // Check all 4 actions
            for (let a = 0; a < 4; a++) {
                let nr = r + dx[a];
                let nc = c + dy[a];

                // If hits wall or block, bounce back
                if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE || isBlock(nr, nc)) {
                    nr = r;
                    nc = c;
                }

                let rwd = stepReward;
                if (isEnd(nr, nc)) {
                    rwd = endReward;
                }

                let q = rwd + gamma * V[nr][nc];

                // Small tie-breaker logic to prefer UP/LEFT over bouncing back or weird circles,
                // but standard max logic usually handles it
                if (q > bestVal) {
                    bestVal = q;
                    bestAction = a;
                } else if (q === bestVal) {
                    // Tie breaking, purely aesthetic (prefer not bouncing on wall)
                    if (!(nr === r && nc === c) && a < bestAction) {
                        bestAction = a;
                    }
                }
            }

            newV[r][c] = bestVal;
            Policy[r][c] = bestAction;

            maxDelta = Math.max(maxDelta, Math.abs(newV[r][c] - V[r][c]));
        }
    }

    V = newV;
    iterationCount++;
    return maxDelta;
}

function checkConvergence(delta) {
    if (delta <= 0.0001) {
        stopAnimation();
        updateGridDOM(`已收斂!! (Converged at iteration ${iterationCount})`);
        document.getElementById('btn-step').disabled = true;
        document.getElementById('btn-run').disabled = true;
        document.getElementById('btn-path').disabled = false;
        setActiveStep(3);
        return true;
    }
    return false;
}

function doSingleStep() {
    if (isAnimating) stopAnimation();
    let delta = stepVI();
    updateGridDOM(`單步完成 (Delta: ${delta.toFixed(4)})`);
    checkConvergence(delta);
    return delta;
}

function runToConvergence() {
    if (isAnimating) return;
    clearPath();

    isAnimating = true;
    document.getElementById('btn-step').disabled = true;
    document.getElementById('btn-run').disabled = true;

    animationInterval = setInterval(() => {
        let delta = stepVI();
        updateGridDOM(`運算中... (Delta: ${delta.toFixed(4)})`);
        checkConvergence(delta);
    }, 150); // fast animation
}

function stopAnimation() {
    if (animationInterval) clearInterval(animationInterval);
    isAnimating = false;
}

function showPath() {
    stopAnimation();
    clearPath();

    let curr = { r: START.r, c: START.c };
    let pathLength = 0;

    // Safety check max 25 steps
    while (!isEnd(curr.r, curr.c) && pathLength < 25) {
        document.getElementById(`cell-${curr.r}-${curr.c}`).classList.add('path');

        let action = Policy[curr.r][curr.c];
        let nr = curr.r + dx[action];
        let nc = curr.c + dy[action];

        if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE || isBlock(nr, nc)) {
            statusText.textContent = `路徑卡住了！當前政策無法到達終點。 (Path blocked)`;
            return;
        }

        curr = { r: nr, c: nc };
        pathLength++;
    }

    if (isEnd(curr.r, curr.c)) {
        document.getElementById(`cell-${curr.r}-${curr.c}`).classList.add('path');
        statusText.textContent += ` - 找到最佳路徑！ (Found optimal path in ${pathLength} steps)`;
    } else {
        statusText.textContent += ` - 未能抵達終點。可能有無限迴圈 (Cycle detected)`;
    }
}

function clearPath() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(c => c.classList.remove('path'));
}

// Event Listeners
document.getElementById('btn-init').addEventListener('click', initRandomPolicy);
document.getElementById('btn-step').addEventListener('click', doSingleStep);
document.getElementById('btn-run').addEventListener('click', runToConvergence);
document.getElementById('btn-path').addEventListener('click', showPath);
document.getElementById('btn-reset').addEventListener('click', () => {
    stopAnimation();
    initGridDOM();
    initRandomPolicy();
});

// Initial Setup
initGridDOM();
initRandomPolicy();
