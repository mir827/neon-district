import type { MissionDefinition } from './Mission';

export const MISSIONS: MissionDefinition[] = [
  {
    id: 'coastal-dash',
    title: '해안의 푸른 신호',
    description: '해안 도로의 신호탑까지 제한 시간 안에 이동하세요.',
    startPosition: { x: -34, z: 24 },
    objectives: [
      { type: 'reach', position: { x: 155, z: -135 }, radius: 10, label: '해안 신호탑 도착' },
    ],
    timeLimit: 95,
    reward: 250,
    successCondition: '신호탑 도착',
    failureCondition: '제한 시간 초과',
  },
  {
    id: 'solar-courier',
    title: '태양전지 운송',
    description: '공업 지구의 전지를 회수해 주거 구역 정비소로 운반하세요.',
    startPosition: { x: 70, z: 86 },
    objectives: [
      {
        type: 'collect',
        itemId: 'solar-cell',
        position: { x: 132, z: 92 },
        radius: 8,
        label: '태양전지 회수',
      },
      { type: 'reach', position: { x: -122, z: 84 }, radius: 11, label: '정비소에 전달' },
    ],
    timeLimit: 150,
    reward: 420,
    successCondition: '전지 회수 후 정비소 도착',
    failureCondition: '제한 시간 초과',
  },
  {
    id: 'silent-harbor',
    title: '고요한 항구',
    description: '순찰망을 벗어나 수배를 해제한 뒤 안전 구역으로 이동하세요.',
    startPosition: { x: 118, z: -15 },
    objectives: [
      { type: 'escape', wantedAtMost: 0, label: '순찰 시야에서 벗어나기' },
      { type: 'reach', position: { x: -82, z: -142 }, radius: 12, label: '안전 구역 도착' },
    ],
    timeLimit: 180,
    reward: 600,
    successCondition: '수배 해제 후 안전 구역 도착',
    failureCondition: '제한 시간 초과',
  },
];
