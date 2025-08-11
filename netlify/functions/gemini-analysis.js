const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
  // Klucz API jest pobierany ze zmiennej środowiskowej Netlify
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API Key is not configured." }),
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });

  try {
    // Przetwarzanie danych wysłanych z Twojej strony
    const { content } = JSON.parse(event.body);
    
    const result = await model.generateContent(content);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ analysis: text }),
    };
  } catch (error) {
    console.error("Gemini Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error", details: error.message }),
    };
  }
};
