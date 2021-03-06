const express = require('express');
const app =express();
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const User = require('./models/user');
const config = require('./config/key')
const auth = require('./middleware/auth')
mongoose.connect(config.mongoURI, 
        {useNewUrlParser: true}).then(() => console.log('DB connected'))
                                .catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.get('/api/users/auth', auth, (req,res) => {
    res.status(200).json({
        _id: req._id,
        isAuth: true,
        email:  req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role
    })
})

app.post('/api/users/register', (req,res) => {
    const user = new User(req.body);

    user.save((err,userData) => {
        if(err){
            return res.json({success: false, err})
        }
        return res.status(200).json({
            success:true,
            user: userData
        });
    })
})

app.post('/api/users/login', (req,res) => {
    //findUser
    User.findOne({email: req.body.email}, (err,user) => {
        if(err) return res.send(err)
        if(!user) return res.json({
            loginSuccess: false,
            message: 'Auth failed email not found'
        });
        //compare password
        user.comparePassword(req.body.password, (err, isMatch) => {
            if(err) return res.send(err)
            else if(!isMatch) return res.json({
                loginSuccess: false,
                message: 'Incorect password'
            })
            //generate token
            user.generateToken((err, user) => {
                if(err) return res.status(400).send(err);
                res.cookie('x_auth', user.token)
                   .status(200)
                   .json({
                       loginSuccess: true,
                       user: user
                   })
            })
        })
    })
})

app.get('/api/users/logout', auth, (req,res) => {
    User.findOneAndUpdate({_id: req.user._id}, {token: ""}, (err, doc) => {
        if(err) return res.json({success: false, err})
        return res.status(200).send({
            success:true,
            message: "Logout successfully"
        })
    })
})

app.get('/',(req,res) => {
    res.send('hello world');
})

port = process.env.PORT || 5000
app.listen(port, ()=>{
    console.log(`listening on port ${5000}`);
});

