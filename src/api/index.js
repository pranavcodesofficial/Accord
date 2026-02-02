require("dotenv").config();
const app = require("./server");

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Accord API running on http://localhost:${PORT}`);
});
