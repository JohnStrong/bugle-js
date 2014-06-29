##What is Bugle-js?

Bugle-js is a publish-subscribe messaging api for javascript which
aims to assist javascript developers in building loosely coupled & scalable systems.

Bugle-js has three primary features:

* <strong>publishers</strong>: publish messages to topics 
* <strong>subscribers</strong>: subscribe to a topic & receive messages published to said topic
* <strong>topics</strong>: named logical channels where subscribers 'listen' & publishers 'publish'

##Bugle-js is event-based

At its core, Bugle-js has an event-driven architecture. 
In other words, Bugle-js assists developers in writing non-blocking code (yay!)

Projects that utilize Bugle-js will only react to events <strong>as they happen</strong>.
This serves to free up a projects main event loop resulting in responsive system with increased scalability.

##License

The MIT License (MIT)

Copyright (c) 2014 John Strong

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.