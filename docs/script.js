// Internationalization (i18n)
let currentLanguage = 'en';
let translations = {};

// Function to load translations
async function loadTranslations(lang) {
    try {
        const response = await fetch(`${lang}.json?v=${new Date().getTime()}`);
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

// Function to get translated string
function t(key) {
    return translations[key] || key;
}

// Update UI with translated text
function updateUI() {
    document.querySelector('.responsive-title').textContent = t('weather_app_title');
    document.getElementById('city-input').placeholder = t('enter_city_placeholder');
    document.querySelector('#search-btn span').textContent = t('search_button');
    document.querySelector('#location-btn span').textContent = t('location_button');
    document.getElementById('options-menu').firstChild.textContent = t('language');
    document.getElementById('attribution-author').innerHTML = t('attribution_author');

    if (lastWeatherData) {
        // Re-render weather info
        const weatherInfoDiv = document.getElementById('weather-info');
        if (weatherInfoDiv.innerHTML) {
            weatherInfoDiv.querySelector('h2').textContent = t('current_weather_title');
            const tempLabel = weatherInfoDiv.querySelector('p:nth-of-type(2)');
            if (tempLabel) {
                const tempValue = tempLabel.textContent.split(':')[1];
                tempLabel.textContent = `${t('temperature_label')}: ${tempValue}`;
            }
            const windLabel = weatherInfoDiv.querySelector('p:nth-of-type(3)');
            if (windLabel) {
                const windValue = windLabel.textContent.split(':')[1];
                windLabel.textContent = `${t('wind_speed_label')}: ${windValue}`;
            }
            updateTime(lastWeatherData.timezone);
        }

        // Re-render forecast
        const forecast = lastWeatherData.daily;
        const forecastContainer = document.getElementById('forecast-container');
        if (forecastContainer.innerHTML) {
            let forecastHTML = `<h3 class="col-span-full text-2xl font-bold text-gray-700 mb-4 text-center">${t('forecast_title')}</h3>`;
            
            const nextFiveDaysTime = forecast.time.slice(1, 6);
            const nextFiveDaysWeatherCode = forecast.weathercode.slice(1, 6);
            const nextFiveDaysTempMax = forecast.temperature_2m_max.slice(1, 6);
            const nextFiveDaysTempMin = forecast.temperature_2m_min.slice(1, 6);

            const locale = currentLanguage === 'es' ? 'es-ES' : 'en-US';
            for (let i = 0; i < nextFiveDaysTime.length; i++) {
                const day = new Date(nextFiveDaysTime[i]);
                const weekday = day.toLocaleDateString(locale, { weekday: 'short' });
                const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

                const forecastIcon = weatherIcons[nextFiveDaysWeatherCode[i]] ? weatherIcons[nextFiveDaysWeatherCode[i]].day : 'wi wi-na';
                const forecastIconColor = getWeatherIconColor(nextFiveDaysWeatherCode[i]);
                forecastHTML += `
                    <div class="forecast-item text-center transform transition-transform duration-300 hover:scale-105">
                        <p class="font-semibold text-gray-600 mb-2">${capitalizedWeekday}</p>
                        <i class="${forecastIcon} text-4xl ${forecastIconColor} my-2"></i>
                        <p class="text-sm text-gray-500">${Math.round(nextFiveDaysTempMax[i])}°C / ${Math.round(nextFiveDaysTempMin[i])}°C</p>
                    </div>
                `;
            }
            forecastContainer.innerHTML = forecastHTML;
        }
    }
}

// Dropdown menu logic
const optionsMenu = document.getElementById('options-menu');
const languageDropdown = document.getElementById('language-dropdown');

optionsMenu.addEventListener('click', (event) => {
    event.stopPropagation();
    languageDropdown.classList.toggle('hidden');
});

// Close the dropdown if the user clicks outside of it
window.addEventListener('click', function(event) {
  if (!optionsMenu.contains(event.target)) {
    languageDropdown.classList.add('hidden');
  }
});

languageDropdown.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') {
        const lang = event.target.dataset.lang;
        if (lang) {
            currentLanguage = lang;
            loadTranslations(currentLanguage);
            languageDropdown.classList.add('hidden');
        }
    }
});

// Status Bar Management
let StatusBar;

// Initialize Status Bar when Capacitor is ready
document.addEventListener('deviceready', () => {
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.StatusBar) {
        StatusBar = Capacitor.Plugins.StatusBar;
        initializeStatusBar();
    }
});

// Also try to initialize when DOM is loaded (for web testing)
document.addEventListener('DOMContentLoaded', () => {
    // Load default language
    loadTranslations(currentLanguage);

    // Small delay to ensure Capacitor is ready
    setTimeout(() => {
        if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.StatusBar) {
            StatusBar = Capacitor.Plugins.StatusBar;
            initializeStatusBar();
        }
    }, 100);
});

// Initialize Status Bar settings
const initializeStatusBar = async () => {
    try {
        if (Capacitor.getPlatform() === 'ios') {
            await Capacitor.Plugins.StatusBar.setStyle({ style: 'LIGHT' });
            await Capacitor.Plugins.StatusBar.setBackgroundColor({ color: '#667eea' });
            await Capacitor.Plugins.StatusBar.setOverlaysWebView({ overlay: true });
        } else if (Capacitor.getPlatform() === 'android') {
            await Capacitor.Plugins.StatusBar.setStyle({ style: 'LIGHT' });
            await Capacitor.Plugins.StatusBar.setBackgroundColor({ color: '#667eea' });
            await Capacitor.Plugins.StatusBar.setOverlaysWebView({ overlay: true });
        }
        console.log('Status Bar initialized successfully');
    } catch (error) {
        console.log('Status Bar not available:', error);
    }
};

// Fallback for web development
if (typeof Capacitor === 'undefined') {
    console.log('Running in web mode - Status Bar features disabled');
}

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const weatherInfo = document.getElementById('weather-info');
const forecastContainer = document.getElementById('forecast-container');
const locationInfoDiv = document.getElementById('location-info');
const loaderContainer = document.querySelector('.loader-container');
let timeInterval; // To hold the interval for time updates

// Background management system
const backgroundManager = {
    setBackground(type) { /* do nothing */ },
    setWeatherBackground(weatherCode) { /* do nothing */ },
    resetToDefault() { /* do nothing */ }
};

const showLoader = () => {
    loaderContainer.classList.remove('hidden');
    loaderContainer.classList.add('flex');
};

const hideLoader = () => {
    loaderContainer.classList.add('hidden');
    loaderContainer.classList.remove('flex');
};

const handleSearch = async () => {
    const cityName = cityInput.value.trim();
    if (cityName) {
        showLoader();
        weatherInfo.innerHTML = '';
        forecastContainer.innerHTML = '';
        locationInfoDiv.innerHTML = '';
        weatherInfo.classList.remove('opacity-100', 'translate-y-0');
        weatherInfo.classList.add('opacity-0', 'translate-y-5');

        try {
            const coordinates = await getCoordinates(cityName);
            const weather = await getWeatherData(coordinates.latitude, coordinates.longitude);
            
            // Set white background for weather results
            // backgroundManager.setBackground('white');
            
            displayWeather(weather);
            await displayLocationInfo(coordinates.latitude, coordinates.longitude);
        } catch (error) {
            displayError(error.message);
        } finally {
            hideLoader();
        }
    }
};

const handleLocation = async () => {
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.Geolocation) {
        showLoader();
        weatherInfo.innerHTML = '';
        forecastContainer.innerHTML = '';
        locationInfoDiv.innerHTML = '';
        weatherInfo.classList.remove('opacity-100', 'translate-y-0');
        weatherInfo.classList.add('opacity-0', 'translate-y-5');

        try {
            const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
            const position = await Capacitor.Plugins.Geolocation.getCurrentPosition(options);
            const { latitude, longitude } = position.coords;
            
            const weather = await getWeatherData(latitude, longitude);
            
            displayWeather(weather);
            await displayLocationInfo(latitude, longitude);
        } catch (error) {
            let message;
            switch (error.code) {
                case 'PERMISSION_DENIED':
                    message = t('geolocation_permission_denied');
                    break;
                case 'POSITION_UNAVAILABLE':
                    message = t('geolocation_position_unavailable');
                    break;
                case 'TIMEOUT':
                    message = t('geolocation_timeout');
                    break;
                default:
                    message = `${t('geolocation_error')}: ${error.message}`;
                    break;
            }
            displayError(message);
        } finally {
            hideLoader();
        }
    } else if (navigator.geolocation) {
        // Fallback for web browsers if Capacitor Geolocation is not available
        showLoader();
        weatherInfo.innerHTML = '';
        forecastContainer.innerHTML = '';
        locationInfoDiv.innerHTML = '';
        weatherInfo.classList.remove('opacity-100', 'translate-y-0');
        weatherInfo.classList.add('opacity-0', 'translate-y-5');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const weather = await getWeatherData(latitude, longitude);
                    
                    displayWeather(weather);
                    await displayLocationInfo(latitude, longitude);
                } catch (error) {
                    displayError(error.message);
                } finally {
                    hideLoader();
                }
            },
            (error) => {
                let message;
                switch (error.code) {
                    case 1:
                        message = t('geolocation_permission_denied');
                        break;
                    case 2:
                        message = t('geolocation_position_unavailable');
                        break;
                    case 3:
                        message = t('geolocation_timeout');
                        break;
                    default:
                        message = `${t('geolocation_error')}: ${error.message}`;
                        break;
                }
                displayError(message);
                hideLoader();
            }
        );
    } else {
        displayError(t('geolocation_not_supported'));
    }
};

searchBtn.addEventListener('click', handleSearch);
locationBtn.addEventListener('click', handleLocation);
cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

// Reset to default background when input is cleared
cityInput.addEventListener('input', (event) => {
    if (event.target.value.trim() === '') {
        // Clear weather info and reset to default background
        weatherInfo.innerHTML = '';
        forecastContainer.innerHTML = '';
        locationInfoDiv.innerHTML = '';
        weatherInfo.classList.remove('opacity-100', 'translate-y-0');
        weatherInfo.classList.add('opacity-0', 'translate-y-5');
        backgroundManager.resetToDefault();
        if (timeInterval) {
            clearInterval(timeInterval); // Stop the time updates
        }
    }
});

// Initialize with default background
backgroundManager.resetToDefault();

async function getCoordinates(cityName) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${cityName}&format=json&limit=1`);
    if (!response.ok) throw new Error(t('fetch_coords_error'));
    const data = await response.json();
    if (data.length > 0) return { latitude: data[0].lat, longitude: data[0].lon };
    throw new Error(t('city_not_found_error'));
}

async function getWeatherData(latitude, longitude) {
    const API_URL = 'https://api.open-meteo.com/v1/forecast';
    const response = await fetch(`${API_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`);
    if (!response.ok) throw new Error(t('fetch_weather_error'));
    return await response.json();
}

async function getCityName(latitude, longitude) {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
    if (!response.ok) throw new Error(t('fetch_city_name_error'));
    const data = await response.json();
    const city = data.address.city || data.address.town || data.address.village || 'Unknown Location';
    const state = data.address.state || '';
    const country = data.address.country || '';
    return { city, state, country };
}

async function displayLocationInfo(latitude, longitude) {
    try {
        const location = await getCityName(latitude, longitude);
        const locationString = [location.city, location.state, location.country].filter(Boolean).join(', ');
        locationInfoDiv.innerHTML = `
            <div class="weather-info-container">
                <p class="text-gray-600 text-lg text-center font-semibold">📍 ${locationString}</p>
            </div>
        `;
    } catch (error) {
        displayError(error.message);
    }
}

function displayError(message) {
    // Set white background for error display
    backgroundManager.setBackground('white');
    
    weatherInfo.innerHTML = `
        <div class="weather-info-container">
            <p class="text-red-500 font-bold text-center text-lg">${message}</p>
        </div>
    `;
    weatherInfo.classList.remove('opacity-0', 'translate-y-5');
    weatherInfo.classList.add('opacity-100', 'translate-y-0');
}

function getWeatherIconColor(weatherCode) {
    const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
    if (weatherCode >= 0 && weatherCode <= 1) return 'text-yellow-400'; // Sunny
    if (weatherCode >= 2 && weatherCode <= 3) return 'text-gray-400'; // Cloudy
    if (weatherCode >= 45 && weatherCode <= 48) return 'text-gray-500'; // Fog
    if (weatherCode >= 51 && weatherCode <= 67) return 'text-blue-500'; // Rain
    if (weatherCode >= 71 && weatherCode <= 77) return 'text-white'; // Snow
    if (weatherCode >= 80 && weatherCode <= 82) return 'text-blue-600'; // Showers
    if (weatherCode >= 85 && weatherCode <= 86) return 'text-white'; // Snow showers
    if (weatherCode >= 95 && weatherCode <= 99) return 'text-yellow-500'; // Thunderstorm
    return isDay ? 'text-gray-800' : 'text-gray-200'; // Default
}

let lastWeatherData = null;

function displayWeather(data) {
    lastWeatherData = data;

    if (!data || !data.current_weather || !data.daily) {
        displayError(t('invalid_weather_data'));
        return;
    }

    const weather = data.current_weather;
    const isDay = weather.is_day === 1;
    const weatherIcon = weatherIcons[weather.weathercode] ? (isDay ? weatherIcons[weather.weathercode].day : weatherIcons[weather.weathercode].night) : 'wi wi-na';
    const iconColor = getWeatherIconColor(weather.weathercode);

    weatherInfo.innerHTML = `
        <div class="weather-info-container">
            <h2 class="text-3xl font-bold text-gray-700 text-center mb-4">${t('current_weather_title')}</h2>
            <div class="text-center">
                <i class="${weatherIcon} text-7xl ${iconColor} my-4"></i>
                <p id="date-time" class="text-xl text-gray-600 mb-2"></p>
                <p class="text-xl text-gray-600 mb-2">${t('temperature_label')}: ${weather.temperature}°C</p>
                <p class="text-xl text-gray-600">${t('wind_speed_label')}: ${weather.windspeed} km/h</p>
            </div>
        </div>
    `;

    const forecast = data.daily;
    let forecastHTML = `<h3 class="col-span-full text-2xl font-bold text-gray-700 mb-4 text-center">${t('forecast_title')}</h3>`;
    
    const nextFiveDaysTime = forecast.time.slice(1, 6);
    const nextFiveDaysWeatherCode = forecast.weathercode.slice(1, 6);
    const nextFiveDaysTempMax = forecast.temperature_2m_max.slice(1, 6);
    const nextFiveDaysTempMin = forecast.temperature_2m_min.slice(1, 6);

    const locale = currentLanguage === 'es' ? 'es-ES' : 'en-US';
    for (let i = 0; i < nextFiveDaysTime.length; i++) {
        const day = new Date(nextFiveDaysTime[i]);
        const weekday = day.toLocaleDateString(locale, { weekday: 'short' });
        const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

        const forecastIcon = weatherIcons[nextFiveDaysWeatherCode[i]] ? weatherIcons[nextFiveDaysWeatherCode[i]].day : 'wi wi-na'; // Always use day icons for forecast
        const forecastIconColor = getWeatherIconColor(nextFiveDaysWeatherCode[i]);
        forecastHTML += `
            <div class="forecast-item text-center transform transition-transform duration-300 hover:scale-105">
                <p class="font-semibold text-gray-600 mb-2">${capitalizedWeekday}</p>
                <i class="${forecastIcon} text-4xl ${forecastIconColor} my-2"></i>
                <p class="text-sm text-gray-500">${Math.round(nextFiveDaysTempMax[i])}°C / ${Math.round(nextFiveDaysTempMin[i])}°C</p>
            </div>
        `;
    }
    forecastContainer.innerHTML = forecastHTML;

    weatherInfo.classList.remove('opacity-0', 'translate-y-5');
    weatherInfo.classList.add('opacity-100', 'translate-y-0');

    const timezone = data.timezone;
    if (timeInterval) {
        clearInterval(timeInterval);
    }
    updateTime(timezone);
    timeInterval = setInterval(() => updateTime(timezone), 60000); // Update time every minute
}

function updateTime(timezone) {
    const dateTimeElement = document.getElementById('date-time');
    if (dateTimeElement && timezone) {
        const now = new Date();
        const locale = currentLanguage === 'es' ? 'es-ES' : 'en-US';
        const options = {
            timeZone: timezone,
            month: 'long',
            day: 'numeric',
            weekday: 'long',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        };
        const formatter = new Intl.DateTimeFormat(locale, options);
        
        if (locale === 'es-ES') {
            const parts = formatter.formatToParts(now);
            const weekday = parts.find(p => p.type === 'weekday').value;
            const month = parts.find(p => p.type === 'month').value;
            
            const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
            const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);

            const day = parts.find(p => p.type === 'day').value;
            const hour = parts.find(p => p.type === 'hour').value;
            const minute = parts.find(p => p.type === 'minute').value;
            const dayPeriod = parts.find(p => p.type === 'dayPeriod').value.toLowerCase();

            dateTimeElement.textContent = `${capitalizedWeekday}, ${day} de ${capitalizedMonth}, ${hour}:${minute}${dayPeriod}`;
        } else {
            dateTimeElement.textContent = formatter.format(now);
        }
    }
}