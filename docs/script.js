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
    document.getElementById('page-title').textContent = t('page_title'); // Update page title
    document.querySelector('.responsive-title').textContent = t('weather_app_title');
    document.getElementById('city-input').placeholder = t('enter_city_placeholder');
    document.querySelector('#search-btn span').textContent = t('search_button');
    document.querySelector('#location-btn span').textContent = t('location_button');
    

    

    document.getElementById('attribution-author').innerHTML = t('attribution_author');
    document.querySelector('[data-i18n="osm_attribution"]').innerHTML = 'Data &copy; OpenStreetMap contributors, ODbL 1.0. <a href="http://osm.org/copyright" target="_blank" class="text-blue-500 hover:underline">http://osm.org/copyright</a>';


    if (lastWeatherData) {
        // Re-render weather info
        displayWeather(lastWeatherData);
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
    const link = event.target.closest('a');
    if (link) {
        const lang = link.dataset.lang;
        if (lang) {
            currentLanguage = lang;
            const flagImg = document.getElementById('selected-lang-flag');
            if (lang === 'en') {
                flagImg.src = 'https://flagcdn.com/w40/us.png';
            } else if (lang === 'es') {
                flagImg.src = 'https://flagcdn.com/w40/es.png';
            }
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
    } catch (error) {
    }
};

// Fallback for web development
if (typeof Capacitor === 'undefined') {
}

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const weatherMainContent = document.getElementById('weather-main-content'); // Updated reference
const forecastContainer = document.getElementById('forecast-container');
const locationInfoDiv = document.getElementById('location-info');
const loaderContainer = document.querySelector('.loader-container');
let timeInterval; // To hold the interval for time updates

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
        weatherMainContent.innerHTML = ''; // Updated reference
        forecastContainer.innerHTML = '';
        locationInfoDiv.innerHTML = '';

        try {
            const coordinates = await getCoordinates(cityName);
            const weather = await getWeatherData(coordinates.latitude, coordinates.longitude);
            const displayData = { ...coordinates, ...weather };
            displayWeather(displayData);
            await displayLocationInfo(coordinates.latitude, coordinates.longitude);
        } catch (error) {
            displayError(error.message);
        } finally {
            hideLoader();
        }
    }
};

const handleLocation = async () => {
    showLoader();
    weatherMainContent.innerHTML = ''; // Updated reference
    forecastContainer.innerHTML = '';
    locationInfoDiv.innerHTML = '';

    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.Geolocation) {
        try {
            const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
            const position = await Capacitor.Plugins.Geolocation.getCurrentPosition(options);
            const { latitude, longitude } = position.coords;
            const weather = await getWeatherData(latitude, longitude);
            const coordinates = { latitude, longitude }; // Create coordinates object for consistency
            const displayData = { ...coordinates, ...weather };
            displayWeather(displayData);
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
        weatherMainContent.innerHTML = ''; // Updated reference
        forecastContainer.innerHTML = '';
        locationInfoDiv.innerHTML = '';
        if (timeInterval) {
            clearInterval(timeInterval);
        }
    }
});

async function getCoordinates(cityName) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${cityName}&format=json&addressdetails=1`);
    if (!response.ok) throw new Error(t('fetch_coords_error'));
    const data = await response.json();

    let bestResult = null;
    let bestRank = Infinity;

    // Prioritize results that are cities, towns, or villages with a good place_rank
    for (const result of data) {
        let currentRank = Infinity;
        if (result.class === 'place') {
            if (result.type === 'city' && result.place_rank === 15) {
                currentRank = 15; // User's preferred rank for city
            } else if (result.type === 'town' && result.place_rank === 16) {
                currentRank = 16; // User's preferred rank for town
            } else if (result.type === 'village' && result.place_rank === 17) {
                currentRank = 17; // User's preferred rank for village
            }
        }

        if (currentRank < bestRank) {
            bestRank = currentRank;
            bestResult = result;
        }
    }

    // If no specific city/town/village found based on user's ranks, try administrative boundaries with a good rank
    if (!bestResult) {
        for (const result of data) {
            if (result.class === 'boundary' && result.type === 'administrative') {
                if (!bestResult || result.place_rank < bestResult.place_rank) {
                    bestResult = result;
                }
            }
        }
    }

    if (bestResult) {
        return { latitude: bestResult.lat, longitude: bestResult.lon, type: bestResult.type, boundingbox: bestResult.boundingbox || null };
    } else if (data.length > 0) {
        // Fallback to the first result if no better result is found
        return { latitude: data[0].lat, longitude: data[0].lon, type: data[0].type, boundingbox: data[0].boundingbox || null };
    }
    throw new Error(t('city_not_found_error'));
}

async function getWeatherData(latitude, longitude) {
    const API_URL = 'https://api.open-meteo.com/v1/forecast';
    const params = `?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,visibility,weather_code,is_day,wind_speed_10m&hourly=temperature_2m,weathercode,wind_speed_10m,relative_humidity_2m,visibility&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`;
    const response = await fetch(`${API_URL}${params}`);
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
        locationInfoDiv.innerHTML = `<p class="text-gray-600 text-lg text-center font-semibold">📍 ${locationString}</p>`;
    } catch (error) {
        displayError(error.message);
    }
}

function displayError(message) {
    weatherMainContent.innerHTML = `<div class="weather-info-container"><p class="text-red-500 font-bold text-center text-lg">${message}</p></div>`;
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

function getWeatherBackgroundColor(weatherCode) {
    // Map weather codes to background colors
    if (weatherCode >= 0 && weatherCode <= 1) return '#fcd34d'; // Sunny - yellow-400
    if (weatherCode >= 2 && weatherCode <= 3) return '#9ca3af'; // Cloudy - gray-400
    if (weatherCode >= 45 && weatherCode <= 48) return '#6b7280'; // Fog - gray-500
    if (weatherCode >= 51 && weatherCode <= 67) return '#3b82f6'; // Rain - blue-500
    if (weatherCode >= 71 && weatherCode <= 77) return '#ffffff'; // Snow - white
    if (weatherCode >= 80 && weatherCode <= 82) return '#2563eb'; // Showers - blue-600
    if (weatherCode >= 85 && weatherCode <= 86) return '#ffffff'; // Snow showers - white
    if (weatherCode >= 95 && weatherCode <= 99) return '#f59e0b'; // Thunderstorm - yellow-500
    return '#e5e7eb'; // Default - gray-200
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getWeatherDescription(weatherCode) {
    switch (weatherCode) {
        case 0:
            return t('clear_sky');
        case 1:
            return t('mainly_clear');
        case 2:
            return t('partly_cloudy');
        case 3:
            return t('overcast');
        case 45:
        case 48:
            return t('fog');
        case 51:
        case 53:
        case 55:
            return t('drizzle');
        case 56:
        case 57:
            return t('freezing_drizzle');
        case 61:
        case 63:
        case 65:
            return t('rain');
        case 66:
        case 67:
            return t('freezing_rain');
        case 71:
        case 73:
        case 75:
            return t('snow_fall');
        case 77:
            return t('snow_grains');
        case 80:
        case 81:
        case 82:
            return t('rain_showers');
        case 85:
        case 86:
            return t('snow_showers');
        case 95:
            return t('thunderstorm');
        case 96:
        case 99:
            return t('thunderstorm_with_hail');
        default:
            return t('unknown_weather');
    }
}

let lastWeatherData = null;

function updateTime(timezone) {
    const timeElement = document.getElementById('time-display');
    if (timeElement && timezone) {
        const now = new Date();
        const options = {
            timeZone: timezone,
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        };
        timeElement.textContent = new Intl.DateTimeFormat('en-US', options).format(now);
    }
}

function displayWeather(data) {


    lastWeatherData = data;

    const locale = currentLanguage === 'es' ? 'es-ES' : 'en-US';

    if (!data || !data.current || !data.daily) {
        displayError(t('invalid_weather_data'));
        return;
    }

    const weather = data.current;
    const isDay = weather.is_day === 1;
    const weatherIcon = weatherIcons[weather.weather_code] ? (isDay ? weatherIcons[weather.weather_code].day : weatherIcons[weather.weather_code].night) : 'wi wi-na';
    const iconColor = getWeatherIconColor(weather.weather_code);
    const backgroundColor = getWeatherBackgroundColor(weather.weather_code);

    let osmBbox;
    let mapSrc;

    if (Array.isArray(data.boundingbox) && data.boundingbox.length === 4) {
            const bbox = data.boundingbox;
            const minLat = parseFloat(bbox[0]);
            const maxLat = parseFloat(bbox[1]);
            const minLon = parseFloat(bbox[2]);
            const maxLon = parseFloat(bbox[3]);

            // Reorder for OpenStreetMap bbox parameter: min_lon,min_lat,max_lon,max_lat
            osmBbox = `${minLon},${minLat},${maxLon},${maxLat}`;
            mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${osmBbox}&amp;layer=mapnik&amp;marker=${data.latitude},${data.longitude}`;
        } else {
            // Fallback if boundingbox is not available or invalid
            // Use a small fixed bbox around the marker
            mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${data.longitude - 0.1},${data.latitude - 0.1},${data.longitude + 0.1},${data.latitude + 0.1}&amp;layer=mapnik&amp;marker=${data.latitude},${data.longitude}`;
        }

        const weatherInfoHtml = `
            <div id="weather-info" class="weather-info-container" style="background-color: ${hexToRgba(backgroundColor, 0.4)};">
                <h2 class="text-3xl font-bold text-gray-700 text-center mb-2">${t('current_weather_title')}</h2>
                <p class="text-center text-gray-500 mb-4" id="time-display"></p>
                <div class="weather-icon-temp-container">
                    <i class="${weatherIcon} text-7xl ${iconColor}"></i>
                    <p class="text-5xl font-bold text-gray-800">${Math.round(weather.temperature_2m)}°C</p>
                </div>
                <p class="text-lg text-gray-600 text-center mt-2">${getWeatherDescription(weather.weather_code)}</p>
                <div class="weather-details mt-4 text-center flex justify-around items-start">
                    <div class="detail-item flex flex-col items-center">
                        <i class="wi wi-strong-wind text-2xl mb-1"></i>
                        <div class="text-gray-600 text-lg">${t('wind_speed_label')}</div>
                        <p class="text-gray-800 text-xl font-bold">${weather.wind_speed_10m} ${t('unit_km_per_hour')}</p>
                    </div>
                    <div class="detail-item flex flex-col items-center">
                        <i class="wi wi-humidity text-2xl mb-1"></i>
                        <div class="text-gray-600 text-lg">${t('humidity_label')}</div>
                        <p class="text-gray-800 text-xl font-bold">${weather.relative_humidity_2m}${t('unit_percent')}</p>
                    </div>
                    <div class="detail-item flex flex-col items-center">
                        <i class="wi wi-fog text-2xl mb-1"></i>
                        <div class="text-gray-600 text-lg">${t('visibility_label')}</div>
                        <p class="text-gray-800 text-xl font-bold">${weather.visibility / 1000} ${t('unit_km')}</p>
                    </div>
                </div>
            </div>
        `;;

        const mapHtml = `
            <div id="map">
                <iframe
                    width="100%"
                    height="400px"
                    frameborder="0" style="border:0; border-radius: 16px;"
                    src="${mapSrc}"
                    allowfullscreen>
                </iframe>
            </div>
        `;

        const hourly = data.hourly;
        let hourlyForecastHTML = `<h3 class="col-span-full text-2xl font-bold text-gray-700 mb-4 text-center">${t('hourly_forecast_title')}</h3>`;

        const currentHour = new Date().getHours();
        const startIndex = hourly.time.findIndex(time => new Date(time).getHours() === currentHour);

        const nextFourHoursTime = hourly.time.slice(startIndex, startIndex + 4);
        const nextFourHoursWeatherCode = hourly.weathercode.slice(startIndex, startIndex + 4);
        const nextFourHoursTemp = hourly.temperature_2m.slice(startIndex, startIndex + 4);
        const nextFourHoursWindSpeed = hourly.wind_speed_10m.slice(startIndex, startIndex + 4);
        const nextFourHoursHumidity = hourly.relative_humidity_2m.slice(startIndex, startIndex + 4);
        const nextFourHoursVisibility = hourly.visibility.slice(startIndex, startIndex + 4);

        for (let i = 0; i < nextFourHoursTime.length; i++) {
            const hour = new Date(nextFourHoursTime[i]);
            const formattedHour = hour.toLocaleTimeString(locale, { hour: 'numeric', hour12: true });

            const hourlyIcon = weatherIcons[nextFourHoursWeatherCode[i]] ? weatherIcons[nextFourHoursWeatherCode[i]].day : 'wi wi-na';
            const hourlyIconColor = getWeatherIconColor(nextFourHoursWeatherCode[i]);
            const weatherDescription = getWeatherDescription(nextFourHoursWeatherCode[i]);

            hourlyForecastHTML += `
                <div class="forecast-item text-center transform transition-transform duration-300 hover:scale-105" style="background-color: ${hexToRgba(getWeatherBackgroundColor(nextFourHoursWeatherCode[i]), 0.4)}; justify-content: space-between;">
                    <p class="font-semibold text-gray-600 mb-2">${formattedHour}</p>
                    <i class="${hourlyIcon} text-4xl ${hourlyIconColor} my-2"></i>
                    <p class="text-xs text-gray-500">${weatherDescription}</p>
                    <p class="text-sm text-gray-500">${Math.round(nextFourHoursTemp[i])}°C</p>
                    <div class="flex justify-center items-center text-xs text-gray-500 mt-1">
                        <i class="wi wi-strong-wind mr-1"></i> ${nextFourHoursWindSpeed[i]} ${t('unit_km_per_hour')}
                    </div>
                    <div class="flex justify-center items-center text-xs text-gray-500">
                        <i class="wi wi-humidity mr-1"></i> ${nextFourHoursHumidity[i]}${t('unit_percent')}
                    </div>
                    <div class="flex justify-center items-center text-xs text-gray-500">
                        <i class="wi wi-fog mr-1"></i> ${Math.round(nextFourHoursVisibility[i] / 1000)} ${t('unit_km')}
                    </div>
                </div>
            `;
        }
        // Wrap in a container similar to forecastContainer
        hourlyForecastHTML = `<div class="hourly-forecast-container grid mt-8">${hourlyForecastHTML}</div>`;

        const forecast = data.daily;
        let forecastHTML = `<h3 class="col-span-full text-2xl font-bold text-gray-700 mb-4 text-center">${t('forecast_title')}</h3>`;

        const nextFiveDaysTime = forecast.time.slice(1, 5);
        const nextFiveDaysWeatherCode = forecast.weathercode.slice(1, 5);
        const nextFiveDaysTempMax = forecast.temperature_2m_max.slice(1, 5);
        const nextFiveDaysTempMin = forecast.temperature_2m_min.slice(1, 5);

        for (let i = 0; i < nextFiveDaysTime.length; i++) {
            const day = new Date(nextFiveDaysTime[i]);
            const weekday = day.toLocaleDateString(locale, { weekday: 'short' });
            const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

            const forecastIcon = weatherIcons[nextFiveDaysWeatherCode[i]] ? weatherIcons[nextFiveDaysWeatherCode[i]].day : 'wi wi-na';
            const forecastIconColor = getWeatherIconColor(nextFiveDaysWeatherCode[i]);
            forecastHTML += `
                <div class="forecast-item text-center transform transition-transform duration-300 hover:scale-105" style="background-color: ${hexToRgba(getWeatherBackgroundColor(nextFiveDaysWeatherCode[i]), 0.4)};">
                    <p class="font-semibold text-gray-600 mb-2">${capitalizedWeekday}</p>
                    <i class="${forecastIcon} text-4xl ${forecastIconColor} my-2"></i>
                    <p class="text-xs text-gray-500">${getWeatherDescription(nextFiveDaysWeatherCode[i])}</p>
                    <p class="text-sm text-gray-500">${Math.round(nextFiveDaysTempMax[i])}${t('unit_celsius')} / ${Math.round(nextFiveDaysTempMin[i])}${t('unit_celsius')}</p>
                </div>
            `;
        }
        forecastHTML = `<div class="daily-forecast-container grid mt-8">${forecastHTML}</div>`; // Wrap daily forecast

        weatherMainContent.innerHTML = `
            <div class="flex flex-wrap -mx-2">
                <div class="w-full lg:w-1/2 px-2 mb-4">
                    ${weatherInfoHtml}
                </div>
                <div class="w-full lg:w-1/2 px-2 mb-4">
                    ${mapHtml}
                </div>
            </div>
            <div class="flex flex-wrap -mx-2">
                <div class="w-full lg:w-1/2 px-2 mb-4">
                    ${hourlyForecastHTML}
                </div>
                <div class="w-full lg:w-1/2 px-2 mb-4">
                    ${forecastHTML}
                </div>
            </div>
        `;

    const timezone = data.timezone;
    if (timeInterval) {
        clearInterval(timeInterval);
    }
    updateTime(timezone);
    timeInterval = setInterval(() => updateTime(timezone), 60000);
}