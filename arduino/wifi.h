#include <HTTPClient.h>
#include <WiFiType.h>
#include <WiFiServer.h>
#include <WiFiUdp.h>
#include <WiFiMulti.h>
#include <WiFiAP.h>
#include <WiFiGeneric.h>
#include <WiFi.h>
#include <WiFiScan.h>
#include <WiFiClient.h>
#include <WiFiSTA.h>

#include "arduino_secrets.h"

// #include <ESP8266WiFi.h>
// #include <ESP8266HTTPClient.h>

String device = SECRET_DEVICE_KEY;

void setupWiFi() {
	WiFi.begin(SECRET_SSID, SECRET_PASS);
	Serial.print("Connecting to WiFi");
	while (WiFi.status() != WL_CONNECTED) {
		delay(500);
		Serial.print(".");
	}
	Serial.println("\nWiFi connected");
	Serial.print("IP address: ");
	Serial.println(WiFi.localIP());
}

bool sendDataToServer(String payload) {
	if (WiFi.status() == WL_CONNECTED) {
		HTTPClient http;
		http.begin(SECRET_SERVER_URL);
		http.addHeader("Content-Type", "application/x-www-form-urlencoded");

		int httpResponseCode = http.POST("device=" + device + "&" + payload);


		if (httpResponseCode > 0) {
			String response = http.getString();
			Serial.println("Server response: " + response);
			return true;
		}
		else {
			Serial.printf("HTTP POST failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
			return false;
		}

		http.end();
	}
	else {
		Serial.println("WiFi not connected");
		return false;
	}
}
