document.addEventListener("DOMContentLoaded", () => {
  let playerCount = 2; // Start with 2 players
  let totalSum = 0;
  const playerContainer = document.getElementById("playerContainer");
  const addBtn = document.getElementById("addPlayerButton");
  const resetAllBtn = document.getElementById("resetAllBtn");
  const removeLastBtn = document.getElementById("removeLastBtn");
  const toggleThemeBtn = document.getElementById("toggleThemeBtn");
  const totalSumDisplay = document.getElementById("totalSum");

  // Track all player reset callbacks
  const playerResetters = [];

  // ===== Create a new player cell =====
  const createPlayerCell = (playerId) => {
    const cell = document.createElement("div");
    cell.classList.add("cell");

    cell.innerHTML = `
      <span contentEditable="true" class="playerName" spellcheck="false">Player ${playerId}</span>
      <div class="controls">
        <div class="pointInc">+</div>
        <div class="points">0</div>
        <div class="pointDec">−</div>
      </div>
    `;

    const pointInc = cell.querySelector(".pointInc");
    const pointDec = cell.querySelector(".pointDec");
    const pointsDisplay = cell.querySelector(".points");

    let playerPoint = 0;

    const updatePointsDisplay = () => {
      pointsDisplay.textContent = playerPoint;
      // Pop animation
      pointsDisplay.classList.remove("score-pop");
      // Force reflow to restart animation
      void pointsDisplay.offsetWidth;
      pointsDisplay.classList.add("score-pop");
    };

    pointInc.addEventListener("click", () => {
      playerPoint++;
      trackTotal(1);
      updatePointsDisplay();
    });

    pointDec.addEventListener("click", () => {
      playerPoint--;
      trackTotal(-1);
      updatePointsDisplay();
    });

    // Prevent Enter key from creating new lines in player name
    const nameSpan = cell.querySelector(".playerName");
    nameSpan.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        nameSpan.blur();
      }
    });

    // Select all text on focus for easy renaming
    nameSpan.addEventListener("focus", () => {
      const range = document.createRange();
      range.selectNodeContents(nameSpan);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    // Store resetter
    const resetter = () => {
      playerPoint = 0;
      pointsDisplay.textContent = "0";
    };
    playerResetters.push(resetter);

    return cell;
  };

  // ===== Track total score =====
  function trackTotal(n) {
    if (n > 0) {
      totalSum -= n;
    }
    if (n < 0) {
      totalSum -= n;
    }

    updateTotalDisplay();
  }

  function updateTotalDisplay() {
    const cells = document.getElementsByClassName("controls");

    if (totalSum === 0) {
      for (let i = 0; i < cells.length; i++) {
        cells[i].classList.remove("hotcell");
      }
      totalSumDisplay.textContent = "";
    } else {
      for (let i = 0; i < cells.length; i++) {
        cells[i].classList.add("hotcell");
      }
      totalSumDisplay.textContent = -1 * totalSum;
    }
  }

  // ===== Initialize players =====
  const initializePlayers = () => {
    for (let i = 1; i <= playerCount; i++) {
      const newPlayerCell = createPlayerCell(i);
      playerContainer.appendChild(newPlayerCell);
    }
  };

  initializePlayers();

  // ===== Add Player =====
  addBtn.addEventListener("click", () => {
    if (playerCount >= 4) {
      addBtn.classList.add("flash");
      addBtn.addEventListener(
        "animationend",
        function () {
          this.classList.remove("flash");
        },
        { once: true }
      );
      return;
    }
    playerCount++;
    const newPlayerCell = createPlayerCell(playerCount);
    playerContainer.appendChild(newPlayerCell);
  });

  // ===== Reset All Scores =====
  resetAllBtn.addEventListener("click", () => {
    totalSum = 0;
    playerResetters.forEach((reset) => reset());
    updateTotalDisplay();
  });

  // ===== Remove Last Player =====
  removeLastBtn.addEventListener("click", () => {
    if (playerCount <= 1) {
      removeLastBtn.classList.add("flash");
      removeLastBtn.addEventListener(
        "animationend",
        function () {
          this.classList.remove("flash");
        },
        { once: true }
      );
      return;
    }

    const lastCell = playerContainer.lastElementChild;
    if (lastCell) {
      // Get the last player's score to adjust total
      const lastScore = parseInt(lastCell.querySelector(".points").textContent) || 0;
      totalSum += lastScore; // reverse the total tracking

      lastCell.style.opacity = "0";
      lastCell.style.transform = "scale(0.8)";
      lastCell.style.transition = "all 200ms ease-out";
      setTimeout(() => {
        playerContainer.removeChild(lastCell);
        playerResetters.pop();
        playerCount--;
        updateTotalDisplay();
      }, 200);
    }
  });

  // ===== Toggle Theme (dark/light) =====
  let isDark = true;
  toggleThemeBtn.addEventListener("click", () => {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.style.setProperty("--bg-primary", "#090606");
      document.documentElement.style.setProperty("--bg-secondary", "#121111");
      document.documentElement.style.setProperty("--bg-hover", "#333");
      document.documentElement.style.setProperty("--text-primary", "#a7a7a7");
      document.documentElement.style.setProperty("--text-secondary", "#5e5b5b");
      document.documentElement.style.setProperty("--text-highlight", "#c6bfbf");
    } else {
      document.documentElement.style.setProperty("--bg-primary", "#e8e4e0");
      document.documentElement.style.setProperty("--bg-secondary", "#d4d0cc");
      document.documentElement.style.setProperty("--bg-hover", "#b0aca8");
      document.documentElement.style.setProperty("--text-primary", "#333");
      document.documentElement.style.setProperty("--text-secondary", "#555");
      document.documentElement.style.setProperty("--text-highlight", "#222");
    }
  });
});
