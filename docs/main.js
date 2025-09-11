

import { loadTranslations, setLanguage, currentLanguage, t } from './i18n.js';
import { getCoordinates, getWeatherData, getCityName } from './api.js';
import { showLoader, hideLoader, displayWeather, displayError, displayLocationInfo, clearUI } from './ui.js';
import { initializeTheme } from './theme.js';
import { initHistory, addToHistory } from './history.js';


const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const optionsMenu = document.getElementById('options-menu');
const languageDropdown = document.getElementById('language-dropdown');

document.addEventListener('DOMContentLoaded', () => {
    loadTranslations(currentLanguage);
    initializeTheme();
    initHistory();
});

const handleSearch = async () => {
    const cityName = cityInput.value.trim();
    if (cityName) {
        showLoader();
        clearUI();
        try {
            const coordinates = await getCoordinates(cityName);
            console.log("Coordinates from getCoordinates:", coordinates);
            const weather = await getWeatherData(coordinates.latitude, coordinates.longitude);
            const displayData = { ...weather, ...coordinates };
            displayWeather(displayData);
            await displayLocationInfo(coordinates.latitude, coordinates.longitude);
            addToHistory(cityName);
        } catch (error) {
            displayError(error.message);
        } finally {
            hideLoader();
        }
    }
};

const handleLocation = async () => {
    showLoader();
    clearUI();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // 1. Get weather data for precise location
                    const weather = await getWeatherData(latitude, longitude);

                    // 2. Get city name from precise location (reverse geocoding)
                    const preciseLocationData = await getCityName(latitude, longitude);
                    const cityName = preciseLocationData.city; // Extract the city name

                    let displayLatitude = latitude;
                    let displayLongitude = longitude;
                    let displayBoundingBox = preciseLocationData.boundingbox; // Fallback to reverse geocoding bbox

                    // 3. Perform a forward geocoding search for the city name to get the town-level bounding box
                    if (cityName && cityName !== 'Unknown Location') {
                        try {
                            const townCoordinates = await getCoordinates(cityName); // This uses our improved logic
                            displayLatitude = townCoordinates.latitude; // Use town's center for pin
                            displayLongitude = townCoordinates.longitude;
                            displayBoundingBox = townCoordinates.boundingbox; // Use town's bounding box
                        } catch (searchError) {
                            console.warn("Could not get town-level coordinates for map, falling back to precise location bbox:", searchError);
                            // If town-level search fails, stick with preciseLocationData's bbox
                        }
                    }

                    const displayData = {
                        latitude: displayLatitude,
                        longitude: displayLongitude,
                        boundingbox: displayBoundingBox,
                        ...weather
                    };
                    displayWeather(displayData);

                    const locationString = [preciseLocationData.city, preciseLocationData.state, preciseLocationData.country].filter(Boolean).join(', ');
                    addToHistory(locationString);

                } catch (error) {
                    displayError(error.message);
                } finally {
                    hideLoader();
                }
            },
            (error) => {
                let message;
                switch (error.code) {
                    case 1: message = t('geolocation_permission_denied'); break;
                    case 2: message = t('geolocation_position_unavailable'); break;
                    case 3: message = t('geolocation_timeout'); break;
                    default: message = `${t('geolocation_error')}: ${error.message}`; break;
                }
                displayError(message);
                hideLoader();
            }
        );
    } else {
        displayError(t('geolocation_not_supported'));
        hideLoader();
    }
};

searchBtn.addEventListener('click', handleSearch);
locationBtn.addEventListener('click', handleLocation);

cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

cityInput.addEventListener('input', (event) => {
    if (event.target.value.trim() === '') {
        clearUI();
    }
});

optionsMenu.addEventListener('click', (event) => {
    event.stopPropagation();
    languageDropdown.classList.toggle('hidden');
});

window.addEventListener('click', function(event) {
  if (!optionsMenu.contains(event.target)) {
    languageDropdown.classList.add('hidden');
  }
});

languageDropdown.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link) {
        const lang = link.dataset.lang;
        if (lang) {
            setLanguage(lang);
        }
    }
});
