const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const we = require('./Data/We.json');
require('dotenv').config()

const port=process.env.PORT || 7000

const app=express()
const corsConfig = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
 }
app.use(cors(corsConfig))
app.use(express.json())

app.get('/',(req,res)=>{
    console.log(`Birthday Count Server is going on port: ${port}`);
    res.send(`Birthday Count Server is going on port: ${port}`)
})

app.get('/we',(req,res)=>{
    console.log("We All:");
    res.send(we)

})
app.get('/we/:id',(req,res)=>{
    const id=req.params.id
    const target=we.find(w=>w.id==id)
    res.send(target)
})


////MongoDB Start
const USER=process.env.DB_USER
const PASSWORD=process.env.DB_PASSWORD


// const uri = "mongodb+srv://<username>:<password>@cluster0.jokwhaf.mongodb.net/?retryWrites=true&w=majority";
const uri = `mongodb+srv://${USER}:${PASSWORD}@cluster0.jokwhaf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  
    //Operation start
    const friendCollection=client.db('birthdayCount').collection('friends')

    ////Post Operation start
    app.post('/bd',async(req,res)=>{
        const friend=req.body;
        const result=await friendCollection.insertOne(friend)
        res.send(result);
    })
    ////Post Operation end


    ///Get Operation start
    app.get('/bd',async(req,res)=>{
        let query={};
        let getSort;
        let getSearch;
        if(req?.query?.email){
            query={ ...query,ref: req?.query?.email}
        }

        if(req?.query?.search){
            getSearch=req?.query?.search
            query={...query, name: {$regex: getSearch, $options: 'i'}}
        }
        console.log("Get Search: ",getSearch);


        if(req?.query?.sort){
            getSort=req?.query?.sort
           
        }
        console.log("get sort: ",getSort);
        if(getSort=="1"){
            console.log("Come in 1");
            const result=await friendCollection.find(query).sort({ratting:1}).toArray()
            res.send(result)
        }
        else if(getSort=="-1"){
            console.log("Come in 1");
            const result=await friendCollection.find(query).sort({ratting:-1}).toArray()
            res.send(result)
        }
        else{
            console.log("Come in 0");
            const result=await friendCollection.find(query).toArray()
            res.send(result)
        }
      

       
    })
    ///Get Operation end

    ///Get Single Data start
    app.get('/bd/:id',async(req,res)=>{
        const id=req.params.id;
        console.log("ID: ",id);
        const query={_id: new ObjectId(id)}
        const result=await friendCollection.findOne(query)
        res.send(result);
    })
    ///Get Single Data end

    ///Delete Single Data start
    app.delete('/bd/:id',async(req,res)=>{
        const id=req.params.id;
        console.log("Delete ID: ",id);
        const query={_id: new ObjectId(id)}
        const result=await friendCollection.deleteOne(query)
        res.send(result)
    })
    ///Delete Single Data end


    ///Patch Data start
    app.patch('/bd/:id',async(req,res)=>{
        const id=req.params.id;
        const people=req.body;
        const filter={_id:new ObjectId(id)}
        const updatePeople={
            $set:{
                ...people
            }
        }
        const result=await friendCollection.updateOne(filter,updatePeople)
        res.send(result)
    })
    ///Patch Data end







    //Operation end



} finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


////MongoDB End

app.listen(port,()=>{
    console.log(`Birthday Count Server is going on port: ${port}`);
})