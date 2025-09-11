import { t } from './i18n.js';

export async function getCoordinates(cityName) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${cityName}&format=json&addressdetails=1`);
    if (!response.ok) throw new Error(t('fetch_coords_error'));
    const data = await response.json();
    console.log("Nominatim API response for:", cityName, data);

    if (data.length === 0) {
        throw new Error(t('city_not_found_error'));
    }

    // 1. Filter out results without bounding box
    const filteredResults = data.filter(result => result.boundingbox);

    if (filteredResults.length === 0) {
        throw new Error(t('city_not_found_error')); // Or a more specific error
    }

    // 2. Sort by importance (descending)
    filteredResults.sort((a, b) => b.importance - a.importance);
    console.log("Highest importance result (after filtering):", filteredResults[0]);

    // Select the result with the highest importance (which is now filteredResults[0])
    const bestResult = filteredResults[0];

    return {
        latitude: bestResult.lat,
        longitude: bestResult.lon,
        type: bestResult.type,
        boundingbox: bestResult.boundingbox || null
    };
}

export async function getWeatherData(latitude, longitude) {
    const API_URL = 'https://api.open-meteo.com/v1/forecast';
    const params = `?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,visibility,weather_code,is_day,wind_speed_10m&hourly=temperature_2m,weathercode,wind_speed_10m,relative_humidity_2m,visibility&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`;
    const response = await fetch(`${API_URL}${params}`);
    if (!response.ok) throw new Error(t('fetch_weather_error'));
    return await response.json();
}

export async function getCityName(latitude, longitude) {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
    if (!response.ok) throw new Error(t('fetch_city_name_error'));
    const data = await response.json();
    const city = data.address.city || data.address.town || data.address.village || 'Unknown Location';
    const state = data.address.state || '';
    const country = data.address.country || '';
    return { city, state, country, boundingbox: data.boundingbox || null };
}