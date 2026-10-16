import { h } from 'preact';

interface Props {
  estName: string;
  roomNumber: string;
  color?: string;
}

export function Header({ estName, roomNumber, color }: Props) {
  return (
    <header style={{ backgroundColor: color || '#1a7a5a', color: '#fff', padding: '12px 16px' }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{estName}</div>
      <div style={{ fontSize: '14px', opacity: 0.9 }}>Chambre {roomNumber}</div>
    </header>
  );
}
