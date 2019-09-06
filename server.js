const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

var shortid = require('shortid');


const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI,function(err) {
    if (err)
        return console.error(err);
});


var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
 db.once("open", function(callback) {
    console.log("Connection succeeded.");
   });

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


var Schema = mongoose.Schema;
var exerciseschema = new Schema({
  username: {type: String, required: true},
  userId: {type: String, required: true},
  exercises: [{description: String, duration: Number, date: Date}]
});
var Exercise = mongoose.model('Exercise',exerciseschema);


var createAndSaveUser = function(user,done) {
  var userId = shortid.generate();
  var exercise= new Exercise({username: user, userId: userId});
  //console.log("shorturl:", shorturl);
  exercise.save((err,data)=> {
    //console.log("OhhhmyyyyG")
    if(err) {
      console.log(err);
      return done(err);
    }
  console.log("data:",data)
  return done(null , data);
})};

var createAndSaveExercise = function(userId, description, duration, date,done) {
 
  Exercise.findOneAndUpdate({userId: userId}, {$push: {"exercises":{description: description, duration: duration, date: date}}},  
 ((err,data)=> {
    
    if(err) {
      console.log(err);
      
    }
  return done(null , data);
}))};

var listUsers = function(done){
  Exercise.find({},  
 ((err,data)=> {
    
    if(err) {
      console.log(err);
      
    }
  return done(null , data);
}))};

var listExercises = function(userId,done){
  Exercise.find({userId: userId},'exercises',  
 ((err,data)=> {
    
    if(err) {
      console.log(err);
      
    }
  return done(null , data);
}))};


var listExercisesDate = function(userId,from,to,done){
  Exercise.aggregate({$match: {userId: userId}},
    {$project: {
        exercises: {$filter: {
            input: '$exercises',
            as: 'exercises',
            cond: {$gte: ['$$exercises.date', from],$lte:['$$exercises.date', to]}
        }},
        _id: 0
    }}
,  
 ((err,data)=> {
    
    if(err) {
      console.log(err);
      
    }
  return done(null , data);
}))};

var findOneByUserId= function(userId, done) {
Exercise.findOne({userId: userId}, (err, data) =>{
    if(err) {
      console.log("in funktion err", err)
      return done(err);
    }
    //console.log('whaaaaaat',data);
    return done(null, data);
    })};


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.post("/api/exercise/new-user", function (req, res){
  console.log(req.body)//[1])
  var name = req.body['username'];
  createAndSaveUser(name, (err, data) => {
   if (data){
      console.log("success", data);
     //res.redirect(data['userId']);
     res.json({userId: data['userId']});
   }else {
     console.error(err);
     console.log(data);
     {res.json({greeting: 'ERROR'})}
//res.json({greeting: 'hello '+name });
}})
})

app.post("/api/exercise/add", function (req, res){
  console.log(req.body)//[1])
  
  
  var userId = req.body['userId'];
  var description = req.body['description'];
  var duration = req.body['duration'];
  if (req.body['date']){
  var date = req.body['date'];
  }else{
    var dt=new Date;
        
    var date= dt.getFullYear()+"-"+(dt.getMonth()+1)+"-"+dt.getDate();
  }
    createAndSaveExercise(userId, description, duration, date, (err, data) => {
   if (data){
      console.log("success", data);
     //res.redirect(data['userId']);
     res.json({userId: data['userId']});
   }else {
     console.error(err);
     console.log(data);
     res.json({greeting: 'ERROR'})
//res.json({greeting: 'hello '+name });
}})

//res.json({greeting: 'hello '+userId });
})
app.get('/api/exercise/users',function (req, res){
  listUsers((err, data) => {
   var formattedResponseUsers= [];
    if (data){
      console.log("success", data);
     for (var i=0; i<data.length;i++){
      formattedResponseUsers.push(data[i]['username'])
     //console.log(data[i]['username'])
     }
     res.json(formattedResponseUsers);
   }else {
     console.error(err);
     console.log(data);
     {res.json({greeting: 'ERROR'})}}})
  
})

app.get('/api/exercise/log',function (req, res){
  //console.log(req)
var userId =  req.query.userId;
if(req.query.from){
  var from =  req.query.from;
  var to =  req.query.to;
  if (req.query.limit){
  var limit = req.query.limit;
  }else{var limit= "999"}
listExercises(userId,(err, data)=> {
    if (data){
      console.log("success", data)//,"DATA",data[0]['exercises']);
      data=data[0]
      var neuData =[];
      for  (var i=0; i<data['exercises'].length;i++){
        console.log('HAAAAAAAALLOOO',data['exercises'][i]['date'])
        if (Date.parse(data['exercises'][i]['date'])>Date.parse(from)&&Date.parse(data['exercises'][i]['date'])<Date.parse(to)){
          if(neuData.length<parseInt(limit)){
          neuData.push(data['exercises'][i]);
          }
        }
        
      }
      res.json(neuData); 
    }else {
     console.error(err);
     console.log(data);
     {res.json({greeting: 'ERROR'})}}})
}else if(req.query.limit){
      var limit = req.query.limit;
   console.log(userId);
  listExercises(userId,(err, data)=> {
    if (data){
      console.log("success", data);
      data=data[0]
      var neuData =[];
      for  (var i=0; i<data['exercises'].length;i++){
        
          if(neuData.length<parseInt(limit)){
          neuData.push(data['exercises'][i]);
          
        }
        
      }
      res.json(neuData); 
    }else {
     console.error(err);
     console.log(data);
     {res.json({greeting: 'ERROR'})}}})
      
    }else{
  console.log(userId);
  listExercises(userId,(err, data)=> {
    if (data){
      console.log("success", data);
      res.json(data); 
    }else {
     console.error(err);
     console.log(data);
     {res.json({greeting: 'ERROR'})}}})
}
  })


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
