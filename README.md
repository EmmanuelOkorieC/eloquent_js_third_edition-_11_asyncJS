# Eloquent Javascript, 3rd Edition: A modern Introduction to programming
An overview, with solution and explanation of exercises in chapter eleven of the ebook [Eloquent Javascript, 3rd Edition](https://eloquentjavascript.net/Eloquent_JavaScript.pdf) by Marijn Haverbeke

## Overview
### Chapter Eleven: Asynchronous Programming
In a **synchronous programming model**, things happen one at a time ( single thread ). When you call a function that performs a long-running action, it returns only when the action has finished and it can return the result. This stops your program for the time the action takes.  An **asynchronous model** allows multiple things to happen at the same time on a single thread. When you start an action, your program continues to run. When the action finishes, the program is informed and gets access to the result. A **multithreaded programming model** allows multiple things to happen at the same time by running them synchronously on different processors (multiple threads) handled by the operating system

Javascript at it's base is synchronous but it's programming platforms-Browsers and Node.js make operations that take a while asynchronous, rather than relying on threads. Since programming with threads is notoriously hard (understanding what a program does is much more difficult when it’s doing multiple things at once), this is generally considered a good thing.

#### Crow Tech
For this chapter, The author worked with a small project built to mimick a network of crow nests that communicate with each other. This project was introduced to help us better understand some asynchronous programming concepts in javascript. You can take a look at the [crow-tech.js](https://github.com/EmmanuelOkorieC/eloquent_js_third_edition-_11_asyncJS/blob/main/crow-tech.js) file. 

This file contains an immediately invoked function expression that abstracts a few things and exposes an interface with 3 items (bound to exports)
```javascript
  let network = new Network(connections, storageFor)
  exports.bigOak = network.nodes["Big Oak"]
  exports.everywhere = network.everywhere.bind(network)
  exports.defineRequestType = network.defineRequestType.bind(network)
```
* The `BigOak` nest derived from the crow's network of nests `network` which is an instance of the class `Network` that defines it's structure
* a copy of the `everywhere` function from `network` that binds itself to `network` (so it can be called, without being referenced as a method on the `network` object)
* a copy of the `defineRequestType` function from `network` that binds itself to `network`

Now let's look at the abstracted items.
```javascript
const connections = [
"Church Tower-Sportsgrounds", "Church Tower-Big Maple", 
"Big Maple-Sportsgrounds", "Big Maple-Woods", 
"Big Maple-Fabienne's Garden", "Fabienne's Garden-Woods",
"Fabienne's Garden-Cow Pasture", "Cow Pasture-Big Oak", 
"Big Oak-Butcher Shop", Butcher Shop-Tall Poplar", 
"Tall Poplar-Sportsgrounds", "Tall Poplar-Chateau",
"Chateau-Great Pine", "Great Pine-Jacques' Farm", 
"Jacques' Farm-Hawthorn", "Great Pine-Hawthorn", 
"Hawthorn-Gilles' Garden", "Great Pine-Gilles' Garden",
"Gilles' Garden-Big Oak", "Gilles' Garden-Butcher Shop", 
"Chateau-Butcher Shop"
]
```
`connections` is an array of nests in the village of Hières-sur-Amby,  that communicate with each other. This nest connections, structure out a map representing the network of crow nests in the vilage
```javascript
function storageFor(name) {
let storage = Object.create(null)
storage["food caches"] = ["cache in the oak", "cache in the meadow", "cache under the hedge"]
storage["cache in the oak"] = "A hollow above the third big branch from the bottom. Several pieces of bread and a pile of acorns."
storage["cache in the meadow"] = "Buried below the patch of nettles (south side). A dead snake."
storage["cache under the hedge"] = "Middle of the hedge at Gilles' garden. Marked with a forked twig. Two bottles of beer."
storage["enemies"] = ["Farmer Jacques' dog", "The butcher", "That one-legged jackdaw", "The boy with the airgun"]
if (name == "Church Tower" || name == "Hawthorn" || name == "Chateau")
storage["events on 2017-12-21"] = "Deep snow. Butcher's garbage can fell over. We chased off the ravens from Saint-Vulbas."
let hash = 0
for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
for (let y = 1985; y <= 2018; y++) {
storage[`chicks in ${y}`] = hash % 6
hash = Math.abs((hash << 2) ^ (hash + y))
}
if (name == "Big Oak") storage.scalpel = "Gilles' Garden"
else if (name == "Gilles' Garden") storage.scalpel = "Woods"
else if (name == "Woods") storage.scalpel = "Chateau"
else if (name == "Chateau" || name == "Butcher Shop") storage.scalpel = "Butcher Shop"
else storage.scalpel = "Big Oak"
for (let prop of Object.keys(storage)) storage[prop] = JSON.stringify(storage[prop])
    return storage
}
```
The function `storageFor` takes a nest name as argument and returns a storage object for that nest. This storage object will share properties with other nests but at the same time have properties that are unique to it. 

Before the object is returned, it's properties are encoded to JSON.

This part of the code from the `storageFor` function confused me a bit 
```javascript
let hash = 0
for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
for (let y = 1985; y <= 2018; y++) {
storage[`chicks in ${y}`] = hash % 6
hash = Math.abs((hash << 2) ^ (hash + y))
}
```
This is a fun way to randomly generate a number for chicks that hatched in each nest every year from 1985 to 2018. This was done using **bitwise operators**. To better understand this, you can read this article on bitwise operators [Javascript bitwise operators](https://www.programiz.com/javascript/bitwise-operators). Or watch this very helpful eplainer video by Mr steve griffith [JS Bitwise operators and binary numbers](https://www.youtube.com/watch?v=RRyxCmLX_ag) 

The class `Network` builds up our network of nests
```javascript
class Network {
    constructor(connections, storageFor) {
      let reachable = Object.create(null)
      for (let [from, to] of connections.map(conn => conn.split("-"))) {
        ;(reachable[from] || (reachable[from] = [])).push(to)
        ;(reachable[to] || (reachable[to] = [])).push(from)
      }
      this.nodes = Object.create(null)
      for (let name of Object.keys(reachable))
    this.nodes[name] = new Node(name, reachable[name], this, storageFor(name))
      this.types = Object.create(null)
    }

    defineRequestType(name, handler) {
      this.types[name] = handler
    }

    everywhere(f) {
      for (let node of Object.values(this.nodes)) f(node)
    }
  }
```
It takes our array of nest  `conections` and the function `storageFor` as arguments to it's constructor and uses them to build up values for it's first property `nodes`. The second property `types` is assigned an empty object with no prototype

`nodes` will be an object that contains all the nests in the village. Each nest is built as an instance of the class `Node` that defines it's structure (we will take a look at this soon)

Well, this part of the code from the class `Network` was also a bit confusing so i will explain
```javascript
let reachable = Object.create(null)
 for (let [from, to] of connections.map(conn => conn.split("-"))) {
    ;(reachable[from] || (reachable[from] = [])).push(to)
    ;(reachable[to] || (reachable[to] = [])).push(from)
}
```
This code is pretty similar to the one we wrote for `buildGraph` in the robot project from chapter 7. The only difference is that this time, instead of using a closure to add properties to the graph object, we do so using the logical OR. The problem though with writing code like this (with the parenthesis after the opening curly brace of the `for` loop) is that javascript does not know how to parse it which is why we add a semicolon in front of it. If you want to understand more how semi-colons work , you can read this article [Let's talk about semicolons in javascript](https://flaviocopes.com/javascript-automatic-semicolon-insertion/) by Flavio Copes

Now back to the class `Network`, There are two methods in it's prototype `defineRequestType` and `everywhere` which if you remember are the functions we export from the crow-tech js file. `defineRequestType` takes two arguments `name` (which gets stored as a property on object `types`) and `handler` (which gets assigned as it's value). `everywhere` takes a function `f` as argument and runs that function on every nest in the network.

```javascript
 const $storage = Symbol("storage"), $network = Symbol("network")

  function ser(value) {
    return value == null ? null : JSON.parse(JSON.stringify(value))
  }
```
The function `ser` returns a deep copy of the value we pass in as argument as long as it is not null. A deep copy of any value is created by converting it to and back from JSON. We do this so that changes to whatever object we pass into `ser` doesn't affect the copy returned in the function. We also create symbol values for  "network" and "storage" for the `Node` class (so that every instance of it will reference a unique network and storage object)

Before we talk about the class `Node`, it is important to understand **callbacks**. *callbacks* are one approach to asynchronous programming. You can think of them like this, a function ( A ) you pass as an argument to another function ( B ), that gets invoked with the result of a preset action (from function B) when it finishes. A good example is the `setTimeout` function available in both Node.js and browsers( not native to javascript) that waits a given number of milliseconds(set action) and then calls a function. (Note - Since the action is just "waiting", we do not pass it's result to the function but ideally whatever action you set provides a result for your callback function)
```javascript
setTimeout(() => console.log("Tick"), 500); //outputs Tick after 500ms
```
Performing multiple asynchronous actions in a row using callbacks
means that you have to keep passing new functions to handle the continuation of the computation after the actions.
```javascript
setTimeout(() => {
    console.log("yay")
     setTimeout(() => {
      console.log("hurray")
       setTimeout(() => {
         console.log("done")
       }, 1000)
    }, 1000)
}, 1000)

//outputs yay after 1s
//outputs hurray after another 1s
//outputs done after waiting another 1s
```
This example chains three successive asynchronous calls together, all their actions are similar (to wait 1s). After the first action is done, it runs the function passed in as argument and logs "yay" then it proceeds to the second action. When that is done, it logs "hurray" and then proceeds to complete the third action which logs "done" after waiting. The drawback to this style of programming is that when the chain of asynchronous actions get way too much, It leaves the code a bit awkward and difficult to understand.

The class `Node` from the class `Network` takes four arguments 
```javascript
 for (let name of Object.keys(reachable))
    this.nodes[name] = new Node(name, reachable[name], this, storageFor(name))
```
* The name of a nest
* An array of neighbouring nests it can communicate with
* The entire `Network` class
* And a special storage object for that nest

All these are stored as properties on the class `Node`. The class `Node` also stores a fifth property `state` that holds an empty object with no prototype

```javascript
 class Node {
    constructor(name, neighbors, network, storage) {
      this.name = name
      this.neighbors = neighbors
      this[$network] = network
      this.state = Object.create(null)
      this[$storage] = storage
    }

    send(to, type, message, callback) {
      let toNode = this[$network].nodes[to]
      if (!toNode || !this.neighbors.includes(to))
        return callback(new Error(`${to} is not reachable from ${this.name}`))
      let handler = this[$network].types[type]
      if (!handler)
        return callback(new Error("Unknown request type " + type))
      if (Math.random() > 0.03) setTimeout(() => {
        try {
          handler(toNode, ser(message), this.name, (error, response) => {
            setTimeout(() => callback(error, ser(response)), 10)
          })
        } catch(e) {
          callback(e)
        }
      }, 10 + Math.floor(Math.random() * 10))
    }

    readStorage(name, callback) {
      let value = this[$storage][name]
      setTimeout(() => callback(value && JSON.parse(value)), 20)
    }

    writeStorage(name, value, callback) {
      setTimeout(() => {
        this[$storage][name] = JSON.stringify(value)
        callback()
      }, 20)
    }
  }
```
The class `Node` has three methods in it's prototype. `readStorage`, `writeStorage` and `send`.

`readStorage` follows the concept of callbacks to read the JSON-encodable data under names in it's storage object. It takes two arguments, a string value (representing a property name) and a callback function. When called on an instance of the class `Node` (or better still a nest object), it uses the string value to access a property on the nest's storage object (set action) then calls the callback function 20 milliseconds later passing in that property value (decoded from JSON) as it's argument

A crow might store information about the places where it’s hidden food under the name "food caches", which could hold an array of names that point at other pieces of data, describing the actual cache. To look up a food cache in the storage bulbs of the Big Oak nest, a crow could run code like this:
```javascript
import {bigOak} from "./crow-tech";

bigOak.readStorage("food caches", caches => {
  let firstCache = caches[0];
    bigOak.readStorage(firstCache, info => {
    console.log(info);
    });
});

// outputs A hollow above the third big branch from the bottom. Several pieces of bread and a pile of acorns. (after 40ms)
```
It first accesses the property "food caches" then passes it's decoded value as an argument to the callback function that runs 20 milliseconds later. 

In the callback function, This decoded value which is an array of property names is assigned `caches`. It's first element is assigned `firstCache` and this property can then be accessed by passing it to `readStorage` again with a callback function that gets called another 20 milliseconds later

It's value is assigned `info` in the callback function and all we do is just log it to the console.

`writeStorage` lets us add properties to a nest's storage object (after 20 milliseconds as it gets wrapped in a `setTimeout`). It takes three arguments. `name` (serves as name of property we are adding), `value` (value of property we are adding encoded to JSON) and `callback` (a callback function that runs after the property has been added to the storage object)
```javascript
 bigOak.writeStorage("crow population", 10, () => {
    bigOak.readStorage("crow population", value => {
        console.log(value)
    })
})
//outputs 10 (after 40 ms- 20ms to add property, 20ms to read it)
```
In this example, the callback function calls `readStorage` to confirm if the property has indeed been added to `bigOak`'s storage object.

The `send` method is a bit more complex and it's why it is coming last. This method sends off a request and helps us communicate with other nests (*requests are transmitted as flashes of light signals by termites using a mirror system consisting of pieces of reflective materials embedded in the nest*). It expects the name of the target nest, the type of the request, and the content of the request as its first three arguments, and it expects a function to call when a response comes in as its fourth and last argument.

This function (fourth argument) expects an error or a response (follows a widely used convention for handling errors in callbacks). The first argument *error* represents a failed action and the second, *response* represents a successful action. (Note - All response or error from calling the `send` function is handled by this callback. Every other callback defined later still wires their result to this callback)

In the case of the call to `send` below, If it receives an exception, it logs it to the console and if it's a successful response, it does the same. 

If the response returns `null` though(if we don't define it), The null coalescing operator `??` provides a fallback value "Note delivered".
```javascript
bigOak.send("Cow Pasture", "note", "Let's caw loudly at 7PM",
(error, response) => { 
error ? console.log(error) : console.log(response ?? "Note delivered")
});
```
But to make nests capable of receiving this request, we first have to
define a request type named "note". **if we don't, an error is encountered**. To do this we use the `defineRequestType` function we export from our source file. It stores a property "note" and assigns it a handler function that would be used to send off the request later in `send`
```javascript
  import {defineRequestType} from "./crow-tech";
  
  defineRequestType("note", (nest, content, source, done) => {
   console.log(`${nest.name} received note: ${content}`);
   done(); //intentionally not define a response
 // done(null, "Note delivered") response would have looked something like this
  });
```
The target nest passed to `send` also has to exist as a part of the network of nests and be a neighboring nest our current nest can send a request to. **If not, an error is also encoutered**. 

These errors (if any) are passed as arguments to the callback function passed to `send` and it's invoked result is returned
```javascript
let toNode = this[$network].nodes[to]
if (!toNode || !this.neighbors.includes(to))
 return callback(new Error(`${to} is not reachable from ${this.name}`))
let handler = this[$network].types[type]
if (!handler)
return callback(new Error("Unknown request type " + type))
```
If we don't encounter any errors, we can progress with the code
```javascript
if (Math.random() > 0.03) setTimeout(() => {
  try {
    handler(toNode, ser(message), this.name, (error, response) => {
      setTimeout(() => callback(error, ser(response)), 10)
    })
  } catch(e) {
    callback(e)
  }
}, 10 + Math.floor(Math.random() * 10))
```
We leave the success of sending our request to a ~3% error (0.03/0.99 * 100) as we try to factor in the probability that our request gets interrupted by an event we can't control. For example, if a car's headlight interferes with the light signal(request) that get's transmitted from the nest or if the crow's mirror system does not provide enough light to transmit a request.  If `Math.random` produces a value less than or equal to 0.03, our request is not sent. But if it does(produces a value greater than 0.03), we proceed with sending the request. The request is set as an action to be called after 10 to 19 ( `10 + Math.floor(Math.random() * 10)`) milliseconds.

This action is wrapped in a `try`/`catch` block and any exception raised and caught in the `catch` block is passed as an argument to the callback function passed to `send`.

Sending the request is done by calling the handler function assigned to the "notes" property of the `types` object from `networks`(instance of the class `Network`), passing four arguments, a target nest, the content of the request, the name of the current nest and a function that it immediately calls (*with an error value and a response value*)

This function waits 10 milliseconds then calls the callback function passed to `send` passing the error value and a copy of the response value as it's arguments

#### Promises
This is another approach to asynchronous programming. It does the same thing as callbacks but follows a different approach. Instead of nesting chains of asynchronous calls that would be awkward at some point, you can return **an object** that represents this future event. This is what the standard class `Promise` is for. 

A *promise* is an asynchronous action that may complete at some point and produce a value. It is able to notify anyone who is interested when its value is available.

The easiest way to create a promise is by calling `Promise.resolve`. This wraps the value you pass to it in a promise
```javascript
let fifteen = Promise.resolve(15);
fifteen.then(value => console.log(`Got ${value}`));
//outputs Got 15
```
To get the result of a promise, you can use its `then` method. This registers a callback function to be called when the promise resolves and produces a value.

The `then` method can also return another promise which resolves to the value the handler function returns, or if that returns a promise, waits for that promise, then resolves the result. 

```javascript
let fifteenOne = Promise.resolve(15);
fifteenOne.then(value => {
   return value ** 2 //another promise. we can call the then method again to get our result
})
.then(newVal => console.log(newVal))
//outputs 225

let fifteenTwo = Promise.resolve(15);
fifteenTwo.then(value => {
   return Promise.resolve(value ** 2)
})
.then(newVal => console.log(newVal))
//outputs 225
```
There is also a `Promise.reject` function that creates a new immediately rejected promise. To explicitly handle such rejections, promises have a `catch` method that registers a handler to be called when the promise is rejected. As a shorthand though, `then` also accepts a rejection handler as a second argument so we can install both types of handlers in a single method call.

You can use a `Promise` constructor to create a promise. This constructor expects a function as argument, which it immediately calls, passing it a function it can use to resolve the promise as first argument and a function it can use to reject the promise as the second argument.

This is how you'd create a Promise-based interface for the `readStorage` function
```javascript
function storage(nest, name) {
   return new Promise((resolve, _) => {
      nest.readStorage(name, result => resolve(result))
   })
}

storage(bigOak, "food caches")
     .then(caches => caches[0])
     .then(firstCache => storage(bigOak, firstCache))
     .then(value => console.log(value))
     
//outputs A hollow above the third big branch from the bottom. Several pieces of bread and a pile of acorns.
```
Instead of nesting our asynchronous calls, we chain them with `then` and `catch` methods that act as a pipeline to move our asynchronous values and failures and this leaves our code quite simplified.

Since there is a chance a request sent by a nest might not get delivered, we can write a new function `request` that automatically retries sending the request a few times before it gives up. And, since we’ve also established that promises are a good thing, we’ll make our `request` function return a promise that either resolves to a succesful response or rejects an error. (So now to get at these values, we'll use the `then` and `catch` method after calling the `request` function)
```javascript
class Timeout extends Error {}

function request(nest, target, type, content) {
  return new Promise((resolve, reject) => {
  let done = false;
  function attempt(n) {
    nest.send(target, type, content, (failed, value) => {
    done = true;
    if (failed) reject(failed);
    else resolve(value);
   });
    setTimeout(() => {
    if (done) return;
    else if (n < 3) attempt(n + 1);
    else reject(new Timeout("Timed out"));
    }, 250);
  }
  attempt(1);
 });
}
```
Because promises can be resolved (or rejected) only once, this will
work. The first time `resolve` or `reject` is called determines the outcome of the promise, and any further calls, such as the timeout arriving after the request finishes or a request coming back after another request finished, are ignored.

The `attempt` function makes a single attempt to send a request. It also sets a timeout that, if no response has come back after 250 milliseconds, either starts the next attempt or, if this was the fourth attempt, rejects the promise with an instance of `Timeout` as the reason.

To isolate ourselves from callbacks altogether, we’ll go ahead and also define a wrapper for `defineRequestType` that allows the handler function to return a promise or plain value and wires that up to the callback for us.
```javascript
  function requestType(name, handler) {
    defineRequestType(name, (nest, content, source,
                      callback) => {
    try {
      Promise.resolve(handler(nest, content, source))
        .then(response => callback(null, response),
              failure => callback(failure));
      } catch (exception) {
        callback(exception);
      }
  });
}
```
It is important to remember that `defineRequestType` only stores a handler function under a **name**, and this function does not get called until `send` is called (with that **name** as it's request type and second argument)

The function `requestType` takes a string value `name` and a `handler` function as arguments. When called, it proceeds to call the `defineRequestType` function. Since this function will be locally scoped in `requestType`, it gets access to it's arguments.

The `defineRequestType` takes `name` and the actual handler function that gets called in `send` as arguments. When this handler function gets called, it starts by calling the `handler` function from `requestType` and wrapping it's result in a `Promise.resolve`. 

It then accesses it's result using the `then` method, passing two callback functions. The first one for a successfully resolved value and the second if an error is encountered. 

This first callback function returns a new promise that resolves to the result of calling the callback function passed to `defineRequestType` with null as it's error value and the resolved value as it's response (remenber this callback function waits 10 milliseconds then calls the callback function passed to `send` with the error and response value). 

The second callback takes the failed value and returns a new promise too, that resolves to the result of calling the callback function passed to `defineRequestType` passing the failed value as it's argument.

Note that the call to `handler` is put in a `try` block to make sure any exception it raises directly is also passed to the callback from `defineRequestType`

#### Promise.all
When working with collections of promises running at the same time,
the `Promise.all` function can be useful. It returns a promise that waits for all of the promises in the array to resolve and then resolves to an array of the values that these promises produced (in the same order as the original array). If any promise is rejected, the result of `Promise.all` is itself rejected.
```javascript
let one = Promise.resolve(1)
let two = Promise.resolve(2)
let three = Promise.resolve(3)


function collection (promise1, promise2, promise3) {
  return Promise.all([promise1, promise2, promise3])
}

collection(one, two, three)
         .then(value => console.log(value)) //outputs [1, 2, 3]

collection(one, two, Promise.reject(4))
         .then(value => console.log(value))
         .catch(error => console.log("error encoutered", error))
         //outputs error encountered 4
```
We can use `Promise.all` as an example to check which of the nests in the village are within transmission distance from the `bigOak` nest. First we call `requestType` passing a string value(name of a handler function) and a handler function as arguments
```javascript
requestType("ping", () => "pong")
```
Next we write a function `availableNeighbors` that makes a `send` request to each of our nest's neighbors. Successful requests produce true and rejected ones produce false
```javascript
function availableRequest(nest) {
   let requests = nest.neighbors.map(neighbor => {
        return request(nest, neighbor, "ping")
                .then(() => true, () => false
                )
   })
   return Promise.all(requests).then(result => {
     return nest.neighbors.filter((_, i) => result[i])
   })
}

availableRequest(bigOak).then(console.log)
//outputs [ true, true, true ]
```
When a neighbor isn't available, we don't want the entire combined promise to fail since then we wouldn't know anything. `filter` is used to remove those elements from the neighbors array whose corresponding value is false. 

This makes use of the fact that filter passes the array index of the current element as a second argument to its filtering function.

#### Network flooding
The fact that nests can talk only to their neighbors greatly inhibits the usefulness of this network. For broadcasting information to the whole network, one solution is to set up a type of request that is automatically forwarded to neighbors. These neighbors then in turn forward it to their neighbors, until the whole network has received the message.

We'll start by using the `everywhere` function (we export from our crow-tech.js file) which runs code on every nest—to add a property to the nest’s `state` object. This property will hold an empty array
```javascript
everywhere(nest => {
  nest.state.gossip = [];
});
```
Then we proceed to write the helper function `sendGossip` that makes a request to each of our nest's neighbors
```javascript
function sendGossip(nest, message, exceptFor = null) {
   nest.state.gossip.push(message);
   for (let neighbor of nest.neighbors) {
    if (neighbor == exceptFor) continue;
    request(nest, neighbor, "gossip", message);
   }
}
```
Before sending off the message though, it gets added to the `gossip` property's array on the nest's `state` object. `exceptFor` represents the nest our current nest received a message/request from. It gets assigned null for the first call. 

The function loops through our current nest's neighbors and proceeds to make the request. If `exceptFor` is one of it's neighbors, it simply skips sending a message to it again. 

Next we proceed to define a handler for the request type "gossip"
```javascript
requestType("gossip", (targetNest, message, source) => {
   if (targetNest.state.gossip.includes(message)) return;
   console.log(`${targetNest.name} received gossip '${message}' from ${source}`);
   sendGossip(targetNest, message, source);
});
```
When this handler function gets called, it checks if the target nest receives a duplicate gossip message, which is very likely to happen with everybody blindly resending them. If it does, it ignores it. But when it receives a new message, it excitedly tells all its neighbors except for the one who sent it the message. This will cause a new piece of gossip to spread through the network like an ink stain in water and get to every nest. This style of network communication is called **flooding**—it floods the network with a piece of information until all nodes have it.

```javascript
sendGossip(bigOak, "party at Big Oak by 7")
//outputs Cow Pasture received message: party at Big Oak by 7 from Big Oak
//Gilles' Garden received message: party at Big Oak by 7 from Big Oak
//.....
````
#### Message routing
If a given node wants to talk to a single other node, flooding is not a very efficient approach. Especially when the network is big, that would lead to a lot of useless data transfers. An alternative approach is to set up a way for messages to hop from node to node until they reach their destination. For this to happen, every node must have a knowledge of the network's layout to be able to compute a route.

Since each nest knows only about its direct neighbors, it doesn’t have the information it needs to compute a route. We must somehow spread the information about these connections to all nests. We can use flooding again but this time we'll be flooding each node with the name and neighbors of all the nests in the network.

This information will be stored in a `Map` object that gets assigned to every nest object using the `everywhere` function. 
```javascript
  everywhere(nest => {
  nest.state.connections = new Map;
  nest.state.connections.set(nest.name, nest.neighbors);
  broadcastConnections(nest, nest.name);
  });
```
The `everywhere` function also does two things. It adds the nest name and it's neighbors as a key-value pair on the `Map` object and proceeds to call the helper function `broadcastConections` so it can flood this first key-value property throughout the network of nests. 
```javascript
  function broadcastConnections(nest, name, exceptFor = null) {
     for (let neighbor of nest.neighbors) {
       if (neighbor == exceptFor) continue;
       request(nest, neighbor, "connections", {
       name,
       neighbors: nest.state.connections.get(name)
       });
     }
   }
```
`broadcastConnections` much like `sendGossip` sends a message to each of our nest's neighbors and excludes the one it received the message from.

This message will be an object that contains the nest name and it's neighbors( being broadcast from the `Map` object assigned to `connections` in the nest's `state` object).
```javascript
requestType("connections", (targetNest, {name, neighbors},
             source) => {
let connections = targetNest.state.connections;
if (JSON.stringify(connections.get(name)) == JSON.stringify(neighbors)) return;
connections.set(name, neighbors);
broadcastConnections(targetNest, name, source);
});
```
When the handler function for "connections" is called in `send`, It checks if the `connections` map assigned to the target nest already has the message stored, and compares it's value to the value of the `neighbors` property from the message. If they are similar, it returns from the function and does not send a duplicate message. But if the check returns undefined and our comparison returns false, it sets the message as a key-value property on our target nest's `connections` map and then happily broadcasts the message.

Now a few pointers. Because we call `broadcastConnections` to send off our request in the `everywhere` function, it means the `requestType` call to store our handler will come before the `everywhere` function is called. If it doesn't, an error message of "Unknown request type connections" is encountered. 

Also because javascript runs synchronously at it's base, The asynchronous requests we make will only return after our program is done executing (This whole action is handled by the event loop and we'll get to that soon). If the request just logs a statement to the console like in `sendGossip`, all the statements will return after our program is done executing. For `broadcastConnections` though, we are effecting a change to the Map we created in the `everywhere` function and they'll only come after the program is done executing.
So checking the Big Oak `connections` map like this will only show the first property assigned to the Map before the asynchronous calls were made
```javascript
console.log(bigOak.state.connections)
// outputs{ 'Big Oak' => [ 'Cow Pasture', 'Butcher Shop', "Gilles' Garden" ] }
```
But delaying this call by a significant amount of time will return the whole Map with all the changes effected
```javascript
setTimeout(() => console.log(bigOak.state.connections), 1000)
//outputs
//{
//  'Big Oak' => [ 'Cow Pasture', 'Butcher Shop', "Gilles' Garden" ],
//  "Gilles' Garden" => [ 'Hawthorn', 'Great Pine', 'Big Oak', 'Butcher Shop' ]
//  ......
```
Now that all the nests have a map of the network's graph object, we can use it to find a route which will point us to the direction we can send our message in

We'll write a `findRoute` function, which greatly resembles the `findRoute` function from Chapter 7. But instead of returning the whole route, it returns the nest closer to the target nest OR null if it doesn't find a route (mostly when we pass an argument that doesn't represent a nest in the network)
```javascript
function findRoute(from, to, connections) {
    let work = [{at: from, via: null}]
    for (let i = 0; i < work.length; i++) {
        let {at, via} = work[i]
        for(let next of connections.get(at) || []) {
            if (next == to) return via
            if(!work.some(w => w.at == next)) {
                work.push({at: next, via: via || next})
            }
        }
    }
    return null
}
```
If the `from` argument passed in(and assigned to `at`) does not exist as a property on the map of the network's graph, Our inner `for` loop will instead iterate through an empty array (this makes whatever code in the `for` loop not run since we iterate zero times) which means the loop exits after the first object passed to `work` has been explored and returns `null`.

If the `to` argument passed in does not exist as a nest on the network, Our `for` loop first explores every possible object, then exits the loop and returns null

Otherwise if they are two valid nests, say "Big Oak" and "Fabienne's Garden", It adds the first object `{at: Big Oak, via: null}` and proceeds to explore it. We can not get to "Fabienne's Garden" from "Big Oak" so it adds three more objects to the work array `{at: Cow Pasture, via: Cow Pasture}`, `{at: Butcher Shop, via: Butcher Shop}`, `{at: Giles Garden, via: Giles Garden}`.

This part `via: via || next` was confusing to a friend so i'll explain. The logical `OR` when written in between two values returns the left sided value if it is the boolean `true` or an actual value and ignores the right sided value. But if this left sided value is null or undefined or false or an empty string, it returns the right sided value. 
```javascript
console.log(6 || 4)
//outputs 6
console.log(null || 4)
//outputs 4
console.log(6 && 4) 
//outputs 4 in case you are wondering. returns the right side
//if both values are the boolean true or an actual value
console.log(null && 4)
//outputs null. 
//if any one of the values is null or undefined or false or ''
//it returns that value
```
This approach is what we use when assigning a value to `via`. If it is null, we simply assign `next` to it and if not, it remains `via`. 

From "Cow Pasture, we can get to "Big Oak" and "Fabienne's Garden" . Because we have already added an object that explores "Big Oak", the `some` method ignores it and proceeds to check Fabienne's Garden. Fabienne's Garden is the target nest so it exits the loop and returns "Cow Pasture"

Now we can build a function that can send long-distance messages. If
the message is addressed to a direct neighbor, it is delivered as usual. If not, it is packaged in an object and sent to a neighbor that is closer to the target, using the "route" request type, which will cause that neighbor to repeat the same behavior.
```javascript
function routeRequest(nest, target, type, content) {
    if(nest.neighbors.includes(target)) {
        return request(nest, target, type, content)
    } else {
        let via = findRoute(nest.name, target, nest.state.connections)
        if(!via) throw new Error(`No route to ${target}`)
        return request(nest, via, "route", {target, type, content})
    }

}

requestType("route", (targetNest, {target, type, content}) => {
    return routeRequest(targetNest, target, type, content)
})
```
Now we can run the `routeRequest` Function 
```javascript
setTimeout(() => {
    routeRequest(bigOak, "Big Maple", 'note', "Let's get it")
}, 1000)

//outputs Big Maple received note: Let's get it from Fabienne's Garden
```
#### Async Fuctions
An `async` function is a function that implicitly returns a promise and that can, in its body, await other promises in a way that looks synchronous. 

An `async` function is marked by the word `async` before the function keyword. Methods can also be made `async` by writing `async` before their name. When such a function or method is called, it returns a promise. 

As soon as the body of the `async` function returns something, that promise is resolved. If it throws an exception, the promise is rejected. Inside an `async` function, the word `await` can be put in front of an expression to wait for a promise to resolve and only then continue the execution of the function. Such a function no longer, like a regular JavaScript function, runs from start to completion in one go. Instead, it can be frozen at any point that has an `await`, and can be resumed at a later time.

This ability of functions to be paused and then resumed again is not exclusive to `async` functions. JavaScript also has a feature called generator functions. These are similar, but without the promises.
When you define a function with `function*` (placing an asterisk after the word function), it becomes a generator. When you call a generator, it returns an iterator (like in Chapter 6).
```javascript
function* powers(n) {
  for (let current = n;; current *= n) {
    yield current;
  }
}

let iterator = powers(3)
console.log(iterator.next()) //outputs { value: 3, done: false }
console.log(iterator.next())  // { value: 9, done: false }
console.log(iterator.next()) //  { value: 27, done: false }
console.log(iterator.next()) //  { value: 81, done: false }

for (let power of powers(3)) {
  if (power > 50) break;
  console.log(power);
}
//outputs 3
// 9
// 27
```
Initially, when you call `powers`, the function is frozen at its start. Every time you call next on the iterator, the function runs until it hits a `yield` expression, which pauses it and causes the yielded value to become the next value produced by the iterator. When the function returns (the one in the example never does), the iterator is done.

An `async` function is a special type of generator. It produces a promise when called, which is resolved when it returns (finishes) and rejected when it throws an exception. Whenever it yields (awaits) a promise, the result of that promise (value or thrown exception) is the result of the `await` expression.

Now let's take a look at the implementation of an `async` function for a rather awkward code from the nest network in the book 

To store important information, crows are known to duplicate it across nests. That way, when a hawk destroys a nest, the information isn’t lost. To retrieve a given piece of information that it doesn’t have in its own storage bulb,we can make a  nest computer consult random other nests in the network until it finds one that has it.

We'll store a handler function that calls the `storage` function from earlier to allow us read a nest's storage object
```javascript
requestType("storage", (nest, name) => storage(nest, name));
```
Then we write a function `findInStorage`that takes two arguments, a nest object and a property name. It checks if the property name  exists in the nest's storage object and if it does, returns a promise that resolves to it's value. If it doesn't ( returns undefined. `undefined == null` is true so don't get confused ), it returns a promise that resolves to the result of calling another function `findInRemoteStorage`
```javascript
function findInStorage(nest, name) {
    return storage(nest, name).then(found => {
        if(found != null) return found
        else return findInRemoteStorage(nest, name)
    })
}
```
`findInRemoteStorage` uses a helper function `network`
```javascript
function network(nest) {
    return Array.from(nest.state.connections.keys())
}
```
Because `connections` is a `Map`, `Object.keys` doesn’t work on it. It has a `keys` method, but that returns an iterator rather than an array. An iterator (or iterable value) can be converted to an array with the `Array.from` function
```javascipt
function findInRemoteStorage(nest, name) {
    let sources = network(nest).filter(n => n != nest.name)
    function next() {
        if (sources.length == 0) {
            return Promise.reject(new Error("Not Found"))
        } else {
            let source = sources[Math.floor(Math.random() * sources.length)]
            sources = sources.filter(n => n != source)
            return routeRequest(nest, source, "storage", name)
            .then(value => value != null ? value : next(), next)
        }
    }
    return next()
}
```
`sources` holds an array of the names of all nests in the village with the name of the nest passed in as argument removed so we don't search this nest again.

The function `next` does the actual searching and retrieving and it's result is returned at the end of the function. 

`next` will keep removing explored nests from the `sources` array and if at any point, it becomes empty (i.e we have explored every possible nest and still have not found the information we are looking for), `next` returns a rejected promise with the error "Not found".

Exploring itself follows this format:
* A random element is picked from the `sources` array (remember `randomPick` from chapter  7) and assigned to `source`. `source` will be the nest we explore next
* Before `source` is explored, it is removed from the `sources` array using the array method `filter`. This call to `filter` returns a new array which is reassigned to `sources` if / for when the `next` function is called again
* It then goes ahead to search `source` using the `routeRequest` function from earlier (incase `source` is not reachable from the current nest)
* This function call returns a promise and we get at it with its `then` method
* If the resolved value (i.e value returned from calling the `storage` function with the `source` nest and the name of the property we are searching for) is not undefined (exists), it returns a promise that resolves to this value 
* But if the resolved value is undefined (property does not exist), it returns a promise that resolves to the result of calling the `next` function again. If this call also returns undefined, It returns another promise that resolves to the result of calling `next` again and so on in a chain of recursive calls
* If the call to `routeRequest` fails for any reason, `next` is passed as a callback function for it to call. Meaning that it well continues exploring and the only time an error is encountered is when the `sources` array is empty
```javascript
setTimeout(() => {
    findInStorage(bigOak, "events on 2017-12-21")
    .then(console.log)
}, 200)
//outputs Deep snow. Butcher's garbage can fell over. We chased off the ravens from Saint-Vulbas.
```
The code works but it is rather awkward. Multiple asynchronous actions are chained together in non-obvious ways with the recursive function (`next`) that models looping through the nests. And the thing the code actually does is completely linear—it always waits for the previous action to complete before starting the next one. we can express this linearly/synchronously and in a less awkward way using the `async` function
```javascript
async function findInStorageTwo(nest, name) {
    let local = await storage(nest, name)
    if(local != null) return local

    let sources = network(nest).filter(n => n != nest.name)
    while (sources.length > 0) {
        let source = sources[Math.floor(Math.random() * sources.length)]
        sources = sources.filter(n => n != source)
        try {
            let found = await routeRequest(nest, source, "storage", name)
            if(found != null) return found
        } catch(_) {}
    }
    throw new Error("Not Found")
}
```

#### The Event loop
When an asynchronous event is scheduled say in a function or in a block scope or anywhere in our program really, it gets removed from our thread of synchronous events and is  executed later in it's own empty function call stack after the synchronous events (e.g the function, the code in the block scope) are done executing. 

This means that when the asynchronous event is executed, control does not go back to the function that scheduled it or say the block scope we put the asynchronous event in.  This is one of the reasons that, without promises, managing exceptions across asynchronous code is hard. Since each callback starts with a mostly empty stack, your `catch` handlers won’t be on the stack when they throw an exception.
```javascript
try {
  setTimeout(() => {
    throw new Error("Woosh");
  }, 20);
 } catch (_) {
   // This will not run
   console.log("Caught!");
}
```
The event loop processes all asynchronous events. You can think of it as a big loop around your program. When there is nothing to be done, that loop is stopped. But as asynchronous events come in, they are added to a queue (often called the *callback queue*) and when our current call stack is empty (when our program is done executing all synchronous code) their code is passed to the call stack **one at a time** to be executed. (No matter how closely together events—such as timeouts or incoming requests—happen, a JavaScript environment will run only one program at a time.)

Because no two things run at the same time, slow-running code might delay the handling of other events. This example sets a timeout but then dallies until after the timeout’s intended point of time, causing the timeout to be late.
```javascript
  let start = Date.now();
  setTimeout(() => {
    console.log("Timeout ran at", Date.now() - start);
  }, 20);
  while (Date.now() < start + 50) {}
  console.log("Wasted time until", Date.now() - start);
  // outputs Wasted time until 50
  // Timeout ran at 55
```
Promises always resolve or reject as a new event. Even if a promise is already resolved, waiting for it will cause your callback to run after the current script finishes, rather than right away.
```javascript
Promise.resolve("Done").then(console.log);
console.log("Me first!");
// outputs Me first!
// Done
```
#### Asynchronous bugs
Asynchronous events might have gaps in execution during which other code can run and it is important to be aware of them when they occur especially when using `await`. Here's an example of a code from the crow network that contains an asynchronous bug. One of the hobbies of our crows is to count the number of chicks that hatch throughout the village every year. Nests store this count in their storage bulbs. The following code tries to enumerate the counts from all the nests for a given year
```javascript
function anyStorage(nest, source, name) {
    if(nest.name == source) return storage(nest, name)
    else return routeRequest(nest, source, "storage", name)
}

async function chicks(nest, year) {
    let list = ""
    await Promise.all(network(nest).map(async name => {
        list += `${name}: ${await anyStorage(nest, name, `chicks in ${year}`)}\n`
    }))
    return list
}
```
But this code is seriously broken and will always return only a single line of output, listing the nest that was slowest to respond. This is because the `map` expression runs before anything has been added to the list, so each of the `+=` operators starts from an empty string and ends up, when its storage retrieval finishes, setting
`list` to a single-line output. This could have easily been avoided by returning the lines from the mapped promises and calling join on the result of `Promise.all`, instead of building up the list by changing a binding. As usual, computing new values is less error-prone than changing existing values.
```javascript
async function chicks(nest, year) {
    let lines = network(nest).map(async name => {
        return name + ": " + await anyStorage(nest, name, `chicks in ${year}`)
    })
    return (await Promise.all(lines)).join("\n")

}
```
## Exercises
### Chapter Eleven: Asynchronous programming
* 11.1 [Tracking the scalpel](https://github.com/EmmanuelOkorieC/eloquent_js_third_edition-_11_asyncJS/blob/main/chapter%2011%20exercises/trackingScalpel.js)

The village crows own an old scalpel that they occasionally use on special missions—say, to cut through screen doors or packaging. To be able to quickly track it down, every time the scalpel is moved to another nest, an entry is added to the storage of both the nest that had it and the nest that took it, under the name "scalpel", with its new location as the value.
This means that finding the scalpel is a matter of following the breadcrumb trail of storage entries, until you find a nest where that points at the nest itself. 

For this exercise, i was tasked to write an async function `locateScalpel` that does this, starting at the nest on which it runs using the `anyStorage` function defined earlier to access storage in arbitrary nests. The scalpel has been going around long enough that it is safe to assume that every nest has a "scalpel" entry in its data storage.

After getting this to work, I was tasked to rewrite the same function again using `async` and `await`. I was also asked to point out if failures properly show up as rejections of the returned promise in both versions? and How?

To start of, I wrote another function `find` that models searching through the nests and returned it's result at the end of the `locateScalpel` function.
```javascript
function locateScalpel(nest) {
    let source = nest.name
    function find(source) {
    return anyStorage(nest, source, "scalpel")
           .then(val => val === source ? val : find(val))
    }
    return find(source)
}
```
`find` takes a nest name as argument and uses the `anyStorage` function to access the storage of the nest looking for the property "scalpel". If the value of this property is a nest name that points to itself, then the scalpel has been found and a promise that resolves to this value is returned.

Else a promise that resolves to calling `find` with the current value as it's argument is returned. This recursive call will break only if a value that points to itself is found.

Implementing this with `async` and `await` was pretty easy
```javascript
async function locateScalpelAsync(nest) {
    let source = nest.name
    let result = await anyStorage(nest, source, "scalpel")
    
    while (result !== source) {
     source = result
     result = await anyStorage(nest, source, "scalpel")
    }
    
    return result
}
```
The while loop will continue reassigning the `result` value from calling `anyStorage` to  `source`, until the values are exactly the same at which point the scapel has been found. This value is what the promise returned by the `async` function resolves to.

When a request fails, say for example if i forgot to define a handler for "storage", the `await` in the `async` function will throw an exception and the promise it returns is rejected.

For the first implementation without `async`/`await`, If the request fails and throws an exception, it is also returned as a rejected promise and the `then` method is totally ignored. So it works the same as the `async` version

* 11.2 [Building Promise.all](https://github.com/EmmanuelOkorieC/eloquent_js_third_edition-_11_asyncJS/blob/main/chapter%2011%20exercises/buildingPromiseAll.js)

For this exercise, i was tasked to implement the `Promise.all` function as a regular function called `Promise_all`.

Two things stuck out in my approach to this exercise. `Promise.all` **returns a promise** and that promise will **resolve to a new array of resolved results**. So in the `promise_all` function, i created a new array object `newArray` that would hold all resolved results. And then I used the `Promise` constructor to create the promise object that the `promise_all` function will return

```javascript
function promise_all(array) {
    let newArray = []
    return new Promise((resolve, reject) => {
     array.forEach(promise => {
        promise
        .then(val => newArray.push(val))
       .catch(error => reject(error))
    })
    
    setTimeout(() => {
      resolve(newArray)
    }, 0)
    })
}
```
The array method `forEach` iterates through each of the promise in the array passed in as argument calling it's `then` and `catch` method. If the promise resolves successfully, it's result is added to `newArray` using the array method `push`. But if any of them throws an exception, The returned promise object is rejected with that exception as it's reason

Because calling the `then` and `catch` methods is asynchronous, It means that the call to resolve in the normal function scope will always run before the then and catch handlers are called and Since we can call resolve or reject only once, it means the `catch` handler will not run the reject function anymore even if it encounters an error 

The returned promise will always resolve to an empty array and it's call to add elements to `newArray` will come after the program is done executing. 

So the `setTimeout` practically makes the resolve call asynchronous so the handlers can run before it is executed. But i did not like this approach because if any of the promises in the array take a lot of time to resolve or reject, The returned promise will default and resolve to the empty array before those promise calls are evaluated.

I needed to delay the call to resolve till every element has been resolved and added to `newArray` no matter how long it takes. So I modified the `promise_all` function and this time used `array.length` to track the iteration of the `forEach` method
```javascript
function promise_all(array) {
    let newArray = []
    return new Promise((resolve, reject) => {
     array.forEach(promise => {
        promise
        .then(val => {
           newArray.push(val); 
           array.length--
           if(array.length == 0) resolve(newArray)})
       .catch(error => reject(error))
    })
    })
}
```
When it gets to the final promise in the array and it resolves successfully, its value is added to `newArray` and then `newArray` can be returned as the resolved value. This was much more effective
