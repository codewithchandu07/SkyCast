// ==========================================
// WEATHER FORECAST APP
// ==========================================

// Open-Meteo APIs
const GEOCODING_API =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_API =
    "https://api.open-meteo.com/v1/forecast";


// ==========================================
// DOM ELEMENTS
// ==========================================

const cityInput = document.getElementById("cityInput");

const searchBtn = document.getElementById("searchBtn");

const locationBtn = document.getElementById("locationBtn");

const suggestions = document.getElementById("suggestions");

const loading = document.getElementById("loading");

const errorBox = document.getElementById("errorBox");

const errorMessage = document.getElementById("errorMessage");

const weatherContent =
    document.getElementById("weatherContent");

const welcome =
    document.getElementById("welcome");

const unitBtn =
    document.getElementById("unitBtn");

const themeBtn =
    document.getElementById("themeBtn");

const searchHistory =
    document.getElementById("searchHistory");

const modeButtons =
    document.querySelectorAll(".mode-btn");


// ==========================================
// WEATHER STATE
// ==========================================

let currentWeatherData = null;

let selectedLocation = null;

let temperatureUnit = "celsius";

const SEARCH_HISTORY_KEY = "weatherSearchHistory";


// ==========================================
// WEATHER CODE MAPPING
// ==========================================

const weatherCodes = {

    0: {
        text: "Clear Sky",
        icon: "☀️"
    },

    1: {
        text: "Mainly Clear",
        icon: "🌤️"
    },

    2: {
        text: "Partly Cloudy",
        icon: "⛅"
    },

    3: {
        text: "Overcast",
        icon: "☁️"
    },

    45: {
        text: "Fog",
        icon: "🌫️"
    },

    48: {
        text: "Depositing Rime Fog",
        icon: "🌫️"
    },

    51: {
        text: "Light Drizzle",
        icon: "🌦️"
    },

    53: {
        text: "Moderate Drizzle",
        icon: "🌦️"
    },

    55: {
        text: "Dense Drizzle",
        icon: "🌧️"
    },

    56: {
        text: "Light Freezing Drizzle",
        icon: "🌧️"
    },

    57: {
        text: "Dense Freezing Drizzle",
        icon: "🌧️"
    },

    61: {
        text: "Slight Rain",
        icon: "🌦️"
    },

    63: {
        text: "Moderate Rain",
        icon: "🌧️"
    },

    65: {
        text: "Heavy Rain",
        icon: "🌧️"
    },

    66: {
        text: "Light Freezing Rain",
        icon: "🌧️"
    },

    67: {
        text: "Heavy Freezing Rain",
        icon: "🌧️"
    },

    71: {
        text: "Slight Snow",
        icon: "🌨️"
    },

    73: {
        text: "Moderate Snow",
        icon: "❄️"
    },

    75: {
        text: "Heavy Snow",
        icon: "❄️"
    },

    77: {
        text: "Snow Grains",
        icon: "🌨️"
    },

    80: {
        text: "Slight Rain Showers",
        icon: "🌦️"
    },

    81: {
        text: "Moderate Rain Showers",
        icon: "🌧️"
    },

    82: {
        text: "Violent Rain Showers",
        icon: "⛈️"
    },

    85: {
        text: "Slight Snow Showers",
        icon: "🌨️"
    },

    86: {
        text: "Heavy Snow Showers",
        icon: "❄️"
    },

    95: {
        text: "Thunderstorm",
        icon: "⛈️"
    },

    96: {
        text: "Thunderstorm with Hail",
        icon: "⛈️"
    },

    99: {
        text: "Thunderstorm with Heavy Hail",
        icon: "⛈️"
    }

};



document.addEventListener("DOMContentLoaded", () => {

    loadTheme();

    setMode("luxury");

    setupEventListeners();

    renderSearchHistory();

});



function setupEventListeners() {

    searchBtn.addEventListener("click", () => {

        const city = cityInput.value.trim();

        if (city === "") {

            showError("Please enter a city name.");

            return;
        }

        searchCity(city);

    });


    cityInput.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {

            const city = cityInput.value.trim();

            if (city) {

                searchCity(city);

            }

        }

    });


    cityInput.addEventListener("input", () => {

        const query = cityInput.value.trim();

        if (query.length >= 2) {

            searchSuggestions(query);

        } else {

            suggestions.innerHTML = "";

        }

    });


    locationBtn.addEventListener(
        "click",
        getCurrentLocation
    );


    unitBtn.addEventListener(
        "click",
        toggleTemperatureUnit
    );


    themeBtn.addEventListener(
        "click",
        toggleTheme
    );

    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            setMode(button.dataset.mode);
        });
    });


    document.querySelectorAll(".city-btn").forEach(button => {

        button.addEventListener("click", () => {

            const city = button.dataset.city;

            cityInput.value = city;

            searchCity(city);

        });

    });


    document.addEventListener("click", (event) => {

        if (
            !event.target.closest(".search-section")
        ) {

            suggestions.innerHTML = "";

        }

    });

}




async function searchCity(city) {

    showLoading(true);

    hideError();

    suggestions.innerHTML = "";

    try {

        const url =
            `${GEOCODING_API}?name=${encodeURIComponent(city)}&count=10&language=en&format=json`;

        const response = await fetch(url);

        if (!response.ok) {

            throw new Error(
                "Unable to search for this city."
            );

        }

        const data = await response.json();

        if (
            !data.results ||
            data.results.length === 0
        ) {

            throw new Error(
                "City not found. Please check the spelling."
            );

        }


        // Select the first matching location
        const location = data.results[0];

        selectedLocation = location;

        await getWeather(location, true);

    }

    catch (error) {

        showError(error.message);

    }

    finally {

        showLoading(false);

    }

}




async function searchSuggestions(query) {

    try {

        const url =
            `${GEOCODING_API}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;

        const response = await fetch(url);

        const data = await response.json();

        suggestions.innerHTML = "";

        if (
            !data.results ||
            data.results.length === 0
        ) {

            return;

        }


        data.results.forEach(location => {

            const item =
                document.createElement("div");

            item.className = "suggestion";

            item.innerHTML = `

                <div>

                    <div class="suggestion-name">
                        ${escapeHTML(location.name)}
                    </div>

                    <div class="suggestion-country">
                        ${escapeHTML(location.admin1 || "")}
                    </div>

                </div>

                <div class="suggestion-country">
                    ${escapeHTML(location.country || "")}
                </div>

            `;


            item.addEventListener("click", () => {

                selectedLocation = location;

                cityInput.value =
                    location.name;

                suggestions.innerHTML = "";

                getWeather(location, true);

            });


            suggestions.appendChild(item);

        });

    }

    catch (error) {

        console.log(
            "Suggestion error:",
            error
        );

    }

}




async function getWeather(location, shouldSaveSearchHistory = false) {

    showLoading(true);

    hideError();

    try {

        const url =
            `${WEATHER_API}?latitude=${location.latitude}` +
            `&longitude=${location.longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,is_day` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset` +
            `&timezone=auto` +
            `&forecast_days=7`;


        const response = await fetch(url);

        if (!response.ok) {

            throw new Error(
                "Unable to fetch weather data."
            );

        }


        const data = await response.json();

        currentWeatherData = data;

        if (shouldSaveSearchHistory && location.name) {
            addSearchHistory(location.name);
        }

        displayWeather(
            location,
            data
        );

    }

    catch (error) {

        console.error(error);

        showError(
            "Unable to load weather information. Please try again."
        );

    }

    finally {

        showLoading(false);

    }

}



function displayWeather(location, data) {

    weatherContent.classList.remove("hidden");

    welcome.classList.add("hidden");


    // LOCATION

    document.getElementById("cityName").textContent =
        location.name;

    document.getElementById("countryName").textContent =
        `${location.admin1 ? location.admin1 + ", " : ""}${location.country || ""}`;


    // CURRENT WEATHER

    const current = data.current;

    const weatherInfo =
        weatherCodes[current.weather_code] ||
        {
            text: "Unknown",
            icon: "🌡️"
        };


    document.getElementById("weatherIcon").textContent =
        weatherInfo.icon;

    document.getElementById("weatherDescription").textContent =
        weatherInfo.text;


    updateTemperatureDisplay(
        current.temperature_2m
    );


    updateFeelsLike(
        current.apparent_temperature
    );


    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;


    document.getElementById("windSpeed").textContent =
        `${current.wind_speed_10m} km/h`;


    document.getElementById("precipitation").textContent =
        `${current.precipitation} mm`;


    document.getElementById("cloudCover").textContent =
        `${current.cloud_cover}%`;


    // SUNRISE / SUNSET

    document.getElementById("sunrise").textContent =
        formatTime(data.daily.sunrise[0]);


    document.getElementById("sunset").textContent =
        formatTime(data.daily.sunset[0]);


    // LOCAL DATE

    updateDateTime(
        current.time
    );


    // FORECAST

    displayForecast(data.daily);

    displayTemperatureGraph(data.daily);


    // LAST UPDATED

    document.getElementById("lastUpdated").textContent =
        new Date().toLocaleTimeString();


    // Update unit button

    unitBtn.textContent =
        temperatureUnit === "celsius"
            ? "°C"
            : "°F";

}


// ==========================================
// DISPLAY FORECAST
// ==========================================

function displayTemperatureGraph(daily) {

    const svg =
        document.getElementById(
            "temperatureGraph"
        );

    if (!svg) {
        return;
    }

    const width = 760;
    const height = 240;
    const paddingX = 40;
    const paddingTop = 28;
    const paddingBottom = 36;

    const maxValues = daily.temperature_2m_max.map(
        temp => temperatureUnit === "fahrenheit"
            ? celsiusToFahrenheit(temp)
            : temp
    );

    const maxValue = Math.max(...maxValues);
    const minValue = Math.min(...maxValues);
    const valueRange = Math.max(maxValue - minValue, 1);

    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = maxValues.map((value, index) => {

        const x = paddingX + (
            chartWidth / Math.max(daily.time.length - 1, 1)
        ) * index;

        const y = height - paddingBottom - (
            ((value - minValue) / valueRange) * chartHeight
        );

        return {
            x,
            y,
            value,
            day: new Date(`${daily.time[index]}T12:00:00`)
        };

    });

    const linePath = points
        .map((point, index) => {
            return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
        })
        .join(" ");

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

    const labels = points.map((point, index) => {

        const shortDay = point.day.toLocaleDateString(
            "en-US",
            {
                weekday: "short"
            }
        );

        return `
            <text
                x="${point.x}"
                y="${height - 10}"
                text-anchor="middle"
                fill="var(--secondary)"
                font-size="11"
                font-weight="600"
            >
                ${shortDay}
            </text>
        `;

    }).join("");

    const circles = points.map((point) => {

        return `
            <circle
                cx="${point.x}"
                cy="${point.y}"
                r="5.5"
                fill="var(--primary)"
                stroke="rgba(255,255,255,0.8)"
                stroke-width="2"
            />
            <text
                x="${point.x}"
                y="${point.y - 14}"
                text-anchor="middle"
                fill="var(--text)"
                font-size="11"
                font-weight="700"
            >
                ${Math.round(point.value)}°
            </text>
        `;

    }).join("");

    svg.innerHTML = `
        <defs>
            <linearGradient id="temperatureArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="rgba(96, 165, 250, 0.45)"/>
                <stop offset="100%" stop-color="rgba(96, 165, 250, 0.08)"/>
            </linearGradient>
        </defs>

        <path
            d="${areaPath}"
            fill="url(#temperatureArea)"
        ></path>

        <path
            d="${linePath}"
            fill="none"
            stroke="var(--primary)"
            stroke-width="3.5"
            stroke-linecap="round"
            stroke-linejoin="round"
        ></path>

        ${circles}
        ${labels}
    `;

}


function displayForecast(daily) {

    const container =
        document.getElementById(
            "forecastContainer"
        );

    container.innerHTML = "";


    for (
        let i = 0;
        i < daily.time.length;
        i++
    ) {

        const date =
            new Date(
                `${daily.time[i]}T12:00:00`
            );


        const dayName =
            i === 0
                ? "Today"
                : date.toLocaleDateString(
                    "en-US",
                    {
                        weekday: "short"
                    }
                );


        const weatherInfo =
            weatherCodes[daily.weather_code[i]] ||
            {
                text: "Unknown",
                icon: "🌡️"
            };


        let maxTemp =
            daily.temperature_2m_max[i];

        let minTemp =
            daily.temperature_2m_min[i];


        if (temperatureUnit === "fahrenheit") {

            maxTemp =
                celsiusToFahrenheit(maxTemp);

            minTemp =
                celsiusToFahrenheit(minTemp);

        }


        const card =
            document.createElement("div");

        card.className =
            "forecast-card";


        card.innerHTML = `

            <div class="forecast-day">
                ${dayName}
            </div>

            <div class="forecast-icon">
                ${weatherInfo.icon}
            </div>

            <div class="forecast-temp">

                ${Math.round(maxTemp)}°
                
                <span class="forecast-min">
                    ${Math.round(minTemp)}°
                </span>

            </div>

            <div class="forecast-rain">
                💧 ${daily.precipitation_sum[i]} mm
            </div>

        `;


        container.appendChild(card);

    }

}


function toggleTemperatureUnit() {

    if (temperatureUnit === "celsius") {

        temperatureUnit =
            "fahrenheit";

    } else {

        temperatureUnit =
            "celsius";

    }


    if (currentWeatherData) {

        displayWeather(
            selectedLocation,
            currentWeatherData
        );

    }

}


function celsiusToFahrenheit(celsius) {

    return (
        (celsius * 9) / 5 + 32
    );

}


function updateTemperatureDisplay(
    temperature
) {

    let value = temperature;

    let unit = "°C";


    if (
        temperatureUnit === "fahrenheit"
    ) {

        value =
            celsiusToFahrenheit(
                temperature
            );

        unit = "°F";

    }


    document.getElementById(
        "temperature"
    ).textContent =
        Math.round(value);


    document.getElementById(
        "temperatureUnit"
    ).textContent =
        unit;

}


function updateFeelsLike(
    temperature
) {

    let value = temperature;

    let unit = "°C";


    if (
        temperatureUnit === "fahrenheit"
    ) {

        value =
            celsiusToFahrenheit(
                temperature
            );

        unit = "°F";

    }


    document.getElementById(
        "feelsLike"
    ).textContent =
        `${Math.round(value)}${unit}`;

}



function updateDateTime(timeString) {

    const date =
        new Date(timeString);


    const dateText =
        date.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );


    const timeText =
        date.toLocaleTimeString(
            "en-US",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    document.getElementById(
        "localDate"
    ).textContent =
        dateText;


    document.getElementById(
        "localTime"
    ).textContent =
        timeText;

}



function formatTime(timeString) {

    if (!timeString) {

        return "--";

    }


    const parts =
        timeString.split("T");


    if (parts.length < 2) {

        return timeString;

    }


    const time =
        parts[1];


    const [hour, minute] =
        time.split(":");


    let h =
        parseInt(hour);


    const ampm =
        h >= 12
            ? "PM"
            : "AM";


    h =
        h % 12 || 12;


    return `${h}:${minute} ${ampm}`;

}



function getCurrentLocation() {

    if (!navigator.geolocation) {

        showError(
            "Geolocation is not supported by your browser."
        );

        return;

    }


    showLoading(true);

    hideError();


    navigator.geolocation.getCurrentPosition(

        async position => {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            try {

                const url =
                    `${GEOCODING_API}?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`;


                // Reverse geocoding is not supported
                // by the normal Open-Meteo geocoding endpoint,
                // so we use coordinates directly.

                const location = {

                    name: "Current Location",

                    latitude: latitude,

                    longitude: longitude,

                    country: "",

                    admin1: ""

                };


                selectedLocation =
                    location;


                await getWeather(
                    location,
                    false
                );

            }

            catch (error) {

                showError(
                    "Unable to get weather for your location."
                );

            }

            finally {

                showLoading(false);

            }

        },

        error => {

            showLoading(false);

            showError(
                "Location permission was denied or unavailable."
            );

        },

        {
            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 300000

        }

    );

}


function addSearchHistory(cityName) {

    const trimmedName = String(cityName).trim();

    if (!trimmedName || trimmedName === "Current Location") {
        return;
    }

    try {

        const history = getSearchHistory();

        const updatedHistory = [trimmedName, ...history.filter(item => item !== trimmedName)].slice(0, 6);

        localStorage.setItem(
            SEARCH_HISTORY_KEY,
            JSON.stringify(updatedHistory)
        );

        renderSearchHistory();

    }

    catch (error) {

        console.error("Unable to save search history:", error);

    }

}


function getSearchHistory() {

    try {

        const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);

        if (!savedHistory) {
            return [];
        }

        const parsedHistory = JSON.parse(savedHistory);

        return Array.isArray(parsedHistory)
            ? parsedHistory.filter(item => typeof item === "string" && item.trim() !== "")
            : [];

    }

    catch (error) {

        console.error("Unable to read search history:", error);

        return [];

    }

}


function renderSearchHistory() {

    if (!searchHistory) {
        return;
    }

    const history = getSearchHistory();

    searchHistory.innerHTML = "";

    if (history.length === 0) {

        searchHistory.classList.add("hidden");

        return;

    }

    const header = document.createElement("div");

    header.className = "search-history-header";

    const label = document.createElement("span");

    label.textContent = "Recent searches";

    const clearButton = document.createElement("button");

    clearButton.className = "clear-history-btn";

    clearButton.type = "button";

    clearButton.textContent = "Clear";

    clearButton.addEventListener("click", () => {

        localStorage.removeItem(SEARCH_HISTORY_KEY);

        renderSearchHistory();

    });

    header.appendChild(label);

    header.appendChild(clearButton);

    searchHistory.appendChild(header);

    const items = document.createElement("div");

    items.className = "search-history-items";

    history.forEach(city => {

        const historyBtn = document.createElement("button");

        historyBtn.type = "button";

        historyBtn.className = "history-btn";

        historyBtn.textContent = city;

        historyBtn.addEventListener("click", () => {

            cityInput.value = city;

            searchCity(city);

        });

        items.appendChild(historyBtn);

    });

    searchHistory.appendChild(items);

    searchHistory.classList.remove("hidden");

}


function showLoading(show) {

    if (show) {

        loading.classList.remove(
            "hidden"
        );

    } else {

        loading.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// ERROR
// ==========================================

function showError(message) {

    errorMessage.textContent =
        message;

    errorBox.classList.remove(
        "hidden"
    );

}


function hideError() {

    errorBox.classList.add(
        "hidden"
    );

}


// ==========================================
// DARK MODE
// ==========================================

function setMode(mode) {
    document.body.classList.remove("mode-luxury", "mode-colorful", "mode-mobile");
    document.body.classList.add(`mode-${mode}`);

    modeButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.mode === mode);
    });

    const app = document.querySelector(".app");
    if (app) {
        app.setAttribute("data-mode", mode);
    }
}


function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const dark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        "weatherTheme",
        dark
            ? "dark"
            : "light"
    );


    themeBtn.textContent =
        dark
            ? "☀️"
            : "🌙";

}


function loadTheme() {

    const theme =
        localStorage.getItem(
            "weatherTheme"
        );


    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeBtn.textContent =
            "☀️";

    }

}


function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}