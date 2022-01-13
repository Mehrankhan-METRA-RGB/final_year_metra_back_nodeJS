const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const model = require('./model')
const multer = require('multer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { stringify } = require('querystring');
const { parse } = require('path');
const { json } = require('body-parser');
const { token } = require('morgan');
const { STATUS_CODES } = require('http');
var authExpirationDate = "15d";
const port = process.env.PORT || 3000;
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'metradb'
});
const KEY = "m yincredibl y(!!1!11!)<'SECRET>)Key'!";
db.connect(function (err) {
  if (err) throw err;
  console.log("Database Connected!");
});
module.exports = db;
// create express app
const app = express();
// Setup server port
// const port = process.env.PORT || 3000;
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
//  parse requests of content-type - application/json
app.use(bodyParser.json())
app.use(function (req, res, next) {
  res.header("Content-Type", 'application/json');
  res.header("Access-Control-Allow-Origin", "*");
  next();
});



app.use('/uploads', express.static(__dirname + '/uploads'));
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

var upload = multer({ storage: storage });

/// Register new Company in a console {upload logo and Comapny name}
app.post('/upload/company', upload.single('image'), async (req, res, next) => {
  createCompany(req, res);
});


// Get All from Organizations
app.get('/getOrg', (req, res) => {
  let sqlwr = 'SELECT id,name,address,postalCode,NIC,phoneNo,email FROM owner_table';
  db.query(sqlwr, (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send(result);
  })
});

//Read Token Session
app.get('/data', function (req, res) {
  var str = req.get('Authorization');
  try {
    jwt.verify(str, KEY, { algorithm: 'HS256' });
    res.send("Very Secret Data");
  } catch {
    res.status(401);
    res.send("Bad Token");
  }

});
//Console sign in
app.post('/ownsignIn', (req, res) => {
  consoleSignIn(req, res);
});
//Console Signup 
app.post('/signupOrg', (req, res) => {
  consoleSignUp(req, res);
});

//get Employess of a specific company
app.get('/get/users/:token', (req, res) => {
  let sqlwr = `SELECT * FROM employee_data_of_${req.params.token}`;
  db.query(sqlwr, (err, result) => {
    if (err) throw err;
    res.send(result);
  })
  console.log('company users Fetched');

});
/// get companies
app.get('/get/companies/:token', (req, res) => {
  let sqlwr = `SELECT * FROM reg_companies_with_${req.params.token}`;
  db.query(sqlwr, (err, result) => {
    if (err) throw err;
    // console.log(result);
    res.send(result);
  })
});
//get User of specific company
app.get('/getUsers/:companyprimarykey/:token', (req, res) => {
  let sqlwr = `SELECT * FROM employee_data_of_${req.params.token} where company_id=${req.params.companyprimarykey}`;
  db.query(sqlwr, (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send(result);
  })
});

///Add Employees to Company
app.post('/adduserdata', upload.single('image'), async (req, res, next) => {
  addEmployee(req, res);
});


///add card decoration For employee
addCardDecorationEmployee('/card/decoration/user');


///Scanner API Fetch Route
fetchScannerAPI('/scanner/fetch/api/:data');
generateScannerAPI('/scanner/generate/api');











app.post('/AddUser', (req, res) => {
  let data = { ownerName: req.body['name'], own_id: req.body['own_id'], address: req.body['address'], postalCode: req.body['phoneNo'], ownerNICNo: req.body['NIC'], phoneNo: req.body['phoneNo'], email: req.body['email'], password: req.body['password'] }
  let sql = `INSERT INTO owner_table SET ?`;
  db.query(sql, data, (err, result) => {
    if (err) { res.send(err); throw err; }
    console.log(result);
    res.send(result);
  })
});

//fetch OR REST API
app.get('/organization/api', (req, res) => {
  let sqlwr = 'SELECT ownerName,email,postalCode FROM owner_table';
  db.query(sqlwr, (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send(result);
  })

})
///Get Virtual card
vailadateVirtualCard('/card/virtual/user/:token');
///delete
deleteData('/delete/from');
///fetch
fetchData('/fetch/:data');
//Guard fetch
app.get('/get/guards/:token', (req, res) => {
  let sqlwr = `SELECT * FROM scanner_guards_${req.params.token} `;
  db.query(sqlwr, (err, result) => {
    if (err) throw err;
    console.log('Guard fetched');
    res.send(result);
  })

})

function deleteData(route) {
  ///coming data from client {data:{id:,token:,type:}}
  ///{id:,token:,type:} is encoded base64 JWT string
  app.post(route, function (req, res) {
    let table;
    console.log(req.body.data);
    var decode = decodeBase64(req.body.data);
    console.log(decode)
    switch (decode.type) {
      case 'employee':
        table = `employee_data_of_${decode.token}`;
        break;
      case 'guard':
        table = `scanner_guards_${decode.token}`;
        break;
      case 'company':
        table = `reg_companies_with_${decode.token}`;
        break;

    }
    let query = `DELETE FROM ${table} WHERE id=${decode.id}`;
    db.query(query, function (error, result) {
      if (error) throw error;
      console.log(result);
      res.send(result);
    })
  });
}
function fetchData(route) {
  ///coming data from client {data:{token:,type:}}
  ///{token:,type:} is encoded base64 JWT string
  app.get(route, function (req, res) {
    let table;
    console.log(req.params.data);
    var decode = decodeBase64(req.params.data);
    console.log(decode)
    switch (decode.type) {
      case 'employee':
        table = `employee_data_of_${decode.token}`;
        break;
      case 'guard':
        table = `scanner_guards_${decode.token}`;
        break;
      case 'company':
        table = `reg_companies_with_${decode.token}`;
        break;
    }
    let query = `SELECT * FROM ${table} `;
    db.query(query, function (error, result) {
      if (error) throw error;
      console.log(result);
      res.send(result);
    });
  });
}

///Fetch User for Scanning
function fetchScannerAPI(route) {

  ///query for scanner guards
  app.get(route, function (req, res) {
    var token = decodeBase64(req.params.data);
    console.log(token);

    var extractedToken;
    console.log(`token: ${token.authenticationToken}`);
    if (token.authenticationToken !== null || token.authenticationToken !== undefined) {
      ///decode token to json
      extractedToken = decodeBase64(token.authenticationToken);
      ///tables if not exist
      createTable(extractedToken['token']);
      var sqlData = { name: token.name, loc: token.loc, date: currentDate(), orientation: token.orientation, };
      let sql = `INSERT INTO scanner_guards_${extractedToken['token']} SET?`;
      let fetchUsers = `SELECT id,name,role,NIC,company_id,email,phoneNo,gender,imageUrl FROM employee_data_of_${extractedToken.token} WHERE company_id=${extractedToken.companyId}`;
      // let checkCompanyId=`SELECT COUNT(*) FROM employee_data_of_${extractedToken.token} WHERE company_id=${extractedToken.companyId}`;
      let checkCompanyInDB = `SELECT COUNT(*) FROM reg_companies_with_${extractedToken.token} WHERE id=${extractedToken.companyId}`;


      db.query(checkCompanyInDB, function (err, result) {
        if (err) {
          ///error
          throw err;
        } else {
          ///on result
          if (result[0]['COUNT(*)'] > 0) {
            ///company is exist 





            //fetch data from table
            db.query(fetchUsers, function (fetchErr, fetchResult) {
              if (err) {
                ///insertion error
                throw err;
              } else {

                //insert Guard data into table

                // db.query(sql, sqlData, function (insertErr, insertResult) {
                //   if (err) {
                //     ///insertion error
                //     throw err;
                //   } else {
                //     console.log('Guard added');
                //     res.status;
                //   }
                // });

                console.log('fetched');
                // console.log(fetchResult);
                res.send(fetchResult);
              }
            });

          } else {
            ///company does not exist 
            console.log('company does not exist');
            //  res.status(409);
            // return 409;
          }
        }
      });

    } else {
      extractedToken = null;
      console.log('Authentication token may not be null or undefined')


    }
    // res.returnedData;
  });




}
///Generate Sanner Token Console
function generateScannerAPI(route) {
  ///query for scanner guards
  app.post(route, function (req, res) {
    var token = decodeBase64(req.body.token);
    console.log(token);

    var extractedToken;
    console.log(`token: ${token.authenticationToken}`);
    if (token.authenticationToken !== null || token.authenticationToken !== undefined) {
      ///decode token to json
      extractedToken = decodeBase64(token.authenticationToken);
      ///tables if not exist
      createTable(extractedToken['token']);
      var sqlData = { name: token.name, loc: token.loc, date: currentDate(), companyId: extractedToken.companyId, orientation: token.orientation, pin: token.pin, token: req.body.token };
      let sql = `INSERT INTO scanner_guards_${extractedToken.token} SET?`;
      let checkDuplicateGuard = `SELECT COUNT(*) FROM scanner_guards_${extractedToken.token} WHERE name='${token.name}' AND pin='${token.pin}'`;
      let checkCompanyInDB = `SELECT COUNT(*) FROM reg_companies_with_${extractedToken.token} WHERE id='${extractedToken.companyId}'`;

      db.query(checkCompanyInDB, function (compErr, CompResult) {
        if (compErr) { throw compErr; }
        else {
          //If result greater than 0 then check for security guards
          if (CompResult[0]['COUNT(*)'] > 0) {
            db.query(checkDuplicateGuard, function (err, duplicateGuardResult) {
              if (err) {
                ///error
                throw err;
              } else {
                ///on result
                if (duplicateGuardResult[0]['COUNT(*)'] > 0) {
                  ///Gaurd already is exist 
                  console.log('Guard name and PIN is already exist ')
                  res.status(409);


                } else {
                  db.query(sql, sqlData, function (insertErr, insertResult) {
                    if (insertErr) {
                      ///insertion error
                      throw insertErr;
                    } else {
                      console.log(insertResult);
                      console.log('Guard added');
                      res.send();
                    }
                  });

                }
              }
            });
          } else {
            console.log('company not found in Database, Mentioned in a Authentication')
          }
        }

      });


    } else {
      extractedToken = null;
      console.log('Authentication token may not be null or undefined')


    }

  });




}



///Create Tables
function createTable(token) {
  let scannerGuards = `CREATE TABLE IF NOT EXISTS scanner_guards_${token} 
  (id int NOT NULL PRIMARY KEY AUTO_INCREMENT,
  companyId int  ,
  loc  varchar(255),  
  orientaion  varchar(4),   
  date  varchar(20),   
  name varchar(255),
  pin varchar(5),
  token varchar(2000),
  FOREIGN KEY (companyId) REFERENCES reg_companies_with_${token}(id))`;
  let reqcompanies = `CREATE TABLE IF NOT EXISTS reg_companies_with_${token} 
  (id int NOT NULL PRIMARY KEY AUTO_INCREMENT,
  companyName varchar(255) NOT NULL ,
  own_id int,         
  logoUrl varchar(255),
  FOREIGN KEY (own_id) REFERENCES owner_table(id))`;
  let cardData = `CREATE TABLE IF NOT EXISTS card_data_of_${token} 
  (id int NOT NULL PRIMARY KEY AUTO_INCREMENT,
  text varchar(255) NOT NULL ,
  backgroundImage varchar(255)  NOT NULL  ,
  backgroundOverlayColor varchar(255) NOT NULL , 
  company_id int NOT NULL, 
  profile varchar(255) ,          
  logo varchar(255) ,
  qrCode varchar(255) ,
  phoneNo varchar(255) ,
  orgname varchar(255) , 
  FOREIGN KEY (company_id) REFERENCES reg_companies_with_${token}(id))`;
  let employeeTable = `CREATE TABLE IF NOT EXISTS employee_data_of_${token} 
  (id int NOT NULL PRIMARY KEY AUTO_INCREMENT,
  name varchar(50)  NOT NULL,
  role varchar(30)  NOT NULL  ,
  NIC varchar(20)  NOT NULL, 
  company_id int NOT NULL, 
  email varchar(35) NOT NULL,          
  address varchar(60) NOT NULL,
  postalCode varchar(15) NOT NULL,
  phoneNo varchar(18) NOT NULL,
  dob varchar(15) NOT NULL,
  gender varchar(10) NOT NULL,         
  nationality varchar(40) NOT NULL,
  imageUrl varchar(255) ,
  qualification varchar(30) NOT NULL,  
  token varchar(80) NOT NULL, 
  qrCode varchar(2000)  ,
  pin varchar(5),
  decoration varchar(20000) ,
  FOREIGN KEY (company_id) REFERENCES reg_companies_with_${token}(id))`;

  let data = [reqcompanies, employeeTable, cardData, scannerGuards];
  for (let i = 0; i <= data.length - 1; i++) {

    db.query(data[i], (err, result) => {
      if (err) throw err;
      console.log(`created table ${i}`);
    })

  }
}

///Create Console account
function consoleSignUp(req, res) {
  var passwordecrypted = crypto.createHash('sha256').update(req.body.password).digest('hex');
  let data = { name: req.body['name'], address: req.body['address'], postalCode: req.body['phoneNo'], NIC: req.body['NIC'], phoneNo: req.body['phoneNo'], email: req.body['email'], password: passwordecrypted, token: req.body['token'], }
  let sql = `INSERT INTO owner_table SET ?`;
  let getCurrentRow = `SELECT id,name,phoneNo,email,NIC,token FROM owner_table WHERE email='${req.body['email']}' AND password='${passwordecrypted}'`;
  db.query(`SELECT COUNT(*) FROM owner_table  WHERE NIC =${req.body['NIC']}`,
    (err, result) => {
      if (err) {
        console.log(err);
        throw err;
      }
      else {
        console.log('checking duplicate');
        ///Check for duplicate NIC
        if (result[0]['COUNT(*)'] === 0) {
          console.log('Inserting');
          ///Insert data into DB
          db.query(sql, data, (err, result) => {
            if (err) { throw err; } else {
              console.log('done');
              ///respond with Auth and owner credentails
              db.query(getCurrentRow, (errr, resultdata) => {
                if (errr) { throw errr; } else {
                  createTable(resultdata[0]['token']);
                  console.log('geting data for response');
                  console.log(resultdata);
                  var payload = { email: resultdata[0]['email'] };
                  var auth = jwt.sign(payload, KEY, { algorithm: 'HS256', expiresIn: "15d", });
                  res.status(200);
                  res.send({ secret: auth, account: resultdata });
                }
              });

            }


          })
        }
        else {
          //NIC is already registered
          res.status(409);
          res.send(result);
          console.log('NIC duplicate found');
        }
      }
    });
}

///Sign in to Console account
function consoleSignIn(req, res) {
  var password = crypto.createHash('sha256').update(req.body['password']).digest('hex');
  // console.log({email:req.body.email,pass:password});
  let checkUser = `SELECT COUNT(*) FROM owner_table WHERE email='${req.body['email']}' AND password='${password}'`;
  let getRow = `SELECT id,name,phoneNo,email,NIC,token FROM owner_table WHERE email='${req.body['email']}' AND password='${password}'`;
  db.query(checkUser, (err, result) => {
    if (err) { throw err; }
    else {
      console.log(result);
      if (result[0]['COUNT(*)'] > 0) {
        res.status(200);
        var payload = { email: req.body['email'] };
        var auth = jwt.sign(payload, KEY, { algorithm: 'HS256', expiresIn: "15d", });
        db.query(getRow, (errr, resultdata) => {
          if (errr) { throw errr; }
          else {
            createTable(resultdata[0]['token']);
            console.log(resultdata);
            res.send({ secret: auth, account: resultdata });
          }
        });
        // console.log("Success");

      }
      else {
        res.status(409);
        res.send('Email password does not Exist')
      }

    }

  });
}
function currentDate() {

  let ts = Date.now();

  let date_time = new Date(ts);
  let date = date_time.getDate();
  let month = date_time.getMonth() + 1;
  let year = date_time.getFullYear();
  return year + "-" + month + "-" + date;
}

function createCompany(req, res) {
  let limitTable = `SELECT COUNT(*) FROM reg_companies_with_${req.body['token']}`;
  let checkComp = `SELECT COUNT(*) FROM reg_companies_with_${req.body['token']} WHERE companyName='${req.body['companyName']}'`;
  let data = { companyName: req.body['companyName'], own_id: req.body['own_id'], logoUrl: req.file.path };
  //  console.log(dtge);
  let sqlq = `INSERT INTO reg_companies_with_${req.body['token']} SET ? `;

  db.query(limitTable, (errlimit, resultlimit) => {
    if (errlimit) { throw errlimit; }
    else {
      console.log(resultlimit[0]['COUNT(*)']);
      ///Check Limit
      if (resultlimit[0]['COUNT(*)'] < 5) {
        db.query(checkComp, (errcheck, resultcheck) => {
          if (errcheck) {
            console.log(errcheck);
            throw errcheck;
          } else {
            ///Check duplicate
            if (resultcheck[0]['COUNT(*)'] === 0) {
              db.query(sqlq, data, (insertionErr, insertionResult) => {
                if (insertionErr) {
                  console.log(insertionErr);
                  throw insertionErr;
                }
                else {
                  console.log(insertionResult);
                  res.send(insertionResult);
                }

              });
            } else {
              console.log(resultcheck);
              res.status(409);
              res.send(resultcheck);
            }
            //  next();


          }

        });
      }
      else {
        console.log({ message: 'You can only Add upto 5 Companies' });
        res.status(401);
        res.send(resultlimit)
      }

    }

  });


}
function addEmployee(req, res) {
  let dtge = { name: req.body['name'], role: req.body['role'], company_id: req.body['company_id'], address: req.body['address'], postalCode: req.body['postalCode'], NIC: req.body.NIC, phoneNo: req.body['phoneNo'], email: req.body['email'], dob: req.body['dob'], qualification: req.body['qualification'], nationality: req.body['nationality'], gender: req.body['gender'], imageUrl: req.file.path };
  let sql = `INSERT INTO employee_data_of_${req.body['token']} SET ?`;
  db.query(`SELECT COUNT(*) FROM employee_data_of_${req.body['token']} WHERE NIC =${req.body['NIC']}`,
    (err, result) => {
      if (err) {
        console.log(err);
        throw err;
      }
      else {
        console.log(result);
        if (result[0]['COUNT(*)'] === 0) {
          console.log('done');
          //uploaded done 
          db.query(sql, dtge, (err, result) => {
            if (err) { throw err; }
            res.status(200);
            res.send(result);
            console.log('employee registration done');

          })
        }
        else {
          //NIC is already registered
          res.status(409);
          res.send(result);
          console.log('NIC is already registered');
        }
      }
    });
}
function addCardDecorationEmployee(route) {
  app.post(route, function (req, res) {
    var _reqBody = JSON.parse(req.body.decoration);
    // console.log(_decoration);
    var isResult = false;
    var responseResult;
    for (var i = 0; i < parseInt(_reqBody.length); i++) {
      var userId = JSON.parse(_reqBody[i]).id;
      var qrCode = JSON.parse(_reqBody[i]).qrCode;
      console.log(`${i}: ${userId}`);
      var userDecoration = JSON.parse(_reqBody[i]);
      var decor = JSON.stringify(userDecoration);
      //  console.log(`${i}:::\n${decor}`);

      let query = `UPDATE employee_data_of_${req.body.token} SET decoration='${decor}' , qrCode='${qrCode}' WHERE id=${userId}`;
      // console.log(`query:::\n${query}`);
      db.query(query, function (err, result) {
        if (err) {
          throw err;

        } else {
          ///Added
          console.log('ADDED');
          isResult = true;
          responseResult = result;
        }


      })


    }
    if (isResult) { res.send(responseResult); } else { res.send(); }

  })



}



function decodeBase64(token) {
  if (token !== null || token !== undefined) {
    ///first encode a token to Json-String
    const base64String = JSON.stringify(token);
    // create a buffer & convert from Base64 string to Buffer bytes
    const buff = Buffer.from(base64String, 'base64');

    // decode buffer as UTF-8
    const str = buff.toString('utf-8');

    return JSON.parse(str);
  }
}


function vailadateVirtualCard(route) {

  app.get(route, function (req, res) {
    var params = decodeBase64(req.params.token);
    let query = `SELECT decoration FROM employee_data_of_${params.token}  WHERE id=${params.uid} AND company_id=${params.cid}`;
    db.query(query, function (err, result) {
      if (err) throw err;
      console.log(result);
      if (result[0].decoration != null) {
        console.log('Virtual card Fetched');
        res.send(result);

      } else {
        console.log('Virtual card Fetch Failed');

        // res.send(409);
        res.sendStatus(409)
      }

    });
  });
}
// listen for requests
app.listen(port, () => {
  console.log(`Server is listening on new port ${8080}`);
});