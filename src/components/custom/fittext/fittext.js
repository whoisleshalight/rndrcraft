import './fittext.scss';

document.querySelectorAll('[data-fls-fittext]').forEach((element) => {
    let frame;
    let previousWidth;
    const range = document.createRange();

    function fitText() {
        frame = undefined;
        if (!element.textContent.trim()) {
            element.style.removeProperty('font-size');
            return;
        }

        const styles = getComputedStyle(element);
        const availableWidth = element.clientWidth
            - parseFloat(styles.paddingLeft)
            - parseFloat(styles.paddingRight);
        if (availableWidth <= 0) return;

        range.selectNodeContents(element);
        const previousSize = element.style.fontSize;
        element.style.fontSize = '100px';
        const referenceWidth = range.getBoundingClientRect().width;
        if (referenceWidth <= 0) {
            element.style.fontSize = previousSize;
            return;
        }

        // Measure the rendered text, including its actual font and letter spacing.
        let minimum = 0;
        let maximum = 200 * availableWidth / referenceWidth;
        for (let step = 0; step < 16; step++) {
            const size = (minimum + maximum) / 2;
            element.style.fontSize = `${size}px`;
            if (range.getBoundingClientRect().width > availableWidth) {
                maximum = size;
            } else {
                minimum = size;
            }
        }
        element.style.fontSize = `${Math.floor(minimum * 1000) / 1000}px`;
    }

    function scheduleFit() {
        if (frame === undefined) frame = requestAnimationFrame(fitText);
    }

    // Ignore height changes caused by the fitted font size itself.
    const resizeObserver = new ResizeObserver(([entry]) => {
        if (entry.contentRect.width !== previousWidth) {
            previousWidth = entry.contentRect.width;
            scheduleFit();
        }
    });
    resizeObserver.observe(element);

    new MutationObserver(scheduleFit).observe(element, {
        childList: true,
        characterData: true,
        subtree: true,
    });

    document.fonts.ready.then(scheduleFit);
    document.fonts.addEventListener('loadingdone', scheduleFit);
    fitText();
});
