const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./model/user');
const config = require('./config');

app.all('*', function(req, res, next){
  req.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
   next();
});

var port = process.env.PORT || 8000;
mongoose.connect(config.database);

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(cors());

app.get('/',function(req, res){

  const user = new User({
    name: 'Himanshu',
    email: 'hkxicor@gmail.com',
    dob: Date.now(),
    status: 'Be Yourself'
  });
  user.save(function(err){
    if(err) throw err
    else {
      res.json(user);
    }
  });

});

function validateEmail(email) {
    var re = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
    return re.test(email);
}
function notEmpty(data) {
  return data != null
}

app.post('/login',function(req,res){
  const email = req.body.email;
  const password = req.body.password;
  if(validateEmail(email)){
    User.findOne({email:email,password:password},function(err, user){
      if(err) throw err;
      else{
        if(user){
          //Authenticated
          //Generate JWT
          const CERT = config.secret;
          const TOKEN = jwt.sign({email:email}, CERT, {
            expiresIn: 120480
          });
          res.json({
            success: true,
            message: 'authenticated',
            expiresIn: (Date.now()+120480),
            token: TOKEN
          });
        }else{
          //Not Authenticated
          res.json({
            success: false,
            message: 'not authenticated, email or password error'
          })
        }
      }
    })
  }else{
      res.json({success: false, message:'Email format wrong'})
  }
});

app.post('/register',function(req,res){
  const name = req.body.name;
  const email = req.body.email;
  const dob = req.body.dob;
  const status = req.body.status;
  const password = req.body.password;

  if(validateEmail(email) && notEmpty(name) && notEmpty(dob) && notEmpty(status) && notEmpty(password)){
    //now create new user
   const user = new User({
      name: name,
      email: email,
      dob: dob,
      status: status,
      password: password
    });

    user.save(function(err){
      if(err) throw error
      else{
        const CERT = config.secret;
        const TOKEN = jwt.sign({email:email}, CERT, {
          expiresIn: 120480
        });

        res.json({
          success: true,
          message: 'registered',
          expiresIn: (Date.now()+120480),
          token: TOKEN
        });
      }
    })
  }else{
    res.json({success:false, message: 'registration failed, problem in details'})
  }
});

//Authentication Middleware

app.use(function(req, res, next) {

	// check header or url parameters or post parameters for token
	var token = req.body.token || req.param('token') || req.headers['x-access-token'];

	// decode token
	if (token) {
    var cert = config.secret;
		jwt.verify(token, cert, function(err, decoded) {
			if (err) {
				return res.json({ success: false, message: 'Failed to authenticate token.' });
			} else {
				req.decoded = decoded;
				next();
			}
		});

	} else {
		// no token
		return res.status(403).send({
			success: false,
			message: 'No token provided.'
		});

	}

});

//Authenticated Routes

app.get('/profile/view',function(req,res){
  const email = req.decoded.email;
  User.findOne({email:email},'-_id -__v -password',function(err, user) {
    res.json(user);
  });
});

//Update Profile

app.post('/profile/update',function(req, res){

  const email = req.decoded.email;

  const name = req.body.name;
  const dob = req.body.dob;
  const password = req.body.password;
  const status = req.body.status;
  const setData = {}
  if(name){
    setData.name = name;
  }
  if(dob) {
    setData.dob = dob;
  }
  if(password) {
    setData.password = password
  }
  if(status){
    setData.status = status;
  }

  User.update({email: email},{$set:setData},function(err,data) {
    if(err) throw err
    else{
      res.json({success:true,message:'Profile Updated'})
    }
  })

})


app.listen(port);
console.log('server started on port ', port);
