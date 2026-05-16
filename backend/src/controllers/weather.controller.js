import axios from "axios";

export async function fetchWeather(req, res) {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    const API_KEY = process.env.OPENWEATHER_API_KEY;
    const URL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    const { data } = await axios.get(URL);

    return res.json({
      success: true,
      message: "Weather fetched successfully",
      data: {
        city: data.name,
        temperature: data.main.temp,
        feels_like: data.main.feels_like,
        humidity: data.main.humidity,
        conditions: data.weather[0].description,
        icon: data.weather[0].icon,
        wind_speed: data.wind.speed,
      },
    });

  } catch (error) {
    console.error("Weather API Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch weather",
    });
  }
}
