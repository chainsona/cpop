# Google Maps Integration for POAP Location-Based Distribution

This document explains how to set up and use the Google Maps integration for location-based POAP distribution methods.

## Setup Requirements

To use the interactive map functionality for location-based distribution methods, you need a Google Maps API key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to APIs & Services > Library
4. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
5. Go to APIs & Services > Credentials
6. Create an API key (restrict it to the APIs mentioned above for security)
7. Add restrictions to the API key (HTTP referrers) to limit usage to your domain

## Configuration

Add your Google Maps API key to your environment variables:

```env
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## Features

The location-based distribution method includes the following features:

- Interactive map for selecting the claim location
- Search functionality to find locations by name or address
- Automatic determination of city and country based on selected location
- Visual representation of the claim radius
- Adjustable radius with real-time visual feedback
- Click-to-place functionality for direct map interaction

## Usage Instructions

1. In the POAP distribution page, select "Location Based" as the distribution method
2. Use the search bar to find a specific location, or click directly on the map
3. The city and country fields will be automatically populated when possible
4. Adjust the radius using the slider to determine the claim area
5. Set additional parameters like claim limits and valid dates
6. Review and create the location-based distribution method

## Troubleshooting

If the map doesn't load or display correctly:

1. Ensure your Google Maps API key is correctly configured in the environment variables
2. Check that all required APIs (Maps JavaScript, Places, Geocoding) are enabled for your project
3. Verify that there are no billing issues with your Google Cloud account
4. Check browser console for any JavaScript errors
5. Make sure your API key has the appropriate restrictions (not too strict) 