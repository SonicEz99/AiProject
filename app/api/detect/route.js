import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";

export async function POST(request) {
  try {
    const data = await request.formData();
    const image = data.get("image");

    if (!image || typeof image.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "Invalid or missing image" },
        { status: 400 }
      );
    }

    // Always use /tmp to match Vercel's read/write constraints
    const tempDir = "/tmp";

    // Generate a safe, unique filename
    const uniqueName = `${crypto.randomUUID()}_${image.name.replace(/\s/g, "_")}`;
    const tempPath = path.join(tempDir, uniqueName);

    // Save the uploaded image temporarily
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(tempPath, buffer);

    // Run Python script
    const pythonProcess = spawn("python", [
      path.join(process.cwd(), "python", "ai_model.py"),
      tempPath,
    ]);

    return new Promise((resolve) => {
      let result = "";

      pythonProcess.stdout.on("data", (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        console.error(`Python Error: ${data}`);
      });

      const cleanup = async () => {
        try {
          await fs.unlink(tempPath);
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.warn(`Failed to delete temp file: ${err.message}`);
          }
        }
      };

      pythonProcess.on("close", async (code) => {
        await cleanup();

        try {
          if (code === 0) {
            const jsonResult = JSON.parse(result.trim());
            resolve(NextResponse.json(jsonResult));
          } else {
            resolve(
              NextResponse.json(
                { error: "Python script failed" },
                { status: 500 }
              )
            );
          }
        } catch (error) {
          console.error("Error parsing Python output:", result);
          console.error(error);
          resolve(
            NextResponse.json(
              { error: "Invalid output from Python script" },
              { status: 500 }
            )
          );
        }
      });

      pythonProcess.on("error", async (err) => {
        await cleanup();
        resolve(
          NextResponse.json(
            { error: err.message },
            { status: 500 }
          )
        );
      });
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
