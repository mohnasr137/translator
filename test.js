import express from "express";
import fs from "fs";

const translate = JSON.parse(fs.readFileSync("./translate.json", "utf-8"));

const app = express();
app.use(express.json());

app.use(express.static("audio"));

app.get("/", (req, res) => {
  res.json(translate[0]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
