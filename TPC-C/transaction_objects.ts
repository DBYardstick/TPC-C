class OrderLine {
  constructor(
  public ol_i_id        : number,  /* Input */
  public ol_supply_w_id : number,  /* Input */
  public ol_quantity    : number,  /* Input */
  public i_price        : number,  /* Output */
  public i_name         : string,  /* Output */
  public i_data         : string,  /* Output */
  public s_quantity     : number,  /* Output */
  public brand_generic  : string,  /* Output */
  public ol_amount      : number   /* Output */
  ){

  }

}

/* New Order I/O, per Clause 2.4.3 */
class NewOrder {

  w_id          : number;      /* Input */
  d_id          : number;      /* Input */
  c_id          : number;      /* Input */
  order_lines   : OrderLine[]; /* Input */  /* if order_lines[n].ol_i_id === -1, then the order-line should be ignored */
  o_id          : number;      /* Output */
  o_entry_d     : Date;        /* Output */
  w_tax         : number;      /* Output */
  d_tax         : number;      /* Output */
  d_next_o_id   : number;      /* Output */
  c_last        : string;      /* Output */
  c_credit      : string;      /* Output */
  c_discount    : number;      /* Output */
  o_ol_cnt      : number;      /* Output */
  total_amount  : number;      /* Output */

  constructor() {

    this.order_lines = [];

    var i;
      for (i = 0; i < 15; ++i) {
        this.order_lines[i] = new OrderLine(0, 0, 0, 0, '', '', 0, '', 0);
      }
  }
}
