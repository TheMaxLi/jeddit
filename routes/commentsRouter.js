const express = require("express");
const { users, articles, comments } = require("../jeddit-fake-db-pass");
const { verifyIfLoggedIn, verifyUserPermit } = require("../helperFunctions");
const router = express.Router();

router.post("/create/:articleId", async (req, res) => {
  verifyIfLoggedIn(req, res);

  const user = users.get_byUsername(req.session.username);
  const text = req.body.comment;
  const article = articles.get_byId(req.params.articleId);
  try {
    let comment = await comments.create({
      creator: user,
      text: text,
      article: article,
    });
    comments.set_vote({ comment: comment, voter: user, vote_value: 1 });
  } catch (error) {
    `<h1>${error}</h1><a href="/articles/${article.id}">go back</a>`;
  }
  res.redirect(`/articles/view/${article.id}`);
});

router.get("/edit/:commentId", (req, res) => {
  verifyIfLoggedIn(req, res);

  const comment = comments.get_byId(req.params.commentId);

  if (verifyUserPermit(req, "comment")) {
    res.render("editComment", { comment: comment });
    return;
  }
  res.redirect("/");
});

router.post("/edit/:commentId", async (req, res) => {
  verifyIfLoggedIn(req, res);

  const comment = comments.get_byId(req.params.commentId);

  if (verifyUserPermit(req, "comment")) {
    const form = req.body;
    try {
      await comments.update({
        id: req.params.commentId,
        text: form.content,
      });
      res.redirect(`/articles/view/${comment.article_id}`);
      return;
    } catch (error) {
      res.send(
        `<h1>${error}</h1><a href="/comments/edit/${req.params.commentId}">go back</a>`
      );
    }
  }
});

router.get("/delete/:commentId", (req, res) => {
  verifyIfLoggedIn(req, res);
  const comment = comments.get_byId(req.params.commentId);
  const articleId = articles.get_byId(comment.article_id).id;

  const jedditInfo = {
    commentId: req.params.commentId,
    articleId: articleId,
  };

  if (verifyUserPermit(req, "comment")) {
    res.render("deleteComment", { jedditInfo: jedditInfo });
    return;
  }
  res.redirect("/");
});

router.post("/delete/:commentId", (req, res) => {
  verifyIfLoggedIn(req, res);
  const comment = comments.get_byId(req.params.commentId);
  const articleId = articles.get_byId(comment.article_id).id;
  try {
    if (verifyUserPermit(req, "comment")) {
      comments.delete(req.params.commentId);
    }
  } catch (error) {
    `<h1>${error}</h1><a href="/articles/${articleId}">go back</a>`;
  }
  res.redirect(`/articles/view/${articleId}`);
});

router.post("/vote/:id/:votevalue", async (req, res) => {
  verifyIfLoggedIn(req, res);
  const comment = comments.get_byId(req.params.id);
  const user = users.get_byUsername(req.session.username);
  const voteValue = parseInt(req.params.votevalue);

  if (comments.get_vote({ comment: comment, voter: user })) {
    // check if user has voted on this
    if (
      comments.get_vote({ comment: comment, voter: user }).vote_value ===
      voteValue
      // then check if the vote value is the same
    ) {
      comments.remove_vote({ comment: comment, voter: user });
      res.redirect(`/articles/view/${comment.article_id}`);
      return;
      // if its the same, remove that vote
    }
  }

  comments.set_vote({
    comment: comment,
    voter: user,
    vote_value: voteValue,
  });

  res.redirect(`/articles/view/${comment.article_id}`);
});

module.exports = router;
