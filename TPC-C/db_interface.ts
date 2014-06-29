

interface TPCCDatabase {
  getName(): string;
  doNewOrderTransaction(input: NewOrder, callback: (status: string, output: NewOrder) => void);
}
