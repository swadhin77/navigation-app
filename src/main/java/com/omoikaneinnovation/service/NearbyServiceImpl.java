package com.omoikaneinnovation.service;

import com.omoikaneinnovation.dto.NearbyPlaceDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class NearbyServiceImpl implements NearbyService {

	@Value("${mapbox.api.key}")
	private String apiKey;

	private final RestTemplate restTemplate = new RestTemplate();

	private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {

		final int R = 6371; 

		double latDistance = Math.toRadians(lat2 - lat1);
		double lonDistance = Math.toRadians(lon2 - lon1);

		double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2) + Math.cos(Math.toRadians(lat1))
				* Math.cos(Math.toRadians(lat2)) * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return R * c;
	}

	@SuppressWarnings("unchecked")
	@Override
	public List<NearbyPlaceDTO> getNearbyPlaces(double lat, double lng, String type, int page) {

		int limit = 10;

		String url = "https://api.mapbox.com/search/searchbox/v1/forward" + "?q=" + type + "&proximity=" + lng + ","
				+ lat + "&limit=10" + "&types=poi" + "&language=en" + "&access_token=" + apiKey;

		System.out.println("MAPBOX URL: " + url);

		Map response = restTemplate.getForObject(url, Map.class);

		List<NearbyPlaceDTO> result = new ArrayList<>();

		if (response == null || !response.containsKey("features")) {
			return result;
		}

		List<Map> features = (List<Map>) response.get("features");

		for (Map f : features) {

			Map geometry = (Map) f.get("geometry");
			if (geometry == null)
				continue;

			List coords = (List) geometry.get("coordinates");
			if (coords == null)
				continue;

			double placeLng = ((Number) coords.get(0)).doubleValue();
			double placeLat = ((Number) coords.get(1)).doubleValue();

			String name = "Unknown";

			if (f.get("properties") != null) {
			    Map properties = (Map) f.get("properties");

			    if (properties.get("name") != null) {
			        name = properties.get("name").toString();
			    }
			}

			if (name.equals("Unknown") && f.get("place_name") != null) {
			    name = f.get("place_name").toString();
			}
			
			String address = "No address";

			if (f.get("properties") != null) {
			    Map properties = (Map) f.get("properties");

			    if (properties.get("full_address") != null) {
			        address = properties.get("full_address").toString();
			    }
			}

			if (address.equals("No address") && f.get("place_name") != null) {
			    address = f.get("place_name").toString();
			}

			double distance = calculateDistance(lat, lng, placeLat, placeLng);

			NearbyPlaceDTO dto = new NearbyPlaceDTO(name, address, placeLat, placeLng);

			dto.setDistance(distance);

			dto.setOpen(true);

			result.add(dto);
		}

		result.sort(Comparator.comparingDouble(NearbyPlaceDTO::getDistance));

		List<NearbyPlaceDTO> filtered = result.stream().filter(p -> p.getDistance() < 10) 
				.collect(Collectors.toMap(p -> p.getName() + "_" + Math.round(p.getDistance()), 
																								
						p -> p, (existing, duplicate) -> existing))
				.values().stream().sorted(Comparator.comparingDouble(NearbyPlaceDTO::getDistance)) 
				.limit(10).toList();

		if (filtered.isEmpty()) {
			return Collections.emptyList();
		}

		return filtered;
	}
}