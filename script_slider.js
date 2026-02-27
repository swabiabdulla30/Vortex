document.addEventListener('DOMContentLoaded', function () {
    const next = document.querySelector('#next');
    const prev = document.querySelector('#prev');
    const slide = document.querySelector('.slide');

    if (next && prev && slide) {
        let isAnimating = false;
        let autoSlideInterval;

        function startAutoSlide() {
            clearInterval(autoSlideInterval);
            autoSlideInterval = setInterval(moveNext, 5000);
        }

        function moveNext() {
            if (isAnimating) return;
            isAnimating = true;

            const items = document.querySelectorAll('.item');
            slide.appendChild(items[0]);

            // Match CSS transition time
            setTimeout(() => {
                isAnimating = false;
            }, 600);
        }

        function movePrev() {
            if (isAnimating) return;
            isAnimating = true;

            const items = document.querySelectorAll('.item');
            slide.prepend(items[items.length - 1]);

            setTimeout(() => {
                isAnimating = false;
            }, 600);
        }

        next.addEventListener('click', function () {
            moveNext();
            startAutoSlide();
        });

        prev.addEventListener('click', function () {
            movePrev();
            startAutoSlide();
        });

        // Initial Start
        startAutoSlide();
    }
});
