require('dotenv').config()
const dbConnect = require("./src/db/db");
const app = require("./src/app");



dbConnect()

app.listen(3000,()=>{
    console.log('server start on port no 3000')
})