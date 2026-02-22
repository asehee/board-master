import { LoginScreen } from '@/src/screens/LoginScreen';

// 라우트 파일은 화면 컴포넌트를 마운트하는 역할만 담당.
// 비즈니스 로직은 LoginScreen 내부 훅에서 처리.
export default function LoginPage() {
  return <LoginScreen />;
}
