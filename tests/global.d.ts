// Global type declarations for testing
declare global {
  interface Window {
    basketOrderManager?: {
      simulateStopLossTrigger?: (symbol: string, price: number) => void;
      createBasket?: (config: any) => Promise<string>;
      cancelBasket?: (basketId: string) => Promise<boolean>;
      getAllBaskets?: () => any[];
    };
  }
}

export {};
