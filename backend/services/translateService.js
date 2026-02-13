import axios from "axios";

// OpenRouter API endpoint for OpenAI models
const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";

// Language code mapping for OpenAI
const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  ta: "Tamil",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  gu: "Gujarati",
  bn: "Bengali",
  pa: "Punjabi",
  ur: "Urdu",
  es: "Spanish",
  fr: "French",
  de: "German",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
  pt: "Portuguese",
  ru: "Russian",
};

/**
 * Detect the language of the input text using OpenAI
 */
export const detectLanguage = async (text) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ No API key found, defaulting to English");
      return "en";
    }

    const response = await axios.post(
      OPENROUTER_API,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a language detection expert. Identify the language of the given text and respond with only the ISO 639-1 language code (e.g., 'en', 'hi', 'te', 'ta'). If the text is in English letters but represents another language (like transliterated Telugu), identify the actual language. Respond with only the language code, nothing else.",
          },
          {
            role: "user",
            content: `What language is this text? "${text}"`,
          },
        ],
        max_tokens: 10,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:5000",
        },
        timeout: 15000,
      }
    );

    const detectedLang = response.data.choices[0]?.message?.content?.trim().toLowerCase() || "en";
    console.log(`🔍 Detected language: ${detectedLang} for text: "${text.substring(0, 30)}..."`);
    return detectedLang;
  } catch (err) {
    console.error("Language Detection Error:", err.message);
    return "en"; // fallback to English
  }
};

/**
 * Translate text from source language to target language using OpenAI via OpenRouter
 * Handles transliterated text (e.g., "bagunnara" in English letters = Telugu "How are you")
 */
export const translateText = async (text, targetLang, sourceLang = "auto") => {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("❌ No OpenAI/OpenRouter API key found");
      throw new Error("API key not configured");
    }

    // Detect source language if auto
    let detectedSourceLang = sourceLang;
    if (sourceLang === "auto") {
      detectedSourceLang = await detectLanguage(text);
    }

    // If source and target are the same, return original text
    if (detectedSourceLang === targetLang) {
      return {
        translatedText: text,
        sourceLanguage: detectedSourceLang,
        targetLanguage: targetLang,
      };
    }

    const sourceLangName = LANGUAGE_NAMES[detectedSourceLang] || detectedSourceLang;
    const targetLangName = LANGUAGE_NAMES[targetLang] || targetLang;

    console.log(`🌍 Translating: "${text.substring(0, 50)}..." from ${sourceLangName} (${detectedSourceLang}) to ${targetLangName} (${targetLang})`);

    const response = await axios.post(
      OPENROUTER_API,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert translator. Translate the given text from ${sourceLangName} to ${targetLangName}. 
            
Important:
- If the text is written in English letters but represents ${sourceLangName} (transliterated), translate it to ${targetLangName}
- Example: "bagunnara" (Telugu in English letters) should be translated to "How are you" in English
- Provide only the translated text, no explanations or additional text
- Maintain the meaning and tone of the original message`,
          },
          {
            role: "user",
            content: `Translate this text to ${targetLangName}: "${text}"`,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:5000",
        },
        timeout: 20000, // 20 second timeout
      }
    );

    const translatedText = response.data.choices[0]?.message?.content?.trim();
    
    if (!translatedText) {
      throw new Error("No translation received from API");
    }

    console.log(`✅ Translation result: "${translatedText.substring(0, 50)}..."`);

    return {
      translatedText: translatedText,
      sourceLanguage: detectedSourceLang,
      targetLanguage: targetLang,
    };
  } catch (err) {
    console.error("❌ Translation Error:", err.message);
    if (err.response) {
      console.error("API Error Response:", err.response.data);
    }
    // Fallback to original text
    return {
      translatedText: text,
      sourceLanguage: sourceLang === "auto" ? "en" : sourceLang,
      targetLanguage: targetLang,
    };
  }
};

/**
 * Get list of supported languages
 * OpenAI supports all major languages, so we return our predefined list
 */
export const getSupportedLanguages = async () => {
  try {
    // Return supported languages
    return [
      { code: "en", name: "English" },
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
      { code: "hi", name: "Hindi" },
      { code: "te", name: "Telugu" },
      { code: "ta", name: "Tamil" },
      { code: "kn", name: "Kannada" },
      { code: "ml", name: "Malayalam" },
      { code: "mr", name: "Marathi" },
      { code: "gu", name: "Gujarati" },
      { code: "bn", name: "Bengali" },
      { code: "pa", name: "Punjabi" },
      { code: "ur", name: "Urdu" },
      { code: "ja", name: "Japanese" },
      { code: "ko", name: "Korean" },
      { code: "zh", name: "Chinese" },
      { code: "ar", name: "Arabic" },
      { code: "pt", name: "Portuguese" },
      { code: "ru", name: "Russian" },
    ];
  } catch (err) {
    console.error("Get Languages Error:", err.message);
    // Return fallback languages
    return [
      { code: "en", name: "English" },
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
      { code: "hi", name: "Hindi" },
      { code: "te", name: "Telugu" },
    ];
  }
};
