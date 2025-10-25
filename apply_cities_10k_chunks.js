import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the City_Country.txt file
const filePath = path.join(__dirname, 'City_Country.txt');

console.log('Reading City_Country.txt file...');

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    console.log(`Found ${lines.length} cities in the file`);
    
    // Process in chunks of 10,000 cities
    const chunkSize = 10000;
    const totalChunks = Math.ceil(lines.length / chunkSize);
    
    console.log(`Processing ${totalChunks} chunks of ${chunkSize} cities each`);
    
    // Create the main SQL file with table setup
    let mainSqlStatements = [];
    
    // First, clear existing data
    mainSqlStatements.push('-- Clear existing data');
    mainSqlStatements.push('TRUNCATE TABLE cities_lookup CASCADE;');
    mainSqlStatements.push('');
    
    // Write the main file
    const mainOutputPath = path.join(__dirname, 'apply_cities_lookup_main_10k.sql');
    fs.writeFileSync(mainOutputPath, mainSqlStatements.join('\n'));
    
    // Process each chunk
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const startIndex = chunkIndex * chunkSize;
        const endIndex = Math.min(startIndex + chunkSize, lines.length);
        const chunkLines = lines.slice(startIndex, endIndex);
        
        console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks} (lines ${startIndex + 1}-${endIndex})`);
        
        let chunkSqlStatements = [];
        
        // Add chunk header
        chunkSqlStatements.push(`-- 10K Chunk ${chunkIndex + 1}/${totalChunks} - Cities ${startIndex + 1} to ${endIndex}`);
        chunkSqlStatements.push('INSERT INTO cities_lookup (city_name, country_name, country_code, state_province, population, is_capital, latitude, longitude) VALUES');
        
        const insertValues = [];
        
        // Process each line in the chunk
        chunkLines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                // Split by comma to get city and country
                const parts = trimmedLine.split(',');
                if (parts.length >= 2) {
                    const cityName = parts[0].trim();
                    const countryName = parts[1].trim();
                    
                    // Clean up city name (remove quotes if present)
                    const cleanCityName = cityName.replace(/^["']|["']$/g, '');
                    const cleanCountryName = countryName.replace(/^["']|["']$/g, '');
                    
                    // Generate country code (simplified)
                    const countryCode = generateCountryCode(cleanCountryName);
                    
                    // Add to insert values with proper quote escaping
                    const escapedCityName = cleanCityName.replace(/'/g, "''");
                    const escapedCountryName = cleanCountryName.replace(/'/g, "''");
                    
                    insertValues.push(`('${escapedCityName}', '${escapedCountryName}', '${countryCode}', NULL, NULL, false, NULL, NULL)`);
                }
            }
        });
        
        // Add the insert values to SQL
        chunkSqlStatements.push(insertValues.join(',\n'));
        chunkSqlStatements.push(';');
        chunkSqlStatements.push('');
        
        // Write chunk file
        const chunkOutputPath = path.join(__dirname, `apply_cities_10k_chunk_${chunkIndex + 1}.sql`);
        fs.writeFileSync(chunkOutputPath, chunkSqlStatements.join('\n'));
        
        console.log(`Generated 10K chunk file: ${chunkOutputPath} with ${insertValues.length} cities`);
    }
    
    // Create a verification file
    const verificationSql = [
        '-- Verify the data',
        'SELECT COUNT(*) as total_cities FROM cities_lookup;',
        'SELECT city_name, country_name FROM cities_lookup ORDER BY city_name LIMIT 10;',
        'SELECT country_name, COUNT(*) as city_count FROM cities_lookup GROUP BY country_name ORDER BY city_count DESC LIMIT 20;'
    ];
    
    const verificationPath = path.join(__dirname, 'verify_cities_data_10k.sql');
    fs.writeFileSync(verificationPath, verificationSql.join('\n'));
    
    console.log(`Generated verification file: ${verificationPath}`);
    console.log(`Total cities to be inserted: ${lines.length}`);
    console.log(`Generated ${totalChunks} 10K chunk files for processing`);
    
} catch (error) {
    console.error('Error reading file:', error);
}

// Simple country code generation function
function generateCountryCode(countryName) {
    const countryCodes = {
        'United States': 'USA',
        'United Kingdom': 'GBR',
        'France': 'FRA',
        'Germany': 'DEU',
        'Spain': 'ESP',
        'Italy': 'ITA',
        'Netherlands': 'NLD',
        'Austria': 'AUT',
        'Czech Republic': 'CZE',
        'Poland': 'POL',
        'Sweden': 'SWE',
        'Denmark': 'DNK',
        'Norway': 'NOR',
        'Finland': 'FIN',
        'Ireland': 'IRL',
        'Belgium': 'BEL',
        'Switzerland': 'CHE',
        'Japan': 'JPN',
        'China': 'CHN',
        'India': 'IND',
        'South Korea': 'KOR',
        'Thailand': 'THA',
        'Singapore': 'SGP',
        'Hong Kong': 'HKG',
        'United Arab Emirates': 'ARE',
        'Malaysia': 'MYS',
        'Indonesia': 'IDN',
        'Philippines': 'PHL',
        'Vietnam': 'VNM',
        'Taiwan': 'TWN',
        'Canada': 'CAN',
        'Australia': 'AUS',
        'Brazil': 'BRA',
        'Argentina': 'ARG',
        'Peru': 'PER',
        'Colombia': 'COL',
        'Chile': 'CHL',
        'Venezuela': 'VEN',
        'Uruguay': 'URY',
        'Bolivia': 'BOL',
        'Ecuador': 'ECU',
        'Egypt': 'EGY',
        'Nigeria': 'NGA',
        'South Africa': 'ZAF',
        'Kenya': 'KEN',
        'Morocco': 'MAR',
        'Democratic Republic of the Congo': 'COD',
        'Ethiopia': 'ETH',
        'Tunisia': 'TUN',
        'Algeria': 'DZA',
        'Andorra': 'AND'
    };
    
    return countryCodes[countryName] || 'UNK';
}
