const express = require("express");
const { subs, users, articles } = require("../jeddit-fake-db-pass");
const { verifyIfLoggedIn, sortFunctions } = require("../helperFunctions");
const router = express.Router();

router.get("/list", (req, res) => {
  const subList = subs.list();
  const session = req.session;
  const jedditInfo = { subList, session };

  res.render("subList", { jedditInfo: jedditInfo });
});

router.get("/create", (req, res) => {
  verifyIfLoggedIn(req, res);

  res.render("createSub", { session: req.session });
});

router.post("/create", async (req, res) => {
  verifyIfLoggedIn(req, res);

  let subname = req.body.subname;
  let creator = users.get_byUsername(req.session.username);
  if (subname.includes("/")) {
    res.send("<h1>no / in titles please</h1> <a href='/'>go home</a>");
    return;
  }

  try {
    await subs.create({ name: subname, creator: creator });
    res.redirect(`/subs/show/${subname}`);
  } catch (error) {
    res.send(`<h1>${error}</h1><a href="/">home</a>`);
  }
});

router.get("/show/:sub", (req, res) => {
  const sub = subs.get_byName(req.params.sub);
  const session = req.session;
  const user = users.get_byUsername(session.username);

  const getArticleBySub = (article) => {
    if (article.sub_name === req.params.sub) {
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
  };
  const matchingArticles = articles.get_byFilter(getArticleBySub);

  try {
    sortFunctions[req.query.ordering](matchingArticles);
  } catch (error) {
    
    const jedditInfo = { matchingArticles, session, sub };

    res.render("sub", { jedditInfo: jedditInfo });
    return;
  }

  const jedditInfo = { matchingArticles, session, sub };

  res.render("sub", { jedditInfo: jedditInfo });
});

module.exports = router;
