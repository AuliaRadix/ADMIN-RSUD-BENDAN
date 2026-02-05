window.addEventListener("load", function () {
    const preloader = document.getElementById("preloader");
    preloader.style.opacity = "0";
    preloader.style.visibility = "hidden";
    setTimeout(() => {
        preloader.remove();
    }, 1000);
});

document.addEventListener("DOMContentLoaded", () => {
    loadPartial("header-placeholder", "partials/header.html", initHeader);
    loadPartial("sidebar-placeholder", "partials/sidebar.html", initSidebar);
});

const loadPartial = (id, path, callback) => {
    const el = document.getElementById(id);
    if (!el) return;

    fetch(path)
        .then(res => res.text())
        .then(html => {
            el.innerHTML = html;
            if (callback) callback();
        })
        .catch(err => console.error("Error loading partial:", err));
};

function initHeader() {
    const toggleBtn = document.getElementById('toggleSidebar');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }
}


function initSidebar() {
    const dropdownToggles = document.querySelectorAll('.js-dropdown');

    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();

            const parent = toggle.closest('.menu-item');
            const submenu = parent.querySelector('.dropdown');

            // tutup dropdown lain
            document.querySelectorAll('.menu-item.open').forEach(item => {
                if (item !== parent) {
                    item.classList.remove('open');
                    const ul = item.querySelector('.dropdown');
                    if (ul) {
                        ul.classList.remove('show');
                        ul.style.maxHeight = null;
                    }
                }
            });

            // toggle current
            parent.classList.toggle('open');
            if (parent.classList.contains('open')) {
                submenu.classList.add('show');
                submenu.style.maxHeight = submenu.scrollHeight + "px";
            } else {
                submenu.classList.remove('show');
                submenu.style.maxHeight = null;
            }
        });
    });

    // Active Menu & Mobile Close Logic
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    const menuLinks = document.querySelectorAll('.sidebar-menu a');

    menuLinks.forEach(link => {
        const href = link.getAttribute('href');

        // 1. Set Active State
        if (href && href !== '#' && href !== 'javascript:void(0)' && href === currentFile) {
            const listItem = link.closest('li');
            if (listItem) listItem.classList.add('active');

            const parentDropdown = link.closest('.dropdown');
            if (parentDropdown) {
                parentDropdown.classList.add('show');
                parentDropdown.style.maxHeight = parentDropdown.scrollHeight + "px";
                const parentMenuItem = parentDropdown.closest('.menu-item');
                if (parentMenuItem) parentMenuItem.classList.add('open');
            }
        }

        // 2. Close sidebar on mobile when link is clicked (if not a dropdown toggle)
        if (!link.classList.contains('js-dropdown')) {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 992) {
                    closeSidebar();
                }
            });
        }
    });
}


function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    sidebar.classList.toggle('show');
    if (overlay) overlay.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    sidebar.classList.remove('show');
    if (overlay) overlay.classList.remove('active');
}

// Close sidebar on click outside (mobile)
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');

    if (sidebar && sidebar.classList.contains('show')) {
        // Jika klik di toggle button, jangan tutup
        if (e.target === toggleBtn || (toggleBtn && toggleBtn.contains(e.target))) {
            return;
        }
        // Jika klik di sidebar, jangan tutup
        if (sidebar.contains(e.target)) {
            return;
        }
        // Klik di area lain = tutup sidebar
        closeSidebar();
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth > 992) {
        sidebar.classList.remove('show');
    }
});

document.getElementById("uploadFoto").addEventListener("change", function () {
    const file = this.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            document.getElementById("previewImage").src = e.target.result;
        };

        reader.readAsDataURL(file);
    }
});

const togglePassword = document.querySelector('#togglePassword');
const password = document.querySelector('#password');

togglePassword.addEventListener('click', function (e) {
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    this.querySelector('i').classList.toggle('bi-eye');
    this.querySelector('i').classList.toggle('bi-eye-slash');
});

function reloadCaptcha() {
    fetch('/reload-captcha')
        .then(res => res.json())
        .then(data => {

            document.getElementById('captchaImg').src =
                '/captcha/' + data.id + '.png';

            document.getElementById('captchaId').value = data.id;
        });
}

function reloadCaptcha() {
            fetch('/reload-captcha')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('captchaImg').src = "/captcha/" + data.id + ".png";
                    document.getElementById('captchaId').value = data.id;
                })
                .catch(error => console.error('Error reloading captcha:', error));
        }