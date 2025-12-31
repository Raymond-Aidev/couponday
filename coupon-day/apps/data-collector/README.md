# CouponDay Data Collector

This module is responsible for acquiring restaurant menu data from various sources.

## Prerequisites

- Node.js
- `pnpm` (or `npm`)
- Seoul Public Data API Key (Get it from [data.seoul.go.kr](https://data.seoul.go.kr))

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set your API key:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env`:
   ```env
   SEOUL_DATA_API_KEY=your_key_here
   ```

## Usage

### 1. Fetch Public Data
Fetches restaurant data from Seoul Public Data Portal.
```bash
npx ts-node src/fetchPublicData.ts
```

### 2. Crawl Naver Maps (Prototype)
Crawls menu data from Naver Maps (Requires Playwright browsers).
```bash
npx playwright install chromium
npx ts-node src/crawlNaver.ts
```
