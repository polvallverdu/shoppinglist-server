import DatabaseClient from "./database/DatabaseClient";
import DatabaseCollection from "./models/Collection";
import DatabaseList from "./models/List";
require("dotenv").config();
/*
(async () => {
  await DatabaseClient.connect();
  const things = await DatabaseClient.createTestingDocs();
  for (let i = 1; i < 10; i++) {
    const item = await DatabaseClient.createItem(`Item ${i}`, "test");
    await DatabaseClient.addItemToCollection(things.collection._id, item._id);
  }
})();
*/