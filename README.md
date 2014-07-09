##What is Bugle-js?

Bugle-js is a publish-subscribe messaging api for javascript which
aims to assist developers in building loosely coupled & scalable systems.

Bugle-js has three primary features:

* <strong>publishers</strong>: publish messages to topics 
* <strong>subscribers</strong>: subscribe to a topic & receive messages published to said topic
* <strong>topics</strong>: named logical channels where subscribers 'listen' & publishers 'publish'

##Bugle-js is event-driven

At its core, Bugle-js has an event-driven architecture. 
In other words, Bugle-js assists developers in writing non-blocking code (yay!)

Projects that utilize Bugle-js will only react to events <strong>as they happen</strong>.
This serves to free up a project's main event loop resulting in a responsive system with increased scalability.

##Install

<b>Status</b>: v0.4.0 (unstable).

At the time of writing, Bugle-js is 'pre-release', that said, pre-release distributions can be found in ``dist/``.

If you would prefer, you can clone the entire repo with:
```bash
git clone https://github.com/JohnStrong/bugle-js.git
```

##Test

All Bugle-js BDD tests use <a href="http://jasmine.github.io/">jasmine</a>.

To run the jasmine test suites for Bugle-js, first you must git clone this repo (see above).

You can view the current state of Bugle-js by running the jasmine SpecRunner (located ``test/jasmine/SpecRunner.html``).
This will open a HTML page in your browser, showing the current pass/failure rate of the test suite.

Ensure that jasmine is installed on your machine and referenced correctly in the SpecRunner before running.

##Usage
To benefit from Bugle-js, first we need to create a 'model'.
```javascript
var bugleSkeleton = {
	'_constructor': function() { }
}
```
Note the ``'_constructor'`` function, this act likes like a traditional constructor often seen in many OOP
languages (Java, C#). Whatever initial state you give to Bugle will be passed to this function. In this example we are not initializing our object with any state.

Now we have to extend this object with Bugle and execute it.
```javascript
var myCustomBugle = Bugle.extend(bugleSkeleton)();
```
Next we will create a ``Subscriber`` instance for a topic, ``'demo'``.

```javascript
var subscriber = myCustomBugle.sub('demo');
```

We want to be able to handle any incoming messages on ``'demo'``, to do this we attach a receive handler to our subscriber.

```javascript
subscriber.receive(function(data) {
	console.log(data);
});
```
When a message is passed to ``'demo'`` our newly subscribed function's receive handler will be triggered with the message value.
Lets try this out by publishing some data to our function.

We can publish a message from within our global scope.

```javascript
myCustomBugle.pub('demo', [1,2,3,4]);
```
This will print ``[1,2,3,4]`` to our console.

Alternatively, we can publish a message from within our extended Bugle object. 
Lets test this by adding a method to ``bugleSkeleton``.

```javascript
var bugleSkeleton = {
	'_constructor': function() { },

	'pubTest': function() {
		this.pub('demo', 'isnt this fun!?');
	}
}
```
Now if we call ``myCustomBugle.pubTest()`` our program will print ``'isnt this fun!?'``.

we can unsubscribe any subscriber instance by calling `unsub`, passing it a topic name and a ``Subscriber`` instance.

Lets try this in our demo.

```javascript
myCustomBugle.unsub('demo', subscriber);
```

This will remove ``subscriber`` from the ``'demo'`` topic, no longer will it receive incoming messages.

##Functional Features
Take our previous example, it is lovely and all, but what if we would like our subscribers to manipulate/filter incoming messages before eventually using them.

For this, Bugle-js supports a number of HOFs (Higher Order Functions) out of the box. 
Such as
* ``map``
* ``filter``
* ``reject``
* ``flatMap``
* ``squash (join)``

To try these out lets create a new ``Subscriber`` instance and attach some HOF handlers.

```javascript
var subscriber = myCustomBugle.sub('demo');

subscriber.map(function(message) {
	return message.concat(5,6,7);
}).reject(function(message) {
	return message.length > 5;
}).receive(function(message) {
	console.log('equals [1,2,5,6,7]', message);
});
```
It would be pretty pointless using all these functions where we are only expecting 1 message at a time, but what about when we want to publish multiple messages at the same time? For example.

```javascript
myCustomBugle.pub('demo', [5,4,3,1],[1,2]);
```
When this code is executed, all subscribers of the topic ``'demo'`` will receive 2 messages (``[5,4,3,2,1]``, ``[1,2]``). 
Before eventually handling our message(s) in ``receive``, we ``map`` over each message, concatenating ``[5,6,7]`` to each and ``reject`` any message which has a length greater than 5.

In our example, the final output is ``"equals [1,2,5,6,7]" [1,2,5,6,7]``.

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