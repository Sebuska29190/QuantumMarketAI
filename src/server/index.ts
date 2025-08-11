import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import serverless from 'serverless-http';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const NEWS_API = 'https://newsdata.io/api/1/news';
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const NEWSDATA_API_KEY = process.env.VITE_NEWSDATA_API_KEY;

// Proxy endpoint for CoinGecko simple price
app.get('/api/proxy/coingecko/simple-price', async (req, res) => {
  try {
    const { ids, vs_currencies, include_24h_change, include_market_cap } = req.query;
    if (!ids || !vs_currencies) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: { ids, vs_currencies, include_24h_change, include_market_cap }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in CoinGecko simple-price proxy:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch simple price' });
  }
});

// Proxy endpoint for CoinGecko market chart
app.get('/api/proxy/coingecko/market-chart', async (req, res) => {
  try {
    const { id, vs_currency, days, interval } = req.query;
    if (!id || !vs_currency || !days) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }
    const response = await axios.get(`${COINGECKO_API}/coins/${id}/market_chart`, {
      params: { vs_currency, days, interval }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in CoinGecko market-chart proxy:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch historical data' });
  }
});

// Proxy endpoint for CoinGecko search
app.get('/api/proxy/coingecko/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Missing search query parameter' });
    }
    const response = await axios.get(`${COINGECKO_API}/search`, { params: { query } });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in CoinGecko search proxy:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to search coins' });
  }
});

// Proxy endpoint for NewsData.io API
app.get('/api/proxy/news', async (req, res) => {
  if (!NEWSDATA_API_KEY) {
    return res.status(500).json({ error: 'NewsData API Key is not configured.' });
  }
  try {
    const { q, language, category, size } = req.query;
    const response = await axios.get(NEWS_API, {
      params: { apikey: NEWSDATA_API_KEY, q, language, category, size }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Error in NewsData proxy:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch news data' });
  }
});

// Proxy endpoint for Gemini API
app.post('/api/proxy/gemini', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API Key is not configured.' });
  }
  try {
    const { prompt } = req.body;
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${GEMINI_API_KEY}`,
      { contents: [{ role: "user", parts: [{ text: prompt }] }] }
    );
    const text = response.data.candidates[0].content.parts[0].text;
    res.json({ text });
  } catch (error: any) {
    console.error('Error in Gemini proxy:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to generate content' });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(3001, () => console.log('Local server is running on port 3001'));
}

// Wrap the Express app for Netlify Functions
export const handler = serverless(app);
