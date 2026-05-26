package com.omoikaneinnovation.service;

import org.springframework.stereotype.Service;
import com.omoikaneinnovation.dto.LocationRequest;

import java.util.ArrayList;
import java.util.List;

@Service
public class LocationServiceImpl implements LocationService {

	private final List<LocationRequest> store = new ArrayList<>();

	@Override
	public void saveLocation(LocationRequest request) {
		store.add(request);

		System.out.println("📍 Saved Location:");
		System.out.println("Lat: " + request.getLat());
		System.out.println("Lng: " + request.getLng());
	}

	@Override
	public List<LocationRequest> getAllLocations() {
		return store;
	}
}