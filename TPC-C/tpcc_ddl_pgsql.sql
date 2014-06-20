
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
	O_ID	integer,
	O_D_ID	integer,
	O_W_ID	integer,
	O_C_ID	integer,
	O_ENTRY_D	timestamp with time zone,
	O_CARRIER_ID	integer NULL,
	O_OL_CNT	numeric(2),
	O_ALL_LOCAL	numeric(1),

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

commit transaction;
