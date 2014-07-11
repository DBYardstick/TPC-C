

interface TPCCDatabase {

  /* Return the name of the database. It may contain database version number as well. */
  getName(): string;

  /*
   * In case of an error/rollback of New Order transaction, the TPC-C
   * specification requires that the O_ID (order-id) of the failed order be
   * shown on the screen. To accomplish this, in case of an error, the
   * DB-interfaces are required to set the 'status' string of the callback to
   * 'Item number is not valid; Order ID: <order_id>'. In case of success, the
   * 'status' should contain 'Success'
   *
   * In case of successful transaction execution, the 'output' object should be
   * the same object that was passed in as 'input' but with all the fields
   * populated.
   */
  doNewOrderTransaction(input: NewOrder, callback: (status: string, output: NewOrder) => void);

  /*
   * In case of successful transaction execution, the 'output' object should be
   * the same object that was passed in as 'input' but with all the fields
   * populated.
   *
   * In case of an error, the 'status' string should contain 'Error', and in
   * case of success, it should contain 'Success'.
   */
  doPaymentTransaction(input: Payment, callback: (status: string, output: Payment) => void);
}
