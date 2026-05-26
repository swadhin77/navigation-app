package com.omoikaneinnovation.service;

import com.omoikaneinnovation.dto.LocationRequest;
import java.util.List;

public interface LocationService {
	void saveLocation(LocationRequest request);

	List<LocationRequest> getAllLocations();
}