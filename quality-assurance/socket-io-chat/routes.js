const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function (app, myDataBase) {
  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please log in',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    });
  });

  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  });

  app.route('/profile').get(ensureAuthenticated, (req,res) => {
    res.render('profile', { username: req.user.username });
  });

  /*
  Removes req.user and clears the session, then redirects to the root page. 
  */
  app.route('/logout').get((req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.route('/auth/github').get(passport.authenticate('github'));
  app.route('/auth/github/callback').get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
    req.session.user_id = req.user.id;
    res.redirect('/chat');
  })

  app.route('/chat').get(ensureAuthenticated, (req, res) => {
    res.render('chat', { user: req.user })
  })

  app.route('/register').post((req, res, next) => {
    // encrypt the password 
    const hash = bcrypt.hashSync(req.body.password, 12);
    
    myDataBase.findOne({ username: req.body.username }, (err, user) => {
      if (err) {
        next(err);
      } else if (user) {
        res.redirect('/');
      } else {
        myDataBase.insertOne({
          username: req.body.username,
          password: hash
        },
          (err, doc) => {
            if (err) {
              res.redirect('/');
            } else {
              // The inserted document is held within
              // the ops property of the doc
              next(null, doc.ops[0]);
            }
          }
        )
      }
    })
  },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      res.redirect('/profile');
    }
  );

  /*
  If none of the above routes worked, this sends a 404 not found page.  
  */
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
}

/*
This middleware checks if there is a login cookie (is the user logged in), then redirect the user. 
*/
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
};