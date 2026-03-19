# Value Iteration Visualizer (5x5 Grid World)

This interactive web application demonstrates the **Value Iteration** algorithm, a fundamental Dynamic Programming method in Reinforcement Learning (RL). Users can observe how an agent learns to navigate a grid while avoiding obstacles and seeking the optimal path to the goal.

Live Demo: https://bytseng.dpdns.org/RL_DIC2/

This project follows the **CRISP-DM (Cross-Industry Standard Process for Data Mining)** framework:

---

## 1. Business Understanding
*   **Objective**: To provide an educational tool that demystifies the convergence process of Reinforcement Learning algorithms.
*   **Goal**: Visualize the transition from a **Random Policy** to an **Optimal Policy** by iteratively updating state values $V(s)$.
*   **Success Criteria**: The agent successfully converges to a consistent value map and finds the shortest path from (0,0) to (4,4), bypassing all blocks.

## 2. Data Understanding
*   **Environment**: A 5x5 grid representing the state space $S$.
*   **States**:
    *   **Start**: (0,0) - The initial position of the agent.
    *   **Goal**: (4,4) - Terminating state with a high positive reward ($R = +10$).
    *   **Obstacles (Blocks)**: (1,1), (2,2), (3,3) - Non-traversable states.
    *   **Transitions**: Deterministic movement (Up, Down, Left, Right). If an agent hits a wall or an obstacle, it remains in its current state.

## 3. Data Preparation
*   **Initialization**: 
    *   All state values $V(s)$ are initialized to 0.
    *   Initial policy $\pi(s)$ is assigned randomly across the 4 possible actions.
*   **Reward Function**: 
    *   Moving to the Goal: $+10$
    *   Any other move (Step Cost): $-1$ to encourage the shortest path.
*   **Hyperparameters**: Default Discount Factor ($\gamma$) = 0.9.

## 4. Modeling (Value Iteration)
Value Iteration computes the optimal state-value function by iteratively improving an estimate of $V(s)$.

### The Bellman Optimality Equation:
$$V_{k+1}(s) = \max_{a \in A} \sum_{s', r} p(s', r | s, a) [r + \gamma V_k(s')]$$

### Policy Derivation:
Once the value function $V(s)$ has converged (or during each step), the **Optimal Policy** $\pi^*(s)$ is extracted by choosing the action that maximizes the expected return:
$$\pi^*(s) = \arg\max_{a \in A} \sum_{s', r} p(s', r | s, a) [r + \gamma V^*(s')]$$

In this visualizer, this is represented by the **arrows** in each cell, which automatically point toward the neighboring state with the highest value.

## 5. Evaluation & Visualization
*   **Convergence**: The algorithm stops when the maximum change in value across all states ($\Delta$) is less than $0.0001$.
*   **Pathfinding Algorithm**: 
    *   After convergence, a "Show Path" feature is available.
    *   The path is generated using a **Greedy approach** based on the derived policy $\pi^*(s)$.
    *   Starting from (0,0), the agent follows the arrows step-by-step until it reaches (4,4).
    *   If a path is successfully found, the trail is highlighted in green.

## 6. Deployment
*   **Architecture**: Client-side execution using HTML5, CSS3, and Vanilla JavaScript.
*   **Web Server**: Compatible with Nginx, Apache, or simple Python HTTP servers.
*   **Responsiveness**: Designed with a mobile-friendly 5x5 grid layout and smooth CSS animations for state updates.

---

## How to Run
1.  Open `index.html` in any modern web browser.
2.  **Step 1**: Click **Random Policy** to see the initial chaotic state.
3.  **Step 2**: Click **Step VI** to watch values propagate from the goal outwards, or click **Run to Convergence** for automated iteration.
4.  **Step 3**: Once converged, click **Show Path** to visualize the optimal trajectory.

## Technical Notes
*   **Arrow Logic**: The arrows represent the action $a$ that leads to the state $s'$ with the highest $V_{k}(s')$.
*   **Flash Animation**: Cells highlight briefly when their value changes significantly, making the "Bellman backup" process visible.
*   **Edge Cases**: The agent is programmed to "bounce" off boundaries and obstacles, receiving the step penalty without changing position.
