const btn = document.getElementById('menu-toggle');
const menu = document.getElementById('mobile-menu');
btn.addEventListener('click', () => {
    menu.classList.toggle('open');
});