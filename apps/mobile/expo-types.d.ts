// expo-env.d.ts 는 Expo 가 생성하며 .gitignore 되어 CI 에는 없다.
// 그 파일이 제공하던 expo/types(예: process.env 타입)를 CI 에서도 쓰도록 커밋되는 참조를 둔다.
/// <reference types="expo/types" />
