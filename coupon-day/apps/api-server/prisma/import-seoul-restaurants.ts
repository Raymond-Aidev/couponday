/**
 * 서울시 일반음식점 데이터 적재 스크립트
 *
 * 사용법:
 *   npx ts-node prisma/import-seoul-restaurants.ts
 *   npx ts-node prisma/import-seoul-restaurants.ts --dry-run
 *   npx ts-node prisma/import-seoul-restaurants.ts --limit 1000
 */

import { PrismaClient, DataSource, ClaimStatus, StoreStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// 설정
// ============================================
const CONFIG = {
  API_KEY: '426e454c6472617938346663536677',
  API_BASE_URL: 'http://openapi.seoul.go.kr:8088',
  SERVICE_NAME: 'LOCALDATA_072404',
  BATCH_SIZE: 1000,  // API 호출당 최대 건수
  DELAY_MS: 500,     // API 호출 간 딜레이
};

// ============================================
// 타입 정의
// ============================================
interface SeoulApiRow {
  MGTNO: string;           // 관리번호 (고유키)
  BPLCNM: string;          // 사업장명
  UPTAENM: string;         // 업태명
  TRDSTATENM: string;      // 영업상태
  DTLSTATENM: string;      // 상세상태
  RDNWHLADDR: string;      // 도로명주소
  SITEWHLADDR: string;     // 지번주소
  RDNPOSTNO: string;       // 우편번호
  SITETEL: string;         // 전화번호
  X: string;               // TM좌표 X
  Y: string;               // TM좌표 Y
  APVPERMYMD: string;      // 인허가일자
  LASTMODTS: string;       // 최종수정일시
}

interface SeoulApiResponse {
  LOCALDATA_072404: {
    list_total_count: number;
    RESULT: { CODE: string; MESSAGE: string };
    row: SeoulApiRow[];
  };
}

interface ImportStats {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
}

// ============================================
// 업태 → 카테고리 매핑
// ============================================
let categoryMap: Map<string, string> = new Map();

async function loadCategoryMap() {
  const categories = await prisma.storeCategory.findMany({
    select: { id: true, seoulApiTypes: true },
  });

  for (const cat of categories) {
    for (const apiType of cat.seoulApiTypes) {
      categoryMap.set(apiType, cat.id);
    }
  }

  console.log(`📂 Loaded ${categoryMap.size} API type → category mappings`);
}

function getCategoryId(uptaenm: string): string | null {
  // 정확히 매칭
  if (categoryMap.has(uptaenm)) {
    return categoryMap.get(uptaenm)!;
  }

  // 부분 매칭 시도
  for (const [apiType, categoryId] of categoryMap) {
    if (uptaenm.includes(apiType) || apiType.includes(uptaenm)) {
      return categoryId;
    }
  }

  // 기타 카테고리 반환
  return categoryMap.get('기타') || null;
}

// ============================================
// API 호출
// ============================================
async function fetchSeoulApi(startIdx: number, endIdx: number): Promise<SeoulApiRow[]> {
  const url = `${CONFIG.API_BASE_URL}/${CONFIG.API_KEY}/json/${CONFIG.SERVICE_NAME}/${startIdx}/${endIdx}/`;

  try {
    const response = await fetch(url);
    const data = await response.json() as SeoulApiResponse;

    if (data.LOCALDATA_072404.RESULT.CODE !== 'INFO-000') {
      console.error(`API Error: ${data.LOCALDATA_072404.RESULT.MESSAGE}`);
      return [];
    }

    return data.LOCALDATA_072404.row || [];
  } catch (error) {
    console.error(`Fetch error: ${error}`);
    return [];
  }
}

// ============================================
// 데이터 변환 및 저장
// ============================================
async function importRow(row: SeoulApiRow, dryRun: boolean): Promise<boolean> {
  // 영업중이 아닌 경우 스킵
  if (row.TRDSTATENM !== '영업/정상') {
    return false;
  }

  // 주소가 없으면 스킵
  const address = row.RDNWHLADDR || row.SITEWHLADDR;
  if (!address) {
    return false;
  }

  // 카테고리 매핑
  const categoryId = getCategoryId(row.UPTAENM);
  if (!categoryId) {
    console.warn(`  ⚠️ No category for: ${row.UPTAENM}`);
    return false;
  }

  if (dryRun) {
    console.log(`  [DRY-RUN] Would import: ${row.BPLCNM} (${row.UPTAENM})`);
    return true;
  }

  try {
    await prisma.store.upsert({
      where: { seoulApiId: row.MGTNO },
      create: {
        seoulApiId: row.MGTNO,
        name: row.BPLCNM,
        categoryId: categoryId,
        address: address,
        addressDetail: row.SITEWHLADDR !== row.RDNWHLADDR ? row.SITEWHLADDR : null,
        postalCode: row.RDNPOSTNO || null,
        phone: row.SITETEL || null,
        status: StoreStatus.ACTIVE,
        dataSource: DataSource.SEOUL_API,
        claimStatus: ClaimStatus.UNCLAIMED,
        rawApiData: row as unknown as Record<string, unknown>,
      },
      update: {
        name: row.BPLCNM,
        address: address,
        phone: row.SITETEL || null,
        rawApiData: row as unknown as Record<string, unknown>,
      },
    });
    return true;
  } catch (error) {
    console.error(`  ❌ Error importing ${row.BPLCNM}: ${error}`);
    return false;
  }
}

// ============================================
// 메인 함수
// ============================================
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]!) : Infinity;

  console.log('🚀 서울시 일반음식점 데이터 적재 시작');
  console.log(`   모드: ${dryRun ? 'DRY-RUN (실제 저장 안함)' : 'PRODUCTION'}`);
  console.log(`   제한: ${limit === Infinity ? '없음' : limit + '건'}`);
  console.log('');

  // 카테고리 매핑 로드
  await loadCategoryMap();

  if (categoryMap.size === 0) {
    console.error('❌ 카테고리 매핑이 없습니다. seed를 먼저 실행하세요.');
    process.exit(1);
  }

  // 전체 건수 확인
  const initialData = await fetchSeoulApi(1, 1);
  if (initialData.length === 0) {
    console.error('❌ API 조회 실패');
    process.exit(1);
  }

  // API에서 총 건수 가져오기
  const totalCountResponse = await fetch(
    `${CONFIG.API_BASE_URL}/${CONFIG.API_KEY}/json/${CONFIG.SERVICE_NAME}/1/1/`
  );
  const totalCountData = await totalCountResponse.json() as SeoulApiResponse;
  const totalCount = totalCountData.LOCALDATA_072404.list_total_count;

  console.log(`📊 전체 데이터: ${totalCount.toLocaleString()}건`);
  console.log('');

  const stats: ImportStats = { total: 0, imported: 0, skipped: 0, errors: 0 };
  let currentIdx = 1;

  while (currentIdx <= totalCount && stats.imported < limit) {
    const endIdx = Math.min(currentIdx + CONFIG.BATCH_SIZE - 1, totalCount);

    console.log(`📦 Fetching ${currentIdx.toLocaleString()} ~ ${endIdx.toLocaleString()}...`);

    const rows = await fetchSeoulApi(currentIdx, endIdx);

    for (const row of rows) {
      if (stats.imported >= limit) break;

      stats.total++;
      const success = await importRow(row, dryRun);

      if (success) {
        stats.imported++;
      } else if (row.TRDSTATENM === '영업/정상') {
        stats.errors++;
      } else {
        stats.skipped++;
      }
    }

    console.log(`   ✅ 진행: ${stats.imported.toLocaleString()}건 적재, ${stats.skipped.toLocaleString()}건 스킵`);

    currentIdx += CONFIG.BATCH_SIZE;

    // API 호출 딜레이
    if (currentIdx <= totalCount && stats.imported < limit) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_MS));
    }
  }

  console.log('');
  console.log('========================================');
  console.log('📊 적재 완료 통계');
  console.log('========================================');
  console.log(`   총 처리: ${stats.total.toLocaleString()}건`);
  console.log(`   적재: ${stats.imported.toLocaleString()}건`);
  console.log(`   스킵 (폐업 등): ${stats.skipped.toLocaleString()}건`);
  console.log(`   오류: ${stats.errors.toLocaleString()}건`);
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
