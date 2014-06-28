class NullDB implements TPCCDatabase {

  nullDBResponseTime: number = 0*1000; /* in milliseconds; Response time of the database that doesn't do anything */

  doNewOrderTransaction(input: NewOrder, callback: (status: string, output: NewOrder) => void) {

    setTimeout(function(){

      input.o_id        = 9999;
      input.o_entry_d   = new Date();
      input.w_tax       = 0.10;
      input.d_tax       = 0.15;
      input.d_next_oid  = 2009;
      input.c_last      = 'Singh';
      input.c_credit    = 'GC';
      input.c_discount  = 0.40;
      input.o_ol_cnt    = 9
      input.total_amount= 800;
      input.status      = 'Success';
      callback('Success', input);
      }, nullDBResponseTime);
  }
}
