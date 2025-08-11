const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    const coinIds = event.queryStringParameters.ids;
    const currencies = event.queryStringParameters.vs_currencies;
    
    // Tutaj budujemy zapytanie do API CoinGecko
    const api_url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=${currencies}&include_24h_change=true&include_market_cap=true`;
    
    const response = await fetch(api_url);
    
    // Sprawdzamy, czy odpowiedź jest poprawna
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to fetch data from CoinGecko API' })
      };
    }
    
    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('CoinGecko Proxy Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
