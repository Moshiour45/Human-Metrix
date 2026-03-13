// Hamburger toggle with animated icon
const toggle = document.getElementById('menu-toggle');
const menu = document.getElementById('mobile-menu');

toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
    toggle.classList.toggle('open');
});

// Close menu when a nav link is clicked
menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.classList.remove('open');
    });
});