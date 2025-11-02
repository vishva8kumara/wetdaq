# 🌦️ WetDAQ — ESP32 Weather Data Acquisition System

WetDAQ is an open-source weather monitoring platform built with **ESP32**, **Node.js**, and **Google Charts**. It continuously collects sensor data (temperature, humidity, pressure, wind speed/direction, rainfall) and publishes it to a centralized server for aggregation, visualization, and export.

---

## 🧩 Architecture Overview

```
ESP32 (Weather Station)
   ↳ sends HTTP POST every 5s → /rx
Node.js Server (Express)
   ↳ aggregates 5-minute windows per device
   ↳ serves dashboard, API, and CSV export
Frontend (HTML + Google Charts)
   ↳ visualizes live & historical data
```

---

## ⚙️ Features

* 📡 Wi-Fi enabled **ESP32 weather station**
* 🌤️ BME280 for temperature, pressure, humidity
* 🌪️ Anemometer & wind vane for wind speed/direction
* 🌧️ Tipping bucket rain gauge
* 🧠 5-minute server-side data aggregation
* 🔐 Basic Auth–protected dashboard
* 📊 Real-time Google Charts with CSV export
* 🧭 Dynamic wind overlay arrow for live updates

---

## 🪶 ESP32 Firmware

The ESP32 collects data using the SparkFun Weather Meter Kit and BME280 sensor:

```cpp
windDirection = weatherMeterKit.getWindDirection();
windSpeed     = weatherMeterKit.getWindSpeed();
rain          = weatherMeterKit.getTotalRainfall();
```

It posts readings every 5 seconds to the server:

```
http://daq.info.lk/rx
```

The onboard LED blinks on successful data posts and remains lit on failure.

---

## 🖥️ Server Setup

### Prerequisites

* Node.js 18+
* MySQL or MariaDB

### Installation

```bash
git clone https://github.com/vishva8kumara/wetdaq.git
cd wetdaq
npm install
```

### Configuration

Create a `.env` file:

```ini
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=wetdaq
DATABASE_USERNAME=wetdaq_user
DATABASE_PASSWORD=your_password

DASHBOARD_USER=admin
DASHBOARD_PASS=secret
```

### Run the server

```bash
node wetdaq.js
```

Dashboard available at: `http://localhost:8000`

---

## 🔐 Authentication

The dashboard (`/`, `/data`, `/devices`) is protected using **HTTP Basic Auth**.

* Credentials are defined in `.env` as `DASHBOARD_USER` and `DASHBOARD_PASS`.
* The `/rx` endpoint remains open for ESP32 data posts.

---

## 📊 Dashboard

* Real-time gauges for temperature, pressure, humidity
* Historical line charts for sensor trends
* Wind scatter chart with overlay arrow
* Rainfall chart for 5-minute intervals
* CSV export button
* Data range filter for historical views

---

## 🧮 Data Aggregation

Each device’s samples are accumulated for 5 minutes:

* **Temperature, Pressure, Humidity, Wind Speed:** averaged
* **Rainfall:** summed
* **Wind Direction:** averaged via vector math

```js
sumSinWdir += wsp * Math.sin(wdir * Math.PI / 180);
sumCosWdir += wsp * Math.cos(wdir * Math.PI / 180);
let avgWdir = Math.atan2(sumSinWdir, sumCosWdir) * 180 / Math.PI;
if (avgWdir < 0) avgWdir += 360;
```

---

## 📁 API Endpoints

| Endpoint           | Method | Description               |
| ------------------ | ------ | ------------------------- |
| `/rx`              | POST   | Receive data from ESP32   |
| `/`                | GET    | Dashboard (auth required) |
| `/data`            | GET    | Return JSON data          |
| `/data?format=csv` | GET    | Return CSV export         |
| `/devices`         | GET    | List active devices       |

---

## 📈 CSV Export

The `/data` endpoint supports CSV downloads:

```bash
curl -u admin:secret http://localhost:8000/data?format=csv -o weather.csv
```

---

## 🧰 Development Notes

* The backend uses modular architecture (`wetdaq.js`, `receive.js`, `dashboard.js`, `repository.js`).
* Aggregation is handled in-memory and flushed every 5 minutes. This is better handled with Redis arrays.
* Data stored in MySQL with retry-safe connection handling.
* Frontend powered by Google Charts with minimal re-renders.

---

## 🧭 Wind Overlay

A blue arrow overlay updates in real time on the wind scatter chart.
It is rendered via:

```js
arc.elem('div', null, { class: 'wind-overlay' });
```

---

## 🧑‍💻 License

MIT License © 2025 — ShilpaSayura

---

## 🌐 Project Goals

WetDAQ provides a fully open, low-cost, and extensible weather telemetry platform for research, education, and IoT experimentation.

---

## 🧭 Roadmap

* [ ] Implement Redis to break out of monolithic
* [ ] AI/ML for disaster prediction
