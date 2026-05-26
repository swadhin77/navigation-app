package com.omoikaneinnovation.controller;

import com.omoikaneinnovation.dto.LocationRequest;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class LocationController {
	private final List<LocationRequest> locationStore = new ArrayList<>();

	@PostMapping("/location")
	public Map<String, Object> receiveLocation(@RequestBody LocationRequest request) {
		if (request == null || request.getLat() == null || request.getLng() == null) {
			return Map.of("status", "error", "message", "Invalid coordinates");
		}
		if (request.getType() == null) {
			request.setType("AUTO");
		}
		if (request.getAddress() == null) {
			request.setAddress("N/A");
		}
		if (request.getPincode() == null) {
			request.setPincode("N/A");
		}
		String timeNow = java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss"));
		request.setTime(timeNow);
		locationStore.add(request);
		System.out.println("\n================ LOCATION TRACK =================");
		System.out.println("TYPE      : " + request.getType());
		System.out.println("LAT/LNG   : " + request.getLat() + " , " + request.getLng());
		System.out.println("ADDRESS   : " + request.getAddress());
		System.out.println("PINCODE   : " + request.getPincode());
		if (request.getSpeed() != null) {
			System.out.println("SPEED     : " + request.getSpeed() + " km/h");
		}
		System.out.println("TIME      : " + request.getTime());
		System.out.println("RAW DATA  : " + request.toString());
		System.out.println("===============================================\n");
		return Map.of("status", "success", "type", request.getType(), "time", request.getTime());
	}

	@GetMapping("/locations")
	public List<LocationRequest> getAllLocations() {
		return locationStore;
	}

	// ==============================
	// GET LATEST LOCATION
	// ==============================
	@GetMapping("/location/latest")
	public Object getLatestLocation() {
		if (locationStore.isEmpty()) {
			return Map.of("message", "No data available");
		}
		return locationStore.get(locationStore.size() - 1);
	}

	@DeleteMapping("/locations")
	public Map<String, String> clearAll() {
		locationStore.clear();
		return Map.of("message", "All locations cleared");
	}
}