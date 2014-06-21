
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
	D_NEXT_OID	integer,

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
	C_CREDIT_LIM	numeric(12,2),
	C_DISCOUNT		numeric(4,4),
	C_BALANCE		numeric(12,2),
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

/* Load ITEM table.
 *
 * This is pretty much just one INSERT statement, so a procedure isn't even
 * necessary.
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
				1 + (random() * 100)					as I_PRICE,
				case
				when random() < 0.10 then
					(select overlay(str placing 'ORIGINAL' from 1 + floor(random() * (length(str)-8))::integer for 8)
						from (select random_a_string(26, 50) as str, s as dummy) as v1 )
				else
					random_a_string(26, 50)
				end										as I_DATA
		from generate_series(1, 100000) as s;

	return;
end;
$$ language plpgsql;

create or replace function add_warehouses(num_warehouses integer default 1) returns void as $$
declare
	current_w_count integer = (select count(*) from WAREHOUSE);
begin
	for w_id in current_w_count+1 .. current_w_count+num_warehouses loop

		insert into WAREHOUSE (W_ID, W_NAME, W_STREET_1, W_STREET_2, W_CITY,
								W_STATE, W_ZIP, W_TAX, W_YTD)
			values	(w_id,
					random_a_string(6, 10),
					random_a_string(10, 20),
					random_a_string(10, 20),
					random_a_string(10, 20),
					random_a_string(2, 2),
					random_n_string(4, 4) || '11111',
					random() * 0.2,
					300000);

		insert into STOCK
			select	s											as S_ID,
					w_id										as W_ID,
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
					case
					when random() < 0.10 then
						(select overlay(str placing 'ORIGINAL' from 1 + floor(random() * (length(str)-8))::integer for 8)
							from (select random_a_string(26, 50) as str, s as dummy) as v1 )
					else
						random_a_string(26, 50)
					end										as S_DATA
			from generate_series(1, 100000) as s;

		insert into	DISTRICT
			select	s									as D_ID,
					w_id								as D_W_ID,
					random_a_string(6, 10)				as D_NAME,
					random_a_string(10, 20)				as D_STREET_1,
					random_a_string(10, 20)				as D_STREET_2,
					random_a_string(10, 20)				as D_CITY,
					random_a_string(2, 2)				as D_STATE,
					random_n_string(4, 4) || '11111'	as D_ZIP,
					random() * 0.2						as D_TAX,
					30000								as D_YTD,
					3001								as D_NEXT_OID
			from generate_series(1, 10) as s;
	end loop;
end;
$$ language plpgsql;

commit transaction;
