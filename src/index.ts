import { Server, HttpServerTransport } from './types/mcp-sdk.js'; // استبدل Stdio بـ Http
import { loadConfig } from './utils/config-loader.js';
import { registerTools } from './tools/index.js';
import { handleError } from './utils/error-handler.js';
import { logger } from './utils/logger.js';

// الدالة الرئيسية
async function main() {
  try {
    // تهيئة الخادم باستخدام HttpServerTransport
    const server = new Server({
      name: "roo-code-intelligence",
      version: "2.1.0",
      transport: new HttpServerTransport()
    });

    // تحميل التكوين
    const config = await loadConfig();

    // تسجيل جميع الأدوات
    await registerTools(server, config);

    // تحديد المنفذ من البيئة أو استخدام قيمة افتراضية
    const port = process.env.PORT || 10000; // المنفذ الديناميكي من Render أو 10000 افتراضيًا
    server.listen(port, '0.0.0.0'); // استماع على جميع الواجهات

    // تسجيل بدء التشغيل بنجاح مع المنفذ
    logger.info(`MCP Server started successfully on port ${port}`);
  } catch (error) {
    handleError('Server initialization failed', error);
    process.exit(1);
  }
}

// تشغيل الدالة الرئيسية مع التعامل مع الأخطاء غير المتوقعة
main().catch(error => {
  handleError('Unhandled error in main', error);
  process.exit(1);
});