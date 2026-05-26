package com.omoikaneinnovation.dto;

public class LocationRequest {

	private Double lat;
	private Double lng;
	private String address;
	private String pincode;
	private String type;
	private String time;
	private Double speed;

	public Double getLat() {
		return lat;
	}

	public void setLat(Double lat) {
		this.lat = lat;
	}

	public Double getLng() {
		return lng;
	}

	public void setLng(Double lng) {
		this.lng = lng;
	}

	public Double getSpeed() {
		return speed;
	}

	public void setSpeed(Double speed) {
		this.speed = speed;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public String getPincode() {
		return pincode;
	}

	public void setPincode(String pincode) {
		this.pincode = pincode;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getTime() {
		return time;
	}

	public void setTime(String time) {
		this.time = time;
	}

	@Override
	public String toString() {
		return "LocationRequest{" + "lat=" + lat + ", lng=" + lng + ", address='" + address + '\'' + ", pincode='"
				+ pincode + '\'' + ", type='" + type + '\'' + ", time='" + time + '\'' + '}';
	}
}