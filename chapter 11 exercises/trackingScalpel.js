const {anyStorage} = require("../bigOak")
const { bigOak } = require("../crow-tech")

function locateScalpel(nest) {
    let source = nest.name
    function find(source) {
    return anyStorage(nest, source, "scalpel")
           .then(val => val === source ? val : find(val))
    }
    return find(source)
}

// implementation with async/await
async function locateScalpelAsync(nest) {
    let source = nest.name
    let result = await anyStorage(nest, source, "scalpel")
    
    while (result !== source) {
     source = result
     result = await anyStorage(nest, source, "scalpel")
    }
    
    return result
}

setTimeout(() => locateScalpel(bigOak).then(console.log), 1000)