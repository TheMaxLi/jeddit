const express = require("express");
const { users, articles, comments } = require("../jeddit-fake-db-pass");
const {
  verifyIfLoggedIn,
  verifyUserPermit,
  sortFunctions,
} = require("../helperFunctions");
const router = express.Router();

router.get("/view/:articleId", async (req, res) => {
  const article = await articles.get_byId(req.params.articleId);
  article.creator = await users.get_byId(article.creator_id).username;

  const session = req.session;
  const user = users.get_byUsername(req.session.username);
  let linkImg = false;

  const lastIndex = article.link.lastIndexOf(".");
  const linkExtension = article.link.substring(lastIndex + 1);
  const imgTypes = ["jpg", "jpeg", "gif", "png"];

  if (imgTypes.includes(linkExtension)) {
    linkImg = true;
  }

  const userComments = comments.get_byFilter((comment) => {
    if (comment.article_id === article.id) {
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
    sortFunctions[req.query.ordering](userComments);
  } catch (error) {
    const jedditInfo = { article, user, userComments, session, linkImg };

    res.render("article", { jedditInfo: jedditInfo });
    return;
  }

  const jedditInfo = { article, user, userComments, session, linkImg };

  res.render("article", { jedditInfo: jedditInfo });
});

router.get("/create/:subName", (req, res) => {
  verifyIfLoggedIn(req, res);

  const subName = req.params.subName;
  res.render("createArticle", { subName: subName });
});

router.post("/create/:subName", async (req, res) => {
  verifyIfLoggedIn(req, res);

  const form = req.body;
  const subName = req.params.subName;
  const user = users.get_byUsername(req.session.username);
  try {
    const article = await articles.create({
      sub: subName,
      title: form.title,
      creator: user,
      link: form.link,
      text: form.content,
    });
    res.redirect(`/articles/view/${article.id}`);
  } catch (error) {
    res.send(`<h1>${error}</h1><a href="/subs/show/${subName}">go back</a>`);
  }
});

router.get("/delete/:articleId", (req, res) => {
  verifyIfLoggedIn(req, res);
  const article = articles.get_byId(req.params.articleId);

  if (verifyUserPermit(req, "article")) {
    res.render("deleteArticle", { article: article });
    return;
  }

  res.redirect("/");
});

router.post("/delete/:articleId", async (req, res) => {
  verifyIfLoggedIn(req, res);
  const article = articles.get_byId(req.params.articleId);

  if (verifyUserPermit(req, "article")) {
    try {
      articles.delete(req.params.articleId);
      res.redirect(`/subs/show/${article.sub_name}`);
      return;
    } catch (error) {
      res.send(
        `<h1>${error}</h1><a href="/subs/show/${article.sub_name}">go back</a>`
      );
    }
  }

  res.redirect("/");
});

router.get("/edit/:articleId", async (req, res) => {
  verifyIfLoggedIn(req, res);
  const article = articles.get_byId(req.params.articleId);

  if (verifyUserPermit(req, "article")) {
    res.render("editArticle", { article: article });
    return;
  }

  res.redirect("/");
});

router.post("/edit/:articleId", async (req, res) => {
  verifyIfLoggedIn(req, res);

  if (verifyUserPermit(req, "article")) {
    const form = req.body;
    try {
      await articles.update({
        id: req.params.articleId,
        title: form.title,
        link: form.link,
        text: form.content,
      });
      res.redirect(`/articles/view/${req.params.articleId}`);
      return;
    } catch (error) {
      res.send(
        `<h1>${error}</h1><a href="/articles/${req.params.articleId}">go back</a>`
      );
    }
  }

  res.redirect("/");
});

router.post("/vote/:id/:votevalue", async (req, res) => {
  verifyIfLoggedIn(req, res);
  const article = articles.get_byId(req.params.id);
  const user = users.get_byUsername(req.session.username);
  const voteValue = parseInt(req.params.votevalue);

  if (articles.get_vote({ article: article, voter: user })) {
    // check if user has voted on this
    if (
      articles.get_vote({ article: article, voter: user }).vote_value ===
      voteValue
      // then check if the vote value is the same
    ) {
      articles.remove_vote({ article: article, voter: user });
      res.redirect(`/subs/show/${article.sub_name}`);
      return;
      // if its the same, remove that vote
    }
  }

  articles.set_vote({
    article: article,
    voter: user,
    vote_value: voteValue,
  });

  res.redirect(`/subs/show/${article.sub_name}`);
});

module.exports = router;
