
import { t } from './i18n.js';

export async function getCoordinates(cityName) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${cityName}&format=json&addressdetails=1`);
    if (!response.ok) throw new Error(t('fetch_coords_error'));
    const data = await response.json();

    let bestResult = null;
    let bestRank = Infinity;

    for (const result of data) {
        let currentRank = Infinity;
        if (result.class === 'place') {
            if (result.type === 'city' && result.place_rank === 15) {
                currentRank = 15;
            } else if (result.type === 'town' && result.place_rank === 16) {
                currentRank = 16;
            } else if (result.type === 'village' && result.place_rank === 17) {
                currentRank = 17;
            }
        }

        if (currentRank < bestRank) {
            bestRank = currentRank;
            bestResult = result;
        }
    }

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
        return { latitude: data[0].lat, longitude: data[0].lon, type: data[0].type, boundingbox: data[0].boundingbox || null };
    }
    throw new Error(t('city_not_found_error'));
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
