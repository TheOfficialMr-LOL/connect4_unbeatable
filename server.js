//link to website: http://localhost:2000/

const fs = require("fs");
const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 2000;

const { execFile } = require("child_process");



//serve everything in the "public" folder (HTML, CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));



//handle requests
app.get("/getBestColumn", (req, res) => {
    let state = req.query.input || "default";
    if(state === "default") {state = "";}
    console.log("Column: ", state);
    execFile("public\\scripts\\webMinimax.exe", [state], (error, stdout, stderr) => {
        if (error) {
        console.error(error);
        return res.status(500).send("Error running C++ program");
        }
        //send output
        console.log(stdout);
        return res.send(stdout.trim());
  });
});





//404 fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "error.html"));
});



app.listen(port, () => {
  console.log(`Connected to port ${port}`);
});
