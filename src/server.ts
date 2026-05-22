// import app from "./app";
// import config from "./config";
// import { initDB } from "./db";


// const main = () => {
//   initDB()
//   app.listen(config.port, () => {
//     console.log(`App listening on port ${config.port}`);
//   });
// };
// main();

import app from "./app";
import { initDB } from "./db";

initDB();

export default app;