
About
=====

This project aims to implement the TPC benchmarks to a T, so much so that its
results can pass a TPC auditor's scrutiny and can be published. Agreed that
there's a lot more to a benchmark than the code to test the SUT (system under
test), but quality and implementation of code determines how much one has to
spend on the client-side hardware to drive the tests.

The first benchmark to be implemented is the famous TPC-C. I will target Postgres
as the database SUT, since it's the one I am most comfortable with.

Why
===

I am not happy with the various open-source benchmarks out there. Just to name a
few, I have seen DBT2 and recently HammerDB, and in both of these, even if the
code allows for enabling keying time and think times, as mandated by TPC-C, I
highly doubt anyone enables those options, and for a good reason. If those
options are enabled, you'd need thousands of terminals to get any decent
benchmark results, plus you will have to employ the likes of middleware or
connection pooler (TP monitor, in TPC-C parlance) to ensure that merely
connecting thousands of clients to the database wouldn't bring it to a grinding
halt.

Decisions
=========

I had been thinking of implementing this benchmark for a couple of years, and I
was convinced that node.js' ability to allow easily and cheaply create
asynchronous, highly concurrent network applications was the right way to
implement the benchmark.

So I spent almost a day researching technology options and browsing the TPC-C
benchmark (my first goal). I considered following:

0. One terminal per process is not an option

	It appears, from some of the past 'Full Disclosure' reports I read, that the
norm is to create an application that simulates an order-entry terminal, and
run multiple instances of it from multiple computers. With a maximum tpmC
(transactions per minute of benchmark-C) at 1.2 per terminal ([Max tpmC Slide])
(because of the percentages of New Order transactions and keying/think times), one
computer simply cannot host enough processes for the tests to deliver decent
tpmC. For eg. with the default maximum process limit of around 65,000 in Linux,
we would get 78000 tpmC, which is 1300 New Order transactions per second; not
impressive.

	By requiring many physical computers to run the TPC-C tests, it would make it
prohibitively expensive for smaller organisations to even try this test as the
benchmark requires.

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
the message layout/data framing protocol of WebSockets (section 5.2 of RFC 6455).

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
to display a user-interface (UI) I would have to resort to one the likes of
curses/ncurses libraries. Although using those libraries doesn't seem very hard,
managing multiple asynchronous PG connections, and tying the interface of any
one of those connections to the UI at will, seems hard. I would like to have the
auditor choose any one of the many terminals at random, and see how transactions
are progressing on that terminal; this combined with the fact that terminals are
supposed to account for keying times and thinking times, so I'd have to put many
clients to sleep for different deterministic periods, which is no easy feat if
done in C language.

	I remembered in some recent node.js articles that there are now libraries to
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
