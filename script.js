// Loading Screen & User Session Check
window.addEventListener('load', function () {
    const loadingScreen = document.getElementById('loading-screen');

    // Check User Session (Authenticated Logic)
    const currentUserData = localStorage.getItem('vortexCurrentUser');

    if (currentUserData) {
        const user = JSON.parse(currentUserData);
        const loginBtns = document.querySelectorAll('.login-btn');

        loginBtns.forEach(btn => {
            // Change button to Dropdown Toggle
            // Note: We need to change the structure slightly
            // Current structure: <a href="login.html" class="login-btn">...</a>
            // New structure: <div class="user-dropdown-container"> <button ...>Name</button> ...menu... </div>

            // Create container
            const container = document.createElement('div');
            container.className = 'user-dropdown-container';

            // Create toggle button
            const toggle = document.createElement('button');
            toggle.className = 'login-btn user-btn';
            toggle.innerHTML = `<span class="icon">👤</span> ${user.name.toUpperCase()}`;

            // Create dropdown menu
            const menu = document.createElement('div');
            menu.className = 'dropdown-menu';
            menu.innerHTML = `
                <a href="tickets.html" class="dropdown-item"><i class="fas fa-ticket-alt"></i> CHECK TICKETS</a>
                ${user.role === 'admin' ? '<a href="admin.html" class="dropdown-item"><i class="fas fa-tachometer-alt"></i> DASHBOARD</a>' : ''}
                <a href="#" class="dropdown-item" id="logout-btn"><i class="fas fa-sign-out-alt"></i> LOGOUT</a>
            `;

            // Assemble
            container.appendChild(toggle);
            container.appendChild(menu);

            // Replace original button
            btn.parentNode.replaceChild(container, btn);

            // Toggle Logic
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('show');
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    menu.classList.remove('show');
                }
            });

            // Logout Logic
            const logout = menu.querySelector('#logout-btn');
            logout.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Disconnect from Vortex Network?')) {
                    localStorage.removeItem('vortexCurrentUser');
                    // Also clear legacy simpler key if any
                    localStorage.removeItem('vortexUser');
                    window.location.href = 'index.html';
                }
            });
        });
    } else {
        // Fallback for simple name stored previously (Migration/Cleanup)
        // If simple 'vortexUser' exists but not 'vortexCurrentUser', clear it to force re-login
        // or just ignore it. Let's ignore it to force new secure flow.
    }

    if (loadingScreen) {
        // Check if user has already visited in this session
        if (sessionStorage.getItem('vortex_visited')) {
            loadingScreen.style.display = 'none';
        } else {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    // Mark session as visited
                    sessionStorage.setItem('vortex_visited', 'true');
                }, 500);
            }, 2000);
        }
    }
});

// Spotlight Effect
document.addEventListener('mousemove', function (e) {
    const spotlight = document.getElementById('spotlight');
    if (spotlight) {
        // Update CSS variables for spotlight position
        spotlight.style.setProperty('--x', `${e.clientX}px`);
        spotlight.style.setProperty('--y', `${e.clientY}px`);
    }
});



// Gallery Slider Logic matched to index.html structure
document.addEventListener('DOMContentLoaded', function () {
    const nextBtn = document.getElementById('next');
    const prevBtn = document.getElementById('prev');
    const slide = document.querySelector('.slide');

    if (nextBtn && prevBtn && slide) {
        let isAnimating = false;
        let autoSlideInterval;

        function startAutoSlide() {
            clearInterval(autoSlideInterval);
            autoSlideInterval = setInterval(function () {
                moveNext();
            }, 3000);
        }

        function moveNext() {
            if (isAnimating) return;
            isAnimating = true;
            let items = document.querySelectorAll('.item');
            slide.appendChild(items[0]);

            setTimeout(() => {
                isAnimating = false;
            }, 500); // Matches CSS transition time
        }

        function movePrev() {
            if (isAnimating) return;
            isAnimating = true;
            let items = document.querySelectorAll('.item');
            slide.prepend(items[items.length - 1]);

            setTimeout(() => {
                isAnimating = false;
            }, 500); // Matches CSS transition time
        }

        nextBtn.onclick = function () {
            moveNext();
            startAutoSlide(); // Reset timer on manual interaction
        };

        prevBtn.onclick = function () {
            movePrev();
            startAutoSlide(); // Reset timer on manual interaction
        };

        // Start initial auto-slide
        startAutoSlide();
    }

    // Interactive Effects for Cards - REMOVED to prevent conflict with CSS transforms
    // CSS handles hover effects for .card, .member-card, and .mini-card now.

    // Scroll Animations using Intersection Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Filter elements to observe (sections and cards)
    const elementsToAnimate = document.querySelectorAll('.content-section, .member-card, .card');
    elementsToAnimate.forEach(el => {
        // Set initial state for animation
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
});

// Navigation Scroll Effect
let lastScroll = 0;
window.addEventListener('scroll', function () {
    const nav = document.querySelector('.glass-nav');
    const currentScroll = window.pageYOffset;

    if (nav) {
        if (currentScroll > lastScroll && currentScroll > 100) {
            nav.style.transform = 'translate(-50%, -100%)';
        } else {
            nav.style.transform = 'translate(-50%, 0)';
        }
    }
    lastScroll = currentScroll;
});

// Main Leads Slider Logic (Seamless Loop)
document.addEventListener('DOMContentLoaded', function () {
    const leadsWrapper = document.querySelector('.leads-wrapper');
    const leadSlides = document.querySelectorAll('.lead-slide');

    if (leadsWrapper && leadSlides.length > 0) {
        // Initial setup: Ensure the second item (index 1) is active/centered
        // We show 3 items. Item 1 (center) should be active.
        function setInitialState() {
            const currentSlides = document.querySelectorAll('.lead-slide');
            currentSlides.forEach(s => s.classList.remove('active'));
            if (currentSlides[1]) currentSlides[1].classList.add('active');
            // Ensure wrapper is shifted so index 1 is in center.
            // Items are 33.33% wide.
            // To center index 1, we want wrapper at -33.33% (showing index 1 in middle slot).
            // Actually, based on style_slider_leads.css, items are flexed.
            // Let's rely on the natural flex flow and just shift the wrapper.
            // Currently, css says .leads-wrapper does transition.
        }

        setInitialState();

        // We need to shift the wrapper to the left by 33.333% to verify next item
        // But for infinite loop with flexbox:
        // 1. Animate transform translateX(-33.333%)
        // 2. On transition end:
        //    - Append first child to end
        //    - Reset transform to translateX(0)
        //    - Update active class (always the new 2nd item)

        let isAnimating = false;

        function slideNext() {
            if (isAnimating) return;
            isAnimating = true;

            // Animate
            leadsWrapper.style.transition = 'transform 0.5s ease-in-out';
            leadsWrapper.style.transform = 'translateX(-33.333%)';

            // Use setTimeout to ensure it matches the CSS transition time reliable
            setTimeout(() => {
                leadsWrapper.style.transition = 'none';
                leadsWrapper.appendChild(leadsWrapper.firstElementChild);
                leadsWrapper.style.transform = 'translateX(0)';

                // Update Active Class (Always highlight the new center item, which is index 1)
                const slides = leadsWrapper.querySelectorAll('.lead-slide');
                slides.forEach(s => s.classList.remove('active'));
                if (slides[1]) slides[1].classList.add('active');

                isAnimating = false;
            }, 500);
        }

        // Auto-play
        setInterval(slideNext, 3000);
    }
});

// Lightbox Logic
document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.close-lightbox');

    if (lightbox) {
        // Function to open lightbox
        const openLightbox = (imgSrc) => {
            if (!imgSrc) return;
            console.log("Opening lightbox for:", imgSrc); // Debug
            lightboxImg.src = imgSrc;
            lightbox.style.display = 'flex';
            // Trigger reflow
            void lightbox.offsetWidth;
            lightbox.classList.add('active');
        };

        // Close functions
        const closeLightbox = () => {
            lightbox.classList.remove('active');
            setTimeout(() => {
                lightbox.style.display = 'none';
                lightboxImg.src = '';
            }, 300);
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', closeLightbox);
        }

        lightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg) {
                closeLightbox();
            }
        });

        // Event Delegation for Gallery Items (Background Images)
        // We attach to body to catch all current and future items
        document.body.addEventListener('click', (e) => {
            // Check if clicked element is an item or inside an item
            const item = e.target.closest('.item, .gallery-item');

            if (item) {
                // Ignore if clicking a button inside (like View Data)
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

                const style = window.getComputedStyle(item);
                const bgImage = style.backgroundImage;

                if (bgImage && bgImage !== 'none') {
                    // Extract URL
                    const urlMatch = bgImage.match(/url\(["']?([^"']*)["']?\)/);
                    if (urlMatch && urlMatch[1]) {
                        openLightbox(urlMatch[1]);
                    }
                }
            }

            // Also check for regular images with a specific class or context
            if (e.target.tagName === 'IMG' &&
                (e.target.closest('.content-section') || e.target.closest('.card'))) {
                // Exclude icons
                if (!e.target.classList.contains('icon') && !e.target.classList.contains('logo')) {
                    openLightbox(e.target.src);
                }
            }
        });
    }
});

/* =========================================
   BACKEND INTEGRATION
   ========================================= */

// Dynamically determine API URL
// If on localhost:5500 (Live Server), point to localhost:5000
// If on localhost:5000 (served by Express) or Vercel (same domain), use relative path
const API_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') && window.location.port !== '5000'
    ? "http://127.0.0.1:5000/api"
    : "/api";

// Signup Function
async function registerUser(name, email, password) {
    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (res.ok) {
            return { success: true, message: data.message };
        } else {
            return { success: false, message: data.error };
        }
    } catch (error) {
        console.error("Signup network error:", error);
        return { success: false, message: error.message || "Network error" };
    }
}

// Login Function
async function loginUser(email, password) {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            // Save token and user info
            localStorage.setItem("vortexToken", data.token);
            localStorage.setItem("vortexCurrentUser", JSON.stringify(data.user));
            return { success: true, token: data.token, user: data.user };
        } else {
            return { success: false, message: data.error };
        }
    } catch (error) {
        console.error("Login network error:", error);
        return { success: false, message: error.message || "Network error" };
    }
}

// Event Registration Function
async function registerForEvent(eventData) {
    try {
        const token = localStorage.getItem("vortexToken");
        // Note: The current backend doesn't strictly verify token on register endpoint yet, 
        // but it's good practice to send it if we add middleware later.

        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(eventData)
        });
        const data = await res.json();
        if (res.ok) {
            return { success: true, data: data };
        } else {
            return { success: false, message: data.error || "Registration failed", details: data.details };
        }
    } catch (error) {
        console.error("Registration network error:", error);
        return { success: false, message: error.message || "Network error" };
    }
}

// Payment Success Mock
async function markPaymentSuccess(ticketId) {
    try {
        const res = await fetch(`${API_URL}/payment-success`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticketId })
        });
        return res.ok;
    } catch (error) {
        return false;
    }
}
