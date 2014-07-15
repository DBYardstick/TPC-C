
Build and watch for changes, from the top directory.

    tsc -w --out TPC-C/runner.js TPC-C/{null_db,transaction_objects,db_interface,postgres_db,terminal,tpcc}.ts

Run it, from the top directory.

    node TPC-C/runner.js

TODO
====

1. Allow a configurable value for the first active warehouse-id.

2. Allow user to increase/decrease the think/keying times, with an aim of
   increasing/decreasing the transaction rates using the same number of
   active warehouses.
