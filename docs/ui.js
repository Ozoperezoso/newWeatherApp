import { setLastWeatherData } from './state.js';
import { t, currentLanguage } from './i18n.js';
import { getCityName } from './api.js';

const weatherMainContent = document.getElementById('weather-main-content');
const forecastContainer = document.getElementById('forecast-container');
const locationInfoDiv = document.getElementById('location-info');
const loaderPopup = document.getElementById('loader-popup');
const loaderText = document.getElementById('loader-text');
const weatherContent = document.getElementById('weather-content');

let timeInterval;

export const showLoader = (location) => {
    loaderText.textContent = `${t('loading_results_for')} ${location}`;
    loaderPopup.classList.remove('hidden');
    loaderPopup.classList.add('flex');
    weatherContent.classList.add('hidden');
};

export const hideLoader = () => {
    loaderPopup.classList.add('hidden');
    loaderPopup.classList.remove('flex');
    weatherContent.classList.remove('hidden');
};

export async function displayLocationInfo(latitude, longitude) {
    try {
        const location = await getCityName(latitude, longitude);
        const locationString = [location.city, location.state, location.country].filter(Boolean).join(', ');
        locationInfoDiv.innerHTML = `<p class="text-gray-600 text-lg text-center font-semibold">📍 ${locationString}</p>`;
    } catch (error) {
        displayError(error.message);
    }
}

export function displayError(message) {
    weatherMainContent.innerHTML = `<div class="weather-info-container"><p class="text-red-500 font-bold text-center text-lg">${message}</p></div>`;
}

function getWeatherIconColor(weatherCode) {
    const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
    if (weatherCode >= 0 && weatherCode <= 1) return 'text-yellow-400';
    if (weatherCode >= 2 && weatherCode <= 3) return 'text-gray-400';
    if (weatherCode >= 45 && weatherCode <= 48) return 'text-gray-500';
    if (weatherCode >= 51 && weatherCode <= 67) return 'text-blue-500';
    if (weatherCode >= 71 && weatherCode <= 77) return 'text-white';
    if (weatherCode >= 80 && weatherCode <= 82) return 'text-blue-600';
    if (weatherCode >= 85 && weatherCode <= 86) return 'text-white';
    if (weatherCode >= 95 && weatherCode <= 99) return 'text-yellow-500';
    return isDay ? 'text-gray-800' : 'text-gray-200';
}

function getWeatherBackgroundColor(weatherCode) {
    if (weatherCode >= 0 && weatherCode <= 1) return '#fcd34d';
    if (weatherCode >= 2 && weatherCode <= 3) return '#9ca3af';
    if (weatherCode >= 45 && weatherCode <= 48) return '#6b7280';
    if (weatherCode >= 51 && weatherCode <= 67) return '#3b82f6';
    if (weatherCode >= 71 && weatherCode <= 77) return '#ffffff';
    if (weatherCode >= 80 && weatherCode <= 82) return '#2563eb';
    if (weatherCode >= 85 && weatherCode <= 86) return '#ffffff';
    if (weatherCode >= 95 && weatherCode <= 99) return '#f59e0b';
    return '#e5e7eb';
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getWeatherDescription(weatherCode) {
    switch (weatherCode) {
        case 0: return t('clear_sky');
        case 1: return t('mainly_clear');
        case 2: return t('partly_cloudy');
        case 3: return t('overcast');
        case 45: case 48: return t('fog');
        case 51: case 53: case 55: return t('drizzle');
        case 56: case 57: return t('freezing_drizzle');
        case 61: case 63: case 65: return t('rain');
        case 66: case 67: return t('freezing_rain');
        case 71: case 73: case 75: return t('snow_fall');
        case 77: return t('snow_grains');
        case 80: case 81: case 82: return t('rain_showers');
        case 85: case 86: return t('snow_showers');
        case 95: return t('thunderstorm');
        case 96: case 99: return t('thunderstorm_with_hail');
        default: return t('unknown_weather');
    }
}

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

export async function displayWeather(data) {
    setLastWeatherData(data);

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
        osmBbox = `${minLon},${minLat},${maxLon},${maxLat}`;
        mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${osmBbox}&amp;layer=mapnik&amp;marker=${data.latitude},${data.longitude}`;
    } else {
        mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${data.longitude - 0.1},${data.latitude - 0.1},${data.longitude + 0.1},${data.latitude + 0.1}&amp;layer=mapnik&amp;marker=${data.latitude},${data.longitude}`;
    }

    const weatherInfoHtml = `
        <div id="weather-info" class="weather-info-container" style="background-color: ${hexToRgba(backgroundColor, 0.4)}; visibility: hidden;">
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
    `;

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
        const formattedHour = hour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

        const hourlyIcon = weatherIcons[nextFourHoursWeatherCode[i]] ? weatherIcons[nextFourHoursWeatherCode[i]].day : 'wi wi-na';
        const hourlyIconColor = getWeatherIconColor(nextFourHoursWeatherCode[i]);
        const weatherDescription = getWeatherDescription(nextFourHoursWeatherCode[i]);

        hourlyForecastHTML += `
            <div class="forecast-item text-center transform transition-transform duration-300 hover:scale-105" style="background-color: ${hexToRgba(getWeatherBackgroundColor(nextFourHoursWeatherCode[i]), 0.4)}; justify-content: space-between; animation-delay: ${i * 100}ms;">
                <p class="font-semibold text-gray-600 mb-2">${formattedHour}</p>
                <i class="${hourlyIcon} text-4xl ${hourlyIconColor} my-2 animate__animated animate__fadeIn"></i>
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
    hourlyForecastHTML = `<div class="hourly-forecast-container grid mt-8">${hourlyForecastHTML}</div>`;

    const forecast = data.daily;
    let forecastHTML = `<h3 class="col-span-full text-2xl font-bold text-gray-700 mb-4 text-center">${t('forecast_title')}</h3>`;

    const nextFiveDaysTime = forecast.time.slice(1, 5);
    const nextFiveDaysWeatherCode = forecast.weathercode.slice(1, 5);
    const nextFiveDaysTempMax = forecast.temperature_2m_max.slice(1, 5);
    const nextFiveDaysTempMin = forecast.temperature_2m_min.slice(1, 5);

    for (let i = 0; i < nextFiveDaysTime.length; i++) {
        const day = new Date(nextFiveDaysTime[i]);
        const weekday = day.toLocaleDateString(currentLanguage === 'es' ? 'es-ES' : 'en-US', { weekday: 'short' });
        const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

        const forecastIcon = weatherIcons[nextFiveDaysWeatherCode[i]] ? weatherIcons[nextFiveDaysWeatherCode[i]].day : 'wi wi-na';
        const forecastIconColor = getWeatherIconColor(nextFiveDaysWeatherCode[i]);
        forecastHTML += `
            <div class="forecast-item text-center transform transition-transform duration-300 hover:scale-105" style="background-color: ${hexToRgba(getWeatherBackgroundColor(nextFiveDaysWeatherCode[i]), 0.4)}; animation-delay: ${i * 100}ms;">
                <p class="font-semibold text-gray-600 mb-2">${capitalizedWeekday}</p>
                <i class="${forecastIcon} text-4xl ${forecastIconColor} my-2 animate__animated animate__fadeIn"></i>
                <p class="text-xs text-gray-500">${getWeatherDescription(nextFiveDaysWeatherCode[i])}</p>
                <p class="text-sm text-gray-500">${Math.round(nextFiveDaysTempMax[i])}${t('unit_celsius')} / ${Math.round(nextFiveDaysTempMin[i])}${t('unit_celsius')}</p>
            </div>
        `;
    }
    forecastHTML = `<div class="daily-forecast-container grid mt-8">${forecastHTML}</div>`;

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

    const weatherInfo = document.getElementById('weather-info');
    const mapElement = document.getElementById('map');
    const mapIframe = mapElement.querySelector('iframe');

    const mapLoadPromise = new Promise(resolve => {
        mapIframe.addEventListener('load', () => {
            mapElement.classList.add('animate__animated', 'animate__fadeInUp');
            weatherInfo.style.visibility = 'visible';
            weatherInfo.classList.add('animate__animated', 'animate__fadeInUp');
            resolve();
        });
    });

    await mapLoadPromise;

    const timezone = data.timezone;
    if (timeInterval) {
        clearInterval(timeInterval);
    }
    updateTime(timezone);
    timeInterval = setInterval(() => updateTime(timezone), 60000);
}

export function clearUI() {
    weatherMainContent.innerHTML = '';
    forecastContainer.innerHTML = '';
    locationInfoDiv.innerHTML = '';
    if (timeInterval) {
        clearInterval(timeInterval);
    }
}