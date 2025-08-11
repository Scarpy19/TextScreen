// DOM elements
const textDisplay = document.getElementById('text-display');
const textInput = document.getElementById('text-input');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const githubBtn = document.getElementById('github-btn');

// Constants
const STORAGE_KEY = 'textscreen-content';
const DEBOUNCE_DELAY = 100;
const MAX_ITERATIONS = 50;
const VIEWPORT_PADDING = 0.95; // 95% of viewport

// State
let resizeTimeout;
let isResizing = false;

// Initialize the application
function init() {
    // Load saved text and handle newlines
    let savedText = localStorage.getItem(STORAGE_KEY) || '';

    // Replace any special characters used for newlines with actual newlines
    savedText = savedText.replace(/\u0000/g, '\n');

    textDisplay.textContent = savedText;
    textInput.value = savedText;

    // Set up event listeners
    setupEventListeners();

    // Initial font size calculation
    calculateOptimalFontSize();

    // Focus the text input (which will be handled by our click handler)
    textInput.focus();
}

// Set up all event listeners
function setupEventListeners() {
    // Input handling
    textInput.addEventListener('input', handleInput);
    textInput.addEventListener('paste', handlePaste);

    // Click anywhere to focus the input
    document.addEventListener('click', handleDocumentClick);

    // Fullscreen button
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Handle resize with debouncing
    window.addEventListener('resize', handleResize);

    // Handle orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);

    // Handle fullscreen change events
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
}

// Handle input events
function handleInput(e) {
    // Update display text with newlines preserved
    let text = e.target.value;

    // Save to localStorage with actual newlines
    localStorage.setItem(STORAGE_KEY, text);

    // Update display with the text (newlines are preserved in the DOM)
    textDisplay.textContent = text;

    // Recalculate font size
    calculateOptimalFontSize();
}

// Handle paste events to clean up text
function handlePaste(e) {
    e.preventDefault();

    // Get pasted text and clean it up
    const text = (e.clipboardData).getData('text');
    const cleanedText = cleanText(text);

    // Insert the cleaned text at the cursor position
    const start = textInput.selectionStart;
    const end = textInput.selectionEnd;
    const currentValue = textInput.value;

    textInput.value = currentValue.substring(0, start) + cleanedText + currentValue.substring(end);

    // Update cursor position
    const newCursorPos = start + cleanedText.length;
    textInput.setSelectionRange(newCursorPos, newCursorPos);

    // Trigger input event
    const event = new Event('input');
    textInput.dispatchEvent(event);
}

// Clean text to handle special cases
function cleanText(text) {
    // Replace all newlines with spaces to prevent unwanted line breaks
    return text.replace(/\r?\n|\r/g, ' ');
}

// Handle document click to focus the input
function handleDocumentClick(e) {
    // Don't refocus if clicking on the fullscreen button
    if (e.target === fullscreenBtn || fullscreenBtn.contains(e.target)) {
        return;
    }

    // Focus the hidden textarea
    textInput.focus();
}

function calculateOptimalFontSize() {
    if (isResizing) {
        return;
    }

    const container = textDisplay;
    let text = container.textContent;

    // If empty, set a default size based on viewport
    if (!text.trim() || text === 'Type something...') {
        const defaultSize = Math.min(window.innerWidth, window.innerHeight) * 0.1;
        container.style.fontSize = `${Math.max(32, defaultSize)}px`;
        container.textContent = 'Type something...';
        container.classList.remove('text');
        container.classList.add('place');
        return;
    }

    container.classList.remove('place');
    container.classList.add('text');

    // Get viewport dimensions (with some padding)
    // Give more weight to width by reducing its padding
    const maxWidth = window.innerWidth * 0.95;  // Increased from 0.9 to 0.95 to use more width
    const maxHeight = window.innerHeight * 0.85; // Slightly reduced height to ensure width has priority

    // Set initial bounds for binary search
    let minSize = 10;
    let maxSize = Math.min(maxWidth, maxHeight) * 2;
    let bestFit = minSize;
    let iterations = 0;

    // Create a temporary container to measure text dimensions
    const tempContainer = document.createElement('div');
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.position = 'fixed';
    tempContainer.classList.add('text');
    tempContainer.style.fontFamily = window.getComputedStyle(container).fontFamily;
    tempContainer.textContent = text;
    document.body.appendChild(tempContainer);

    try {
        // First, find the maximum width that fits
        let widthBestFit = minSize;
        let heightBestFit = minSize;

        // Binary search for maximum width that fits
        let widthMin = minSize;
        let widthMax = maxSize;

        while (widthMin <= widthMax && iterations < MAX_ITERATIONS) {
            const size = Math.floor((widthMin + widthMax) / 2);
            tempContainer.style.fontSize = `${size}px`;

            const rect = tempContainer.getBoundingClientRect();
            const widthFits = rect.width <= maxWidth + 1;

            if (widthFits) {
                widthBestFit = size;
                widthMin = size + 1;
            } else {
                widthMax = size - 1;
            }
            iterations++;
        }

        // Then, find the maximum height that fits, but don't exceed the width-constrained size
        let heightMin = minSize;
        let heightMax = widthBestFit; // Don't exceed the width-constrained size

        while (heightMin <= heightMax && iterations < MAX_ITERATIONS * 2) {
            const size = Math.floor((heightMin + heightMax) / 2);
            tempContainer.style.fontSize = `${size}px`;

            const rect = tempContainer.getBoundingClientRect();
            const heightFits = rect.height <= maxHeight + 1;

            if (heightFits) {
                heightBestFit = size;
                heightMin = size + 1;
            } else {
                heightMax = size - 1;
            }
            iterations++;
        }

        // Use the smaller of the two fits (should be heightBestFit since it's constrained by widthBestFit)
        bestFit = Math.min(widthBestFit, heightBestFit);
    } finally {
        // Clean up
        document.body.removeChild(tempContainer);
    }

    // Ensure reasonable font size (with a higher minimum for better visibility)
    // Slightly reduce the final size to ensure width fits perfectly
    const finalSize = Math.max(32, bestFit * 0.98); // 98% of best fit to ensure width fits
    container.style.fontSize = `${finalSize}px`;

    console.log(`Final font size: ${finalSize}px, after ${iterations} iterations`);
}

function handleResize() {
    console.log('Window resized:', window.innerWidth, 'x', window.innerHeight);
    calculateOptimalFontSize();
}

function handleOrientationChange() {
    calculateOptimalFontSize();
}

function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement &&
        !document.mozFullScreenElement && !document.msFullscreenElement) {
        // Enter fullscreen
        const element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    lockLandscapeOrientation();
}

async function lockLandscapeOrientation() {
    if ('screen' in window && 'orientation' in window.screen && 'lock' in window.screen.orientation) {
        try {
            await window.screen.orientation.lock('landscape');
        } catch (error) {
            console.log('Orientation lock failed:', error.message);
        }
    }
}


function handleFullscreenChange() {
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement ||
        document.mozFullScreenElement || document.msFullscreenElement);

    // Show/hide fullscreen button based on fullscreen state
    githubBtn.style.display = fullscreenBtn.style.display = isFullscreen ? 'none' : 'block';

    // Recalculate font size after fullscreen change
    calculateOptimalFontSize();
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
});

// Log any unhandled errors
window.addEventListener('error', function (error) {
    console.error('Unhandled error:', error.message, 'at', error.filename, 'line', error.lineno);
});

// Log when the window is fully loaded
window.addEventListener('load', function () {
    console.log('Viewport size:', window.innerWidth, 'x', window.innerHeight, "Device pixel ratio:", window.devicePixelRatio);

});