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

// Helper function to standardize date format
function standardizeDate(dateString: string): string {
  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // If the date contains "Today" or matches today's date, use the standardized format
  if (dateString.toLowerCase().includes('today') || 
      (dateString.includes(today.getDate().toString()) && 
       dateString.includes(today.toLocaleDateString('en-US', { month: 'long' })))) {
    return todayFormatted;
  }
  
  // For other dates, try to parse and format them
  try {
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  } catch (error) {
    console.warn('Could not parse date:', dateString);
  }
  
  // Fallback to original string if parsing fails
  return dateString;
}

// AI-powered image analysis using OpenAI Vision
export async function analyzeScreenTimeWithAI(imageDataUrl: string): Promise<ExtractedScreenTimeData> {
  try {
    console.log('Starting AI vision analysis...');
    
    const response = await fetch('/api/ai-vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageDataUrl
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to analyze image with AI');
    }

    console.log('AI analysis result:', result.data);
    
    // Validate the AI response
    const data = result.data;
    if (!data.totalTime || !data.date) {
      throw new Error('AI response missing required fields');
    }

    return {
      totalTime: data.totalTime,
      date: standardizeDate(data.date),
      apps: data.apps || [],
      categories: data.categories || [],
      updatedAt: data.updatedAt || new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  } catch (error) {
    console.error('Error in AI analysis:', error);
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
    date: standardizeDate(date),
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