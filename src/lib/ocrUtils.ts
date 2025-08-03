import Tesseract from 'tesseract.js';

export interface ExtractedScreenTimeData {
  totalTime: string;
  date: string;
  apps: Array<{
    name: string;
    time: string;
  }>;
  categories: Array<{
    name: string;
    time: string;
  }>;
  updatedAt: string;
}

// Extract text from image using client-side Tesseract (more reliable)
export async function extractTextFromImage(imageDataUrl: string): Promise<string> {
  try {
    console.log('Starting client-side OCR processing...');
    
    // Use client-side Tesseract which is more reliable in Next.js
    const result = await Tesseract.recognize(
      imageDataUrl,
      'eng',
      {
        logger: m => console.log('OCR Progress:', m),
        errorHandler: err => console.error('OCR Error:', err)
      }
    );
    
    console.log('OCR completed successfully');
    return result.data.text;
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error('Failed to extract text from image');
  }
}

// Parse extracted text to find screen time data
function parseScreenTimeData(text: string): ExtractedScreenTimeData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let totalTime = '';
  let date = '';
  let updatedAt = '';
  const apps: Array<{ name: string; time: string }> = [];
  const categories: Array<{ name: string; time: string }> = [];
  
  console.log('Parsing text lines:', lines);
  
  // Extract total screen time - look for the largest time value (usually the total)
  const timeMatches = text.match(/(\d+h\s*\d*m|\d+h|\d+m)/gi) || [];
  if (timeMatches.length > 0) {
    // Find the largest time value (likely the total)
    const timeValues = timeMatches.map(time => {
      const hours = time.match(/(\d+)h/)?.[1] || '0';
      const minutes = time.match(/(\d+)m/)?.[1] || '0';
      return parseInt(hours) * 60 + parseInt(minutes);
    });
    const maxTimeIndex = timeValues.indexOf(Math.max(...timeValues));
    totalTime = timeMatches[maxTimeIndex];
    console.log('Found total time:', totalTime);
  }
  
  // Extract date - look for various date patterns
  const datePatterns = [
    /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s*(\w+\s+\d+)/i,
    /(\w+\s+\d+)/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /(\d{1,2}-\d{1,2}-\d{4})/i
  ];
  
  for (const pattern of datePatterns) {
    const dateMatch = text.match(pattern);
    if (dateMatch) {
      date = dateMatch[0];
      console.log('Found date:', date);
      break;
    }
  }
  
  // Extract "Updated at" information - more flexible patterns
  const updatedPatterns = [
    /Updated\s+(?:today\s+)?at\s+(\d+:\d+\s*[ap]m)/i,
    /(\d+:\d+\s*[ap]m)/i,
    /(\d{1,2}:\d{2}\s*[ap]m)/i
  ];
  
  for (const pattern of updatedPatterns) {
    const updatedMatch = text.match(pattern);
    if (updatedMatch) {
      updatedAt = updatedMatch[1] || updatedMatch[0];
      console.log('Found updated time:', updatedAt);
      break;
    }
  }
  
  // Extract apps and their times - more flexible patterns
  const appPatterns = [
    /([A-Za-z0-9\s&]+):\s*(\d+h\s*\d*m|\d+h|\d+m)/i,
    /([A-Za-z0-9\s&]+)\s+(\d+h\s*\d*m|\d+h|\d+m)/i,
    /^([A-Za-z0-9\s&]+)\s*(\d+h\s*\d*m|\d+h|\d+m)$/i
  ];
  
  lines.forEach(line => {
    console.log('Processing line:', line);
    
    for (const pattern of appPatterns) {
      const appMatch = line.match(pattern);
      if (appMatch && appMatch[1].trim().length > 0) {
        const appName = appMatch[1].trim();
        const appTime = appMatch[2];
        
        // Skip if it's the total time or contains certain keywords
        const skipKeywords = ['total', 'screen', 'time', 'updated', 'today', 'week', 'day'];
        const shouldSkip = skipKeywords.some(keyword => 
          appName.toLowerCase().includes(keyword)
        );
        
        if (shouldSkip) continue;
        
        // Check if it's a category
        const categoryKeywords = ['utilities', 'information', 'reading', 'productivity', 'finance', 'social', 'entertainment', 'games', 'creativity'];
        const isCategory = categoryKeywords.some(keyword => 
          appName.toLowerCase().includes(keyword)
        );
        
        if (isCategory) {
          categories.push({ name: appName, time: appTime });
          console.log('Found category:', appName, appTime);
        } else {
          apps.push({ name: appName, time: appTime });
          console.log('Found app:', appName, appTime);
        }
        break; // Found a match, move to next line
      }
    }
  });
  
  // If no date found, use today's date
  if (!date) {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    };
    date = today.toLocaleDateString('en-US', options);
  }
  
  // If no updated time found, use current time
  if (!updatedAt) {
    const now = new Date();
    updatedAt = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  const result = {
    totalTime: totalTime || '0h 0m',
    date,
    apps: apps.slice(0, 5), // Limit to top 5 apps
    categories: categories.slice(0, 5), // Limit to top 5 categories
    updatedAt
  };
  
  console.log('Final parsed result:', result);
  return result;
}

// Main function to process image and extract screen time data
export async function processScreenTimeImage(imageDataUrl: string): Promise<ExtractedScreenTimeData> {
  try {
    console.log('Starting OCR processing...');
    
    // Extract text from image
    const extractedText = await extractTextFromImage(imageDataUrl);
    console.log('Extracted text:', extractedText);
    
    // Parse the extracted text
    const parsedData = parseScreenTimeData(extractedText);
    console.log('Parsed data:', parsedData);
    
    return parsedData;
  } catch (error) {
    console.error('Error processing screen time image:', error);
    throw error;
  }
}

// Fallback function for manual data entry
export function createManualScreenTimeData(
  totalTime: string, 
  date: string, 
  updatedAt: string
): ExtractedScreenTimeData {
  return {
    totalTime,
    date,
    apps: [
      { name: 'Chrome', time: '2h 53m' },
      { name: 'vibecode', time: '28m' },
      { name: 'Reddit', time: '19m' }
    ],
    categories: [
      { name: 'Utilities', time: '2h 53m' },
      { name: 'Information & Reading', time: '19m' },
      { name: 'Productivity & Finance', time: '45m' }
    ],
    updatedAt
  };
} 