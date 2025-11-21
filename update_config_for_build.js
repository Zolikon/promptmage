import { promises as fs } from "fs";
import path from "path";

const currentDate = new Date().toISOString().split("T")[0].replace(/-/g, ".");

const envFilePath = path.join(process.cwd(), ".env");

async function updateEnvDate() {
  try {
    const data = await fs.readFile(envFilePath, "utf8");

    const updatedEnv = data.replace(/VITE_APP_BUILT_AT=.*/, `VITE_APP_BUILT_AT=${currentDate}`);

    await fs.writeFile(envFilePath, updatedEnv, "utf8");
    console.log(`VITE_APP_BUILT_AT updated successfully to '${currentDate}'`);
  } catch (err) {
    console.error("Error updating .env file:", err);
  }
}
async function updateEnvVersion() {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageData = await fs.readFile(packageJsonPath, "utf8");
    const { version } = JSON.parse(packageData);

    const envData = await fs.readFile(envFilePath, "utf8");
    const updatedEnv = envData.replace(/VITE_APP_VERSION=.*/, `VITE_APP_VERSION=${version}`);

    await fs.writeFile(envFilePath, updatedEnv, "utf8");
    console.log(`VITE_APP_VERSION updated successfully to '${version}'`);
  } catch (err) {
    console.error("Error updating VITE_APP_VERSION in .env file:", err);
  }
}

updateEnvDate();
updateEnvVersion();
