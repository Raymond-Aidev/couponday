import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const API_KEY = process.env.SEOUL_DATA_API_KEY;
const BASE_URL = `http://openapi.seoul.go.kr:8088/${API_KEY}/json/CrtfcUpsoInfo/1/5/`;

export interface PublicPlaceInfo {
    CRTFC_UPSO_MGT_SNO: number;
    UPSO_NM: string; // Store Name
    CGG_CODE_NM: string; // District
    COB_CODE_NM: string; // Category
    BIZCND_CODE_NM: string; // Sub Category
    RDN_CODE_NM: string; // Address
    TEL_NO: string;
    Y_DNTS: string; // Latitude
    X_CNTS: string; // Longitude
    FOOD_MENU: string; // Menu info
}


export async function fetchPublicData() {
    if (!API_KEY) {
        console.warn('SEOUL_DATA_API_KEY is not set. Fetching sample data or mocking.');
        // In production, we would throw error or require key
        return;
    }

    try {
        console.log(`Fetching data from ${BASE_URL}...`);
        const response = await axios.get(BASE_URL);
        const data = response.data;

        if (data.CrtfcUpsoInfo && data.CrtfcUpsoInfo.row) {
            const rows: PublicPlaceInfo[] = data.CrtfcUpsoInfo.row;
            console.log(`Fetched ${rows.length} rows.`);

            const outputPath = path.join(__dirname, '../data/public_data.json');
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, JSON.stringify(rows, null, 2));
            console.log(`Saved to ${outputPath}`);
            return rows;
        } else {
            console.error('Invalid response structure:', JSON.stringify(data).substring(0, 200));
        }
    } catch (error) {
        console.error('Error fetching public data:', error);
    }
}

if (require.main === module) {
    fetchPublicData();
}
