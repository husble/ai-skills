import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Tham số dòng lệnh: <prompt> [output.mp4] [input_image]
const prompt = process.argv[2];
const outputFile = process.argv[3] || 'generated_video.mp4';
const inputImage = process.argv[4]; // tùy chọn -> image-to-video

const apiKey = process.env.GEMINI_API_SKILL;
const model = process.env.VEO_MODEL || 'veo-3.0-generate-001';
const aspectRatio = process.env.VEO_ASPECT_RATIO || '16:9';

if (!prompt && !inputImage) {
  console.error('Lỗi: Bạn phải cung cấp prompt (text) hoặc một ảnh đầu vào.');
  console.error('Cách dùng:');
  console.error('  Text -> video : node generate-video.js "<prompt>" [out.mp4]');
  console.error('  Image -> video: node generate-video.js "<prompt>" [out.mp4] "<đường_dẫn_ảnh>"');
  process.exit(1);
}

if (!apiKey) {
  console.error('Lỗi: Không tìm thấy biến môi trường GEMINI_API_SKILL.');
  console.error('Vui lòng thiết lập bằng lệnh: export GEMINI_API_SKILL="your_api_key_here"');
  process.exit(1);
}

// Đoán MIME type từ đuôi file ảnh
function imageMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

const ai = new GoogleGenAI({ apiKey });

async function generateVideo() {
  // Xây dựng request
  const request = {
    model,
    config: { numberOfVideos: 1, aspectRatio },
  };

  if (prompt) request.prompt = prompt;

  if (inputImage) {
    const absImage = path.resolve(process.cwd(), inputImage);
    if (!fs.existsSync(absImage)) {
      console.error(`Lỗi: Không tìm thấy ảnh đầu vào: ${absImage}`);
      process.exit(1);
    }
    request.image = {
      imageBytes: fs.readFileSync(absImage).toString('base64'),
      mimeType: imageMimeType(absImage),
    };
    console.log(`Chế độ: Image -> Video (ảnh: ${absImage})`);
  } else {
    console.log('Chế độ: Text -> Video');
  }

  console.log(`Model: ${model} | Tỉ lệ: ${aspectRatio}`);
  if (prompt) console.log(`Prompt: "${prompt}"`);
  console.log('Đang gửi yêu cầu tạo video (quá trình này có thể mất vài phút)...');

  try {
    let operation = await ai.models.generateVideos(request);

    // Poll cho tới khi hoàn tất
    while (!operation.done) {
      await new Promise((r) => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
      console.log('  ...đang xử lý');
    }

    if (operation.error) {
      console.error('❌ Lỗi từ phía dịch vụ Veo:');
      console.error(operation.error.message || JSON.stringify(operation.error));
      process.exit(1);
    }

    const generated = operation.response?.generatedVideos?.[0];
    if (!generated?.video) {
      const filtered = operation.response?.raiMediaFilteredReasons;
      console.error('Lỗi: Không có video nào được trả về.');
      if (filtered?.length) console.error(`Lý do bị lọc (RAI): ${filtered.join('; ')}`);
      process.exit(1);
    }

    const outputPath = path.resolve(process.cwd(), outputFile);
    await ai.files.download({ file: generated.video, downloadPath: outputPath });
    console.log(`✅ Thành công! Video đã được lưu tại: ${outputPath}`);
  } catch (error) {
    console.error('❌ Lỗi khi gọi API tạo video:');
    console.error(error.message);
    if (/not found|not support|permission|model/i.test(error.message || '')) {
      console.error('Gợi ý: nếu key/region chưa hỗ trợ Veo 3, thử lại với VEO_MODEL=veo-2.0-generate-001');
    }
    process.exit(1);
  }
}

generateVideo();
