import type { LLMSettings, IngestedDocument } from '../types';

let settings: LLMSettings = {
  endpoint: 'http://localhost:11434/api/generate',
  model: 'llama3',
};

export const configure = (newSettings: LLMSettings) => {
  settings = newSettings;
};

// A utility to safely parse JSON that might be wrapped in markdown code blocks
export function parseLLMJson(text: string): any {
    try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})|(\[[\s\S]*])/);
        if (jsonMatch) {
            // Take the first non-null capturing group
            const jsonString = jsonMatch[1] || jsonMatch[2] || jsonMatch[3];
            if (jsonString) {
                return JSON.parse(jsonString);
            }
        }
        // Fallback for raw JSON string
        return JSON.parse(text);
    } catch (error) {
        console.error("Failed to parse LLM JSON response:", text, error);
        throw new Error("The local model returned an invalid JSON format.");
    }
}


export async function generate(prompt: string, expectJson: boolean): Promise<string> {
  if (!settings.endpoint || !settings.model) {
    throw new Error('LLM service not configured. Please set endpoint and model in Settings.');
  }

  const body = {
    model: settings.model,
    prompt: prompt,
    stream: false,
    format: expectJson ? 'json' : undefined,
  };

  try {
    const response = await fetch(settings.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Local LLM API error (${response.status}): ${errorText}`);
    }

    const responseData = await response.json();
    
    // Ollama and other similar APIs return the response in a 'response' field.
    if (responseData && typeof responseData.response === 'string') {
      return responseData.response.trim();
    } else {
      throw new Error('Unexpected response structure from local LLM API.');
    }
  } catch (error) {
    console.error('Error calling local LLM:', error);
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error(`Could not connect to the local LLM endpoint at ${settings.endpoint}. Please ensure the server is running and the endpoint is correct.`);
    }
    throw error;
  }
}

export async function runAutomatedSearch(subjectName: string): Promise<IngestedDocument[]> {
  const prompt = `You are a research agent. Find 3-5 recent, real-world public records, news articles, or official statements related to the political figure "${subjectName}". For each item, provide a source URL, a publication date, a summary of the content, and classify its type.
  
  Valid types are: 'article', 'speech', 'vote', 'donation', 'leak', 'tweet', 'other'.
  
  Output ONLY a valid JSON object matching this schema:
  Schema:
  [
    {
      "subject": "${subjectName}",
      "type": "string",
      "source": "string (URL)",
      "date": "string (YYYY-MM-DD)",
      "content": "string (summary of the document)"
    }
  ]`;

  const responseText = await generate(prompt, true);
  const searchResults = parseLLMJson(responseText);

  if (!Array.isArray(searchResults)) {
    throw new Error("Automated search returned data in an unexpected format.");
  }
  
  // Add client-side fields
  return searchResults.map(doc => ({
      ...doc,
      id: `doc-${Date.now()}-${Math.random()}`,
      status: 'indexed',
  }));
}
