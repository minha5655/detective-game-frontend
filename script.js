// ==========================================
// CASE FILES - MYSTERY DETECTIVE GAME
// ==========================================

// Backend API URL
const API_URL = "https://detective-game-backend-hrtl.onrender.com/api/cases";

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


// ==========================================
// RANK SYSTEM
// ==========================================

function getRank() {
    if (score >= 300) {
        return "Master Detective";
    } else if (score >= 200) {
        return "Senior Detective";
    } else if (score >= 100) {
        return "Junior Detective";
    }

    return "Rookie Detective";
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
    saveProgress();
}


// ==========================================
// ACHIEVEMENTS
// ==========================================

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

        const icon = document.createElement("div");
        icon.style.fontSize = "30px";
        icon.textContent = unlocked ? achievement.icon : "🔒";

        const title = document.createElement("h3");
        title.textContent = achievement.title;

        const description = document.createElement("p");
        description.textContent = achievement.description;

        const status = document.createElement("strong");
        status.textContent = unlocked ? "UNLOCKED" : "LOCKED";

        card.appendChild(icon);
        card.appendChild(title);
        card.appendChild(description);
        card.appendChild(status);

        container.appendChild(card);
    });
}


// ==========================================
// LOAD ALL CASES
// ==========================================

async function loadCases() {
    const container = document.getElementById("cases-container");

    if (!container) {
        console.error("Cases container not found!");
        return;
    }

    container.innerHTML = "<p>Loading cases...</p>";

    try {
        // FIXED: Connect to the hosted backend
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(
                "Failed to load cases. HTTP status: " + response.status
            );
        }

        const cases = await response.json();

        container.innerHTML = "";

        if (!Array.isArray(cases) || cases.length === 0) {
            container.innerHTML = `
                <p>No cases available yet. Please try again later.</p>
            `;

            console.warn(
                "The backend returned no cases. Check the database."
            );

            return;
        }

        cases.forEach(function (caseItem) {
            const card = document.createElement("div");
            card.className = "case-card";

            const caseId = Number(caseItem.id);

            const isCompleted = completedCaseIds.includes(caseId);
            const isClosed = closedCaseIds.includes(caseId);

            const title = document.createElement("h3");
            title.textContent = caseItem.title || "Untitled Case";

            const story = document.createElement("p");
            story.textContent = caseItem.story || "No story available.";

            card.appendChild(title);
            card.appendChild(story);

            if (isCompleted) {
                const badge = document.createElement("span");
                badge.className = "solved-badge";
                badge.textContent = "Solved ✓";
                card.appendChild(badge);
            } else if (isClosed) {
                const badge = document.createElement("span");
                badge.className = "solved-badge";
                badge.textContent = "Closed";
                card.appendChild(badge);
            }

            const button = document.createElement("button");
            button.className = "open-case-button";

            button.textContent = isCompleted
                ? "Solved"
                : isClosed
                    ? "Closed"
                    : "Investigate";

            if (isCompleted || isClosed) {
                button.disabled = true;
            } else {
                button.addEventListener("click", function () {
                    openCase(caseItem.id);
                });
            }

            card.appendChild(button);
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading cases:", error);

        container.innerHTML = `
            <p>Unable to load cases. Please try again.</p>
        `;
    }
}


// ==========================================
// OPEN A CASE
// ==========================================

async function openCase(caseId) {
    const numericCaseId = Number(caseId);

    if (
        completedCaseIds.includes(numericCaseId) ||
        closedCaseIds.includes(numericCaseId)
    ) {
        alert("You have already finished this case!");
        return;
    }

    try {
        // FIXED: Use the hosted backend URL
        const response = await fetch(
            API_URL + "/" + encodeURIComponent(caseId)
        );

        if (!response.ok) {
            throw new Error(
                "Failed to load case. HTTP status: " + response.status
            );
        }

        currentCase = await response.json();
        selectedSuspect = "";

        const caseMenu = document.getElementById("case-menu");
        const gameScreen = document.getElementById("game-screen");

        if (caseMenu) {
            caseMenu.style.display = "none";
        }

        if (gameScreen) {
            gameScreen.style.display = "block";
        }

        const titleElement = document.getElementById("case-title");
        const storyElement = document.getElementById("case-story");
        const resultElement = document.getElementById("result");

        if (titleElement) {
            titleElement.textContent = currentCase.title || "Untitled Case";
        }

        if (storyElement) {
            storyElement.textContent = currentCase.story || "";
        }

        if (resultElement) {
            resultElement.innerHTML = "";
            resultElement.className = "";
        }

        displaySuspects();

        await loadClues(caseId);

    } catch (error) {
        console.error("Error opening case:", error);

        alert("Unable to open this case. Please try again.");
    }
}


// ==========================================
// DISPLAY SUSPECTS
// ==========================================

function displaySuspects() {
    const container = document.getElementById("suspects-container");

    if (!container || !currentCase) {
        console.error("Suspects container or current case not found!");
        return;
    }

    container.innerHTML = "";
    selectedSuspect = "";

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


// ==========================================
// LOAD CLUES
// ==========================================

async function loadClues(caseId) {
    const container = document.getElementById("clues-container");

    if (!container) {
        console.error("Clues container not found!");
        return;
    }

    container.innerHTML = "<p>Loading clues...</p>";

    try {
        // FIXED: Use the hosted backend URL
        const response = await fetch(
            API_URL + "/" + encodeURIComponent(caseId) + "/clues"
        );

        if (!response.ok) {
            throw new Error(
                "Failed to load clues. HTTP status: " + response.status
            );
        }

        const clues = await response.json();

        container.innerHTML = "";

        if (!Array.isArray(clues) || clues.length === 0) {
            container.innerHTML = "<p>No clues available.</p>";
            return;
        }

        clues.forEach(function (clue, index) {
            const clueElement = document.createElement("div");
            clueElement.className = "clue-card";

            const heading = document.createElement("h4");
            heading.textContent = "🔎 Clue " + (index + 1);

            const description = document.createElement("p");
            description.textContent = clue.description || "No description available.";

            clueElement.appendChild(heading);
            clueElement.appendChild(description);

            container.appendChild(clueElement);
        });

    } catch (error) {
        console.error("Error loading clues:", error);

        container.innerHTML = `
            <p>Unable to load clues. Please try again.</p>
        `;
    }
}


// ==========================================
// DISPLAY RESULT
// ==========================================

function showResult(message, isCorrect) {
    const resultElement = document.getElementById("result");

    if (!resultElement) {
        return;
    }

    resultElement.textContent = message;

    resultElement.className = isCorrect
        ? "correct-result"
        : "wrong-result";
}


// ==========================================
// SAVE GAME PROGRESS
// ==========================================

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


// ==========================================
// SUBMIT ANSWER
// ==========================================

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


// ==========================================
// RETURN TO CASE LIST
// ==========================================

function backToCases() {
    currentCase = null;
    selectedSuspect = "";

    const gameScreen = document.getElementById("game-screen");
    const caseMenu = document.getElementById("case-menu");

    if (gameScreen) {
        gameScreen.style.display = "none";
    }

    if (caseMenu) {
        caseMenu.style.display = "block";
    }

    loadCases();
}


// ==========================================
// RESET GAME
// ==========================================

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

    currentCase = null;
    selectedSuspect = "";

    localStorage.removeItem("detectiveScore");
    localStorage.removeItem("solvedCases");
    localStorage.removeItem("attemptedCases");
    localStorage.removeItem("completedCaseIds");
    localStorage.removeItem("closedCaseIds");
    localStorage.removeItem("achievements");

    const gameScreen = document.getElementById("game-screen");
    const caseMenu = document.getElementById("case-menu");

    const resultElement = document.getElementById("result");
    const cluesElement = document.getElementById("clues-container");
    const suspectsElement = document.getElementById("suspects-container");

    if (gameScreen) {
        gameScreen.style.display = "none";
    }

    if (caseMenu) {
        caseMenu.style.display = "block";
    }

    if (resultElement) {
        resultElement.innerHTML = "";
        resultElement.className = "";
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


// ==========================================
// FINAL REPORT
// ==========================================

function showReport() {
    const reportSection = document.getElementById("final-report");

    if (!reportSection) {
        return;
    }

    const finalScore = document.getElementById("final-score");
    const finalSolved = document.getElementById("final-solved");
    const finalAttempted = document.getElementById("final-attempted");
    const finalRank = document.getElementById("final-rank");

    if (finalScore) {
        finalScore.textContent = score;
    }

    if (finalSolved) {
        finalSolved.textContent = solvedCases;
    }

    if (finalAttempted) {
        finalAttempted.textContent = attemptedCases;
    }

    if (finalRank) {
        finalRank.textContent = getRank();
    }

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


// ==========================================
// EVENT LISTENERS
// ==========================================

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


// ==========================================
// INITIALIZE GAME
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    setupEventListeners();
    updateScoreboard();
    displayAchievements();
    loadCases();
});
