const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const path = require("path");

const app = express();
const port = 3000;

const subsRouter = require("./routes/subsRoute");
const usersRouter = require("./routes/usersRouter");
const debugRouter = require("./routes/debugger");
const articlesRouter = require("./routes/articlesRouter");
const commentsRouter = require("./routes/commentsRouter");

app.use(express.static(path.join(__dirname, "views")));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  cookieSession({
    name: "session",
    keys: ["put_a_key_here_i_guess"],
  })
);

app.set("view engine", "ejs");

app.use("/subs", subsRouter);
app.use("/users", usersRouter);
app.use("/debug", debugRouter);
app.use("/articles", articlesRouter);
app.use("/comments", commentsRouter);

app.get("/", (req, res) => {
  res.redirect("/subs/list");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
