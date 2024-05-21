const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jwtKey = 'e-comm';
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000'
}));

require("./db/config");
const User = require("./db/User");
const Product = require("./db/Product")

app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await User.findOne({
            $or: [{ email: email }, { name: name }]
        });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let user = new User({ name, email, password });
        await user.save();
        return res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Something went wrong!' });
    }
});



app.post("/login", async (req, res) => {
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body);
        if (user) {
            user.password = undefined;
            jwt.sign({ user },jwtKey,{expiresIn:"2h"},(err,token)=>{
                if(err){
                    return res.status(400).json({ message: 'Something went wrong' });
                }
                res.status(200).json({ message: 'Loged in successfully', user ,auth:token});
            })
        }
        else {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }
    } else {
        res.status(500).json({ message: 'Please fill the details' });
    }
})

app.post("/add-product",verifyToken, async (req, res) => {
    try{
        let product = new Product(req.body);
        let result = await product.save();
        return res.status(201).json({ message: "Product added successfully"});
    }catch (error) {
        return res.status(500).json({ message: "An error occurred while adding the product", error: error.message });
    }
})

app.get("/products",verifyToken, async (req, res) => {
    let products = await Product.find();
    if (products.length > 0) {
        res.send(products);
    } else {
        res.send({ "message": "No Products found" })
    }
})

app.delete("/product/:id",verifyToken, async (req, res) => {
    const result = await Product.deleteOne({ _id: req.params.id });
    res.send(result);
})

app.get("/product/:id", verifyToken, async (req, res) => {
    const result = await Product.findOne({ _id: req.params.id });
    if (result) {
        res.status(200).send(result);
    } else {
        res.status(404).send({ result: "Record Not Found" });
    }
})

app.put("/product/:id",verifyToken,async (req,res)=>{
    let result = await Product.updateOne(
        {_id:req.params.id},
        {
            $set: req.body
        }
    )
    res.send(result)
})

app.get("/search/:key",verifyToken, async(req,res)=>{
    let result = await Product.find({
        "$or":[
            { name: {$regex:req.params.key} },
            { price: {$regex:req.params.key} },
            { company: {$regex:req.params.key} },
            { category: {$regex:req.params.key} }
        ]
    });
    res.send(result);
})


function verifyToken(req, res, next){
    let token  = req.headers['authorization'];
    if(token){
        jwt.verify(token,jwtKey,(err,valid)=>{
            if(err){
                res.status(401).send({message:"Please provide valid token"})
            }else{
                next();
            }
        })

    }else{
        res.status(403).send({message:"Please add token.." })
    }
}

app.listen(5000);