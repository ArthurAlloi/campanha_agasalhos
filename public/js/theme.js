// theme.js - Controle do modo escuro/claro

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateToggleButton(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateToggleButton(newTheme);
}

function updateToggleButton(theme) {
    const toggleButton = document.getElementById('theme-toggle');
    const themeIcon = toggleButton.querySelector('.theme-icon');
    
    if (theme === 'light') {
        themeIcon.textContent = '🌙';
        toggleButton.style.borderColor = 'var(--header-text)';
        toggleButton.style.color = 'var(--header-text)';
    } else {
        themeIcon.textContent = '☀️';
        toggleButton.style.borderColor = 'var(--header-text)';
        toggleButton.style.color = 'var(--header-text)';
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', loadTheme);
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

// Observar mudanças na preferência do sistema
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
        loadTheme();
    }
});