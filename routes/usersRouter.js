const bcrypt = require("bcrypt");
const saltRounds = 10;
const { users, articles, comments } = require("../jeddit-fake-db-pass");
const { verifyIfLoggedOut, sortFunctions } = require("../helperFunctions");
const express = require("express");
const router = express.Router();

router.get("/profile/:username", (req, res) => {
  const session = req.session;
  const username = req.params.username;
  const user = users.get_byUsername(username);
  const user_id = users.get_byUsername(username).id;
  const allArticles = articles.get_byFilter((article) => {
    if (article.creator_id === user_id) {
      article.voteCount = articles.get_all_votes({ article: article });

      if (user) {
        const articleVote = articles.get_vote({
          article: article,
          voter: user,
        });
        if (articleVote) {
          switch (articleVote.vote_value) {
            case 1:
              article.voted = "upvoted";
              break;
            case -1:
              article.voted = "downvoted";
              break;
          }
        } else {
          article.voted = "neutral";
        }
      }
      return article;
    }
    return;
  });
  const allComments = comments.get_byFilter((comment) => {
    if (comment.creator_id === user_id) {
      comment.creator = users.get_byId(comment.creator_id).username;

      let date = new Date(0);
      date.setUTCSeconds(comment.ts);
      comment.date = date;

      comment.voteCount = comments.get_all_votes({ comment: comment });

      if (user) {
        const commentVote = comments.get_vote({
          comment: comment,
          voter: user,
        });
        if (commentVote) {
          switch (commentVote.vote_value) {
            case 1:
              comment.voted = "upvoted";
              break;
            case -1:
              comment.voted = "downvoted";
              break;
          }
        } else {
          comment.voted = "neutral";
        }
      }
      return comment;
    }
  });
  try {
    sortFunctions[req.query.ordering](allComments);
    sortFunctions[req.query.ordering](allArticles);
  } catch (error) {
    const jedditInfo = { allArticles, allComments, username, session, user };

    res.render("user", { jedditInfo: jedditInfo });
    return;
  }
  const jedditInfo = { allArticles, allComments, username, session, user };
  res.render("user", { jedditInfo: jedditInfo });
});

router.get("/login", (req, res) => {
  verifyIfLoggedOut(req, res);

  res.render("login");
});

router.post("/login", async (req, res) => {
  verifyIfLoggedOut(req, res);

  let givenUsername = req.body.username;
  let givenPassword = req.body.password;
  if (
    users.get_byUsername(givenUsername) && // if user exist
    (await bcrypt.compare(
      givenPassword,
      users.get_byUsername(givenUsername).password_hash // if user's password hash is same as given password hased
    ))
  ) {
    console.log(
      `user logged in, username: ${givenUsername} ; password : ${givenPassword} `
    );
    req.session.username = givenUsername;
  } else console.log("Password or Username incorrect");
  res.redirect("/");
});

router.get("/signup", (req, res) => {
  verifyIfLoggedOut(req, res);

  res.render("signUp");
});

router.post("/signup", async (req, res) => {
  verifyIfLoggedOut(req, res);

  let givenUsername = req.body.username;
  let givenPassword = bcrypt.hash(req.body.password, saltRounds);
  try {
    users.create({
      username: givenUsername,
      password_hash: await givenPassword,
    });
    req.session.username = givenUsername;
    res.redirect("/");
  } catch (error) {
    res.send(`<h1>${error}</h1><a href="/">home</a>`);
  }
});

router.post("/logout", (req, res) => {
  req.session.username = undefined;
  res.redirect("/");
});

module.exports = router;
