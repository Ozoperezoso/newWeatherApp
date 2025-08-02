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
        // For Android, we need to set the style first
        await StatusBar.setStyle({ style: 'LIGHT' });
        
        // Set status bar background color to transparent
        await StatusBar.setBackgroundColor({ color: '#00000000' });
        
        // For Android, set overlay to true to make status bar transparent
        // This allows the background color to show through
        await StatusBar.setOverlaysWebView({ overlay: true });
        
        // Hide the status bar for full screen experience
        await StatusBar.hide();
        
        // Additional Android-specific settings
        if (Capacitor.getPlatform() === 'android') {
            // Set status bar to be transparent with colored content
            await StatusBar.setBackgroundColor({ color: '#00000000' });
            // Ensure light content (white icons/text)
            await StatusBar.setStyle({ style: 'LIGHT' });
        }
        
        console.log('Status Bar initialized successfully - Full screen mode enabled');
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

// Background management system
const backgroundManager = {
    // Set background based on screen/page
    setBackground(type) {
        // Remove all background classes
        document.body.classList.remove('default-bg', 'white-bg', 'sunny-bg', 'cloudy-bg', 'rainy-bg', 'snowy-bg', 'stormy-bg', 'night-bg');
        
        // Add the new background class
        document.body.classList.add(`${type}-bg`);
        
        console.log(`Background changed to: ${type}`);
    },
    
    // Set background based on weather condition
    setWeatherBackground(weatherCode) {
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour > 18;
        
        let backgroundType = 'default';
        
        // Weather code mapping to background types
        if (weatherCode >= 0 && weatherCode <= 3) {
            backgroundType = isNight ? 'night' : 'sunny';
        } else if (weatherCode >= 45 && weatherCode <= 48) {
            backgroundType = 'cloudy';
        } else if (weatherCode >= 51 && weatherCode <= 67) {
            backgroundType = 'rainy';
        } else if (weatherCode >= 71 && weatherCode <= 77) {
            backgroundType = 'snowy';
        } else if (weatherCode >= 80 && weatherCode <= 82) {
            backgroundType = 'rainy';
        } else if (weatherCode >= 85 && weatherCode <= 86) {
            backgroundType = 'snowy';
        } else if (weatherCode >= 95 && weatherCode <= 99) {
            backgroundType = 'stormy';
        } else {
            backgroundType = isNight ? 'night' : 'sunny';
        }
        
        this.setBackground(backgroundType);
    },
    
    // Reset to default background
    resetToDefault() {
        this.setBackground('default');
    }
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
            backgroundManager.setBackground('white');
            
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
                    
                    // Set white background for weather results
                    backgroundManager.setBackground('white');
                    
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
    }
});

// Initialize with default background
backgroundManager.resetToDefault();

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
        locationInfoDiv.innerHTML = `
            <div class="weather-info-container">
                <p class="text-gray-600 text-lg text-center font-semibold">📍 ${cityName}</p>
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

function displayWeather(data) {
    if (!data || !data.current_weather || !data.daily) {
        displayError('Invalid weather data received.');
        return;
    }

    const weather = data.current_weather;
    const weatherIcon = weatherIcons[weather.weathercode] || 'fas fa-question-circle';
    weatherInfo.innerHTML = `
        <div class="weather-info-container">
            <h2 class="text-3xl font-bold text-gray-700 text-center mb-4">Current Weather</h2>
            <div class="text-center">
                <i class="${weatherIcon} text-7xl text-blue-500 my-4"></i>
                <p class="text-xl text-gray-600 mb-2">Temperature: ${weather.temperature}°C</p>
                <p class="text-xl text-gray-600">Wind Speed: ${weather.windspeed} km/h</p>
            </div>
        </div>
    `;

    const forecast = data.daily;
    let forecastHTML = '<h3 class="col-span-full text-2xl font-bold text-gray-700 mb-4 text-center">5-Day Forecast</h3>';
    for (let i = 0; i < 5; i++) {
        const day = new Date(forecast.time[i]);
        const forecastIcon = weatherIcons[forecast.weathercode[i]] || 'fas fa-question-circle';
        forecastHTML += `
            <div class="forecast-item text-center transform transition-transform duration-300 hover:scale-105">
                <p class="font-semibold text-gray-600 mb-2">${day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <i class="${forecastIcon} text-4xl text-yellow-500 my-2"></i>
                <p class="text-sm text-gray-500">${forecast.temperature_2m_max[i]}°C / ${forecast.temperature_2m_min[i]}°C</p>
            </div>
        `;
    }
    forecastContainer.innerHTML = forecastHTML;

    weatherInfo.classList.remove('opacity-0', 'translate-y-5');
    weatherInfo.classList.add('opacity-100', 'translate-y-0');
}