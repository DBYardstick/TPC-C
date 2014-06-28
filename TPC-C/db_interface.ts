

interface TPCCDatabase {
  doNewOrderTransaction(input: NewOrder, callback: (status: string, output: NewOrder) => void);
}
