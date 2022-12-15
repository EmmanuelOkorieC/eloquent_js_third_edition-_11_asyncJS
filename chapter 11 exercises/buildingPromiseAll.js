// first implementation
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

//second and more effective implementation
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


