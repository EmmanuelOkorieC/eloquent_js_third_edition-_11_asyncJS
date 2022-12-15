const {bigOak, defineRequestType, everywhere} = require('./crow-tech')


bigOak.readStorage('food caches', caches => {
    let firstCache = caches[2]
    bigOak.readStorage(firstCache, info => {
        console.log(info)
    })
})

defineRequestType('note', (nest, content, source, done) => {
    console.log(`${nest.name} received note: ${content} from ${source}`)
    done(null, `Message received by ${nest.name}`)
})

bigOak.send("Cow Pasture", "note", "Let's Caw Loudly at 7PM", (err, response) => { err ? console.log("Error encountered", err) : console.log(response || "note delivered")})

function storage(nest, name) {
    return new Promise((resolve, _) => {
       nest.readStorage(name, result => resolve(result))
    })
 }

storage(bigOak, "food caches")
     .then(caches => caches[0])
     .then(firstCache => storage(bigOak, firstCache))
     .then(value => console.log(value))


class Timeout extends Error{}

function request(nest, target, type, content) {
    return new Promise((resolve, reject) => {
        let done = false
        function attempt(n) {
            nest.send(target, type, content, (failed, value) => {
                done = true
                if(failed) reject(failed)
                else resolve(value)
            })
        setTimeout(() => {
            if(done) return
            else if(n < 3) attempt(n + 1)
            else reject(new Timeout('Timed out'))
        }, 250)
    }
        attempt(1)
    })
}

// request(bigOak, 'Cow Pasture', 'note', 'Let us all relax')
// .then(value => console.log(value))

function requestType(name, handler) {
    defineRequestType(name, (nest, content, source, callback) => {
        try {
            Promise.resolve(handler(nest, content, source))
            .then(response => callback(null, response), failure => callback(failure))
        } catch(exception) {
            callback(exception)
        }
    })
}

requestType("ping", () => "pong")

function availableNeighbors(nest) {
    let requests = nest.neighbors.map(neighbor => {
        return request(nest, neighbor, 'ping')
              .then(() => true, () => false)
    })

    return Promise.all(requests).then(result => {
        return nest.neighbors.filter((_, i) => console.log(result[i]))
    })
}

// availableNeighbors(bigOak)

everywhere(nest => {
    nest.state.gossip = []
})

function sendGossip(nest, message, exceptFor = null) {
    nest.state.gossip.push(message)
    for (let neighbor of nest.neighbors) {
        if(neighbor == exceptFor) continue
        request(nest, neighbor, "gossip", message)
    }
}

requestType('gossip', (nest, message, source) => {
    if(nest.state.gossip.includes(message)) return
    console.log(`${nest.name} received message: ${message} from ${source}`)
    sendGossip(nest, message, source)
})

// setTimeout(() => sendGossip(bigOak, "Lets party!!!"), 1000)

// sendGossip(bigOak, "party at Big Oak by 7")

requestType("connections", (nest, {name, neighbors}, source) => {
    let connections = nest.state.connections
    if(JSON.stringify(connections.get(name)) == JSON.stringify(neighbors)) return;
    connections.set(name, neighbors)
    broadcastConnections(nest, name, source)
})

everywhere(nest => {
    nest.state.connections = new Map
    nest.state.connections.set(nest.name, nest.neighbors)
    broadcastConnections(nest, nest.name)
})

function broadcastConnections(nest, name, exceptFor = null) {
    for (let neighbor of nest.neighbors) {
        if (neighbor == exceptFor) continue;
       request(nest, neighbor, "connections", {
            name,
            neighbors: nest.state.connections.get(name),
        })
    }
}

// console.log(bigOak.state.connections)

// setTimeout(() => console.log(bigOak.state.connections), 1000)

// setTimeout(()=> {
//     everywhere(nest => {
//         console.log(nest.state.connections)
//     })
// }, 1000)

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
// setTimeout(() => console.log(findRoute("Big Oak", "Hawthorn", bigOak.state.connections)), 1000)

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

// setTimeout(() => {
//     routeRequest(bigOak, "Big Maple", 'note', "Let's get it")
// }, 1000)

requestType("storage", (nest, name) => storage(nest, name))

function findInStorage(nest, name) {
    return storage(nest, name).then(found => {
        if(found != null) return found
        else return findInRemoteStorage(nest, name)
    })
}

function network(nest) {
    return Array.from(nest.state.connections.keys())
}

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

// setTimeout(() => {
//     findInStorage(bigOak, "events on 2017-12-21")
//     .then(console.log)
// }, 200)

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

function anyStorage(nest, source, name) {
    if(nest.name == source) return storage(nest, name)
    else return routeRequest(nest, source, "storage", name)
}

// async function chicks(nest, year) {
//     let list = ""
//     await Promise.all(network(nest).map(async name => {
//         list += `${name}: ${await anyStorage(nest, name, `chicks in ${year}`)}\n`
//     }))
//     return list
// }

async function chicks(nest, year) {
    let lines = network(nest).map(async name => {
        return name + ": " + await anyStorage(nest, name, `chicks in ${year}`)
    })
    return (await Promise.all(lines)).join("\n")

}

// setTimeout(() => { 
//     chicks(bigOak, 2000)
//        .then(console.log)
// }, 3000)

//Assignment

function locateScapel(nest) {
    let source = nest.name
    function find(source) {
    return anyStorage(nest, source, "scalpel")
           .then(val => val === source ? val : find(val))
    }
    return find(source)
}

async function locateScapelAsync(nest) {
    let source = nest.name
    let result = await anyStorage(nest, source, "scalpel")
    
    while (result !== source) {
     source = result
     result = await anyStorage(nest, source, "scalpel")
    }
    
    return result
}

// setTimeout(() => { 
//     locateScapel(bigOak, "scalpel")
//        .then(console.log)
// }, 3000)

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


function promise_allTwo(array) {
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

// promise_allTwo([Promise.resolve(1), Promise.reject(2), Promise.resolve(3)]).then(console.log)

exports.anyStorage = anyStorage