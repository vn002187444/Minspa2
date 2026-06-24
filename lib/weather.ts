import { storage } from '@/lib/storage';

export interface WeatherData {
  temp: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy'
  humidity: number
  isDay: boolean
}

const CACHE_KEY = 'min_weather_cache'
const CACHE_TTL = 30 * 60 * 1000 // 30 phút

export async function getWeather(): Promise<WeatherData | null> {
  try {
    const cached = storage.get(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TTL) return data
    }

    // Open-Meteo free API (no key needed), coords for Thủ Đức, Vietnam
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=10.848&longitude=106.762&current=temperature_2m,relative_humidity_2m,weather_code,is_day&timezone=auto'
    )
    if (!res.ok) return null
    const json = await res.json()
    const current = json.current

    const weather: WeatherData = {
      temp: Math.round(current.temperature_2m),
      condition: decodeWeatherCode(current.weather_code),
      humidity: current.relative_humidity_2m,
      isDay: current.is_day === 1,
    }

    storage.set(CACHE_KEY, JSON.stringify({ data: weather, timestamp: Date.now() }))
    return weather
  } catch {
    return null
  }
}

function decodeWeatherCode(code: number): WeatherData['condition'] {
  if (code === 0) return 'sunny'
  if (code <= 3) return 'cloudy'
  if (code <= 48) return 'foggy'
  if (code <= 67) return 'rainy'
  if (code <= 86) return 'snowy'
  return 'rainy'
}

export function getThemeModifier(weather: WeatherData | null): { warmth: number; brightness: number } {
  if (!weather) return { warmth: 0, brightness: 0 }
  const warmth = Math.max(-1, Math.min(1, (30 - weather.temp) / 15))
  const brightness = weather.condition === 'sunny' ? 0.2 : weather.condition === 'rainy' ? -0.2 : 0
  return { warmth, brightness }
}
