import axios from 'axios';

async function main() {
    const url = 'http://openapi.seoul.go.kr:8088/sample/json/CrtfcUpsoInfo/1/5/';
    console.log(`Fetching ${url}...`);
    try {
        const response = await axios.get(url);
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

if (require.main === module) {
    main();
}
