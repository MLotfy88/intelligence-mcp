# تحليل مشكلة اتصال خادم MCP (roo-code-intelligence)

## الملخص
الهدف هو جعل خادم `roo-code-intelligence` يظهر كـ "Connected MCP Server" في VS Code. على الرغم من أن الخادم يعمل بنجاح على Render (يستجيب لنقطة نهاية `/health` بـ `OK`)، إلا أن امتداد VS Code لا يمكنه إنشاء اتصال مستقر، مما يؤدي إلى أخطاء مختلفة (404، 409، 400).

## التكوين الحالي
*   **ملف `mcp.json`:**
    ```json
    {
      "mcpServers": {
        "roo-code-intelligence": {
          "url": "https://intelligence-mcp.onrender.com/mcp"
        }
      }
    }
    ```
    *   تم نقل الملف من `.kilocode/mcp.json` إلى `mcp.json` في جذر مساحة العمل.
    *   تم تغيير `serverUrl` إلى `url` ليتوافق مع تكوين SSE.
    *   تم إضافة `/mcp` إلى عنوان URL ليتوافق مع نقطة نهاية SSE المتوقعة.

*   **ملف `src/index.ts` (النسخة الحالية):**
    ```typescript
    import { Server } from '@modelcontextprotocol/sdk/server/index.js';
    import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
    import { loadConfig } from './utils/config-loader.js';
    import { getToolDefinitions } from './tools/index.js';
    import { getMemoryBankToolDefinition } from './tools/memory-bank.js'; // Import directly
    import { handleError } from './utils/error-handler.js';
    import { logger } from './utils/logger.js';
    import { readFile } from 'fs/promises';
    import express from 'express';
    import cors from 'cors'; // Import cors

    async function main() {
      try {
        const config = await loadConfig();
        if (process.env.SERP_API_KEY) {
          config.integrations.serpapi.api_key = process.env.SERP_API_KEY;
          logger.info('SERP_API_KEY loaded from environment variables');
        }

        // Initialize memory bank with project prompt before server starts
        const mcpPromptContent = await readFile('mcp-server-prompt.md', 'utf-8');
        const memoryBankToolDefinition = getMemoryBankToolDefinition(config); // Get the tool definition
        if (memoryBankToolDefinition && memoryBankToolDefinition.handler) {
          await memoryBankToolDefinition.handler({
            action: 'write',
            file_category: 'core',
            file_name: 'project-brief.md',
            content: mcpPromptContent
          });
          logger.info('Project prompt successfully written to memory bank.');
        } else {
          logger.error('Memory bank manager tool definition or handler is missing.');
        }

        const tools = getToolDefinitions(config);

        const app = express();
        app.use(express.json()); // For parsing application/json

        // Configure CORS for specific origins and methods
        app.use(cors({
          origin: '*', // Allow all origins for testing. IMPORTANT: Restrict this in production!
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
        }));

        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        });

        const server = new Server({
          name: "roo-code-intelligence",
          version: "2.1.0",
          transport: transport,
          tools: tools
        });

        // Handle all requests with the transport
        app.get('/mcp', async (req, res) => {
          await transport.handleRequest(req, res, null); // Changed from req.body to null
        });

        // Handle /api/tool endpoint as well, routing to the same transport
        app.post('/api/tool', async (req, res) => {
          await transport.handleRequest(req, res, req.body);
        });

        // Add a basic health check endpoint
        app.get('/health', (req, res) => {
          res.status(200).send('OK');
        });

        const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        app.listen(port, () => {
          logger.info(`MCP Server started successfully on port ${port}`);
        });

      } catch (error: unknown) {
        const err = error as Error;
        handleError('Server initialization failed', err);
        process.exit(1);
      }
    }

    main().catch((error: unknown) => {
      const err = error as Error;
      handleError('Unhandled error in main', err);
      process.exit(1);
    });
    ```

## تسلسل الأخطاء والتشخيصات والخطوات المتخذة

1.  **المشكلة الأولية:** `roo-code-intelligence` لا يظهر ضمن "Connected MCP Servers".
    *   **التشخيص:** ملف `mcp.json` في موقع غير صحيح (`.kilocode/mcp.json`) أو أن الامتداد غير مثبت/معطل.
    *   **الخطوات المتخذة:**
        *   تم نقل `mcp.json` إلى جذر مساحة العمل.
        *   تم طلب التحقق من تثبيت وتمكين امتداد MCP وإعادة تحميل VS Code.
    *   **النتيجة:** لا يزال لا يظهر.

2.  **خطأ جديد:** `Invalid MCP settings format: mcpServers.roo-code-intelligence: Invalid input`
    *   **التشخيص:** ملف `mcp.json` يستخدم `serverUrl` بدلاً من `url` لتكوين SSE.
    *   **الخطوات المتخذة:** تم تغيير `serverUrl` إلى `url` في `mcp.json`.
    *   **النتيجة:** لا يزال لا يظهر، ولكن خطأ جديد: `SSE error: Non-200 status code (404)`.

3.  **خطأ جديد:** `SSE error: Non-200 status code (404)`
    *   **التشخيص:** نقطة نهاية SSE غير صحيحة في عنوان URL.
    *   **الخطوات المتخذة:** تم إضافة `/mcp` إلى عنوان URL في `mcp.json` (`https://intelligence-mcp.onrender.com/mcp`).
    *   **النتيجة:** يظهر الخادم الآن، ولكن مع خطأ `SSE error: Non-200 status code (409)`.

4.  **خطأ جديد:** `SSE error: Non-200 status code (409)`
    *   **التشخيص:** تعارض في `Content-Type` أو مشكلة في `StreamableHTTPServerTransport`.
    *   **الخطوات المتخذة:**
        *   تم إزالة تعيين `res.setHeader('Content-Type', 'application/json')` من نقاط نهاية `/mcp` و `/api/tool`.
        *   تم محاولة التبديل إلى `HTTPServerTransport` (فشل بسبب عدم العثور على الوحدة).
        *   تم إعادة `StreamableHTTPServerTransport` مع `sessionIdGenerator` مخصص.
    *   **النتيجة:** لا يزال يظهر الخطأ 409، ثم خطأ 400.

5.  **خطأ جديد:** `400 Bad Request`
    *   **التشخيص:** `req.body` يتم تمريره إلى `transport.handleRequest` لطلبات `GET` إلى `/mcp`، حيث يكون `req.body` `undefined`.
    *   **الخطوات المتخذة:** تم تغيير `app.all` إلى `app.get` لنقطة نهاية `/mcp`، وتم إزالة `req.body` من استدعاء `transport.handleRequest` لـ `app.get('/mcp')`.
    *   **النتيجة:** لا يزال يظهر الخطأ 400، ثم خطأ 404.

6.  **خطأ جديد:** `404 Not Found` (بعد 400)
    *   **التشخيص:** على الرغم من التغييرات، لا يزال الخادم لا يجد نقطة نهاية SSE أو أن طريقة الطلب غير متطابقة.
    *   **الخطوات المتخذة:** تم تغيير `app.get('/mcp')` إلى `app.get('/mcp')` (لم يتغير) وتم تمرير `null` كـ `req.body` إلى `transport.handleRequest` لـ `app.get('/mcp')`.
    *   **النتيجة:** تم رفض هذا التغيير من قبل المستخدم.

## المشكلة الحالية والفرضيات

الخادم يعمل على Render، وملف `mcp.json` صحيح من الناحية النحوية ويشير إلى نقطة النهاية الصحيحة. ومع ذلك، فإن امتداد VS Code لا يمكنه إنشاء اتصال مستقر.

**الفرضيات الرئيسية:**

1.  **توقعات `StreamableHTTPServerTransport`:** قد يكون `StreamableHTTPServerTransport` يتوقع تنسيقًا معينًا للطلبات أو الرؤوس التي لا يوفرها امتداد VS Code بشكل صحيح، أو أن هناك مشكلة في كيفية تعامله مع اتصالات SSE في بيئة Render.
2.  **تكوين امتداد VS Code:** على الرغم من أننا قمنا بتثبيت الامتداد، فقد يكون هناك تكوين داخلي للامتداد في VS Code نفسه يمنع الاتصال الصحيح، أو أنه يتوقع مسارًا مختلفًا تمامًا لنقطة نهاية SSE.
3.  **مشكلة في Render:** قد يكون هناك سلوك معين من Render (مثل وكيل عكسي أو موازن تحميل) يتداخل مع اتصالات SSE.

## الخطوات المقترحة للتحقيق الإضافي

1.  **التحقق من سجلات الخادم على Render:** على الرغم من أننا رأينا سجلات "INFO"، فإن سجلات "ERROR" أو "WARN" الأكثر تفصيلاً من Render قد توفر رؤى حول سبب رفض الطلبات (400، 404، 409).
2.  **التحقق من سجلات امتداد VS Code (إذا أمكن):** إذا كان هناك أي طريقة للوصول إلى سجلات تصحيح الأخطاء الخاصة بامتداد MCP في VS Code، فقد توفر معلومات حول الطلبات التي يرسلها والردود التي يتلقاها.
3.  **تبسيط الخادم:** محاولة إنشاء خادم MCP بسيط للغاية باستخدام `StreamableHTTPServerTransport` فقط، بدون أي أدوات أو منطق إضافي، لمعرفة ما إذا كان الاتصال الأساسي يعمل.
4.  **النظر في نقل بديل:** إذا استمرت المشاكل مع `StreamableHTTPServerTransport`، فقد نحتاج إلى استكشاف خيارات نقل أخرى إذا كانت متاحة في SDK، أو حتى تنفيذ نقل مخصص إذا لزم الأمر.

آمل أن يساعد هذا التحليل المفصل في فهم المشكلة وإيجاد حل.