
import { t } from './i18n.js';

const historyContainer = document.getElementById('search-history-container');

function getHistory() {
    return JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];
}

function saveHistory(history) {
    localStorage.setItem('weatherSearchHistory', JSON.stringify(history));
}

export function addToHistory(cityName) {
    let history = getHistory();
    // Remove the city if it already exists to avoid duplicates and move it to the top
    history = history.filter(c => c.toLowerCase() !== cityName.toLowerCase());

    history.unshift(cityName);
    if (history.length > 5) {
        history.pop();
    }
    saveHistory(history);
    renderHistory();
}

function renderHistory() {
    const history = getHistory();
    historyContainer.innerHTML = '';
    if (history.length > 0) {
        const title = document.createElement('h3');
        title.classList.add('text-lg', 'font-semibold', 'mb-2', 'text-gray-700', 'dark:text-gray-300');
        title.textContent = t('recent_searches');
        historyContainer.appendChild(title);

        const list = document.createElement('div');
        list.classList.add('flex', 'flex-wrap', 'gap-2');
        history.forEach(city => {
            const badge = document.createElement('span');
            badge.classList.add('cursor-pointer', 'py-1', 'px-3', 'bg-gray-200', 'dark:bg-gray-800', 'rounded-full', 'text-sm', 'text-gray-700', 'dark:text-gray-700', 'hover:bg-blue-500', 'dark:hover:bg-blue-400', 'hover:text-white', 'dark:hover:text-gray-100');
            badge.textContent = city;
            badge.addEventListener('click', () => {
                document.getElementById('city-input').value = city;
                document.getElementById('search-btn').click();
            });
            list.appendChild(badge);
        });
        historyContainer.appendChild(list);
    }
}

export function initHistory() {
    renderHistory();
}
