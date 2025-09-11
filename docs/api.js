
import { t } from './i18n.js';

export async function getCoordinates(cityName) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${cityName}&format=json&addressdetails=1`);
    if (!response.ok) throw new Error(t('fetch_coords_error'));
    const data = await response.json();

    if (data.length === 0) {
        throw new Error(t('city_not_found_error'));
    }

    let bestResult = null;
    let highestScore = -1;

    for (const result of data) {
        // We only care about results that have a bounding box
        if (!result.boundingbox) {
            continue;
        }

        let score = 0;
        if (result.class === 'place' && (result.type === 'city' || result.type === 'town' || result.type === 'village')) {
            score = 10; // High score for preferred types
        } else if (result.class === 'boundary' && result.type === 'administrative') {
            score = 5;  // Lower score for administrative boundaries
        }

        if (score > highestScore) {
            highestScore = score;
            bestResult = result;
        }
    }

    // If after all that we still didn't find a preferred type, fall back to the first result that has a bounding box.
    if (!bestResult) {
        bestResult = data.find(r => r.boundingbox);
    }

    // If absolutely nothing has a bounding box, fall back to the very first result from the API.
    if (!bestResult) {
        bestResult = data[0];
    }

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
    return { city, state, country };
}
