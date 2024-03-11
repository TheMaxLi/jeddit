const { articles, users, comments } = require("./jeddit-fake-db-pass");

function verifyIfLoggedIn(req, res) {
  if (!req.session.username) {
    res.redirect("/");
  }
}

function verifyIfLoggedOut(req, res) {
  if (req.session.username) {
    res.redirect("/");
  }
}

function verifyUserPermit(req, type) {
  if (type === "article") {
    const articleId = req.params.articleId;
    const article = articles.get_byId(articleId);
    const articleCreator = users.get_byId(article.creator_id).username;
    if (req.session.username === articleCreator) {
      return true;
    }
  } else if (type === "comment") {
    const commentId = req.params.commentId;
    const comment = comments.get_byId(commentId);
    const commentCreator = users.get_byId(comment.creator_id).username;
    if (req.session.username === commentCreator) {
      return true;
    }
  }
}

function getAllComments(user, user_id) {
  return comments.get_byFilter((comment) => {
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
}

function getAllArticles(user, req, user_id) {
  return articles.get_byFilter((article) => {
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
}

const sortFunctions = {
  Top: (sortable) => {
    sortable.sort((a, b) => b.voteCount - a.voteCount);
  },
  New: (sortable) => {
    sortable.sort((a, b) => b.ts - a.ts);
  },
  Old: (sortable) => {
    sortable.sort((a, b) => a.ts - b.ts);
  },
  Ragebait: (sortable) => {
    if (sortable.sub_name) {
      sortable.sort(
        (a, b) =>
          articles.get_all_interactions({ article: b }) -
          articles.get_all_interactions({ article: a })
      );
    } else {
      sortable.sort(
        (a, b) =>
          comments.get_all_interactions({ comment: b }) -
          comments.get_all_interactions({ comment: a })
      );
    }
  },
};

module.exports = {
  verifyIfLoggedIn,
  verifyIfLoggedOut,
  verifyUserPermit,
  getAllComments,
  getAllArticles,
  sortFunctions,
};
