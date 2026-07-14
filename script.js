/* ============================================================
   String Matching Algorithm Visualizer
   ------------------------------------------------------------
   Implements Naive, KMP, and Rabin-Karp string matching
   algorithms, benchmarks them, and renders results in a table,
   a winner card, and a Chart.js grouped bar chart.
   ============================================================ */

"use strict";

// Global chart reference so we can destroy it before re-creating
let chart;

/* ============================================================
   Naive Search
   ============================================================ */

/**
 * Performs naive (brute-force) string matching.
 * Slides the pattern over the text one character at a time and
 * compares character by character.
 *
 * @param {string} text - The text to search within.
 * @param {string} pattern - The pattern to search for.
 * @returns {{positions: number[], comparisons: number, time: number}}
 */
function naiveSearch(text, pattern) {
    const startTime = performance.now();
    const positions = [];
    let comparisons = 0;

    const n = text.length;
    const m = pattern.length;

    for (let i = 0; i <= n - m; i++) {
        let j = 0;
        while (j < m) {
            comparisons++;
            if (text[i + j] !== pattern[j]) {
                break;
            }
            j++;
        }
        if (j === m) {
            positions.push(i);
        }
    }

    const endTime = performance.now();
    return {
        positions,
        comparisons,
        time: endTime - startTime
    };
}

/* ============================================================
   Compute LPS (Longest Prefix Suffix) Array
   ============================================================ */

/**
 * Computes the LPS (Longest Proper Prefix which is also Suffix)
 * array used by the KMP algorithm to avoid re-checking characters
 * that have already been matched.
 *
 * @param {string} pattern - The pattern to preprocess.
 * @returns {number[]} The LPS array for the given pattern.
 */
function computeLPS(pattern) {
    const m = pattern.length;
    const lps = new Array(m).fill(0);
    let length = 0; // length of the previous longest prefix suffix
    let i = 1;

    while (i < m) {
        if (pattern[i] === pattern[length]) {
            length++;
            lps[i] = length;
            i++;
        } else if (length !== 0) {
            length = lps[length - 1];
        } else {
            lps[i] = 0;
            i++;
        }
    }

    return lps;
}

/* ============================================================
   KMP Search
   ============================================================ */

/**
 * Performs Knuth-Morris-Pratt string matching using a precomputed
 * LPS array to skip unnecessary comparisons after a mismatch.
 *
 * @param {string} text - The text to search within.
 * @param {string} pattern - The pattern to search for.
 * @returns {{positions: number[], comparisons: number, time: number}}
 */
function kmpSearch(text, pattern) {
    const startTime = performance.now();
    const positions = [];
    let comparisons = 0;

    const n = text.length;
    const m = pattern.length;
    const lps = computeLPS(pattern);

    let i = 0; // index for text
    let j = 0; // index for pattern

    while (i < n) {
        comparisons++;
        if (text[i] === pattern[j]) {
            i++;
            j++;
            if (j === m) {
                positions.push(i - j);
                j = lps[j - 1];
            }
        } else if (j !== 0) {
            j = lps[j - 1];
        } else {
            i++;
        }
    }

    const endTime = performance.now();
    return {
        positions,
        comparisons,
        time: endTime - startTime
    };
}

/* ============================================================
   Rabin-Karp Search
   ============================================================ */

/**
 * Performs Rabin-Karp string matching using a rolling hash to
 * quickly filter out non-matching windows before doing a full
 * character-by-character verification.
 *
 * Character comparisons are only counted during actual
 * verification of a hash match (not during hash computation).
 *
 * @param {string} text - The text to search within.
 * @param {string} pattern - The pattern to search for.
 * @returns {{positions: number[], comparisons: number, time: number}}
 */
function rabinKarpSearch(text, pattern) {
    const startTime = performance.now();
    const positions = [];
    let comparisons = 0;

    const BASE = 256;
    const PRIME = 101;

    const n = text.length;
    const m = pattern.length;

    if (m > n) {
        const endTime = performance.now();
        return { positions, comparisons, time: endTime - startTime };
    }

    let patternHash = 0;
    let textHash = 0;
    let highOrder = 1; // BASE^(m-1) % PRIME, used to remove the leading digit

    // Precompute BASE^(m-1) % PRIME
    for (let i = 0; i < m - 1; i++) {
        highOrder = (highOrder * BASE) % PRIME;
    }

    // Compute the initial hash values for the pattern and the first window of text
    for (let i = 0; i < m; i++) {
        patternHash = (BASE * patternHash + pattern.charCodeAt(i)) % PRIME;
        textHash = (BASE * textHash + text.charCodeAt(i)) % PRIME;
    }

    for (let i = 0; i <= n - m; i++) {
        // If hash values match, verify characters one by one
        if (patternHash === textHash) {
            let match = true;
            for (let j = 0; j < m; j++) {
                comparisons++;
                if (text[i + j] !== pattern[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                positions.push(i);
            }
        }

        // Calculate hash for the next window of text
        if (i < n - m) {
            textHash = (BASE * (textHash - text.charCodeAt(i) * highOrder) + text.charCodeAt(i + m)) % PRIME;

            // Ensure the hash is non-negative
            if (textHash < 0) {
                textHash += PRIME;
            }
        }
    }

    const endTime = performance.now();
    return {
        positions,
        comparisons,
        time: endTime - startTime
    };
}

/* ============================================================
   Benchmark
   ============================================================ */

/**
 * Generates a random string of the given length using the
 * provided character set (defaults to "ABCD").
 *
 * @param {number} length - Desired length of the generated string.
 * @param {string} charset - Characters to draw from.
 * @returns {string} A randomly generated string.
 */
function generateRandomText(length, charset = "ABCD") {
    let result = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset[randomIndex];
    }
    return result;
}

/**
 * Runs a full performance benchmark comparing Naive, KMP, and
 * Rabin-Karp against a randomly generated 10,000 character text
 * using a fixed set of pattern lengths.
 *
 * @returns {{labels: string[], naive: number[], kmp: number[], rabinKarp: number[]}}
 */
function runBenchmark() {
    const benchmarkText = generateRandomText(10000, "ABCD");
    const patterns = ["AB", "ABCD", "ABCDAB", "ABCDABCD"];

    const naiveComparisons = [];
    const kmpComparisons = [];
    const rabinKarpComparisons = [];

    patterns.forEach((pattern) => {
        const naiveResult = naiveSearch(benchmarkText, pattern);
        const kmpResult = kmpSearch(benchmarkText, pattern);
        const rabinKarpResult = rabinKarpSearch(benchmarkText, pattern);

        naiveComparisons.push(naiveResult.comparisons);
        kmpComparisons.push(kmpResult.comparisons);
        rabinKarpComparisons.push(rabinKarpResult.comparisons);
    });

    return {
        labels: patterns,
        naive: naiveComparisons,
        kmp: kmpComparisons,
        rabinKarp: rabinKarpComparisons
    };
}

/* ============================================================
   Winner
   ============================================================ */

/**
 * Determines which algorithm had the smallest execution time and
 * renders a "winner" card describing the fastest algorithm.
 *
 * @param {Array<{name: string, time: number}>} results - Results from all algorithms.
 */
function displayWinner(results) {
    const winnerDiv = document.getElementById("winner");
    if (!winnerDiv) {
        return;
    }

    let fastest = results[0];
    for (let i = 1; i < results.length; i++) {
        if (results[i].time < fastest.time) {
            fastest = results[i];
        }
    }

    winnerDiv.innerHTML = `
        <div>🏆 Fastest Algorithm</div>
        <div>${fastest.name}</div>
        <div>${fastest.time.toFixed(3)} ms</div>
    `;
}

/* ============================================================
   Chart
   ============================================================ */

/**
 * Renders (or re-renders) the Chart.js grouped bar chart showing
 * comparison counts for each algorithm across the benchmark
 * pattern lengths. Destroys any previously existing chart first.
 *
 * @param {{labels: string[], naive: number[], kmp: number[], rabinKarp: number[]}} benchmarkData
 */
function renderChart(benchmarkData) {
    const canvas = document.getElementById("chart");
    if (!canvas) {
        return;
    }

    // Destroy the previous chart instance before creating a new one
    if (chart) {
        chart.destroy();
    }

    const ctx = canvas.getContext("2d");

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: benchmarkData.labels,
            datasets: [
                {
                    label: "Naive",
                    data: benchmarkData.naive,
                    backgroundColor: "rgba(255, 99, 132, 0.7)"
                },
                {
                    label: "KMP",
                    data: benchmarkData.kmp,
                    backgroundColor: "rgba(54, 162, 235, 0.7)"
                },
                {
                    label: "Rabin-Karp",
                    data: benchmarkData.rabinKarp,
                    backgroundColor: "rgba(255, 206, 86, 0.7)"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: "Character Comparisons by Pattern Length"
                },
                legend: {
                    display: true,
                    position: "top"
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Pattern"
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Number of Comparisons"
                    }
                }
            }
        }
    });
}

/* ============================================================
   Table Rendering
   ============================================================ */

/**
 * Renders the results table body with one row per algorithm.
 *
 * @param {Array<{name: string, positions: number[], comparisons: number, time: number}>} results
 */
function renderResultsTable(results) {
    const resultBody = document.getElementById("resultBody");
    if (!resultBody) {
        return;
    }

    resultBody.innerHTML = "";

    results.forEach((result) => {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = result.name;

        const positionsCell = document.createElement("td");
        positionsCell.textContent = result.positions.length > 0
            ? result.positions.join(", ")
            : "No matches found";

        const comparisonsCell = document.createElement("td");
        comparisonsCell.textContent = result.comparisons;

        const timeCell = document.createElement("td");
        timeCell.textContent = result.time.toFixed(3);

        row.appendChild(nameCell);
        row.appendChild(positionsCell);
        row.appendChild(comparisonsCell);
        row.appendChild(timeCell);

        resultBody.appendChild(row);
    });
}

/* ============================================================
   Run Algorithms
   ============================================================ */

/**
 * Main entry point triggered by the "Run Algorithms" button.
 * Reads text/pattern input, validates them, executes all three
 * string matching algorithms, updates the results table, the
 * winner card, and refreshes the benchmark chart.
 */
function runAlgorithms() {
    const textInput = document.getElementById("text");
    const patternInput = document.getElementById("pattern");

    if (!textInput || !patternInput) {
        console.error("Required input elements (#text, #pattern) were not found.");
        return;
    }

    const text = textInput.value;
    const pattern = patternInput.value;

    // Validate that both fields are filled in
    if (text.trim() === "" || pattern.trim() === "") {
        alert("Please enter both Text and Pattern.");
        return;
    }

    // Validate that the pattern isn't longer than the text
    if (pattern.length > text.length) {
        const resultBody = document.getElementById("resultBody");
        if (resultBody) {
            resultBody.innerHTML = "";
        }
        const winnerDiv = document.getElementById("winner");
        if (winnerDiv) {
            winnerDiv.innerHTML = "";
        }
        alert("Pattern length cannot exceed text length.");
        return;
    }

    // Execute all three algorithms
    const naiveResult = naiveSearch(text, pattern);
    const kmpResult = kmpSearch(text, pattern);
    const rabinKarpResult = rabinKarpSearch(text, pattern);

    const results = [
        { name: "Naive", ...naiveResult },
        { name: "KMP", ...kmpResult },
        { name: "Rabin-Karp", ...rabinKarpResult }
    ];

    // Update the results table
    renderResultsTable(results);

    // Update the winner card
    displayWinner(results);

    // Run the benchmark and refresh the chart
    const benchmarkData = runBenchmark();
    renderChart(benchmarkData);
}

/* ============================================================
   Initialization
   ============================================================ */

// Attach the run function to a "Run" button if one exists with id
// "runBtn", and also expose runAlgorithms globally so it can be
// called directly via an inline onclick handler in the HTML.
window.runAlgorithms = runAlgorithms;

document.addEventListener("DOMContentLoaded", () => {
    const runButton = document.getElementById("runBtn");
    if (runButton) {
        runButton.addEventListener("click", runAlgorithms);
    }
});
