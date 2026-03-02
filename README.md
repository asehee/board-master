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

