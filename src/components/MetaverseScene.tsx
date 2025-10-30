import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import { Company } from '../types';
import { CompanyCard3D } from './CompanyCard3D';

interface MetaverseSceneProps {
  companies: Company[];
  onCompanyClick: (company: Company) => void;
}

export const MetaverseScene = ({ companies, onCompanyClick }: MetaverseSceneProps) => {
  // 원형으로 기업들을 배치
  const radius = 8;
  const angleStep = (2 * Math.PI) / companies.length;

  const getPosition = (index: number): [number, number, number] => {
    const angle = index * angleStep;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = Math.sin(index * 0.5) * 2; // 약간의 높이 변화
    return [x, y, z];
  };

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000' }}>
      <Canvas
        camera={{ position: [0, 5, 15], fov: 75 }}
        style={{ background: 'linear-gradient(to bottom, #0a0a1a, #1a0a2a)' }}
      >
        {/* 조명 */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <spotLight position={[0, 15, 0]} angle={0.5} penumbra={1} intensity={1} />

        {/* 별 배경 */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        {/* 환경 맵 */}
        <Environment preset="night" />

        {/* 기업 카드들 */}
        {companies.map((company, index) => (
          <CompanyCard3D
            key={company.id}
            company={company}
            position={getPosition(index)}
            onClick={onCompanyClick}
          />
        ))}

        {/* 중앙 플랫폼 */}
        <mesh position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[12, 64]} />
          <meshStandardMaterial
            color="#1a1a3a"
            metalness={0.8}
            roughness={0.2}
            opacity={0.5}
            transparent
          />
        </mesh>

        {/* 카메라 컨트롤 */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={30}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};
