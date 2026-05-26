package com.omoikaneinnovation.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api")
public class WeatherController {

	@Value("${weather.api.key}")
	private String apiKey;

	private final RestTemplate restTemplate = new RestTemplate();

	@GetMapping("/weather")
	public Object getWeather(@RequestParam double lat, @RequestParam double lng) {

		try {
			String url = "https://api.tomorrow.io/v4/weather/realtime?location=" + lat + "," + lng + "&apikey="
					+ apiKey;

			return restTemplate.getForObject(url, Object.class);

		} catch (Exception e) {
			return Map.of("error", "Weather fetch failed");
		}
	}
}
