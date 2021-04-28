//express, cors, mongo, bcrypt, jwswebtoken, dotenv

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const mongodb = require("mongodb");
const URL = "mongodb+srv://mallika:hemasundari@cluster0.bl042.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";


const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());


app.post("/adminregister", async (req, res) => {
    let connection = await mongodb.connect(URL);
    let db = connection.db("ecommerce");
    let isEmailUnique = await db.collection("admin").findOne({ email: req.body.email });
    if (isEmailUnique) {
        res.status(401).json({
            message: "Email already exists"
        })
    }
    else {
        // req.body.prod = [];
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(req.body.password, salt);
        req.body.password = hash;
        let user = await db.collection("admin").insertOne(req.body);
        res.json({
            message: "Admin Registered"
        })
    }
})

app.post("/adminlogin", async (req, res) => {
    let connection = await mongodb.connect(URL);
    let db = connection.db("ecommerce");
    let user = await db.collection("admin").findOne({ email: req.body.email });
    console.log(user);
    if (user) {
        let isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
        if (isPasswordCorrect) {
            let token = jwt.sign({ _id: user._id }, "secretinfo");
            res.json({
                message: "Allow",
                token: token,
                id: user._id
            })
        }
        else {
            res.json({
                message: "Email or Password is incorrect"
            })
        }
    }
    else {
        res.status(404).json({
            message: "Email or Password is incorrect"
        })
    }
})


app.post("/adminpost/:id", async (req, res) => {
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db("ecommerce");
        let user = await db.collection("admin").updateOne({ _id: mongodb.ObjectID(req.params.id) }, { $push: { products: req.body } });
        // console.log(user);
        await connection.close();
        res.json({
            message: "Product recieved"
        })
    } catch (error) {
        console.log(error)
    }
})

app.get("/admingetprod", async (req, res) => {
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db("ecommerce");
        let prod = await db.collection("admin").findOne();
        // console.log(prod);
        await connection.close();
        res.json(prod);
    } catch (error) {
        console.log(error)
    }
})

app.post("/register", async (req, res) => {
    let connection = await mongodb.connect(URL);
    let db = connection.db("ecommerce");
    let isEmailUnique = await db.collection("register").findOne({ email: req.body.email });
    if (isEmailUnique) {
        res.status(401).json({
            message: "Email already exists"
        })
    }
    else {
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(req.body.password, salt);
        // console.log(hash);
        req.body.password = hash;
        let user = await db.collection("register").insertOne(req.body);
        res.json({
            message: "User Registered"
        })
    }
})

app.post("/login", async (req, res) => {
    let connection = await mongodb.connect(URL);
    let db = connection.db("ecommerce");
    let user = await db.collection("register").findOne({ email: req.body.email });
    if (user) {
        let isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
        if (isPasswordCorrect) {
            let token = jwt.sign({ _id: user._id }, "secretinfo");
            res.json({
                message: "Allow",
                token: token,
                id: user._id
            })
        }
        else {
            res.json({
                message: "Email or Password is incorrect"
            })
        }
    }
    else {
        res.status(404).json({
            message: "Email or Password is incorrect"
        })
    }
})


function authenticate(req, res, next) {
    if (req.headers.authorization) {
        try {
            let jwtValid = jwt.verify(req.headers.authorization, "secretinfo");
            if (jwtValid) {
                req.userId = jwtValid._id;
                next();
            }
        } catch (error) {
            res.status(401).json({
                message: "Invalid Token"
            })
        }
    }
    else {
        res.status(401).json({
            message: "No Token Present"
        })
    }
}

app.listen(3004);

app.post("/:id", authenticate, async (req, res) => {
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db("ecommerce");
        await db.collection("register").updateOne({ _id: mongodb.ObjectID(req.params.id) }, { $push: { order: req.body } });
        res.json({
            message: "Order recieved"
        })
    } catch (error) {
        console.log(error);
    }
})

app.get("/:id", authenticate, async (req, res) => {
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db("ecommerce");
        let order = await db.collection("register").findOne({ _id: mongodb.ObjectID(req.params.id) });
        await connection.close();
        res.json(order);
    } catch (error) {
        console.log(error);
    }
});

// app.put("/updatenum/:id", async (req, res) => {
//     try {
//         let connection = await mongodb.connect(URL);
//         let db = connection.db("ecommerce");
//         let order = await db.collection("admin").findOne(
//             { _id: mongodb.ObjectID(req.params.id) },
//             { $elemMatch: { order: { title: req.body.title } } });
//         await connection.close();
//         res.json(order);
//     } catch (error) {
//         console.log(error);
//     }
// });

app.put("/delitem/:id", async (req, res) => {
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db("ecommerce");
        let order = await db.collection("register").updateOne(
            { _id: mongodb.ObjectID(req.params.id) },
            { $pull: { order: { title: req.body.title } } });
        // let order = await db.collection("register").findOne({ _id: mongodb.ObjectID(req.params.id) }, { $in: { order: { title: req.body } } });
        await connection.close();
        res.json(order);
    } catch (error) {
        console.log(error);
    }
});