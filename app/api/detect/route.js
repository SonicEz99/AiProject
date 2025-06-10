import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';

export async function POST(request) {
  try {
    const data = await request.formData();
    const image = data.get('image');
    
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    // Save the uploaded image temporarily
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const tempPath = path.join(tempDir, image.name);
    await fs.writeFile(tempPath, buffer);

    // Run Python script
    const pythonProcess = spawn('python', [
      path.join(process.cwd(), 'python', 'ai_model.py'),
      tempPath
    ]);

    return new Promise((resolve) => {
      let result = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
      });

      pythonProcess.on('close', async (code) => {
        try {
          // Clean up temp file
          await fs.unlink(tempPath);
          
          if (code === 0) {
            const jsonResult = JSON.parse(result.trim());
            resolve(NextResponse.json(jsonResult));
          } else {
            resolve(NextResponse.json({ 
              error: 'Python script failed' 
            }, { status: 500 }));
          }
        } catch (error) {
          console.error('Error parsing Python output:', result);
          console.log(error);
          resolve(NextResponse.json({ 
            error: 'Invalid output from Python script' 
          }, { status: 500 }));
        }
      });

      pythonProcess.on('error', async (err) => {
        await fs.unlink(tempPath).catch(console.error);
        resolve(NextResponse.json({ 
          error: err.message 
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process image' 
    }, { status: 500 });
  }
}