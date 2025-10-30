import { useRef, useState } from 'react';
import { Mesh } from 'three';
import { Text } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { Company } from '../types';

interface CompanyCard3DProps {
  company: Company;
  position: [number, number, number];
  onClick: (company: Company) => void;
}

export const CompanyCard3D = ({ company, position, onClick }: CompanyCard3DProps) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick(company);
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  // 시장에 따라 색상 결정
  const color = company.market === 'KOSPI' ? '#4a90e2' : '#e24a90';
  const emissiveColor = hovered ? color : '#000000';
  const scale = hovered ? 1.2 : 1;

  return (
    <group position={position}>
      {/* 기업 큐브 */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        scale={scale}
      >
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={hovered ? 0.5 : 0}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* 기업명 텍스트 */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {company.name}
      </Text>

      {/* 주가 변동률 표시 */}
      <Text
        position={[0, -1.2, 0]}
        fontSize={0.25}
        color={company.priceChange >= 0 ? '#00ff00' : '#ff0000'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#000000"
      >
        {company.priceChange >= 0 ? '+' : ''}
        {company.priceChangeRate.toFixed(2)}%
      </Text>
    </group>
  );
};
