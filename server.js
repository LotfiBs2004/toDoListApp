const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const app = express();
app.use(bodyParser.json());

// Rest of your server code goes here 
 
const db = mysql.createConnection({
    host: 'localhost', 
    user: 'root',
    password: '01061977',
    database: 'taskApp' 
}); 

db.connect((err) => {
    if(err) {
        throw err;
    }
    console.log('Connected to database');
}
); 


app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));



app.post('/signUp', (req, res) => {
    let username  = req.body.username;
    let password = req.body.password;
    
    console.log(username    );
    if (username.trim() === '' || password.trim() === '') {
        res.status(400).send('Values cannot be empty');
        return; 
    } 
    db.query('SELECT * FROM user WHERE username = ?', [username], (err, result) => { 
        if(err) {
            console.log(err);
            res.status(400).send('Error ocured while fetching values');
            return;
        }
        if(result.length > 0) {
            res.status(400).send('User already exists');
            return;
        }else {
            db.query('INSERT INTO user (username, password) VALUES (?,?)', [username, password], (err, result) => {
                if(err) {
                    console.log(err);
                    res.status(400).send('Error ocured while inserting values');
                }
                console.log(result);
                console.log('Values inserted');
                res.status(200).send('Values inserted');
        
            });
        }
    }


    );

  

});     
 

function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login'); // Redirect to login page if user is not authenticated
    }
    next();
}

// Middleware to check if user is authorized to access tasks
function requireAuthorization(req, res, next) {
    const requestedUsername = req.params.username;
    const authenticatedUsername = req.session.user.username;
    if (requestedUsername !== authenticatedUsername) {
        return res.status(403).send('Unauthorized access'); // Return 403 Forbidden if user is not authorized
    }
    next();
}


app.post('/login' ,   (req, res) => {
    let username  = req.body.username;
    let password = req.body.password;
    // console.log(username);
    if (username.trim() === '' || password.trim() === '') {
        res.status(400).send('Values cannot be empty');
        return; 
    }
    db.query('SELECT * FROM user WHERE username = ? AND password = ?', [username, password], (err, result) => {
        if(err) {
            console.log(err);
            res.status(400).send('Error ocured while fetching values');
            return;
        }
        if(result.length > 0) { 
            // res.status(200).send('Login successful');
            req.session.user = {
                password: result[0].password,
                username: result[0].username
            };

           res.redirect('/taskApp/' + username);
            return;
        }else {
            res.status(400).send('Invalid credentials');
            
        }
    });
}
);

app.post('/taskApp/:username', (req, res) => {
    let username  = req.params.username;
    let task = req.body.Task; 
    
    if (task.trim() === '') {
        res.status(400).send('Values cannot be empty');
        return; 
    }
    db.query('SELECT * FROM user WHERE username = ?', [username], (err, result) => {
        if(err) {
            console.log(err);
            res.status(400).send('Error ocured while fetching values');
            return;
        }
        if(result.length > 0) {
            const user = result[0];
            db.query('INSERT INTO task (userId, dicription , date) VALUES (?,? , NOW() )', [user.id, task], (err, result) => {
                if(err) {
                    console.log(err);
                    res.status(400).send('Error ocured while inserting values');
                }
                console.log(result);
                console.log('Values inserted');

                db.query('SELECT * FROM task WHERE userId = ?', [user.id], (err, tasks) => {
                    if (err) {
                        console.log(err);
                        res.status(400).send('Error ocured while fetching values');
                        return;
                    }
                    res.status(200).json(tasks);
                });
        
            });
        }else {
            res.status(400).send('User not found');
        }
    });
});
 

app.post("/taskApp/deleteTask/:taskID", (req, res) => {
    let taskID = req.params.taskID;
    console.log(taskID);
     
     
    db.query('DELETE FROM task WHERE id = ?', [taskID], (err, result) => {
        if(err) {
            console.log(err);
            res.status(400).send('Error ocured while deleting values');
            return;
        }
        console.log(result);
        console.log('Values deleted');
        res.status(200).send('Values deleted');
    });
}); 


app.get("/taskApp/:username/tasks", (req, res) => {
    
    let username = req.params.username;
    console.log(username); 
    db.query('SELECT * FROM user WHERE username = ?', [username], (err, result) => { 
        if(err) {
            console.log(err);
            res.status(400).send('Error ocured while fetching values');
            return;
        }
        if(result.length > 0) {
            const user = result[0];
            
            db.query('SELECT * FROM task WHERE userId = ?', [user.id], (err, tasks) => {
                console.log(tasks);
                if(err) {
                    console.log(err);
                    res.status(400).send('Error ocured while fetching values');
                    return;
                }else {
                     
                    res.status(200).json(tasks);
                }
            });
        }else {
            res.status(400).send('User not found');
        }
    } 
    ); 

    
}
);

app.get("/taskApp/:username", (req, res) => {

    let username = req.params.username;
    console.log(username);

    db.query('SELECT * FROM user WHERE username = ?', [username], (err, result) => {
        if(err) {
            console.log(err);
            res.status(400).send('Error ocured while fetching values');
            return;
        }
        if(result.length > 0) {
            res.sendFile(path.join(__dirname, 'public/taskApp.html')) ;
            return;
        }else {
            res.status(400).send('User not found');
        }
    });

}
);


 
 

app.get("/signUp", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/signUp.html')) ;

});


app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html')) ;

}
);








app.listen(3000, "0.0.0.0", () => {
    console.log('Server is running on port 3000');
});