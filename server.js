const path = require('path')

const express = require('express')
const app = express()
const server = require('http').createServer(app);

const PORT = 4000

app.use(express.static(path.join(__dirname, '/public/')))

app.get('/', (req, res) => {
    res.statusCode = 200
    res.sendFile(path.join(__dirname, "/pages/index.html"), (err) => {
        if(err) console.log(err);
    })
})

app.get('/sync', (req, res) => {
    res.statusCode = 200
    res.sendFile(path.join(__dirname, "/pages/synchronouse.html"), (err) => {
        if(err) console.log(err);
    })
})

server.listen(PORT, () => {
    console.log("Listening on http://localhost:" + PORT)
})