// =======================
// STRING MATCHING VISUALIZER
// Part 1
// =======================

let chart;

// -------------------------
// Naive Search
// -------------------------
function naiveSearch(text, pattern) {
    let matches = [];
    let comparisons = 0;

    const start = performance.now();

    for (let i = 0; i <= text.length - pattern.length; i++) {
        let j = 0;

        while (j < pattern.length) {
            comparisons++;

            if (text[i + j] !== pattern[j])
                break;

            j++;
        }

        if (j === pattern.length)
            matches.push(i);
    }

    const end = performance.now();

    return {
        matches,
        comparisons,
        time: (end - start).toFixed(3)
    };
}

// -------------------------
// LPS Array
// -------------------------
function computeLPS(pattern) {

    let lps = new Array(pattern.length).fill(0);

    let len = 0;
    let i = 1;

    while (i < pattern.length) {

        if (pattern[i] === pattern[len]) {
            len++;
            lps[i] = len;
            i++;
        }

        else {

            if (len !== 0) {
                len = lps[len - 1];
            }

            else {
                lps[i] = 0;
                i++;
            }

        }

    }

    return lps;
}

// -------------------------
// KMP Search
// -------------------------
function kmpSearch(text, pattern) {

    const start = performance.now();

    let lps = computeLPS(pattern);

    let matches = [];
    let comparisons = 0;

    let i = 0;
    let j = 0;

    while (i < text.length) {

        comparisons++;

        if (text[i] === pattern[j]) {
            i++;
            j++;
        }

        if (j === pattern.length) {

            matches.push(i - j);

            j = lps[j - 1];
        }

        else if (
            i < text.length &&
            text[i] !== pattern[j]
        ) {

            if (j !== 0)
                j = lps[j - 1];

            else
                i++;

        }

    }

    const end = performance.now();

    return {

        matches,

        comparisons,

        time: (end - start).toFixed(3)

    };

}

// -------------------------
// Run Algorithms
// -------------------------
function runAlgorithms() {

    const text = document
        .getElementById("text")
        .value;

    const pattern = document
        .getElementById("pattern")
        .value;

    if (
        text.trim() === "" ||
        pattern.trim() === ""
    ) {

        alert("Please enter both Text and Pattern.");

        return;

    }

    const naive = naiveSearch(text, pattern);

    const kmp = kmpSearch(text, pattern);

    // Rabin-Karp added in Part 2
