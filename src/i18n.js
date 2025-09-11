
import { lastWeatherData } from './state.js';
import { displayWeather } from './ui.js';
import { initHistory } from './history.js';

export let currentLanguage = 'en';
export let translations = {};

export async function loadTranslations(lang) {
    try {
        const response = await fetch(`./${lang}.json?v=${new Date().getTime()}`);
        if (!response.ok) {
            console.error(`Could not load translation file for ${lang}.`);
            return;
        }
        translations = await response.json();
        updateUI();
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

export function t(key) {
    return translations[key] || key;
}

function updateUI() {
    document.getElementById('page-title').textContent = t('page_title');
    document.querySelector('.responsive-title').textContent = t('weather_app_title');
    document.getElementById('city-input').placeholder = t('enter_city_placeholder');
    document.querySelector('#search-btn span').textContent = t('search_button');
    document.querySelector('#location-btn span').textContent = t('location_button');
    document.getElementById('attribution-author').innerHTML = t('attribution_author');
    document.querySelector('[data-i18n="osm_attribution"]').innerHTML = 'Data &copy; OpenStreetMap contributors, ODbL 1.0. <a href="http://osm.org/copyright" target="_blank" class="text-blue-500 hover:underline">http://osm.org/copyright</a>';

    if (lastWeatherData) {
        displayWeather(lastWeatherData);
    }
    initHistory();
}

export function setLanguage(lang) {
    currentLanguage = lang;
    const flagImg = document.getElementById('selected-lang-flag');
    if (lang === 'en') {
        flagImg.src = 'https://flagcdn.com/w40/us.png';
    } else if (lang === 'es') {
        flagImg.src = 'https://flagcdn.com/w40/es.png';
    }
    loadTranslations(currentLanguage);
    document.getElementById('language-dropdown').classList.add('hidden');
}
