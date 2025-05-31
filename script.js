class FullScreenTextDisplay
{
    constructor()
    {
        this.textInput = document.querySelector('.text-input');
        this.textDisplay = document.querySelector('.text-display');
        this.textContent = document.querySelector('.text-content');
        this.textMeasure = document.querySelector('.text-measure');

        this.minFontSize = 12;
        this.maxFontSize = 500;
        this.currentFontSize = 48;
        this.resizeTimeout = null;

        this.init();
    }

    init()
    {
        this.setupEventListeners();
        this.focusInput();
    }

    setupEventListeners()
    {
        // Input events
        this.textInput.addEventListener('input', () => this.handleTextChange());
        this.textInput.addEventListener('paste', () =>
        {
            setTimeout(() => this.handleTextChange(), 0);
        });

        // Focus management
        document.addEventListener('click', () => this.focusInput());
        document.addEventListener('keydown', (e) =>
        {
            if (e.target !== this.textInput)
            {
                this.focusInput();
            }
        });

        // Window resize
        window.addEventListener('resize', () =>
        {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this.updateTextSize(), 100);
        });

        // Prevent default behaviors that might interfere
        document.addEventListener('selectstart', (e) => e.preventDefault());
        document.addEventListener('dragstart', (e) => e.preventDefault());
    }

    focusInput()
    {
        this.textInput.focus();
    }

    handleTextChange()
    {
        const text = this.textInput.value;

        if (text.trim() === '')
        {
            this.textContent.textContent = 'Click anywhere and start typing...';
            this.textContent.classList.add('placeholder');
        }
        else
        {
            this.textContent.textContent = text;
            this.textContent.classList.remove('placeholder');
        }

        this.updateTextSize();
    }

    updateTextSize()
    {
        if (this.textContent.classList.contains('placeholder'))
        {
            this.textDisplay.style.fontSize = '48px';
            return;
        }

        const text = this.textContent.textContent;
        if (!text.trim()) return;

        const optimalSize = this.findOptimalFontSize(text);
        this.currentFontSize = optimalSize;
        this.textDisplay.style.fontSize = `${optimalSize}px`;
    }

    findOptimalFontSize(text)
    {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const maxWidth = viewportWidth * 0.95;
        const maxHeight = viewportHeight * 0.95;

        let low = this.minFontSize;
        let high = this.maxFontSize;
        let bestSize = this.minFontSize;

        // Binary search for optimal font size
        while (low <= high)
        {
            const mid = Math.floor((low + high) / 2);
            const dimensions = this.measureText(text, mid);

            if (dimensions.width <= maxWidth && dimensions.height <= maxHeight)
            {
                bestSize = mid;
                low = mid + 1;
            }
            else
            {
                high = mid - 1;
            }
        }

        return bestSize;
    }

    measureText(text, fontSize)
    {
        this.textMeasure.style.fontSize = `${fontSize}px`;
        this.textMeasure.textContent = text;

        return {
            width: this.textMeasure.scrollWidth,
            height: this.textMeasure.scrollHeight
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () =>
{
    new FullScreenTextDisplay();
});

// Handle page visibility changes to maintain focus
document.addEventListener('visibilitychange', () =>
{
    if (!document.hidden)
    {
        setTimeout(() =>
        {
            document.querySelector('.text-input').focus();
        }, 100);
    }
});

const fullscreenBtn = document.getElementById('fullscreen-btn');
fullscreenBtn.addEventListener('click', function()
{
    const docElm = document.documentElement;
    if (docElm.requestFullscreen)
    {
        docElm.requestFullscreen();
    }
});
document.addEventListener('fullscreenchange', function()
{
    fullscreenBtn.style.display = document.fullscreenElement ? 'none' : '';
});