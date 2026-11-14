// 화면 전환 중 빈 흰 화면 대신 앱 배경(휴대폰 틀)을 그대로 보여 깜빡임을 없앤다.
export const APP_BG = '#eef2ee';
export const PHONE_BG = '#111b2d';
export function AppLoading() {
  return (
    <div style={{ minHeight: '100dvh', background: APP_BG }}>
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', background: PHONE_BG }} />
    </div>
  );
}
