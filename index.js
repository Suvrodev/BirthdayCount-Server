const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const we = require("./Data/We.json");
require("dotenv").config();

const port = process.env.PORT || 3003;

const app = express();
const corsConfig = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
};
app.use(cors(corsConfig));
app.use(express.json());

app.get("/", (req, res) => {
  console.log(`Birthday Count Server is going on port: ${port}`);
  res.send(
    `-(search and total) Birthday Count Server is going on port: ${port}`
  );
});

app.get("/we", (req, res) => {
  console.log("We All:");
  res.send(we);
});
app.get("/we/:id", (req, res) => {
  const id = req.params.id;
  const target = we.find((w) => w.id == id);
  res.send(target);
});

////MongoDB Start
const USER = process.env.DB_USER;
const PASSWORD = process.env.DB_PASSWORD;

// const uri = "mongodb+srv://<username>:<password>@cluster0.jokwhaf.mongodb.net/?retryWrites=true&w=majority";
const uri = `mongodb+srv://${USER}:${PASSWORD}@cluster0.jokwhaf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    //Operation start
    const friendCollection = client.db("birthdayCount").collection("friends");
    const userCollection = client.db("birthdayCount").collection("user");

    ///Use Operation start

    ///post user start
    app.post("/user", async (req, res) => {
      const collectUser = req.body;
      console.log("User: ", collectUser);

      const query = { email: collectUser.email };
      const existUser = await userCollection.findOne(query);

      if (existUser) {
        console.log("USer Already Exists");
        return res.send({ message: "user already exists" });
      }

      const result = await userCollection.insertOne(collectUser);
      console.log("User added");
      res.send(result);
    });
    ///Post user end

    ///Get user operation start
    app.get("/alluser", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    ///Get user operation end-

    ///Get specific user operation start
    app.get("/allusers/:email", async (req, res) => {
      const email = req.params.email;
      console.log("Email: ", email);
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });
    ///Get specific user operation end

    //Delete user start
    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      console.log("Delete id: ", id);
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });
    //Delete user end

    ///make admin user start
    app.patch("/user/:id", async (req, res) => {
      const id = req.params.id;
      const user = req.body;
      console.log("Update id: ", id);
      console.log("Update user: ", user);

      const filter = { _id: new ObjectId(id) };
      const updateUser = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updateUser);
      res.send(result);
    });
    ///make admin user end

    /////Birthday Operation start

    ////Post Operation start
    app.post("/bd", async (req, res) => {
      const friend = req.body;
      const result = await friendCollection.insertOne(friend);
      res.send(result);
    });
    ////Post Operation end

    ///Total inserted Number start
    app.get("/total", async (req, res) => {
      try {
        console.log("Come Count");
        let query = {};
        const email = req?.query?.email;
        if (email) {
          console.log("Email---", email);
          query = { ...query, ref: email };
        }

        // Use countDocuments to apply the query
        const result = await friendCollection.countDocuments(query);

        res.status(200).send({ total: result });
      } catch (error) {
        res
          .status(500)
          .send({ error: "An error occurred while fetching the total count." });
      }
    });
    ///Total inserted Number End

    ///Get Operation for total janogon start
    app.get("/bds", async (req, res) => {
      console.log("Come");

      let query = {};
      const email = req?.query?.email;
      const search = req?.query?.search;
      const page = parseInt(req?.query?.page) || 0;
      const limit = 5;

      try {
        if (email) {
          console.log("Email---", email);
          query = { ...query, ref: email };
        }
        if (search) {
          console.log("Search---", search);
          query = { ...query, name: { $regex: search, $options: "i" } };
        }
        // if (page) {
        console.log("Page---", page);
        const skip = page * limit;
        // }

        console.log("Top of Result");
        const result = await friendCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "An internal server error occurred" });
      }
    });
    ///Get Operation for total janogon end

    ///Get Operation start
    app.get("/bd", async (req, res) => {
      let query = {};
      let getSort;
      let getSearch;

      let page = parseInt(req?.query?.page) || 0;
      console.log("Page:", page);
      console.log("Page type: ", typeof page);

      let limit = parseInt(req?.query?.limit) || 5;
      console.log("Limit: ", limit);
      console.log("Limit type: ", typeof limit);

      const skip = page * limit;

      if (req?.query?.email) {
        query = { ...query, ref: req?.query?.email };
      }

      if (req?.query?.search) {
        getSearch = req?.query?.search;
        query = { ...query, name: { $regex: getSearch, $options: "i" } };
      }
      console.log("Get Search: ", getSearch);

      if (req?.query?.sort) {
        getSort = req?.query?.sort;
      }
      console.log("get sort: ", getSort);
      if (getSort == "1") {
        // console.log("Come in 1");
        const result = await friendCollection
          .find(query)
          .skip(skip)
          .limit(limit)
          .sort({ ratting: 1 })
          .toArray();
        res.send(result);
      } else if (getSort == "-1") {
        // console.log("Come in -1");
        const result = await friendCollection
          .find(query)
          .skip(skip)
          .limit(limit)
          .sort({ ratting: -1 })
          .toArray();
        res.send(result);
      } else {
        // console.log("Come in 0");
        const result = await friendCollection
          .find(query)
          .skip(skip)
          .limit(limit)
          .toArray();
        res.send(result);
      }
    });
    ///Get Operation end

    ///Get Single Data start
    app.get("/bd/:id", async (req, res) => {
      const id = req.params.id;
      console.log("ID: ", id);
      const query = { _id: new ObjectId(id) };
      const result = await friendCollection.findOne(query);
      res.send(result);
    });
    ///Get Single Data end

    ///Delete Single Data start
    app.delete("/bd/:id", async (req, res) => {
      const id = req.params.id;
      console.log("Delete ID: ", id);
      const query = { _id: new ObjectId(id) };
      const result = await friendCollection.deleteOne(query);
      res.send(result);
    });
    ///Delete Single Data end

    ///Patch Data start
    app.patch("/bd/:id", async (req, res) => {
      const id = req.params.id;
      const people = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatePeople = {
        $set: {
          ...people,
        },
      };
      const result = await friendCollection.updateOne(filter, updatePeople);
      res.send(result);
    });
    ///Patch Data end

    /////Birthday Operation end

    //Operation end
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

////MongoDB End

app.listen(port, () => {
  console.log(`Birthday Count Server is going on port: ${port}`);
});
