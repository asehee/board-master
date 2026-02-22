/** 비동기 딜레이. MockAdapter에서 네트워크 지연을 시뮬레이션할 때 사용. */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
