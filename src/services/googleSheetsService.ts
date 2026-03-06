import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1l7UklehnPi0XK1J4ieuHLrJFzhdpijSe/export?format=csv&gid=1868962544';

export interface Term {
  id: string; // We'll use en_US as the primary key/id since there's no explicit ID
  definition: string;
  en_US: string;
  Context: string;
  'Part of speech': string;
  zh_CN: string;
  zh_TW: string;
  ja_JP: string;
  ko_KR: string;
  fr_FR: string;
  de_DE: string;
  es_ES: string;
  // Add other fields as needed, but let's keep it flexible
  [key: string]: any;
}

export const fetchTermsFromSheet = async (): Promise<Term[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('Errors parsing CSV:', results.errors);
        }
        
        // Filter out empty rows and ensure en_US exists as we use it as ID
        const data = results.data as any[];
        
        const validTerms = data
          .filter(row => row.en_US && row.en_US.trim() !== '')
          .map(row => {
            // Create a more unique base ID using en_US and Part of speech
            let baseId = row.en_US.trim();
            if (row['Part of speech']) {
              baseId += `_${row['Part of speech'].trim()}`;
            }
            return {
              ...row,
              id: baseId
            };
          });

        // Ensure absolute uniqueness by appending a counter for any remaining duplicates
        const seenIds = new Set<string>();
        const finalTerms = validTerms.map(term => {
          let uniqueId = term.id;
          let counter = 1;
          while (seenIds.has(uniqueId)) {
            uniqueId = `${term.id}_${counter}`;
            counter++;
          }
          seenIds.add(uniqueId);
          return { ...term, id: uniqueId };
        });
          
        resolve(finalTerms);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
