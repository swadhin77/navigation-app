package com.omoikaneinnovation.dto;

public class NearbyPlaceDTO {

	private String name;
	private String address;
	private double lat;
	private double lng;
	private double distance;
	private boolean open;

	public NearbyPlaceDTO() {
	}

	public NearbyPlaceDTO(String name, String address, double lat, double lng) {
		this.name = name;
		this.address = address;
		this.lat = lat;
		this.lng = lng;
	}

	public NearbyPlaceDTO(String name, String address, double lat, double lng, double distance, boolean open) {
		super();
		this.name = name;
		this.address = address;
		this.lat = lat;
		this.lng = lng;
		this.distance = distance;
		this.open = open;
	}

	public boolean isOpen() {
		return open;
	}

	public void setOpen(boolean open) {
		this.open = open;
	}

	public double getDistance() {
		return distance;
	}

	public void setDistance(double distance) {
		this.distance = distance;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public double getLat() {
		return lat;
	}

	public void setLat(double lat) {
		this.lat = lat;
	}

	public double getLng() {
		return lng;
	}

	public void setLng(double lng) {
		this.lng = lng;
	}
}