 const API_URL = "https://detective-game-backend-hrtl.onrender.com";

let currentCase = null;
let selectedSuspect = "";

let score = Number(localStorage.getItem("detectiveScore")) || 0;
let solvedCases = Number(localStorage.getItem("solvedCases")) || 0;
let attemptedCases = Number(localStorage.getItem("attemptedCases")) || 0;

let completedCaseIds = JSON.parse(
    localStorage.getItem("completedCaseIds") || "[]"
).map(Number);

let closedCaseIds = JSON.parse(
    localStorage.getItem("closedCaseIds") || "[]"
).map(Number);

let achievements = JSON.parse(
    localStorage.getItem("achievements") || "[]"
);

function getRank() {
    if (score >= 300) {
        return "Master Detective";
    } else if (score >= 200) {
        return "Senior Detective";
    } else if (score >= 100) {
        return "Junior Detective";
    } else {
        return "Rookie Detective";
    }
}

function updateRank() {
    const rankElement = document.getElementById("rank");

    if (rankElement) {
        rankElement.textContent = getRank();
    }
}

function updateScoreboard() {
    const scoreElement = document.getElementById("score");
    const solvedElement = document.getElementById("solved-cases");
    const attemptedElement = document.getElementById("attempted-cases");

    if (scoreElement) {
        scoreElement.textContent = score;
    }

    if (solvedElement) {
        solvedElement.textContent = solvedCases;
    }

    if (attemptedElement) {
        attemptedElement.textContent = attemptedCases;
    }

    updateRank();

    localStorage.setItem("detectiveScore", score);
    localStorage.setItem("solvedCases", solvedCases);
    localStorage.setItem("attemptedCases", attemptedCases);
}

const achievementDetails = {
    first_investigation: {
        title: "First Investigation",
        icon: "🔎",
        description: "Make your first accusation."
    },

    sharp_mind: {
        title: "Sharp Mind",
        icon: "🧠",
        description: "Solve your first case correctly."
    },

    master_detective: {
        title: "Master Detective",
        icon: "🏆",
        description: "Solve all three cases correctly."
    },

    perfect_investigator: {
        title: "Perfect Investigator",
        icon: "🌟",
        description: "Solve all three cases without a wrong answer."
    }
};

function unlockAchievement(achievementId) {
    if (achievements.includes(achievementId)) {
        return;
    }

    achievements.push(achievementId);

    localStorage.setItem(
        "achievements",
        JSON.stringify(achievements)
    );

    displayAchievements();

    const achievement = achievementDetails[achievementId];

    if (achievement) {
        alert(
            "🏆 Achievement Unlocked!\n\n" +
            achievement.icon + " " + achievement.title +
            "\n" + achievement.description
        );
    }
}

function displayAchievements() {
    const container = document.getElementById(
        "achievements-container"
    );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    Object.keys(achievementDetails).forEach(function (id) {
        const achievement = achievementDetails[id];
        const unlocked = achievements.includes(id);

        const card = document.createElement("div");

        card.className = unlocked
            ? "achievement-card"
            : "achievement-card locked";

        card.innerHTML = `
            <div style="font-size: 30px;">
                ${unlocked ? achievement.icon : "🔒"}
            </div>
            <h3>${achievement.title}</h3>
            <p>${achievement.description}</p>
            <strong>${unlocked ? "UNLOCKED" : "LOCKED"}</strong>
        `;

        container.appendChild(card);
    });
}
async function loadCases() {
    const container = document.getElementById("cases-container");

    if (!container) {
        return;
    }

    container.innerHTML = "<p>Loading cases...</p>";

    try {
        const response = await fetch(API_URL + "/api/cases");

        if (!response.ok) {
            throw new Error("Failed to load cases");
        }

        const cases = await response.json();

        container.innerHTML = "";

        if (cases.length === 0) {
            container.innerHTML = "<p>No cases available.</p>";
            return;
        }

        cases.forEach(function (caseItem) {
            const card = document.createElement("div");
            card.className = "case-card";

            const isCompleted = completedCaseIds.includes(Number(caseItem.id));
            const isClosed = closedCaseIds.includes(Number(caseItem.id));

            let status = "";

            if (isCompleted) {
                status = "<span class='solved-badge'>Solved ✓</span>";
            } else if (isClosed) {
                status = "<span class='solved-badge'>Closed</span>";
            }

            card.innerHTML = `
                <h3>${caseItem.title}</h3>
                <p>${caseItem.story}</p>
                ${status}
                <button class="open-case-button">
                    ${isCompleted ? "Solved" : isClosed ? "Closed" : "Investigate"}
                </button>
            `;

            const button = card.querySelector("button");

            if (isCompleted || isClosed) {
                button.disabled = true;
            } else {
                button.addEventListener("click", function () {
                    openCase(caseItem.id);
                });
            }

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading cases:", error);
        container.innerHTML = "<p>Unable to load cases. Please try again.</p>";
    }
}
async function openCase(caseId) {
    if (
        completedCaseIds.includes(Number(caseId)) ||
        closedCaseIds.includes(Number(caseId))
    ) {
        alert("You have already finished this case!");
        return;
    }

    try {
        const response = await fetch(API_URL + "/api/cases/" + caseId);

        if (!response.ok) {
            throw new Error("Failed to load case");
        }

        currentCase = await response.json();
        selectedSuspect = "";

        document.getElementById("case-menu").style.display = "none";
        document.getElementById("game-screen").style.display = "block";

        document.getElementById("case-title").textContent = currentCase.title;
        document.getElementById("case-story").textContent = currentCase.story;
        document.getElementById("result").innerHTML = "";

        displaySuspects();
        await loadClues(caseId);
    } catch (error) {
        console.error("Error opening case:", error);
        alert("Unable to open this case. Please try again.");
    }
}

function displaySuspects() {
    const container = document.getElementById("suspects-container");

    if (!container || !currentCase) {
        return;
    }

    container.innerHTML = "";

    const suspects = [
        currentCase.suspect1,
        currentCase.suspect2,
        currentCase.suspect3,
        currentCase.suspect4
    ];

    suspects.forEach(function (suspect) {
        if (!suspect) {
            return;
        }

        const label = document.createElement("label");
        label.className = "suspect-option";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "suspect";
        radio.value = suspect;

        radio.addEventListener("change", function () {
            selectedSuspect = suspect;
        });

        label.appendChild(radio);
        label.appendChild(document.createTextNode(" " + suspect));

        container.appendChild(label);
    });
}
function displaySuspects() {
    const container = document.getElementById("suspects-container");

    if (!container) {
        console.error("Suspects container not found!");
        return;
    }

    if (!currentCase) {
        console.error("No case selected!");
        return;
    }

    container.innerHTML = "";

    const suspects = [
        currentCase.suspect1,
        currentCase.suspect2,
        currentCase.suspect3,
        currentCase.suspect4
    ];

    suspects.forEach(function (suspect) {
        if (!suspect) {
            return;
        }

        const label = document.createElement("label");
        label.className = "suspect-option";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "suspect";
        radio.value = suspect;

        radio.addEventListener("change", function () {
            selectedSuspect = suspect;
        });

        const name = document.createElement("span");
        name.textContent = suspect;

        label.appendChild(radio);
        label.appendChild(name);

        container.appendChild(label);
    });

    console.log("Suspects displayed:", suspects);
}
async function loadClues(caseId) {
    const container = document.getElementById("clues-container");

    if (!container) {
        return;
    }

    container.innerHTML = "<p>Loading clues...</p>";

    try {
        const response = await fetch(API_URL + "/api/cases/" + caseId + "/clues");

        if (!response.ok) {
            throw new Error("Failed to load clues");
        }

        const clues = await response.json();

        container.innerHTML = "";

        if (clues.length === 0) {
            container.innerHTML = "<p>No clues available.</p>";
            return;
        }

        clues.forEach(function (clue, index) {
            const clueElement = document.createElement("div");
            clueElement.className = "clue-card";

            const heading = document.createElement("h4");
            heading.textContent = "🔎 Clue " + (index + 1);

            const description = document.createElement("p");
            description.textContent = clue.description;

            clueElement.appendChild(heading);
            clueElement.appendChild(description);

            container.appendChild(clueElement);
        });
    } catch (error) {
        console.error("Error loading clues:", error);
        container.innerHTML = "<p>Unable to load clues. Please try again.</p>";
    }
}

function showResult(message, isCorrect) {
    const resultElement = document.getElementById("result");

    if (!resultElement) {
        return;
    }

    resultElement.textContent = message;
    resultElement.className = isCorrect ? "correct-result" : "wrong-result";
}

function saveProgress() {
    localStorage.setItem("detectiveScore", score);
    localStorage.setItem("solvedCases", solvedCases);
    localStorage.setItem("attemptedCases", attemptedCases);

    localStorage.setItem(
        "completedCaseIds",
        JSON.stringify(completedCaseIds)
    );

    localStorage.setItem(
        "closedCaseIds",
        JSON.stringify(closedCaseIds)
    );

    localStorage.setItem(
        "achievements",
        JSON.stringify(achievements)
    );
}

function submitAnswer() {
    if (!currentCase) {
        alert("Please open a case first!");
        return;
    }

    const caseId = Number(currentCase.id);

    if (
        completedCaseIds.includes(caseId) ||
        closedCaseIds.includes(caseId)
    ) {
        alert("You have already submitted an accusation for this case!");
        return;
    }

    if (!selectedSuspect) {
        alert("Please select a suspect before submitting!");
        return;
    }

    attemptedCases++;

    if (attemptedCases === 1) {
        unlockAchievement("first_investigation");
    }

    closedCaseIds.push(caseId);

    const correctAnswer = String(
        currentCase.correctAnswer || ""
    ).trim().toLowerCase();

    const chosenAnswer = String(
        selectedSuspect
    ).trim().toLowerCase();

    if (chosenAnswer === correctAnswer) {
        score += 100;
        solvedCases++;

        if (!completedCaseIds.includes(caseId)) {
            completedCaseIds.push(caseId);
        }

        showResult(
            "🎉 Correct! You solved the case and earned 100 points!",
            true
        );

        if (solvedCases === 1) {
            unlockAchievement("sharp_mind");
        }

        if (completedCaseIds.length >= 3) {
            unlockAchievement("master_detective");

            if (attemptedCases === 3 && score === 300) {
                unlockAchievement("perfect_investigator");
            }
        }
    } else {
        score -= 25;

        showResult(
            "❌ Wrong accusation! You lost 25 points. The case is now closed.",
            false
        );
    }

    saveProgress();
    updateScoreboard();
    displayAchievements();
    loadCases();
}
function backToCases() {
    currentCase = null;
    selectedSuspect = "";

    const gameScreen = document.getElementById("game-screen");
    const caseMenu = document.getElementById("case-list");

    if (gameScreen) {
        gameScreen.style.display = "none";
    }

    if (caseMenu) {
        caseMenu.style.display = "grid";
    }

    loadCases();
}

function resetGame() {
    const confirmed = confirm(
        "Are you sure you want to reset all your detective progress?"
    );

    if (!confirmed) {
        return;
    }

    score = 0;
    solvedCases = 0;
    attemptedCases = 0;

    completedCaseIds = [];
    closedCaseIds = [];
    achievements = [];

    localStorage.removeItem("detectiveScore");
    localStorage.removeItem("solvedCases");
    localStorage.removeItem("attemptedCases");
    localStorage.removeItem("completedCaseIds");
    localStorage.removeItem("closedCaseIds");
    localStorage.removeItem("achievements");

    currentCase = null;
    selectedSuspect = "";

    const gameScreen = document.getElementById("game-screen");
    const caseMenu = document.getElementById("case-list");
    const resultElement = document.getElementById("result");
    const cluesElement = document.getElementById("clues");
    const suspectsElement = document.getElementById("suspects");

    if (gameScreen) {
        gameScreen.style.display = "none";
    }

    if (caseMenu) {
        caseMenu.style.display = "grid";
    }

    if (resultElement) {
        resultElement.innerHTML = "";
    }

    if (cluesElement) {
        cluesElement.innerHTML = "";
    }

    if (suspectsElement) {
        suspectsElement.innerHTML = "";
    }

    updateScoreboard();
    displayAchievements();
    loadCases();

    alert("Your detective progress has been reset!");
}

function showReport() {
    const reportSection = document.getElementById("final-report");

    if (!reportSection) {
        return;
    }

    document.getElementById("final-score").textContent = score;
    document.getElementById("final-solved").textContent = solvedCases;
    document.getElementById("final-attempted").textContent = attemptedCases;
    document.getElementById("final-rank").textContent = getRank();

    reportSection.style.display = "block";

    reportSection.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function closeReport() {
    const reportSection = document.getElementById("final-report");

    if (reportSection) {
        reportSection.style.display = "none";
    }
}


function setupEventListeners() {
    const resetButton = document.getElementById("reset-button");
    const submitButton = document.getElementById("submit-answer");
    const backButton = document.getElementById("back-to-cases");
    const reportButton = document.getElementById("show-report");
    const closeReportButton = document.getElementById("close-report");

    if (resetButton) {
        resetButton.addEventListener("click", resetGame);
    }

    if (submitButton) {
        submitButton.addEventListener("click", submitAnswer);
    }

    if (backButton) {
        backButton.addEventListener("click", backToCases);
    }

    if (reportButton) {
        reportButton.addEventListener("click", showReport);
    }

    if (closeReportButton) {
        closeReportButton.addEventListener("click", closeReport);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    setupEventListeners();
    updateScoreboard();
    displayAchievements();
    loadCases();
});
function backToCases() {
    currentCase = null;
    selectedSuspect = "";

    document.getElementById("game-screen").style.display = "none";
    document.getElementById("case-menu").style.display = "block";

    loadCases();
}

document.addEventListener("DOMContentLoaded", function () {
    updateScoreboard();
    displayAchievements();
    loadCases();
});
