# intelligence-mcp

<div dir="rtl">

# دليل استخدام خادم MCP للذكاء الاصطناعي (Roo Code Intelligence)

## 🎯 نظرة عامة على المشروع

هذا المشروع هو خادم MCP (Model Context Protocol) متكامل مصمم لتوفير قدرات ذكاء اصطناعي متقدمة لتحليل الكود. يدمج الخادم أدوات متخصصة متعددة ويتبع سير عمل تحليل ثلاثي المراحل (الفحص ← التشخيص ← التنفيذ) لتقديم رؤى وحلول شاملة للكود.

## 🚀 المتطلبات الأساسية

تأكد من تثبيت البرامج التالية على نظامك:

-   **Node.js**: الإصدار 18 أو أحدث.
-   **npm**: مدير حزم Node.js (يأتي مع Node.js).
-   **Git**: لنسخ المستودع.

## 🛠️ خطوات التثبيت والإعداد

اتبع هذه الخطوات لإعداد وتشغيل الخادم محليًا:

1.  **نسخ المستودع**:
    افتح الطرفية (Terminal) وقم بنسخ المستودع:
    ```bash
    git clone https://github.com/yourusername/intelligence-mcp.git
    cd intelligence-mcp
    ```

2.  **تثبيت الاعتماديات**:
    انتقل إلى دليل المشروع وقم بتثبيت جميع الاعتماديات اللازمة:
    ```bash
    npm install
    ```

3.  **بناء المشروع**:
    قم ببناء مشروع TypeScript لتحويل الكود المصدري إلى JavaScript قابل للتنفيذ:
    ```bash
    npm run build
    ```

4.  **إعداد ملف التكوين (`.roo/code-intelligence.yaml`)**:
    يستخدم الخادم ملف تكوين YAML لإدارة الإعدادات. تأكد من وجود الملف `.roo/code-intelligence.yaml` في جذر المشروع. إذا لم يكن موجودًا، يمكنك إنشاؤه بالمحتوى التالي (أو تعديل الموجود):

    ```yaml
    version: 2.0
    memory:
      enabled: true
      files:
        core: []
        dynamic: []
        planning: []
        technical: []
        auto_generated: []
      archive:
        path: "archive/"
        retention_period: "30d"
    priorities:
      P0: [code_modifications, handover_decisions]
      P1: [memory_bank_updates, critical_conflicts]
      P2: [general_discussion]
    integrations:
      serpapi:
        api_key: "" # يجب تعيين هذا المفتاح من متغيرات البيئة أو أسرار GitHub
        rate_limit: 100
        cache_duration: "1h"
      eslint:
        config_path: ".eslintrc.js"
        auto_fix: true
        severity_threshold: "warning"
      typescript:
        tsconfig_path: "tsconfig.json"
        check_on_save: true
        diagnostic_level: "error"
    ```
    **ملاحظة**: بالنسبة لـ `serpapi.api_key`، يفضل استخدام متغيرات البيئة (مثل `SERP_API_KEY` في ملف `.env`) أو أسرار GitHub بدلاً من تضمينه مباشرة في هذا الملف لأسباب أمنية.

5.  **إعداد متغيرات البيئة (`.env`)**:
    لتعيين مفتاح API الخاص بـ SerpAPI وأي متغيرات بيئة أخرى، قم بإنشاء ملف `.env` في جذر المشروع (إذا لم يكن موجودًا) وأضف المتغيرات التالية:

    ```dotenv
    SERP_API_KEY=your_serp_api_key_here
    # يمكنك إضافة متغيرات بيئة أخرى هنا إذا لزم الأمر
    ```
    **تأكد من استبدال `your_serp_api_key_here` بمفتاح API الفعلي الخاص بك.**

## 🖥️ تشغيل الخادم محليًا

بعد إكمال خطوات التثبيت، يمكنك تشغيل الخادم:

1.  **تشغيل الخادم**:
    ```bash
    npm run start
    ```
    سيقوم هذا الأمر بتشغيل الخادم في وضع الإنتاج. سترى رسالة في الطرفية تشير إلى أن الخادم قد بدأ بنجاح.

2.  **تشغيل الخادم مع المراقبة (للتطوير)**:
    إذا كنت تقوم بالتطوير وترغب في إعادة تشغيل الخادم تلقائيًا عند حفظ التغييرات، استخدم:
    ```bash
    npm run watch
    ```

## 🔌 دمج الخادم مع عميل MCP (مثل VS Code)

لجعل الخادم يعمل "أونلاين" أو يتفاعل مع بيئة تطوير مثل VS Code، تحتاج إلى تكوين عميل MCP (مثل ملحق Claude Desktop أو أي ملحق يدعم MCP) للاتصال بالخادم المحلي.

### مثال لتكوين VS Code (باستخدام ملحق يدعم MCP):

عادةً، تتطلب ملحقات MCP تكوينًا في ملف JSON (مثل `~/.claude-desktop/claude_desktop_config.json` أو إعدادات المستخدم في VS Code). ستحتاج إلى إضافة إدخال لخادمك.

إليك مثال على كيفية تكوين خادمك في ملف `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "roo-code-intelligence": {
      "serverUrl": "https://intelligence-mcp.onrender.com"
    }
  }
}
```

**شرح التكوين:**

-   `"roo-code-intelligence"`: هو اسم فريد لخادمك.
-   `"command": "node"`: يحدد الأمر الذي سيتم تنفيذه لتشغيل الخادم.
-   `"args": ["./dist/index.js"]`: يحدد الوسيطات التي سيتم تمريرها إلى الأمر (مسار ملف الدخول الرئيسي للخادم بعد البناء).
-   `"cwd": "/workspaces/intelligence-mcp"`: يحدد دليل العمل الذي سيتم فيه تنفيذ الأمر. **تأكد من تعديل هذا المسار ليتناسب مع المسار الفعلي لمشروعك على جهازك.**
-   `"env": { "SERP_API_KEY": "your_serp_api_key_here" }`: يسمح لك بتمرير متغيرات البيئة مباشرة إلى عملية الخادم. **استبدل `your_serp_api_key_here` بمفتاح API الفعلي الخاص بك.**

بعد حفظ هذا التكوين، يجب أن يتعرف عميل MCP في VS Code على خادمك ويمكنه الآن استدعاء الأدوات التي يوفرها.

## 🔧 الأدوات المتاحة

يوفر خادم Roo Code Intelligence الأدوات التالية:

-   `roo_code_workflow`: لتنفيذ سير عمل التحليل الكامل (الفحص، التشخيص، التنفيذ).
-   `code_intelligence_analyze`: محرك تحليل الكود ثلاثي المراحل.
-   `web_search_enhanced`: تكامل SerpAPI للبحث على الويب مع التخزين المؤقت.
-   `memory_bank_manager`: نظام إدارة ملفات الذاكرة المنظمة مع الأرشفة التلقائية.
-   `eslint_analysis`: أداة تحليل جودة الكود باستخدام ESLint مع إمكانيات الإصلاح التلقائي.
-   `typescript_diagnostics`: أداة فحص أنواع TypeScript والتشخيصات.

## 💡 أمثلة على الاستخدام (من خلال عميل MCP)

بمجرد تكوين عميل MCP الخاص بك، يمكنك استدعاء أدوات الخادم. إليك بعض الأمثلة البرمجية (باستخدام MCP SDK):

```typescript
import { MCPClient } from "@modelcontextprotocol/sdk";

// قم بإنشاء عميل MCP للاتصال بالخادم المحلي
// إذا كان الخادم يعمل محليًا عبر StdioServerTransport، فقد لا تحتاج إلى serverUrl
// ولكن إذا كنت تستخدم خادمًا مستضافًا عبر HTTP/HTTPS، فستحتاج إلى تحديد serverUrl
const client = new MCPClient({
    serverName: "roo-code-intelligence" // يجب أن يتطابق هذا مع اسم الخادم في تكوين العميل
});

// مثال 1: تحليل كود كامل لملف
await client.call("roo_code_workflow", {
  workflow_type: "full_analysis",
  target_files: ["src/auth.ts", "src/types.ts"],
  include_web_search: true
});

// مثال 2: فحص سريع لـ ESLint
await client.call("eslint_analysis", {
  file_path: "src/components/Header.tsx",
  auto_fix: true
});

// مثال 3: تكثيف السياق
await client.call("roo_code_workflow", {
  workflow_type: "context_condensing"
});

// مثال 4: بحث على الويب عن حلول
await client.call("web_search_enhanced", {
  query: "TypeScript interface extends generic constraint",
  search_type: "documentation",
  max_results: 5
});
```

## ⚠️ حل المشكلات الشائعة

-   **مشاكل الاتصال**:
    -   تأكد من أن الخادم يعمل (تحقق من الطرفية التي قمت بتشغيل `npm run start` فيها).
    -   تأكد من أن مسار `cwd` في تكوين عميل MCP صحيح ويشير إلى جذر مشروعك.
    -   تأكد من أن اسم الخادم (`"roo-code-intelligence"`) في تكوين العميل يطابق الاسم المحدد في `src/index.ts`.
-   **مشاكل TypeScript**:
    -   تأكد من وجود ملف `tsconfig.json` صحيح في جذر المشروع.
    -   تأكد من أن `tsconfig_path` في `.roo/code-intelligence.yaml` يشير إلى المسار الصحيح.
-   **مشاكل ESLint**:
    -   تحقق من وجود ملف `.eslintrc.cjs` أو `.eslintrc.js` في جذر المشروع.
    -   تأكد من أن `config_path` في `.roo/code-intelligence.yaml` يشير إلى المسار الصحيح.
-   **مشاكل SerpAPI**:
    -   تأكد من تعيين `SERP_API_KEY` بشكل صحيح في ملف `.env` أو في متغيرات البيئة الخاصة بتكوين عميل MCP.

## ☁️ استضافة السيرفر على الإنترنت

يمكنك استضافة هذا الخادم على منصات سحابية مختلفة لجعله متاحًا عبر الإنترنت. إليك بعض الخيارات الشائعة:

### 1. استضافة على Railway

-   قم بإنشاء حساب على [Railway](https://railway.app).
-   اربط حسابك على GitHub بالمستودع الخاص بك.
-   سيقوم Railway تلقائيًا باكتشاف مشروع Node.js ونشره.

### 2. استضافة على Render

-   قم بإنشاء حساب على [Render](https://render.com).
-   اختر "New Web Service" وقم بربط مستودع GitHub الخاص بك.
-   اضبط إعدادات البناء والبدء:
    ```
    Build Command: npm install && npm run build
    Start Command: npm start
    ```

### 3. استضافة على Heroku

-   قم بإنشاء حساب على [Heroku](https://heroku.com).
-   قم بتثبيت Heroku CLI.
-   قم برفع المشروع باستخدام Git:
    ```bash
    heroku create your-mcp-server-name # استبدل بالاسم الذي تختاره
    git push heroku main
    ```

### ملاحظات هامة للاستضافة عبر الإنترنت:

-   **متغيرات البيئة**: تأكد من ضبط جميع متغيرات البيئة المطلوبة (مثل `SERP_API_KEY`) على منصة الاستضافة.
-   **تكوين الخادم**: قد تحتاج إلى تعديل ملف التكوين `.roo/code-intelligence.yaml` أو منطق الخادم (خاصة في `src/index.ts`) لاستخدام `HttpServerTransport` بدلاً من `StdioServerTransport` إذا كنت تستضيفه كخدمة ويب قياسية.
-   **CORS**: إذا كنت ستتصل بالخادم من نطاقات مختلفة (مثل تطبيق ويب أمامي)، فستحتاج إلى تمكين CORS (Cross-Origin Resource Sharing) على الخادم.
-   **HTTPS**: استخدم دائمًا HTTPS للاتصال الآمن بالخادم المستضاف.

بعد الاستضافة، ستحصل على عنوان URL للخادم (مثال: `https://your-server-url.com`). يمكنك بعد ذلك تكوين عميل MCP الخاص بك للاتصال بهذا العنوان:

```typescript
import { MCPClient } from "@modelcontextprotocol/sdk";

const client = new MCPClient({
    serverUrl: "https://your-server-url.com" // رابط السيرفر الخاص بك بعد الاستضافة
});

// الآن يمكنك استخدام السيرفر من أي مكان
await client.call("typescript_diagnostics", {
    file_path: "src/main.ts",
    check_type: "all"
});
```

## 🤝 المساهمة في المشروع

نرحب بمساهماتكم! يرجى اتباع الخطوات التالية:

1.  عمل Fork للمستودع.
2.  إنشاء فرع جديد للميزة أو إصلاح الأخطاء: `git checkout -b feature/your-feature-name`
3.  القيام بالتغييرات وتقديمها: `git commit -m "feat: Add new feature"`
4.  دفع الفرع إلى المستودع الخاص بك: `git push origin feature/your-feature-name`
5.  فتح طلب سحب (Pull Request) إلى الفرع الرئيسي للمشروع.

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT. انظر ملف `LICENSE` لمزيد من التفاصيل.

</div>