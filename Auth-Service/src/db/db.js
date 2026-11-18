const mongose = require('mongoose')

const dbConnect = async()=>{
 try {
    await mongose.connect(process.env.mongodburi)
    console.log('Your data base connected succsfully')
 } catch (error) {
    console.log(`You have some error in db ${error}`)
 }
}

module.exports=dbConnect;

