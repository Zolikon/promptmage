import { promises as fs } from "fs";
import path from "path";

const currentDate = new Date().toISOString().split("T")[0].replace(/-/g, ".");

const envFilePath = path.join(process.cwd(), ".env");

async function updateEnvDate() {
  try {
    const data = await fs.readFile(envFilePath, "utf8");

    const updatedEnv = data.replace(/VITE_APP_BUILT_AT=.*/, `VITE_APP_BUILT_AT=${currentDate}`);

    await fs.writeFile(envFilePath, updatedEnv, "utf8");
    console.log("VITE_APP_BUILT_AT updated successfully.");
  } catch (err) {
    console.error("Error updating .env file:", err);
  }
}

updateEnvDate();
