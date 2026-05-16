import express from "express";
import { fetchWeather } from "../../goplanner/backend/controllers/weather.controller.js";

const router = express.Router();

router.get("/", fetchWeather);

export default router;
