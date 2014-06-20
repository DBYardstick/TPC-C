begin transaction;

drop table if exists ORDER_LINE;
drop table if exists STOCK;
drop table if exists ITEM;
drop table if exists NEW_ORDER;
drop table if exists ORDERS;
drop table if exists HISTORY;
drop table if exists CUSTOMER;
drop table if exists DISTRICT;
drop table if exists WAREHOUSE;

commit transaction;