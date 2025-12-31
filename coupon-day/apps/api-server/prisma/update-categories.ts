import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categoryMappings = [
  { name: '한식', seoulApiTypes: ['한식', '식육(숯불구이)', '탕류(보신용)', '정종/대포집/소주방'] },
  { name: '중식', seoulApiTypes: ['중국식'] },
  { name: '일식', seoulApiTypes: ['일식', '회집'] },
  { name: '양식', seoulApiTypes: ['경양식', '패밀리레스토랑', '패스트푸드'] },
  { name: '카페/디저트', seoulApiTypes: ['까페', '다방', '전통찻집', '호프/통닭', '감성주점'] },
  { name: '분식', seoulApiTypes: ['분식', '김밥(도시락)', '뷔페식'] },
  { name: '기타', seoulApiTypes: ['기타', '외국음식전문점(인도,태국등)', '복어취급', '출장조리', '이동조리'] },
];

async function updateCategories() {
  console.log('카테고리 Seoul API 타입 매핑 업데이트 시작...\n');

  for (const mapping of categoryMappings) {
    const result = await prisma.storeCategory.updateMany({
      where: { name: mapping.name },
      data: { seoulApiTypes: mapping.seoulApiTypes },
    });
    console.log(`✅ ${mapping.name}: ${result.count} row(s) updated`);
  }

  console.log('\n현재 카테고리 매핑 확인:');
  const categories = await prisma.storeCategory.findMany({
    select: { name: true, seoulApiTypes: true }
  });

  for (const c of categories) {
    console.log(`  ${c.name}: [${c.seoulApiTypes.join(', ')}]`);
  }

  console.log('\n✅ 업데이트 완료!');
}

updateCategories()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
