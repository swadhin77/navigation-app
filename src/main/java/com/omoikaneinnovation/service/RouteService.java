package com.omoikaneinnovation.service;

import java.util.Map;

public interface RouteService {
	Map<String, Object> getRoute(String origin, String destination);
}