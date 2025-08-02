const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const weatherInfo = document.getElementById('weather-info');
const forecastContainer = document.getElementById('forecast-container');
const locationInfoDiv = document.getElementById('location-info');
const loaderContainer = document.querySelector('.loader-container');

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
            displayWeather(weather);
            await displayLocationInfo(coordinates.latitude, coordinates.longitude);
        } catch (error) {
            displayError(error.message);
        } finally {
            hideLoader();
        }
    }
};

const handleLocation = () => {
    if (navigator.geolocation) {
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
                displayError(`Geolocation error: ${error.message}`);
                hideLoader();
            }
        );
    } else {
        displayError('Geolocation is not supported by this browser.');
    }
};

searchBtn.addEventListener('click', handleSearch);
locationBtn.addEventListener('click', handleLocation);
cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

async function getCoordinates(cityName) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${cityName}&format=json&limit=1`);
    if (!response.ok) throw new Error('Could not fetch coordinates.');
    const data = await response.json();
    if (data.length > 0) return { latitude: data[0].lat, longitude: data[0].lon };
    throw new Error('City not found. Please try again.');
}

async function getWeatherData(latitude, longitude) {
    const API_URL = 'https://api.open-meteo.com/v1/forecast';
    const response = await fetch(`${API_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min`);
    if (!response.ok) throw new Error('Could not fetch weather data.');
    return await response.json();
}

async function getCityName(latitude, longitude) {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
    if (!response.ok) throw new Error('Could not fetch city name.');
    const data = await response.json();
    return data.address.city || data.address.town || data.address.village || 'Unknown Location';
}

async function displayLocationInfo(latitude, longitude) {
    try {
        const cityName = await getCityName(latitude, longitude);
        locationInfoDiv.innerHTML = `<p class="text-gray-600 text-lg">${cityName}</p>`;
    } catch (error) {
        displayError(error.message);
    }
}

function displayError(message) {
    weatherInfo.innerHTML = `<p class="text-red-500 font-bold">${message}</p>`;
    weatherInfo.classList.remove('opacity-0', 'translate-y-5');
    weatherInfo.classList.add('opacity-100', 'translate-y-0');
}

function displayWeather(data) {
    if (!data || !data.current_weather || !data.daily) {
        displayError('Invalid weather data received.');
        return;
    }

    const weather = data.current_weather;
    const weatherIcon = weatherIcons[weather.weathercode] || 'fas fa-question-circle';
    weatherInfo.innerHTML = `
        <h2 class="text-3xl font-bold text-gray-700">Current Weather</h2>
        <i class="${weatherIcon} text-7xl text-blue-500 my-4"></i>
        <p class="text-xl text-gray-600">Temperature: ${weather.temperature}°C</p>
        <p class="text-xl text-gray-600">Wind Speed: ${weather.windspeed} km/h</p>
    `;

    const forecast = data.daily;
    let forecastHTML = '<h3 class="col-span-full text-2xl font-bold text-gray-700 mb-4">5-Day Forecast</h3>';
    for (let i = 0; i < 5; i++) {
        const day = new Date(forecast.time[i]);
        const forecastIcon = weatherIcons[forecast.weathercode[i]] || 'fas fa-question-circle';
        forecastHTML += `
            <div class="text-center bg-white bg-opacity-50 rounded-lg p-4 shadow-md transform transition-transform duration-300 hover:scale-110">
                <p class="font-semibold text-gray-600">${day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <i class="${forecastIcon} text-4xl text-yellow-500 my-2"></i>
                <p class="text-sm text-gray-500">${forecast.temperature_2m_max[i]}°C / ${forecast.temperature_2m_min[i]}°C</p>
            </div>
        `;
    }
    forecastContainer.innerHTML = forecastHTML;

    weatherInfo.classList.remove('opacity-0', 'translate-y-5');
    weatherInfo.classList.add('opacity-100', 'translate-y-0');
}