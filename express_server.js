const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

// Middle-wares for body-parser and cookies.
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

function generateRandomString() {
  // Set length to 6.
  const length = 6;
  // Display characters to work with.
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  // Hold the result in a variable.
  let urlID = ' ';
  // Loop through the characters variable.
  for (let i = 0; i < length; i++) {
    // Add result and characters together.
    urlID += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  // Return a string of 6 random alphanumeric characters.
  return urlID;
};

function getUserByEmail(email, users) {
  return Object.values(users).find(user => user.email === email);
};

function urlsForUser(id) {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
}

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.reddit.com",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.youtube.com",
    userID: "aJ48lW",
  },
};

const users = {
  user1: {
    id: "user1",
    email: "user1@email.com",
    password: "123",
  },
  user2: {
    id: "user2",
    email: "user2@email.com",
    password: "abc",
  },
};

// GET ROUTES
app.get('/', (req,res) => {
  const templateVars = {
    userID: req.cookies['user_id'],
  };
  res.render('index', templateVars);
});

app.get('/urls', (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  if(!userID) {
    res.status(401).send("Please login or create an account to view your URLs");
    return;
  }

  const userURLs = urlsForUser(userID);
  const urlData = { 
    urls: userURLs,
    userID,
    user,
  };
  res.render('urls_index', urlData);
});

app.get('/register', (req, res) => {
  const userID = req.cookies["user_id"]
  if(userID) {
    res.redirect("/urls")
  }
  const templateVars = {
    userID: req.cookies['user_id'],
  };
  res.render('urls_register', templateVars);
});

app.get('/login', (req, res) => {
  const userID = req.cookies["user_id"]
  if(userID) {
    res.redirect("/urls")
  }

  const templateVars = {
    userID: req.cookies["user.email"],
  }
  // const userLoggedIn = users[userID];

  // console.log(templateVars);
  res.render('urls_login', templateVars);
});

app.get('/urls/new', (req, res) => {
  const userID = req.cookies["user_id"];
  if(!userID) {
    res.redirect("/login")
  }
  const user = users[userID];
  const templateVars = { 
    userID,
    user,
  };
  res.render('urls_new', templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  const shortURL = req.params.id;

  if(!userID) {
    res.status(401).send("Please login or create an account to view the URL");
    return;
  }

  const userURLs = urlsForUser(userID);
  if(!userURLs[shortURL]) {
    res.status(403).send("This URL is not under your account");
    return;
  }

  const templateVars = { 
    id: shortURL, 
    longURL: urlDatabase[shortURL].longURL,
    userID,
    user,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  
  if(longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send('Short URL not found');
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// POST ROUTES

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  // Condition if email or password is left empty
  if(!email || !password) {
    return res.status(400).send('Email and Password are required.');
  }
  // If email exists in users object
  const existingUser = getUserByEmail(email, users);
  if (existingUser) {
    return res.status(400).send('Email already exists.');
  }
  const userID = generateRandomString(); // Generate user & add it to users obj
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: userID,
    email,
    password: hashedPassword, // Store hashed password of user.
  };

  users[userID] = newUser;
  res.cookie('user_id', userID);
  res.redirect('/urls');
});

app.post('/urls', (req, res) => {
  const userID = req.cookies["user_id"]
  if(!userID) {
    const errorMsg = ("Please login or create an account to continue.");
    const templateVars = {
    userID: null,
    error: errorMsg
    };
    res.render("urls_new", templateVars);
  }
  const { longURL } = req.body;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userID,
  };
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const newLongURL = req.body.newLongURL;
  const userID = req.cookies["user_id"];

  if(!urlDatabase[shortURL]) {
    res.status(404).send("URL not found.");
    return;
  }

  if(!userID) {
    res.status(401).send("Please login or create an account to view the URL");
    return;
  }

  const userURLs = urlsForUser(userID);
  if(!userURLs[shortURL]) {
    res.status(403).send("This URL is not under your account");
    return;
  }

  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect('/urls');
});


app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const foundUser = getUserByEmail(email, users);
  if(!foundUser) {
    return res.status(403).send(`User with email ${email} does not exist.`);
  }
  if (foundUser.password !== password) {
    return res.status(403).send('Incorrect password');
  }
  res.cookie('user_id', foundUser.id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
})

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const userID = req.cookies["user_id"];

  if(!urlDatabase[shorturl]) {
    res.status(404).send("URL not found.");
    return;
  }

  if(!userID) {
    res.status(401).send("Please login or create an account to view the URL");
    return;
  }

  const userURLs = urlsForUser(userID);
  if(!userURLs[shortURL]) {
    res.status(403).send("This URL is not under your account");
    return;
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});