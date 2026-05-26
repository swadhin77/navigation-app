package com.omoikaneinnovation.controller;

import com.omoikaneinnovation.dto.NearbyPlaceDTO;
import com.omoikaneinnovation.service.NearbyService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class NearbyController {

	@Autowired
	private NearbyService nearbyService;

	@GetMapping("/nearby")
	public List<NearbyPlaceDTO> getNearby(@RequestParam double lat, @RequestParam double lng, @RequestParam String type,
			@RequestParam int page) {
		return nearbyService.getNearbyPlaces(lat, lng, type, page);
	}
}