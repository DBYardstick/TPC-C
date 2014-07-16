

interface TPCCDatabase {

  /* Return the name of the database. It may contain database version number as well. */
  getName(): string;

  /*
   * All the trnasaction profiles, except Stock Level, are required to execute
   * in at least Repeatable Read transaction isolation mode. The Stock Level
   * transaction should be executed in at least Read Committed mode.
   *
   * To leverage this flexibility afforded to us, for this one transaction
   * profile, the DB-interface implementation should switch to 'Read Committed'
   * mode before executing Stock Level transaction and switch back to
   * 'Repeatable Read' after it's completed.
   *
   * This implementation is left up to the DB-interface implementation to handle
   * appropriately.
   */

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
  doNewOrderTransaction(input: NewOrder, callback: (status: string, output: NewOrder) => void): void;

  /*
   * In case of successful transaction execution, the 'output' object should be
   * the same object that was passed in as 'input' but with all the fields
   * populated.
   *
   * In case of an error, the 'status' string should contain 'Error', and in
   * case of success, it should contain 'Success'.
   */
  doPaymentTransaction(input: Payment, callback: (status: string, output: Payment) => void): void;

  /*
   * In case of successful transaction execution, the 'output' object should be
   * the same object that was passed in as 'input' but with all the fields
   * populated.
   *
   * In case of an error, the 'status' string should contain 'Error', and in
   * case of success, it should contain 'Success'.
   */
  doDeliveryTransaction(input: Delivery, callback: (status: string, output: Delivery) => void): void;

  doOrderStatusTransaction(input: OrderStatus, callback: (status: string, output: OrderStatus) => void): void;
}
