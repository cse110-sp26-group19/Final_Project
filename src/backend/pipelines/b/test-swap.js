import FormData from "form-data";
import fs from "fs";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const form = new FormData();
form.append("sourceImage", fs.createReadStream(path.join(__dirname, "images/source.jpg")));
form.append("targetImage", fs.createReadStream(path.join(__dirname, "images/target.png")));

axios
  .post("http://localhost:3001/api/swap", form, {
    headers: form.getHeaders(),
  })
  .then((res) => console.log(res.data))
  .catch((err) => console.error(err.message));
