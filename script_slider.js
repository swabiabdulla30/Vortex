document.addEventListener('DOMContentLoaded', function () {
    const next = document.querySelector('#next');
    const prev = document.querySelector('#prev');
    const slide = document.querySelector('.slide');

    if (next && prev && slide) {
        next.addEventListener('click', function () {
            const items = document.querySelectorAll('.item');
            slide.appendChild(items[0]);
        });

        prev.addEventListener('click', function () {
            const items = document.querySelectorAll('.item');
            slide.prepend(items[items.length - 1]);
        });

        // Auto-slide every 3.5 seconds
        setInterval(() => {
            const items = document.querySelectorAll('.item');
            slide.appendChild(items[0]);
        }, 3500);
    }
});
