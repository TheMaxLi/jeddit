const express = require("express");
const { debug } = require("../jeddit-fake-db-pass");
const router = express.Router();
debug;

router.get("/", (req, res) => {
  res.render("debugpage");
});

router.get("/debug_db", (req, res) => {
  debug.log_debug();
  res.send("check the server console.   <a href='/'>To Home</a>");
});

router.post("/reset_db", (req, res) => {
  debug.reset_and_seed();
  debug.log_debug();
  res.send(
    "database reset; check the server console.   <a href='/'>To Home</a>"
  );
});

module.exports = router;
