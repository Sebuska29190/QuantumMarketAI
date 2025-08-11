import { api } from "./api";
import { DetailedAnalysis, TechnicalIndicators, NewsItem } from "./types";

class AnalysisService {
  private async getHistoricalData(crypto: string, days: number = 200) {
    try {
      console.log(`Fetching historical data for ${crypto}...`);
      const historicalData = await api.getHistoricalData(crypto, days);
      console.log('Historical data response:', historicalData);
      
      return historicalData;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < period + 1; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        avgGain = (avgGain * 13 + difference) / period;
        avgLoss = (avgLoss * 13) / period;
      } else {
        avgGain = (avgGain * 13) / period;
        avgLoss = (avgLoss * 13 - difference) / period;
      }
    }

    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    return isNaN(rsi) ? 50 : rsi;
  }

  private calculateMACD(prices: number[]) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
    const signalLine = this.calculateEMA([macdLine], 9)[0];
    const histogram = macdLine - signalLine;
    
    return {
      value: macdLine,
      signal: signalLine,
      histogram,
      interpretation: this.interpretMACD(macdLine, signalLine, histogram)
    };
  }

  private interpretMACD(macdLine: number, signalLine: number, histogram: number): string {
    let interpretation = '';
    const tolerance = 0.1;

    if (histogram > tolerance) {
      interpretation = 'Bullish momentum';
    } else if (histogram < -tolerance) {
      interpretation = 'Bearish momentum';
    } else {
      interpretation = 'Neutral or fading momentum';
    }

    if (macdLine > 0 && signalLine > 0) {
      interpretation += ' (upward trend)';
    } else if (macdLine < 0 && signalLine < 0) {
      interpretation += ' (downward trend)';
    }

    if (Math.abs(macdLine - signalLine) < tolerance) {
      interpretation += ', potential trend reversal';
    }

    return interpretation;
  }

  private calculateEMA(prices: number[], period: number): number[] {
    if (prices.length < period) {
      return [];
    }
    const multiplier = 2 / (period + 1);
    const ema: number[] = [prices[0]];

    for (let i = 1; i < prices.length; i++) {
      ema.push(
        (prices[i] - ema[i - 1]) * multiplier + ema[i - 1]
      );
    }
    return ema;
  }

  private calculateSMA(prices: number[], period: number = 20): number {
    if (!prices || prices.length < period) return 0;
    const slice = prices.slice(-period);
    return slice.reduce((sum, price) => sum + price, 0) / slice.length;
  }

  private findSupportResistance(prices: number[]) {
    if (prices.length < 4) return { support: 0, resistance: 0 };
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const q1Index = Math.floor(prices.length * 0.25);
    const q3Index = Math.floor(prices.length * 0.75);

    return {
      support: sortedPrices[q1Index],
      resistance: sortedPrices[q3Index]
    };
  }

  private async getMarketSentiment(crypto: string) {
    try {
      const newsResponse = await api.getNews(crypto);
      const newsItems: NewsItem[] = newsResponse.news;
      
      if (!newsItems || newsItems.length === 0) {
        return { newsScore: 50, socialScore: 50, marketMood: 'Neutral' };
      }

      const positiveCount = newsItems.filter(n => n.sentiment === 'positive').length;
      const total = newsItems.length;

      const newsScore = (positiveCount / total) * 100;

      return {
        newsScore,
        socialScore: Math.random() * 100, // Placeholder for social score
        marketMood: newsScore > 60 ? 'Bullish' : 
                    newsScore < 40 ? 'Bearish' : 'Neutral'
      };
    } catch (error) {
      console.error('Error getting market sentiment:', error);
      return {
        newsScore: 50,
        socialScore: 50,
        marketMood: 'Neutral'
      };
    }
  }

  private calculateStochRSI(prices: number[], period: number = 14): number {
    if (prices.length < period * 2) return 50;
    const rsiValues = prices.slice(0, prices.length - period + 1).map((_, i) => this.calculateRSI(prices.slice(i, i + period)));
    
    const minRSI = Math.min(...rsiValues);
    const maxRSI = Math.max(...rsiValues);
    const lastRSI = rsiValues[rsiValues.length - 1];

    if (maxRSI - minRSI === 0) return 50;
    return ((lastRSI - minRSI) / (maxRSI - minRSI)) * 100;
  }

  private interpretStochRSI(stochRSI: number): string {
    if (stochRSI > 80) return 'Extremely overbought';
    if (stochRSI > 60) return 'Overbought';
    if (stochRSI < 20) return 'Extremely oversold';
    if (stochRSI < 40) return 'Oversold';
    return 'Neutral';
  }

  private calculateOBV(prices: number[], volumes: number[]): string {
    if (prices.length !== volumes.length) return 'Neutral';
    let obv = 0;
    const obvValues = [0];

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        obv += volumes[i];
      } else if (prices[i] < prices[i - 1]) {
        obv -= volumes[i];
      }
      obvValues.push(obv);
    }
    const recentOBV = obvValues.slice(-5);
    const trend = recentOBV[recentOBV.length - 1] > recentOBV[0] ? 'Bullish' : 'Bearish';
    return trend;
  }

  private calculateVolumeRatio(volumes: number[], period: number = 20): number {
    if (volumes.length < period) return 1;
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = volumes.slice(-period).reduce((a, b) => a + b, 0) / period;
    return avgVolume === 0 ? 1 : currentVolume / avgVolume;
  }

  private determineMarketPhase(prices: number[], ma50: number, ma200: number): string {
    const currentPrice = prices[prices.length - 1];
    const priceAboveMA50 = currentPrice > ma50;
    const priceAboveMA200 = currentPrice > ma200;
    const ma50AboveMA200 = ma50 > ma200;

    if (priceAboveMA50 && priceAboveMA200 && ma50AboveMA200) {
      return 'Bull Market';
    } else if (!priceAboveMA50 && !priceAboveMA200 && !ma50AboveMA200) {
      return 'Bear Market';
    } else if (priceAboveMA200 && !priceAboveMA50) {
      return 'Correction';
    } else {
      return 'Accumulation';
    }
  }

  private calculateVolatility(prices: number[]): number {
    const returns = prices.slice(1).map((price, i) => 
      Math.log(price / prices[i])
    );
    if (returns.length === 0) return 0;
    
    return Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / returns.length
    ) * Math.sqrt(365) * 100;
  }
  
  private async getAIAnalysis(
    crypto: string,
    technicalIndicators: TechnicalIndicators,
    news: NewsItem[],
    sentiment: any
  ): Promise<string> {
    const prompt = `
      Act as an expert quantitative analyst and cryptocurrency trader. Analyze the following comprehensive market data for ${crypto} and provide a detailed strategic analysis:
  
      PRICE ACTION & TECHNICAL ANALYSIS:
      • Current Price: ${technicalIndicators.currentPrice} USD
      • 24h Change: ${technicalIndicators.price_change_24h}%
      • Key Moving Averages:
        - MA20: ${technicalIndicators.ma20}
        - MA50: ${technicalIndicators.ma50}
        - MA200: ${technicalIndicators.ma200}
      
      MOMENTUM INDICATORS:
      • RSI(14): ${technicalIndicators.rsi} - ${this.interpretRSI(technicalIndicators.rsi)}
      • MACD: 
        - Value: ${technicalIndicators.macd.value}
        - Signal: ${technicalIndicators.macd.signal}
        - Histogram: ${technicalIndicators.macd.histogram}
      • Volume Change: ${technicalIndicators.volumeChange}%
      
      MARKET STRUCTURE:
      • Current Market Phase: ${technicalIndicators.marketPhase}
      • Volatility: ${technicalIndicators.volatility}%
      • Key Price Levels:
        - Support: ${technicalIndicators.support}
        - Resistance: ${technicalIndicators.resistance}
      
      MARKET SENTIMENT:
      • News Sentiment Score: ${sentiment.newsScore}%
      • Market Mood: ${sentiment.marketMood}
      • Recent News Headlines:
      ${news.slice(0, 3).map(n => `  - ${n.title} (${n.sentiment})`).join('\n')}
      
      Based on this comprehensive data, provide a detailed analysis in the following HTML structure. Be extremely analytical and precise, focusing on actionable insights:
  
      <div class="analysis">
        <div class="summary">
          <h3>Strategic Market Analysis</h3>
          <p class="highlight">[Provide a concise but detailed 2-3 line summary of the current market situation, incorporating price action, technical indicators, and sentiment. Be specific about the market phase and key levels.]</p>
        </div>
  
        <div class="signals">
          <h3>Critical Trading Signals</h3>
          <ul>
            <li class="signal-item [positive/negative/neutral]">[Technical Signal: Describe specific technical setup or pattern]</li>
            <li class="signal-item [positive/negative/neutral]">[Momentum Signal: Describe momentum status and implications]</li>
            <li class="signal-item [positive/negative/neutral]">[Volume Signal: Describe volume analysis and its significance]</li>
            <li class="signal-item [positive/negative/neutral]">[Sentiment Signal: Describe sentiment impact on price]</li>
          </ul>
        </div>
  
        <div class="strategy">
          <h3>Strategic Recommendations</h3>
          <div class="position-strategy">
            [Provide specific entry, exit, and position management recommendations based on all available data]
          </div>
          <div class="risk-management">
            <div class="entry">Entry Zones: $[Specify optimal entry ranges with reasoning]</div>
            <div class="stop">Stop Loss: $[Specify stop loss levels with technical justification]</div>
            <div class="target">Targets: $[Specify multiple price targets with technical justification]</div>
          </div>
          <div class="timeframe">
            [Specify optimal trading timeframe based on volatility and market phase]
          </div>
        </div>
      </div>
  
      Important Guidelines:
      1. Base all analysis on quantitative data provided
      2. Highlight specific technical setups and patterns
      3. Provide concrete price levels for all recommendations
      4. Include risk management considerations
      5. Consider market structure and phase in all recommendations
      6. Integrate sentiment analysis with technical signals
      7. Be precise with numbers and percentages
      8. Focus on actionable insights
      9. Maintain professional, analytical tone
      10. Use technical terminology appropriately
  
      Remove any markdown formatting and ensure all price levels are properly formatted with $ symbol.
    `;
  
    try {
      // Use the new proxy endpoint on our server
      const response = await fetch('/api/proxy/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      return data.text ?? "";
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
      throw new Error('Failed to fetch AI analysis from server.');
    }
  }

  private interpretRSI(rsi: number): string {
    if (rsi >= 70) return 'Overbought - Consider taking profits';
    if (rsi <= 30) return 'Oversold - Potential buying opportunity';
    if (rsi >= 60) return 'Bullish momentum building';
    if (rsi <= 40) return 'Bearish pressure present';
    return 'Neutral momentum';
  }
 
  async getDetailedAnalysis(crypto: string): Promise<DetailedAnalysis> {
    try {
      const historicalData = await this.getHistoricalData(crypto);
      if (!historicalData || !historicalData.prices || historicalData.prices.length < 200) {
        throw new Error('Insufficient historical data for analysis.');
      }

      const prices = historicalData.prices;
      const volumes = historicalData.volumes;
      const currentPrice = prices[prices.length - 1];

      const rsi = this.calculateRSI(prices);
      const macd = this.calculateMACD(prices);
      const stochRSI = this.calculateStochRSI(prices);
      const ma20 = this.calculateSMA(prices, 20);
      const ma50 = this.calculateSMA(prices, 50);
      const ma200 = this.calculateSMA(prices, 200);
      const { support, resistance } = this.findSupportResistance(prices);
      const volumeRatio = this.calculateVolumeRatio(volumes);
      const volatilityIndex = this.calculateVolatility(prices);
      const obvTrend = this.calculateOBV(prices, volumes);
      const marketPhase = this.determineMarketPhase(prices, ma50, ma200);
      
      const technicalIndicators: TechnicalIndicators = {
        currentPrice,
        price_change_24h: historicalData.price_change_24h,
        rsi,
        macd,
        ma20,
        ma50,
        ma200,
        volumeChange: volumeRatio,
        marketPhase,
        volatility: volatilityIndex,
        support,
        resistance
      };

      const sentiment = await this.getMarketSentiment(crypto);
      const newsResponse = await api.getNews(crypto);
      const newsItems: NewsItem[] = newsResponse.news;

      const signals = [
        {
          indicator: 'RSI',
          value: rsi,
          signal: this.interpretRSI(rsi),
          strength: Math.abs(50 - rsi) / 50
        },
        {
          indicator: 'MACD',
          value: macd.value,
          signal: macd.interpretation,
          strength: macd.value !== 0 ? Math.abs(macd.value / currentPrice) : 0
        },
        {
          indicator: 'StochRSI',
          value: stochRSI,
          signal: this.interpretStochRSI(stochRSI),
          strength: Math.abs(50 - stochRSI) / 50
        },
        {
          indicator: 'OBV',
          value: 0,
          signal: obvTrend,
          strength: volumeRatio - 1
        }
      ];

      const aiAnalysis = await this.getAIAnalysis(
        crypto,
        technicalIndicators,
        newsItems,
        sentiment
      );

      const latestPrice = prices[prices.length - 1];
      const marketSummary = `${crypto.charAt(0).toUpperCase() + crypto.slice(1)} as of ${new Date().toLocaleDateString()} is in a ${marketPhase.toLowerCase()} with ${
        this.interpretRSI(rsi).toLowerCase()
      } momentum and a ${macd.interpretation.toLowerCase()}. Price is ${
        latestPrice > ma50 ? 'above' : 'below'
      } most moving averages, indicating ${
        latestPrice > ma50 && latestPrice > ma200 ? 'bullish momentum' : 'potential trend reversal'
      }.`;

      const baseConfidence = parseFloat((85 - volatilityIndex / 2).toFixed(2));
      const priceTargets = {
        shortTerm: {
          low: currentPrice * (1 - volatilityIndex * 0.1),
          high: currentPrice * (1 + volatilityIndex * 0.1)
        },
        midTerm: {
          low: currentPrice * (1 - volatilityIndex * 0.2),
          high: currentPrice * (1 + volatilityIndex * 0.2)
        },
        longTerm: {
          low: currentPrice * (1 - volatilityIndex * 0.3),
          high: currentPrice * (1 + volatilityIndex * 0.3)
        }
      };

      return {
        summary: marketSummary,
        aiAnalysis,
        priceTargets: {
          '24H': {
            range: `$${priceTargets.shortTerm.low.toFixed(2)} - $${priceTargets.shortTerm.high.toFixed(2)}`,
            confidence: baseConfidence.toString()
          },
          '7D': {
            range: `$${priceTargets.midTerm.low.toFixed(2)} - $${priceTargets.midTerm.high.toFixed(2)}`,
            confidence: Math.max(30, baseConfidence * 0.9).toString()
          },
          '30D': {
            range: `$${priceTargets.longTerm.low.toFixed(2)} - $${priceTargets.longTerm.high.toFixed(2)}`,
            confidence: Math.max(30, baseConfidence * 0.8).toString()
          }
        },
        signals: signals.map(s => ({
          text: `${s.indicator}: ${s.signal}`,
          importance: s.strength > 0.7 ? 'high' : s.strength > 0.4 ? 'medium' : 'low'
        })),
        strategy: {
          position: marketPhase === 'Bull Market' ? 'Long' : 'Short',
          entry: (support + (resistance - support) * 0.382).toString(),
          stop: (support * 0.95).toString(),
          target: resistance.toString()
        },
        marketStructure: {
          trend: marketPhase
        }
      };
    } catch (error) {
      console.error('Error in analysis:', error);
      return {
        summary: "Market analysis unavailable.",
        aiAnalysis: "Failed to fetch market analysis.",
        priceTargets: { '24H': { range: "N/A", confidence: "0" }, '7D': { range: "N/A", confidence: "0" }, '30D': { range: "N/A", confidence: "0" } },
        signals: [],
        strategy: { position: "N/A", entry: "N/A", stop: "N/A", target: "N/A" },
        marketStructure: { trend: "N/A" }
      };
    }
  }
}

export const analysisService = new AnalysisService();
