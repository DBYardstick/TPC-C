
/*****************************************
 * TPC-C Table definitions for Postrges. *
 *****************************************/

/*
 * The _ID columns are not required to be integers, they can be any data type
 * that can store a specified number of unique identifiers. See section 1.3 for
 * discussion about "N unique IDs".
 *
 * Some columns with NUMERIC data type do not require a scale (digits after the
 * decimal period). These can be converted to plain integers, perhaps with a
 * CHECK constraint to ensure integrity, if performance benefits. All that the
 * specification requires is that these columns be capable of storing at least
 * the specified number of digits.
 *
 * TODO: Have a second set of eyes review the DDL in context of Clause 1.3.
 * Specifically, we want to make sure that I did not miss any columns in the
 * table definitions.
 *
 * Note that the specifiaction allows for rearranging of the columns within a
 * table. So we can put the fixed-length fields towards the begining of the
 * table. There's no clear consensus of whether this optimization yeilds any
 * real performance benefit in Postgres, but we can try and compare the
 * optimization's performance later. If this optimization is ever tried, then
 * make sure that the order of the columns in INSERT statments is also altered
 * accordingly.
 */

begin transaction;

create table WAREHOUSE (
	W_ID		integer,
	W_NAME		varchar(10),
	W_STREET_1	varchar(20),
	W_STREET_2	varchar(20),
	W_CITY		varchar(20),
	W_STATE		char(2),
	W_ZIP		char(9),
	W_TAX		numeric(4,4),
	W_YTD		numeric(12,2),

	primary key (W_ID)
);

create table DISTRICT (
	D_ID		integer,
	D_W_ID		integer,
	D_NAME		varchar(10),
	D_STREET_1	varchar(20),
	D_STREET_2	varchar(20),
	D_CITY		varchar(20),
	D_STATE		char(2),
	D_ZIP		char(9),
	D_TAX		numeric(4,4),
	D_YTD		numeric(12,2),
	D_NEXT_O_ID	integer,

	primary key (D_W_ID, D_ID),
	foreign key (D_W_ID) references WAREHOUSE(W_ID)
);

/*
 * The CHECK constraint on C_CREDIT is not mandated by the specification, so we
 * may want to remove it and compare the performance improvement.
 */
create table CUSTOMER (
	C_ID			integer,
	C_D_ID			integer,
	C_W_ID			integer,
	C_FIRST			varchar(16),
	C_MIDDLE		char(2),
	C_LAST			varchar(16),
	C_STREET_1		varchar(20),
	C_STREET_2		varchar(20),
	C_CITY			varchar(20),
	C_STATE			char(2),
	C_ZIP			char(9),
	C_PHONE			char(16),
	C_SINCE			timestamp with time zone,
	C_CREDIT		char(2)	CHECK(C_CREDIT IN ('GC','BC')),
	C_CREDIT_LIM	numeric(12, 2),
	C_DISCOUNT		numeric(4, 4),
	C_BALANCE		numeric(12, 2),
	C_YTD_PAYMENT	numeric(12, 2),
	C_PAYMENT_CNT	numeric(4),
	C_DELIVERY_CNT	numeric(4),
	C_DATA			varchar(500),

	primary key (C_W_ID, C_D_ID, C_ID),
	foreign key (C_W_ID, C_D_ID) references DISTRICT(D_W_ID, D_ID)
);

create table HISTORY (
	H_C_ID		integer,
	H_C_D_ID	integer,
	H_C_W_ID	integer,
	H_D_ID		integer,
	H_W_ID		integer,
	H_DATE		timestamp with time zone,
	H_AMOUNT	numeric(6,2),
	H_DATA		varchar(24),

	foreign key (H_C_W_ID, H_C_D_ID, H_C_ID) references CUSTOMER(C_W_ID, C_D_ID, C_ID),
	foreign key (H_W_ID, H_D_ID) references DISTRICT(D_W_ID, D_ID)
);

/*
 * XXX: Note that the specification calls this as ORDER table. I am sure
 * it's allowed to alter the table names slightly if the SUT has some
 * limitations/restrictions, because I have seen this change in table names in
 * other 'Full Disclosure Reports' as well.
 */
create table ORDERS (
	O_ID			integer,
	O_D_ID			integer,
	O_W_ID			integer,
	O_C_ID			integer,
	O_ENTRY_D		timestamp with time zone,
	O_CARRIER_ID	integer NULL,
	O_OL_CNT		numeric(2),
	O_ALL_LOCAL		numeric(1),

	primary key (O_W_ID, O_D_ID,O_ID),
	foreign key (O_W_ID, O_D_ID, O_C_ID) references CUSTOMER(C_W_ID, C_D_ID, C_ID)
);

/*
 * XXX: Note that the specification calls this as NEW-ORDER table. I am sure
 * it's allowed to alter the table names slightly if the SUT has some
 * limitations/restrictions, because I have seen this change in table names in
 * other 'Full Disclosure Reports' as well.
 */
create table NEW_ORDER (
	NO_O_ID		integer,
	NO_D_ID		integer,
	NO_W_ID		integer,

	primary key (NO_W_ID, NO_D_ID, NO_O_ID),
	foreign key (NO_W_ID, NO_D_ID, NO_O_ID) references ORDERS(O_W_ID, O_D_ID, O_ID)
);

create table ITEM (
	I_ID	integer,
	I_IM_ID	integer,
	I_NAME	varchar(24),
	I_PRICE	numeric(5,2),
	I_DATA	varchar(50),

	primary key (I_ID)
);

create table STOCK (
	S_I_ID			integer,
	S_W_ID			integer,
	S_QUANTITY		integer,
	S_DIST_01		char(24),
	S_DIST_02		char(24),
	S_DIST_03		char(24),
	S_DIST_04		char(24),
	S_DIST_05		char(24),
	S_DIST_06		char(24),
	S_DIST_07		char(24),
	S_DIST_08		char(24),
	S_DIST_09		char(24),
	S_DIST_10		char(24),
	S_YTD			numeric(8),
	S_ORDER_CNT		numeric(4),
	S_REMOTE_CNT	numeric(4),
	S_DATA			varchar(50),

	primary key (S_W_ID, S_I_ID),
	foreign key (S_W_ID) references WAREHOUSE(W_ID),
	foreign key (S_I_ID) references ITEM(I_ID)
);

/*
 * XXX: Note that the specification calls this as ORDER-LINE table. I am sure
 * it's allowed to alter the table names slightly if the SUT has some
 * limitations/restrictions, because I have seen this change in table names in
 * other 'Full Disclosure Reports' as well.
 */
create table ORDER_LINE (
	OL_O_ID			integer,
	OL_D_ID			integer,
	OL_W_ID			integer,
	OL_NUMBER		integer,
	OL_I_ID			integer,
	OL_SUPPLY_W_ID	integer,
	OL_DELIVERY_D	timestamp with time zone NULL,
	OL_QUANTITY		numeric(2),
	OL_AMOUNT		numeric(6,2),
	OL_DIST_INFO	char(24),

	primary key (OL_W_ID, OL_D_ID, OL_O_ID, OL_NUMBER),
	foreign key (OL_W_ID, OL_D_ID, OL_O_ID) references ORDERS(O_W_ID, O_D_ID, O_ID),
	foreign key (OL_SUPPLY_W_ID, OL_I_ID) references STOCK(S_W_ID, S_I_ID)
);


/*
 * Functions for initial data population of TPC-C database.
 */

/*
 * Random string generators, as described in Clause 4.3.2.2.
 *
 * Note that error checking of input parameters is intentionally left out, since
 * these are not general-purpose functions used by the application.
 *
 * TODO: Implement these functions as SQL-language functions, and see if get
 *			better performance. One side-effect I am wary of is that the SQL
 *			language functions might get inlined (a good thing) but it may also
 *			lead to them being optimized away (called only once per query),
 *			which is not what we want.
 */
create or replace function random_a_string(x integer, y integer) returns text as $$
declare
	/* The length of the string should be between x and y characters long. */
	len			integer	= x + floor(random() * ((y + 1) - x))::integer;
	characters	text	= '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	chars_len	integer	= length(characters);
	result		text	= '';
begin
	for i in 1..len loop
		result = result || substr(characters, 1 + floor(random() * chars_len)::integer, 1);
	end loop;
	return result;
end;
$$ language plpgsql;

create or replace function random_n_string(x integer, y integer) returns text as $$
declare
	/* The length of the string should be between x and y characters long. */
	len			integer	= x + floor(random() * ((y + 1) - x))::integer;
	characters	text	= '0123456789';
	chars_len	integer	= length(characters);
	result		text	= '';
begin
	for i in 1..len loop
		result = result || substr(characters, 1 + floor(random() * chars_len)::integer, 1);
	end loop;
	return result;
end;
$$ language plpgsql;

/*
 * Function to generate C_LAST; see Clause 4.3.2.3
 */
create or replace function generate_c_last(num integer) returns text as $$
declare
	arr		text[]	= array['BAR', 'OUGHT', 'ABLE', 'PRI', 'PRES', 'ESE', 'ANTI', 'CALLY', 'ATION', 'EING'];
	first	integer = num / 100;
	second	integer = (num % 100) / 10;
	third	integer = num % 10;
begin
	return arr[first+1] || arr[second+1] || arr[third+1];
end;
$$ language plpgsql;

/*
 * Function to generate non-uniform random numbers; see Clause 2.1.6
 */
create or replace function NURand(A integer, x integer, y integer, C integer) returns integer as $$
declare
begin
	return (((floor(random() * (A+1))::integer
				| (x + floor(random() * ((y + 1) - x))::integer))
			+ C) % (y - x + 1)) + x;
end;
$$ language plpgsql;

/*
 * Load ITEM table.
 *
 * This is pretty much just one INSERT statement, so a procedure isn't even
 * necessary; this INSERT can be integrated into add_warehouses() function, if
 * needed.
 */
create or replace function load_item() returns void as $$
declare
begin
	/*
	 * I had to inject the 's as dummy' inside the inline view to force the
	 * planner to re-execute that view for each outer row. Otherwise, the inline
	 * view was optimized away, and only one random_a_string() invocation was
	 * used to populate all of the 'ORIGINAL' rows.
	 */
	insert into ITEM
		select	s										as I_ID,
				floor(random() * 10000)::integer + 1	as I_IM_ID,
				random_a_string(14, 24)					as I_NAME,
				1 + (random() * 99)						as I_PRICE,
				case when random() < 0.10 then
					(select overlay(str placing 'ORIGINAL' from 1 + floor(random() * (length(str)-8))::integer for 8)
						from (select random_a_string(26, 50) as str, s as dummy) as v1 )
				else
					random_a_string(26, 50)
				end										as I_DATA
		from generate_series(1, 100000) as s;

	return;
end;
$$ language plpgsql;

create or replace function add_warehouses(start_id integer default 1, num_warehouses integer default 1) returns setof integer as $$
begin
	return query
	with
	constants as (	/* Definition of C-Load; see Clause 2.1.6.1 */
		select floor(random() * (255+1))::integer as c_load,
		coalesce(start_id, (select count(*)+1 from WAREHOUSE)) as start_wh_id),

	warehouses_inserted(w_id) as (
		insert into WAREHOUSE
			select	s									as W_ID,
					random_a_string(6, 10)				as W_NAME,
					random_a_string(10, 20)				as W_STREET_1,
					random_a_string(10, 20)				as W_STREET_2,
					random_a_string(10, 20)				as W_CITY,
					random_a_string(2, 2)				as W_STATE,
					random_n_string(4, 4) || '11111'	as W_ZIP,
					random() * 0.2						as W_TAX,
					300000								as W_YTD
			from generate_series((select start_wh_id from constants),
									(select start_wh_id from constants) + num_warehouses - 1) as s
			returning W_ID),

	stocks_inserted as (
		insert into STOCK
			select	s											as S_ID,
					w.w_id										as W_ID,
					10 + floor(random() * (100 - 10))::integer	as S_QUANTITY,
					random_a_string(24, 24)						as S_DIST_01,
					random_a_string(24, 24)						as S_DIST_02,
					random_a_string(24, 24)						as S_DIST_03,
					random_a_string(24, 24)						as S_DIST_04,
					random_a_string(24, 24)						as S_DIST_05,
					random_a_string(24, 24)						as S_DIST_06,
					random_a_string(24, 24)						as S_DIST_07,
					random_a_string(24, 24)						as S_DIST_08,
					random_a_string(24, 24)						as S_DIST_09,
					random_a_string(24, 24)						as S_DIST_10,
					0											as S_YTD,
					0											as S_ORDER_CNT,
					0											as S_REMOTE_CNT,
					case when random() < 0.10 then
						(select overlay(str placing 'ORIGINAL' from 1 + floor(random() * (length(str)-8))::integer for 8)
							from (select random_a_string(26, 50) as str, s as dummy) as v1 )
					else
						random_a_string(26, 50)
					end										as S_DATA
			from generate_series(1, 100000) as s
				cross join warehouses_inserted as w),

		districts_inserted (d_id, d_w_id)  as (
			insert into	DISTRICT
				select	s									as D_ID,
						w.w_id								as D_W_ID,
						random_a_string(6, 10)				as D_NAME,
						random_a_string(10, 20)				as D_STREET_1,
						random_a_string(10, 20)				as D_STREET_2,
						random_a_string(10, 20)				as D_CITY,
						random_a_string(2, 2)				as D_STATE,
						random_n_string(4, 4) || '11111'	as D_ZIP,
						random() * 0.2						as D_TAX,
						30000								as D_YTD,
						3001								as D_NEXT_O_ID
				from generate_series(1, 10) as s
					cross join warehouses_inserted as w
				returning d_id, d_w_id),

		customers_inserted as (
			insert into CUSTOMER
				select	s									as C_ID,
						d.d_id								as C_D_ID,
						d.d_w_id							as C_W_ID,
						random_a_string(8, 16)				as C_FIRST,
						'OE'								as C_MIDDLE,
						case when s < 1000 then
							generate_c_last(s)
						else
							generate_c_last(NURand(255, 0, 999,
									(select c_load from constants)))
						end 								as C_LAST,
						random_a_string(10, 20)				as C_STREET_1,
						random_a_string(10, 20)				as C_STREET_2,
						random_a_string(10, 20)				as C_CITY,
						random_a_string(2, 2)				as C_STATE,
						random_n_string(4, 4) || '11111'	as C_ZIP,
						random_n_string(0, 16)				as C_PHONE,
						now()								as C_SINCE,
						case when random() < 0.10 then
							'BC'
						else
							'GC'
						end									as C_CREDIT,
						50000								as C_CREDIT_LIM,
						random() * 0.5						as C_DISCOUNT,
						-10.00								as C_BALANCE,
						10.00								as C_YTD_PAYMENT,
						1									as C_PAYMENT_CNT,
						0									as C_DELIVERY_CNT,
						random_a_string(300, 500)			as C_DATA
				from generate_series(1, 3000) as s
					cross join districts_inserted as d),

		/*
		 * Ideally, the HISTORY table should be generated using the rows
		 * returned by 'customers_inserted' CTE, but we load it using
		 * 'districts_inserted' instead, because (a) the data returned be
		 * 'customers_inserted' won't have to be cached by execution engine, and
		 * (b) the TPC-C specification doesn't disallow it; all it requires is
		 * that there be a row in HISTORY table for each row in CUSTOMER table.
		 */
		history_inserted as (
			insert into HISTORY
				select	s						as H_C_ID,
						d.d_id					as H_C_D_ID,
						d.d_w_id				as H_C_W_ID,
						d.d_id					as H_D_ID,
						d.d_w_id				as H_W_ID,
						clock_timestamp()		as H_DATE,
						10						as H_AMOUNT,
						random_a_string(12, 24)	as H_DATA
				from generate_series(1, 3000) as s
					cross join districts_inserted as d),

		/*
		 * In a single execution of this function, this random permutation gets
		 * used in all districts' ORDERS table. IOW, different runs of this
		 * function *do* use different permutations.
		 *
		 * XXX: Consider a way to generate a different random permutation for
		 * each district, within the same execution of this function.
		 */
		O_C_ID_permutation (p) as (
			select array_agg(s)
			from (select	s
					from generate_series(1, 3000) as s
					order by random()) as v),

		orders_inserted as (
			insert into ORDERS
				select	s										as O_ID,
						d.d_id									as O_D_ID,
						d.d_w_id								as O_W_ID,
						(select p[s] from O_C_ID_permutation)	as O_C_ID,
						clock_timestamp()						as O_ENTRY_D,
						case when s < 2101 then
							1 + floor(random() * 10)::integer
						else
							null
						end										as O_CARRIER_ID,
						5 + floor(random() * (10+1))::integer	as O_OL_CNT,
						1										as O_ALL_LOCAL
				from generate_series(1, 3000) as s
					cross join districts_inserted as d
				returning *),

		order_line_inserted as (
			insert into ORDER_LINE
				select	o_id											as OL_O_ID,
						o_d_id											as OL_D_ID,
						o_w_id											as OL_W_ID,
						v.s												as OL_NUMBER,
						1+floor(random() * 100000)::integer				as OL_I_ID,
						o_w_id											as OL_SUPPLY_W_ID,
						case when o_id < 2101 then
							o_entry_d
						else
							null
						end												as OL_DELIVERY_D,
						5												as OL_QUANTITY,
						case when o_id < 2101 then
							0
						else
							floor(1 + (random() * (999999 + 1)))/100
						end												as OL_AMOUNT,
						random_a_string(24, 24)							as OL_DIST_INFO
				from orders_inserted,
					lateral (select s from generate_series(1, o_ol_cnt::integer) as s) as v),

		new_order_inserted as (
			insert into NEW_ORDER
				select	o_id	as NO_O_ID,
						o_d_id	as NO_D_ID,
						o_w_id	as NO_W_ID
				from orders_inserted where o_id between 2101 and 3000)
	select w_id from warehouses_inserted;

	return;
end;
$$ language plpgsql;

create type order_line_param as (
	ol_i_id        integer,				/* Input */
	ol_supply_w_id integer,				/* Input */
	ol_quantity    integer,				/* Input */
	i_price        double precision,	/* Output */
	i_name         text,  				/* Output */
	i_data         text,  				/* Output */
	s_quantity     integer,				/* Output */
	brand_generic  char(1),				/* Output */
	ol_amount      double precision		/* Output */
);

create type new_order_param as (
	w_id			integer,					/* Input */
	d_id			integer,					/* Input */
	c_id			integer,					/* Input */
	order_lines		order_line_param[],			/* Input */
	o_id			integer,					/* Output */
	o_entry_d		timestamp with time zone,	/* Output */
	w_tax			double precision,			/* Output */
	d_tax			double precision,			/* Output */
	d_next_o_id		integer,					/* Output */
	c_last			text,						/* Output */
	c_credit		char(2),					/* Output */
	c_discount		double precision,			/* Output */
	o_ol_cnt		integer,					/* Output */
	total_amount	double precision			/* Output */
);

create or replace function throw_error(msg text) returns text as $$
begin
	raise exception '%', msg;
end;
$$ language plpgsql;

create or replace function raise_notice(msg text) returns text as $$
begin
	raise notice '%', msg;
	return msg;
end;
$$ language plpgsql;

/*
 * Function to process the 'New Order' transaction profile.
 *
 * Clause 2.3.1 explicitly allows the commands within a transaction to be
 * performed in any order (with an exception described in Clause 2.4.2.3). So we
 * can perform different parts of this function in different orders to reduce
 * the amount of time these intra-transaction commands spend waiting for each
 * other; at least one top TPC-C 'Full Disclosure Report' shows that other
 * vendors leverage this flexibility.
 *
 * But I feel that since there can be only 10 terminals operating for a warehouse,
 * and because of the transaction mix requirements, very few of those may be
 * performing this transaction. So at this point I don't feel like exploiting
 * the flexibility provided by this clause. We may want to do this at some later
 * stage, though, and see if it helps improve the performance.
 */
create or replace function process_new_order(order_p new_order_param) returns new_order_param as $$
	with
		warehouse_selected as (
			select W_TAX from WAREHOUSE where W_ID = order_p.w_id
		),
		district_updated(d_tax, generated_o_id, d_next_o_id) as (
			update	DISTRICT
			set		D_NEXT_O_ID = D_NEXT_O_ID + 1
			where	D_W_ID = order_p.w_id
			and		D_ID = order_p.d_id
			returning
					D_TAX, D_NEXT_O_ID - 1, D_NEXT_O_ID
		),
		customer_selected as (
			select	C_DISCOUNT,
					C_LAST,
					C_CREDIT
			from	CUSTOMER
			where	C_W_ID	= order_p.w_id
			and		C_D_ID	= order_p.d_id
			and		C_ID	= order_p.c_id
		),
		order_lines_input as (
			select * from unnest(order_p.order_lines) as ol
		),
		order_inserted as (
			insert into ORDERS
			values((select generated_o_id from district_updated),-- as O_ID
					order_p.d_id, -- as O_D_ID,
					order_p.w_id, --  as O_W_ID,
					order_p.c_id, --  as O_C_ID,
					now(), --  as O_ENTRY_D,	/* If this value is changed, change the value in new_order_param costructor below as well */
					null, --  as O_CARRIER_ID,
					(select count(*) from order_lines_input), --  as O_OL_CNT,
					(select	(count(*) = 0)::integer::numeric
						from	order_lines_input
						where	ol_supply_w_id <> order_p.w_id) --  as O_ALL_LOCAL
				)
		),
		new_order_inserted as (
			insert into NEW_ORDER
			values((select generated_o_id from district_updated), --  as NO_O_ID,
					order_p.d_id, --  as NO_D_ID,
					order_p.w_id --  as NO_W_ID
				)
		),
		order_lines_valid as (
			select * from order_lines_input where ol_i_id between 1 and 100000
		),
		order_lines_invalid as (
			/*
			* An invalid item is the one that's not in the ITEM table. A simple
			* ID range check is sufficient; TPC-C specification doesn't say
			* how to check this, so this seems compliant with the specification.
			*/
			select * from order_lines_input where ol_i_id not between 1 and 100000
		),
		order_lines_computed as (
			update STOCK as s
				set	S_QUANTITY =	case
									when s.S_QUANTITY >= v.ol_quantity + 10 then
										s.S_QUANTITY - v.ol_quantity
									else
										s.S_QUANTITY - v.ol_quantity + 91
									end,
					S_YTD = S_YTD + v.ol_quantity,
					S_ORDER_CNT = S_ORDER_CNT + 1,
					S_REMOTE_CNT = S_REMOTE_CNT + (v.ol_supply_w_id != order_p.w_id)::integer

			from	order_lines_valid as v,
					ITEM as i
			where	s.S_I_ID	= v.ol_i_id
				and	s.S_W_ID	= v.ol_supply_w_id
				and	i.I_ID		= v.ol_i_id
			returning
					v.ol_i_id,
					v.ol_supply_w_id,
					v.ol_quantity,
					i.I_PRICE,
					i.I_NAME,
					i.I_DATA,
					s.S_QUANTITY as s_quantity,
					case
					when i.I_DATA like '%ORIGINAL%' and s.S_DATA like '%ORIGINAL%' then
						'B'
					else
						'G'
					end as brand_generic,
					v.ol_quantity * i.I_PRICE as ol_amount,
					case
					when v.ol_i_id = 1 then
						S_DIST_01
					when v.ol_i_id = 2 then
						S_DIST_02
					when v.ol_i_id = 3 then
						S_DIST_03
					when v.ol_i_id = 4 then
						S_DIST_04
					when v.ol_i_id = 5 then
						S_DIST_05
					when v.ol_i_id = 6 then
						S_DIST_06
					when v.ol_i_id = 7 then
						S_DIST_07
					when v.ol_i_id = 8 then
						S_DIST_08
					when v.ol_i_id = 9 then
						S_DIST_09
					when v.ol_i_id = 10 then
						S_DIST_10
					end as s_dist_xx
		),
		order_line_inserted as (
			insert into ORDER_LINE
				(select	(select generated_o_id from district_updated) as OL_O_ID,
						order_p.d_id			as OL_D_ID,
						order_p.w_id			as OL_W_ID,
						row_number() over ()	as OL_NUMBER,
						ol_i_id					as OL_I_ID,
						ol_supply_w_id			as OL_SUPPLY_W_ID,
						null					as OL_DELIVERY_D,
						ol_quantity				as OL_QUANTITY,
						ol_amount				as OL_AMOUNT,
						s_dist_xx				as OL_DIST_INFO
				from	order_lines_computed as c)
				returning
						ol_amount
		),
		order_lines_rejected as (
			/* Per the specification, all the other operations of a New Order
			* transaction should precede this error-rasing operation. So, to
			* guarantee that, we include some irrelevant piece of information
			* generated from last successful operation into this CTE.
			*
			* Generated 'Order ID' needs to be reported back to the client, per
			* the specification. The 'irrelevant' data mentioned above is the
			* 'Successful item count:' below.
			*/
			select throw_error('Item number is not valid. Order id: '
						|| (select generated_o_id from district_updated)
						|| ' Successful item count: '
						|| (select count(*) from order_line_inserted)) from order_lines_invalid
		)
		-- , debug as (
		-- 	select case raise_notice('order_lines_computed: ' || order_lines_computed::text) when 'null' then '1' else '2' end from order_lines_computed limit 1
		-- )
	select (
		order_p.w_id,
		order_p.d_id,
		order_p.c_id,
		(select array_agg((ol_i_id, ol_supply_w_id, ol_quantity, i_price, i_name, i_data, s_quantity, brand_generic, ol_amount)::order_line_param) from order_lines_computed),
		(select generated_o_id from district_updated),
		now(),	/* now() is stable within a transaction, so we don't need to get it from order_inserted */
		(select w_tax from warehouse_selected),
		(select d_tax from district_updated),
		(select d_next_o_id from district_updated),
		(select c_last from customer_selected),
		(select c_credit from customer_selected),
		(select c_discount from customer_selected),
		(select count(*) from order_lines_input),
		(select sum(ol_amount)
				* (1-(select c_discount from customer_selected))
				* (1 + (select w_tax from warehouse_selected)
					+ (select d_tax from district_updated))
				/* An expression to force the ERROR if an unused I_ID is provided */
				+ (select count(*) from order_lines_rejected)
			from order_line_inserted)
		)::new_order_param;
$$ language sql;

/*

Some examples of unit tests (needs at least 2 warehouses populated). Nood some polish before these can be actually used as unit test:

postgres=# select process_new_order((1, 2, 3, '{"(-10,5,12,13,,,14,,15)","(4,10,6,7,,,,,)"}', 0, null, null, null, null, null, null, null, null, null)::new_order_param);
ERROR:  Item number is not valid. Order id: 3036 Successful item count: 1
CONTEXT:  SQL function "process_new_order" statement 1
Time: 96.286 ms
postgres=# select process_new_order((1, 2, 3, '{"(11,5,12,13,,,14,,15)","(4,10,6,7,,,,,)"}', 0, null, null, null, null, null, null, null, null, null)::new_order_param);
                                                                                                                                             process_new_order
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 (1,2,3,"{""(11,5,12,4.75,i4elhuB8yTVq5nNPsA65c,kUmfUGXdLby2Gabf46F9utZX353f7icscyH6fFk1RT3x4fM8m,97,G,57)"",""(4,10,6,3.52,bbvFNaKWi1lUnojdaecXu4,4IDAcpLnUqa5b7ndtiBSBO2Q0Zk518L5QpG2OrqJSAP,43,G,21.12)""}",3036,"2014-07-01 15:41:02.541777-04",0.0472,0.1941,3037,BARBARPRI,GC,0.1501,2,82.4151055644)
(1 row)

Time: 16.131 ms
postgres=# select process_new_order((1, 2, 3, '{"(11,5,12,13,,,14,,15)","(100001,10,6,7,,,,,)"}', 0, null, null, null, null, null, null, null, null, null)::new_order_param);
ERROR:  Item number is not valid. Order id: 3037 Successful item count: 1
CONTEXT:  SQL function "process_new_order" statement 1
Time: 7.310 ms
postgres=# select process_new_order((1, 2, 3, '{"(11,5,12,13,,,14,,15)","(100000,10,6,7,,,,,)"}', 0, null, null, null, null, null, null, null, null, null)::new_order_param);
                                                                                                                                               process_new_order
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 (1,2,3,"{""(11,5,12,4.75,i4elhuB8yTVq5nNPsA65c,kUmfUGXdLby2Gabf46F9utZX353f7icscyH6fFk1RT3x4fM8m,85,G,57)"",""(100000,10,6,31.96,uEb4jLP5hKlH8mLf,TORIGINALiL6MphQJ3GOlqa2zxOOQTBJQhYLNe5EwQLig,58,G,191.76)""}",3037,"2014-07-01 15:41:22.957463-04",0.0472,0.1941,3038,BARBARPRI,GC,0.1501,2,262.4370412212)
(1 row)

postgres=# select * from order_line where ol_o_id = 3037;
 ol_o_id | ol_d_id | ol_w_id | ol_number | ol_i_id | ol_supply_w_id | ol_delivery_d | ol_quantity | ol_amount |       ol_dist_info
---------+---------+---------+-----------+---------+----------------+---------------+-------------+-----------+--------------------------
    3037 |       2 |       1 |         1 |      11 |              5 |               |          12 |    957.12 | 1UBv5me2KGYyeM4BU84DGPaR
    3037 |       2 |       1 |         2 |  100000 |             10 |               |           6 |     21.12 | 60sCcOJUQy71t4wclE86fimL
(2 rows)

select process_new_order((1, 2, 3, '{"(4,5,6,7,,,,,)","(10,11,12,13,,,14,,15)"}', 0, null, null, null, null, null, null, null, null, null)::new_order_param);

select	*
from (select unnest( ((1, 2, 3, '{"(4,5,6,7,,,8,,9)","(10,11,12,13,,,14,,15)"}', 0, '2014/04/04 12:00:00', 0, 0, 0, '', '', 0, 0, 0)::new_order_param).order_lines) as a) as v
where (a).ol_i_id = 4;


*/

/*
 * Function to perform sanity checks on the initial data loaded. The purpose of
 * this function is to ensure that the initial data loaded does not violate the
 * requirements of the TPC-C specification.
 */
create or replace function data_load_sanity_tests() returns setof text as $$
begin
	/* Ensure that the ORIGINAL string's placement in I_DATA has sufficient variation. */
	if ((select count(*) from(select distinct position('ORIGINAL' in I_DATA) from ITEM) as v) < 40 ) then
		return next 'Less than 40 distinct placements of ORIGINAL string in I_DATA.';
	end if;

	/* Ensure that the ORIGINAL string's placement in I_DATA has sufficient variation. */
	if ((select count(*) from(select distinct position('ORIGINAL' in S_DATA) from STOCK) as v) < 40 ) then
		return next 'Less than 40 distinct placements of ORIGINAL string in S_DATA.';
	end if;

	if ((select count(*) from(select distinct c_last from customer where C_W_ID = 1 and C_ID > 1000) as v) < 500 ) then
		return next 'C_LAST column has very few distinct values.';
		return next 'HINT: Possibly NURand() is to blame.';
	end if;

	if ((select sum((O_ID = O_C_ID)::integer) from ORDERS where O_W_ID = 1) > 1000 ) then
		return next 'The random permutation for O_C_ID doesn''t seem to be random enough.';
	end if;

	if ((select count(distinct O_CARRIER_ID) from ORDERS where O_W_ID = 1) < 10) then
		return next 'Not all values of O_CARRIER_ID have been used.';
	end if;

	if ((select min(O_OL_CNT) < 5 OR max(O_OL_CNT) > 15 from ORDERS where O_W_ID = 1)) then
		return next 'Unexpected values in O_OL_CNT.';
	end if;

	if ((select count(distinct O_OL_CNT) from ORDERS where O_W_ID = 1) <> 11) then
		return next 'Each of the values in the range [5, 15] should have been used for O_OL_CNT.';
	end if;

	if (0 = (select sum(r::integer) from (select O_W_ID, O_D_ID, O_OL_CNT, count(*) >= 350 as r from ORDERS group by O_W_ID, O_D_ID, O_OL_CNT) as v)) then
		return next 'Improper distribution of O_OL_CNT.';
	end if;

	if (0 = (select sum(r::integer) from (select min(no_o_id) <> 2101 or max(no_o_id) <> 3000 as r from NEW_ORDER group by NO_W_ID, NO_D_ID) as v)) then
		return next 'Improper min/max values in NO_O_ID.';
	end if;

	/*
	 * Test that random_a_string() returns a string within the bounds. If this
	 * test fails even once, the incident should be taken seriosly to review the
	 * random_a_function(); because of the random nature of the function, the
	 * bug may not appear again for a long time.
	 */
	declare
		min_len	integer	= floor(random() * (30 + 1))::integer;
		max_len	integer	= 30 + floor(random() * (65 + 1))::integer;
		s		text	= random_a_string(min_len, max_len);
		n		text	= random_n_string(min_len, max_len);
	begin
		if (true <> (select length(s) >= min_len AND length(s) <= max_len)) then
			return next 'SERIOUS! random_a_string sanity test failed.'
						|| ' min_len: ' || min_len || ' max_len: ' || max_len
						|| ' string: ' || s;
		end if;

		if (true <> (select length(n) >= min_len AND length(n) <= max_len)) then
			return next 'SERIOUS! random_n_string sanity test failed.'
						|| ' min_len: ' || min_len || ' max_len: ' || max_len
						|| ' string: ' || n;
		end if;
	end;

	return next 'Done';
	return;
end;
$$ language plpgsql;

create or replace function consistency_checks() returns setof text as $$
begin

	/* Clause 3.3.2.1 Consistency Check 1
	 *
	 * The result of this query should be 0.
	 */

	if ( 0 <> (select  sum((not ok)::int)
				from    (select  W_ID, W_YTD = sum(D_YTD) as ok
						from	WAREHOUSE
						join	DISTRICT
							on	D_W_ID = W_ID
						group by W_ID) as v))
	then
		return next 'Consistency check 1 failed.';
	end if;

	/*
	 * Clause 3.3.2.2 Consistency Check 2
	 *
	 * Results of both the following queries should be 0
	 */

	if ( 0 <> (select  sum((not ok)::int)
				from	(select D_W_ID, D_ID, D_NEXT_O_ID - 1 = max(O_ID) as ok
						from	DISTRICT
						join	ORDERS
							on	D_W_ID = O_W_ID
							and	D_ID = O_D_ID
						group by D_W_ID, D_ID) as v))
	then
		return next 'Consitency check 2 part 1 failed.';
	end if;

	if ( 0 <> (select  sum((not ok)::int)
				from	(select D_W_ID, D_ID, D_NEXT_O_ID - 1 = max(NO_O_ID) as ok
						from	DISTRICT
						join	NEW_ORDER
							on	D_W_ID = NO_W_ID
							and	D_ID = NO_D_ID
						group by D_W_ID, D_ID) as v))
	then
		return next 'Consitency check 2 part 2 failed.';
	end if;

	/*
	 * TODO: Add all the checks here. Optionally, depending on a parameter,
	 * perform only first 4 checks, because the rest of the checks may be time-
	 * consuming, and because the Clause 3.3.2 allows it.
	 */

	return next 'All checks finished.'
	return;
end;
$$ language plpgsql;

commit transaction;
