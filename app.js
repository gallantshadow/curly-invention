const express = require("express")
const app=express()

const redis= require("async-redis")
const client = redis.createClient();

const path=require('path');
const ejs=require('ejs');

const server=require('http').createServer(app);
const io=require('socket.io')(server)

client.on("error", function(error) {
  console.error(error);
});

client.set("activeUser",'0')

app.use(express.static('public'))

async function counter(data)
{
    try{
        let value = await client.incr(data.color);
        //console.log(data.color," ",value);
      io.sockets.emit('broadcast',{ color:data.color,value});
    }
    catch(e){
      console.log(e);
    }

}

app.get("/",async(req,res)=>{
    let values=await client.mget("green","blue","red","yellow");
    //console.log(values);
    const html = await ejs.renderFile(path.join(__dirname,'./public/sockethome.ejs'), {values}, {async: true});
    res.send(html);
})

io.on('connection', async(socket)=> {
  try{
    let activeUser= await client.incr('activeUser');
    console.log('active user',":",activeUser);
    
    socket.on('green', counter );
    socket.on('blue', counter );
    socket.on('red', counter );
    socket.on('yellow', counter );

    socket.on('disconnect', async () =>{
      activeUser= await client.decr('activeUser');
      console.log('active user',":",activeUser);
      
    });
}
catch(e)
{
  console.log(e);
}
});

server.listen(3002,()=>{console.log("server is running")});