import { ImageResponse } from 'next/og';

export const alt = 'AI Tool Box - Best AI Tools Directory 2026';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 'bold', marginBottom: 20 }}>
          AI Tool Box
        </div>
        <div style={{ fontSize: 40, color: '#888888' }}>
          Best AI Tools Directory 2026
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

