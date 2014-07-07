
Open-source TPC benchmark implementations to a T, using less resources.

Elevator Pitch
==============

This project aims to implement the TPC benchmarks to a T, so much so that its
results can pass a TPC auditor's scrutiny and can be published. TPC-C will be
attempted first.

Agreed that there's a lot more to a benchmark than the code to test the SUT
(system under test), but the design, quality and implementation of the test
driver code determines how many resources one has to spend on the client-side
hardware to drive the tests.

If the client-side hardware requirements are reduced, the benchmark sponsor
can spend more on the hardware for the System Under Test (SUT, or the
database being tested).

The first benchmark to be implemented is the famous TPC-C. I will target
Postgres as the database SUT, since it's the one I am most comfortable with. But
I will try to make it easier for addition of other databases.

Mission Statement
=================

Develop an open-source implementations of TPC benchmarks that stick to the
standard, allow for the variations permitted by the benchmark specification,
and, most importantly, be very light on the hardware so that running a benchmark
doesn't cost someone an arm and a leg.

Strategic Planning
==================

See the "Decisions" section below.

Motivation
==========

The TPC-C benchmark drivers currently available to us, like TPCC-UVa/DBT2/HammerDB,
all run one process (or thread) at a time. Because the TPC-C benchmark specification
limits the max tpmC (transactions per minute of benchmark-C) from any single
client to be 1.2 tpmC, this means that to get a result of, say, 1 million tpmC
one has to run with about 833,000 clients. Even for a decent number as low
as 100,000 tpmC, one has to run 83,000 clients via processes/threads.

Given that running a process/thread, even on modern operating systems, is a bit
expensive, it requires a big upfront investment to run the thousands of clients
required for derving a decent tpmC number.

So, these existing implementations of TPC-C compromise on the one of the core
requirements of the TPC-C benchmark: keying time and thinking time. These
implementations resort to just hammering the SUT (system under test) with a
constant stream of transactions from a few clients (ranging from 10-50). The
database gets overwhelmed by the barrage of transactions coming from these few
clients and at that point the tpmC recorded becomes the SUT's tpmC.

So you can see that even though a decent modern database (running on a single
machine) can serve a few hundred clients simultaneously, it ends up serving
very few (10-50) clients. I strongly believe that this wasy the database is
not being tested to its full capacity.

2.7 million tpmC
-----------------

My iniital tests demonstrate that, theoretically, a NodeJS application running
on my 2-year old laptop is capable of generating about 2.7 million tpmC; all
this on a single CPU, while 7 other CPUs are sitting idle. I ran the
nodejs_ticks_per_second.js script (linked below), to see how many events can
NodeJS process per second. On my machine the result was about 600,000/sec. Since
TPC-C mandates that no more than 45% of the transactions be the New Order
Transaction, this means that only about 270,000 of those events can be used for
processing New Order Transaction. Since a New Order transaction involves about
6 steps (display menu, keying time, send transaction, receive result, render
screen, think time), we can get 45,000 New Order Transactions per second, and
that translates to 2,700,000 tpmC.

https://github.com/gurjeet/nodejs_ticks_per_second/blob/master/ticks_per_second.js

Decisions
=========

I had been thinking of implementing this benchmark for a couple of years, and I
was convinced that NodeJS' ability to allow easily and cheaply create
asynchronous, highly concurrent network applications was the right way to
implement the benchmark.

So I spent a day researching technology options and reading through  the TPC-C
benchmark (my first target benchmark). I considered following:

0. One process (or thread) per terminal is not an option

	It appears, from some of the past 'Full Disclosure' reports I read, that the
norm is to create an application that simulates an order-entry terminal, and
run multiple instances of it from multiple computers. With a maximum tpmC at
1.2 per terminal ([Max tpmC Slide]) (because of the percentages of New Order
transactions and keying/think times), one computer simply cannot host enough
processes for the tests to deliver decent tpmC. For eg. with the default maximum
process limit of around 65,000 in Linux, we would get 78,000 tpmC, given that the
OS doesn't actually come to a grinding halt by the time it creates 65k processes.

	By requiring many physical computers to run the TPC-C tests, it would make it
prohibitively expensive for smaller organisations to even try this test the way
the benchmark specification mandates.

[Max tpmC Slide]: http://www.tpc.org/information/sessions/sigmod/sld016.htm

1. Node.js application

	First I thought of implementing the benchmark as a node.js application, such
that a number of asynchronous clients would be hitting the Postgres server
asynchronously, and I can call it a day.

	But reading the TPC-C benchmark description, it appears that terminals are
quite important a requirement of the benchmark. I guess the auditor has to be
able to see the application/terminal in action. So this idea was dropped.

	By this time I had reviewed all unit-tests of node-postgres package, and was
convinced that this should be used. I did see some deficiencies in the tests and
code, but they can be improved. Eg. developed a patch for the tests; and the
'readyForQuery' message doesn't know the current transaction state, even though
the Postgres wire protocol version 3.0 conveys that, and there's no built-in
support for composing transactions, except holding on the the connection
forcefully.

2. Implementing project using node-postgres-pure, inside browser.

	This would require that the pg.js library be made to work over WebSockets,
and make Postgres understand WebSockets. I went back and read code of WSLAY
project (I have contributed some code to that project in the past). I also read
the message-layout/data-framing protocol of WebSockets (section 5.2 of RFC 6455).

	Idea was sound, but as is evident, too much work is involved in making
current projects talk over WebSockets. WebSockets itself is not free, in terms
of performance; apart from the startup-overhead of HTTP Upgrade handshake, every
message has to be encoded/decoded to extract the data that is otherwise sent raw
in the TCP communication. Also, even if I modified Postgres to understand
WebSockets, later when we'd have to introduce a connection pooler (TP monitor,
in TPC-C parlance), we'd have to modify that connection pooler as well to
understand WebSockets.

3. Back to square one: application in Node.js

	It dawned on me, why not use libpq's asynchronous API to talk to Postgres
using many connections from a single process. So I investigated that angle. But
to display a user-interface (UI) I would have to resort to one of the likes of
curses/ncurses libraries. Although using those libraries doesn't seem very hard,
managing multiple asynchronous PG connections, and tying the interface of any
one of those connections to the UI at will, feels hard. I would like to have the
auditor choose any one of the many terminals at random, and see how transactions
are progressing on that terminal; this combined with the fact that terminals are
supposed to account for keying times and thinking times, so I'd have to put many
clients to sleep for different deterministic periods, which is no easy feat if
done in C language.

	I remembered in some recent NodeJS articles that there are now libraries to
write terminal programs. Research brought up 'blessed' and I think it is the right
tool for the job (only time will tell :). It has quite sophisticated UI controls,
and it'd allow for easy tying of a model (order-entry terminal) to a view (the
console) in asynchronous fashion.

4. TypeScript

	Last but not the least, the choice of language. I understand JavaScript to
certain extent, just enough to make heads and tails of others' code, but I am
quite sure it will get pretty ugly pretty soon, and it will be difficult, if not
impossible, to prove to the auditor that the code does what the benchmark
requires.

	So I have chosen TypeScript as the language, even though I haven't coded
anything outside of its playground application. But I have great confidence in
its ability to bring clarity to a complex, weakly-typed world of JavaScript.

5. No AngularJS

	After I had decided upon using NodeJS and Blessed to develop the tests, it
occurred to me why not use AngularJS Framework (or something similar) to make it
easier for model-view binding; that is, just make a change in the model, and the
framework will take care of updating the view (terminal in our case).

	I love the concept of AngularJS because it makes it very easy to separate
the models from the view, and works almost like magic. But this magic comes at a
cost. After a little more thought, I decided against using AngularJS
specifically, because it seems to me that it compares the old and new values of
the objects to decide if something has changed in the model, which means that it
has to keep copies of objects. Since this magic requires extra memory footprint
and more CPU execution, it would incur increased latencies immediately in the
benchmark driver, and that isn't acceptable, especially when the work we'd have
to do in the absence of this framework is minimal.

6. License

	I chose GPL v3 License because I agree with its philosophy. I don't want
Tivoization to limit this code being run on someone's hardware. If you own the
hardware, you should be able to run this code on it, with whatever modifications
you deem fit.

	As of now I believe that as the owner of this project, I can change my mind
later to adopt GPLv2, if I later disagree with some of the attributes of GPLv3.
Of course, the code that was previously distributed under GPLv3 will remain
under GPLv3.

7. Do not pass JSON formatted strings to and from the database

	In Postgres, the `to_json()` and its counterpart `json_populate_record()` can
be used to marshal and unmarshal the JSON data. So it is possible to send JSON
strings to the database and make it send the result as JSON as well. That would
simplify the TPC-C application-side logic a bit because the application is being
developed in JavaScript here.

But I chose to not use JSON for database communication purely for performance
reasons. Making the database do something that can be done by the client would
make database performance suffer.
