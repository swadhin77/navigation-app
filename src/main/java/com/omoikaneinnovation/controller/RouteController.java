package com.omoikaneinnovation.controller;

import com.omoikaneinnovation.service.RouteService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Collections;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") 
public class RouteController {

	private final RouteService routeService;

	public RouteController(RouteService routeService) {
		this.routeService = routeService;
	}

	@GetMapping("/route")
	public Map<String, Object> getRoute(@RequestParam String origin, @RequestParam String destination) {
		try {
			System.out.println("GET Route → " + origin + " → " + destination);
			return routeService.getRoute(origin, destination);
		} catch (Exception e) {
			return Map.of("routes", Collections.emptyList());
		}
	}

	@PostMapping("/route")
	public Map<String, Object> getRoutePost(@RequestBody Map<String, Double> req) {

		if (req == null || req.get("fromLat") == null || req.get("fromLng") == null || req.get("toLat") == null
				|| req.get("toLng") == null) {

			return Map.of("routes", Collections.emptyList());
		}

		try {
			double fromLat = req.get("fromLat");
			double fromLng = req.get("fromLng");
			double toLat = req.get("toLat");
			double toLng = req.get("toLng");

			String origin = fromLat + "," + fromLng;
			String destination = toLat + "," + toLng;

			return routeService.getRoute(origin, destination);

		} catch (Exception e) {
			return Map.of("routes", Collections.emptyList());
		}
	}
}