
const themeToggle = document.getElementById('theme-toggle');
const html = document.querySelector('html');

const sunIcon = '<i class="fas fa-sun"></i>';
const moonIcon = '<i class="fas fa-moon"></i>';

function setTheme(theme) {
    if (theme === 'dark') {
        html.classList.add('dark');
        themeToggle.innerHTML = sunIcon;
        localStorage.setItem('theme', 'dark');
    } else {
        html.classList.remove('dark');
        themeToggle.innerHTML = moonIcon;
        localStorage.setItem('theme', 'light');
    }
}

export function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            setTheme('light');
        } else {
            setTheme('dark');
        }
    });
}
