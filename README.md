# BoardCam

건설 현장 보드판을 촬영하고, 2x4 라벨 오버레이를 합성해 갤러리에 저장하는 iOS/Android 앱.

## 구조

```
board-master/
├── apps/
│   └── mobile/          # Expo React Native 앱 (@board/mobile)
└── packages/
    └── core/            # 공유 비즈니스 로직 (@board/core)
```

## 기술 스택

- **Runtime**: React Native 0.81 + Expo 54
- **Routing**: Expo Router (파일 기반)
- **State**: Zustand 5
- **Graphics**: @shopify/react-native-skia 2.2.12 (오버레이 합성)
- **Storage**: AsyncStorage
- **Package Manager**: pnpm 10 (workspaces)
- **Language**: TypeScript

## 주요 화면

| 화면 | 경로 | 설명 |
|------|------|------|
| 카메라 | `(tabs)/index` | 후면 카메라로 보드판 촬영 |
| 미리보기 | `preview` | Skia로 라벨 오버레이 합성 후 저장 |
| 설정 | `(tabs)/explore` | 앨범 이름 및 보드판 라벨 편집 |
| 로그인 | `(auth)/login` | 이메일/비밀번호 인증 |

## 아키텍처

`@board/core`는 UI와 분리된 인증 모듈을 제공한다.

```
UI (LoginScreen)
  → Zustand Store (auth.store)
  → AuthService
  → IAuthAdapter
  → MockAuthAdapter | RestAuthAdapter
```

어댑터 교체만으로 백엔드를 전환할 수 있다. `AppProvider`에서 `__DEV__` 플래그로 개발/프로덕션 어댑터를 선택한다.

## 시작하기

### 의존성 설치

```bash
pnpm install
```

### 개발 서버 실행

```bash
pnpm dev          # Metro 서버만 시작
pnpm dev:ios      # iOS 시뮬레이터
pnpm dev:android  # Android 에뮬레이터
```

> Skia를 사용하므로 Expo Go는 지원하지 않는다. Development Build가 필요하다.

### 네이티브 빌드

```bash
cd apps/mobile
npx expo run:ios
npx expo run:android
```

Node 18 또는 20 LTS가 필요하다. Ruby 3.x + CocoaPods가 iOS 빌드에 필요하다.

### 코드 검사

```bash
pnpm typecheck    # TypeScript 검사
pnpm lint         # ESLint
pnpm test         # Jest (packages/core)
pnpm check        # 위 세 가지 모두
```

## 환경 요구사항

- Node.js 18 또는 20 LTS
- pnpm 10
- iOS 빌드: Xcode + CocoaPods (Ruby 3.x)
- Android 빌드: Android Studio + SDK

## 설정 (앱 내)

앱 설정 탭에서 다음을 변경할 수 있다.

- **앨범 이름**: 촬영 사진이 저장될 갤러리 앨범 (기본값: `BoardCam`)
- **보드판 라벨**: 2열 x 4행 각 칸의 텍스트 (기본값: 공종, 구조물명, 위치, 공구, 공사명, 기간, 감리원, 시공자)

설정은 AsyncStorage에 저장되어 앱 재시작 후에도 유지된다.
