fetch("http://localhost:3001").then(response => {
    console.log("Okay of", response.ok);
}).catch(error => {
    console.error("Fetch returned error", error);
})