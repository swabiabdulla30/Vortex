// Loading Screen & User Session Check
window.addEventListener('load', function () {
    const loadingScreen = document.getElementById('loading-screen');

    try {
        // Check User Session (Authenticated Logic)
        const currentUserData = localStorage.getItem('vortexCurrentUser');

        if (currentUserData) {
            let user;
            try {
                user = JSON.parse(currentUserData);
            } catch (e) {
                console.error("User data corruption:", e);
                localStorage.removeItem('vortexCurrentUser');
                user = null;
            }

            if (user && user.name) {
                const loginBtns = document.querySelectorAll('.login-btn');

                loginBtns.forEach(btn => {
                    // Desktop Logic: Replace with Dropdown
                    if (!btn.classList.contains('mobile-only')) {
                        const container = document.createElement('div');
                        container.className = 'user-dropdown-container';

                        const toggle = document.createElement('button');
                        toggle.className = 'login-btn user-btn';
                        toggle.innerHTML = `<span class="icon">👤</span> ${user.name.toUpperCase()}`;

                        const menu = document.createElement('div');
                        menu.className = 'dropdown-menu';
                        menu.innerHTML = `
                        <a href="tickets.html" class="dropdown-item"><i class="fas fa-ticket-alt"></i> CHECK TICKETS</a>
                        ${user.role === 'admin' ? '<a href="admin.html" class="dropdown-item"><i class="fas fa-tachometer-alt"></i> DASHBOARD</a>' : ''}
                        <a href="#" class="dropdown-item logout-link"><i class="fas fa-sign-out-alt"></i> LOGOUT</a>
                    `;

                        container.appendChild(toggle);
                        container.appendChild(menu);
                        btn.parentNode.replaceChild(container, btn);

                        toggle.addEventListener('click', (e) => {
                            e.stopPropagation();
                            menu.classList.toggle('show');
                        });

                        document.addEventListener('click', (e) => {
                            if (!container.contains(e.target)) {
                                menu.classList.remove('show');
                            }
                        });
                    } else {
                        // Mobile Logic: Inject Premium Card at TOP of Menu
                        const navLinks = document.querySelector('.nav-links');
                        if (navLinks) {
                            // Hide existing login button
                            btn.style.display = 'none';

                            // Check if profile card already exists
                            if (!navLinks.querySelector('.mobile-profile-card')) {
                                const profileCard = document.createElement('div');
                                profileCard.className = 'mobile-profile-card';
                                profileCard.innerHTML = `
                                <div class="profile-avatar">
                                    <i class="fas fa-user-astronaut"></i>
                                </div>
                                <div class="profile-info">
                                    <div class="profile-name">${user.name}</div>
                                    <div class="profile-email">${user.email || 'ACCESS_GRANTED'}</div>
                                </div>
                            `;

                                // Insert after header (close button)
                                const header = navLinks.querySelector('.mobile-nav-header');
                                if (header) {
                                    header.insertAdjacentElement('afterend', profileCard);
                                } else {
                                    navLinks.insertBefore(profileCard, navLinks.firstChild);
                                }

                                // Inject Bottom Actions
                                const bottomActions = document.createElement('div');
                                bottomActions.className = 'mobile-bottom-actions';
                                bottomActions.innerHTML = `
                                <a href="tickets.html" class="action-link"><i class="fas fa-ticket-alt"></i> My Tickets</a>
                                ${user.role === 'admin' ? '<a href="admin.html" class="action-link"><i class="fas fa-tachometer-alt"></i> Admin</a>' : ''}
                                <a href="#" class="action-link logout-link-mobile" style="color: var(--primary-red);"><i class="fas fa-sign-out-alt"></i> Sign Out</a>
                            `;
                                navLinks.appendChild(bottomActions);
                            }
                        }
                    }
                });

                // Logout Logic (Delegated)
                document.addEventListener('click', (e) => {
                    if (e.target.closest('.logout-link') || e.target.closest('.logout-link-mobile')) {
                        e.preventDefault();
                        if (confirm('Disconnect from Vortex Network?')) {
                            localStorage.removeItem('vortexCurrentUser');
                            localStorage.removeItem('vortexUser');
                            window.location.href = 'index.html';
                        }
                    }
                });
            }
        }
    } catch (err) {
        console.error("Critical Script Error:", err);
        // Ensure we don't break the page
    } finally {
        // ALWAYS Remove Loading Screen
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

// Main Leads Slider Logic (Seamless Loop & Touch)
document.addEventListener('DOMContentLoaded', function () {
    const leadsWrapper = document.querySelector('.leads-wrapper');
    const leadSlides = document.querySelectorAll('.lead-slide');
    const prevBtn = document.getElementById('lead-prev');
    const nextBtn = document.getElementById('lead-next');

    if (leadsWrapper && leadSlides.length > 0) {

        function getShiftPercentage() {
            return window.innerWidth <= 768 ? 100 : 33.333;
        }

        // Initial setup
        function setInitialState() {
            const currentSlides = leadsWrapper.querySelectorAll('.lead-slide');
            currentSlides.forEach(s => s.classList.remove('active'));

            // Desktop: Center item (index 1) is active. Mobile: First item (index 0) is active.
            const activeIndex = window.innerWidth <= 768 ? 0 : 1;
            if (currentSlides[activeIndex]) currentSlides[activeIndex].classList.add('active');
        }

        setInitialState();

        let isAnimating = false;
        let autoPlayer;

        function updateActive() {
            const slides = leadsWrapper.querySelectorAll('.lead-slide');
            slides.forEach(s => s.classList.remove('active'));

            // Desktop: Center item (index 1) is active. Mobile: First item (index 0) is active.
            const activeIndex = window.innerWidth <= 768 ? 0 : 1;
            if (slides[activeIndex]) slides[activeIndex].classList.add('active');
        }

        function slideNext() {
            if (isAnimating) return;
            isAnimating = true;

            const shift = getShiftPercentage();

            // Animate
            leadsWrapper.style.transition = 'transform 0.5s ease-in-out';
            leadsWrapper.style.transform = `translateX(-${shift}%)`;

            setTimeout(() => {
                leadsWrapper.style.transition = 'none';
                leadsWrapper.appendChild(leadsWrapper.firstElementChild);
                leadsWrapper.style.transform = 'translateX(0)';
                updateActive();
                isAnimating = false;
            }, 500);
        }

        function slidePrev() {
            if (isAnimating) return;
            isAnimating = true;

            const shift = getShiftPercentage();

            // Move last item to front immediately
            leadsWrapper.style.transition = 'none';
            leadsWrapper.prepend(leadsWrapper.lastElementChild);
            leadsWrapper.style.transform = `translateX(-${shift}%)`;

            // Force reflow
            void leadsWrapper.offsetWidth;

            // Animate back to 0
            leadsWrapper.style.transition = 'transform 0.5s ease-in-out';
            leadsWrapper.style.transform = 'translateX(0)';

            setTimeout(() => {
                updateActive();
                isAnimating = false;
            }, 500);
        }

        function startAutoPlay() {
            clearInterval(autoPlayer);
            autoPlayer = setInterval(slideNext, 3000);
        }

        function resetAutoPlay() {
            clearInterval(autoPlayer);
            startAutoPlay();
        }

        // Event Listeners for Buttons
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                slideNext();
                resetAutoPlay();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                slidePrev();
                resetAutoPlay();
            });
        }

        // Touch / Swipe Support
        let touchStartX = 0;
        let touchEndX = 0;

        leadsWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        leadsWrapper.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50; // Minimum distance for swipe
            if (touchEndX < touchStartX - swipeThreshold) {
                // Swipe Left -> Next
                slideNext();
                resetAutoPlay();
            }
            if (touchEndX > touchStartX + swipeThreshold) {
                // Swipe Right -> Prev
                slidePrev();
                resetAutoPlay();
            }
        }

        // Start Auto-play
        startAutoPlay();
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
            // Check if client clicked inside a gallery item (slider or grid)
            const galleryItem = e.target.closest('.item, .gallery-item');

            if (galleryItem) {
                // Ignore if clicking a button inside (like View Data)
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

                // Priority Check: Look for an <img> tag inside the item first
                const img = galleryItem.querySelector('img');
                if (img) {
                    openLightbox(img.src);
                    return;
                }

                // Fallback: Check for background-image
                const style = window.getComputedStyle(galleryItem);
                const bgImage = style.backgroundImage;

                if (bgImage && bgImage !== 'none') {
                    // Extract URL
                    const urlMatch = bgImage.match(/url\(["']?([^"']*)["']?\)/);
                    if (urlMatch && urlMatch[1]) {
                        openLightbox(urlMatch[1]);
                    }
                }
                return; // Stop processing if handled
            }

            // Also check for regular images BUT ONLY inside the #gallery section
            // This prevents images in Events or other sections from popping up
            if (e.target.tagName === 'IMG' && e.target.closest('#gallery')) {
                // Exclude icons just in case
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

// Mobile Navigation Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
    const burger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links a');

    if (burger) {
        burger.addEventListener('click', () => {
            // Toggle Nav
            nav.classList.toggle('nav-active');

            // Animate Links
            navLinks.forEach((link, index) => {
                if (link.style.animation) {
                    link.style.animation = '';
                } else {
                    link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
                }
            });

            // Burger Animation
            burger.classList.toggle('toggle');
        });
    }

    // Close Button Logic
    const closeMenu = document.querySelector('.close-menu');
    if (closeMenu) {
        closeMenu.addEventListener('click', () => {
            nav.classList.remove('nav-active');
            burger.classList.remove('toggle');
        });
    }

    // Close when clicking outside (on backdrop)
    document.addEventListener('click', (e) => {
        if (nav.classList.contains('nav-active') &&
            !nav.contains(e.target) &&
            !burger.contains(e.target)) {
            nav.classList.remove('nav-active');
            burger.classList.remove('toggle');
        }
    });
});

// Login Redirect Logic (Save current page before going to login)
document.addEventListener('click', (e) => {
    // Check for link with class login-btn
    const loginLink = e.target.closest('a.login-btn');

    // Ensure it's a link and points to login.html
    if (loginLink && loginLink.getAttribute('href').includes('login.html')) {
        // Don't save if we are already on login page to avoid loops
        if (!window.location.pathname.includes('login.html')) {
            sessionStorage.setItem('loginRedirectUrl', window.location.href);
        }
    }
});
