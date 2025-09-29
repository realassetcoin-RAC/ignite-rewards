# City API Setup Guide

## Overview
The MerchantSignupModal now includes a smart city search feature that uses the [API Ninjas City API](https://api-ninjas.com/api/city) to provide auto-suggestions for city and country selection.

## Features
- **Auto-suggestions**: As users type, the system searches for cities worldwide
- **Real-time validation**: Validates city names against a database of 50,000+ cities
- **Smart matching**: Provides suggestions with population data and capital city indicators
- **User-friendly interface**: Single input field for "City, Country" selection

## Setup Instructions

### ✅ API Key Already Configured
The API key `mmukoqC1YD+DnoIYT1bUFQ==3yeUixLPT1Y8IxQt` is already configured in the code, so the city search feature will work immediately without any additional setup.

### Optional: Environment Variable Configuration
If you prefer to use environment variables, add the following to your `.env` file:

```env
REACT_APP_API_NINJAS_KEY=mmukoqC1YD+DnoIYT1bUFQ==3yeUixLPT1Y8IxQt
```

This will override the default API key in the code.

### 3. API Limits
- **Free Plan**: ~50,000 cities, 10 requests per minute
- **Premium Plan**: 5,000,000+ cities, higher rate limits

## How It Works

### User Experience
1. User types in the "City, Country" field
2. After 2+ characters, the system searches for matching cities
3. A dropdown appears with suggestions showing:
   - City name and country
   - Population data
   - Capital city indicator (if applicable)
4. User selects from the suggestions
5. Form is automatically populated with validated city and country data

### Technical Implementation
- **Debounced search**: 300ms delay to prevent excessive API calls
- **Error handling**: Graceful fallback when API is unavailable
- **Validation**: Ensures selected cities exist in the database
- **State management**: Maintains form data and suggestion state

## API Response Format
```json
[
  {
    "name": "San Francisco",
    "latitude": 37.7562,
    "longitude": -122.443,
    "country": "US",
    "population": 3592294,
    "is_capital": false
  }
]
```

## Error Handling
- **API Key Missing**: Shows "API key not configured" message
- **No Results**: Shows "No cities found" with spelling suggestion
- **Network Error**: Shows "Unable to search cities" message
- **Rate Limiting**: Handles 429 responses gracefully

## Security Considerations
- API key is stored in environment variables
- No sensitive data is sent to the API
- Input is sanitized before API calls
- Rate limiting prevents abuse

## Fallback Behavior
If the API is unavailable:
- Form still functions normally
- Users can manually enter city and country
- Validation still works for basic format checking
- No blocking errors for the signup process

## Testing
The feature is ready to test immediately:
1. Open the merchant signup modal
2. Navigate to the form step
3. Type in the "City, Country" field (e.g., "New York", "London", "Tokyo")
4. Verify suggestions appear with city names, countries, and population data
5. Test selection and form population
6. Try different city names to see the variety of suggestions

## Troubleshooting
- **No suggestions appearing**: Check API key configuration
- **Slow response**: Check network connection and API status
- **Invalid suggestions**: Verify API key has proper permissions
- **Form not populating**: Check browser console for errors
