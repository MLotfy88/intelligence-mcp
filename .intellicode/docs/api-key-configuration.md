# API Key Configuration for IntelliCodeMCP

This document guides you on how to obtain and configure API keys for the Large Language Models (LLMs) supported by IntelliCodeMCP. Proper configuration of these keys is essential for enabling enhanced summarization and other LLM-powered features.

## Supported LLMs and API Key Acquisition

IntelliCodeMCP supports the following LLMs. Please refer to their official documentation for detailed instructions on how to obtain an API key for each service:

1.  **OpenAI (for Claude models via proxy or direct integration):**
    *   **API Key Name:** `OPENAI_API_KEY`
    *   **Acquisition:** Visit the [OpenAI API website](https://platform.openai.com/account/api-keys) and create a new secret key.

2.  **Google (for Gemini models):**
    *   **API Key Name:** `GOOGLE_API_KEY`
    *   **Acquisition:** Visit the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and create API credentials. Ensure the Gemini API is enabled for your project.

3.  **DeepSeek:**
    *   **API Key Name:** `DEEPSEEK_API_KEY`
    *   **Acquisition:** Refer to the [DeepSeek API documentation](https://www.deepseek.com/api-docs) for instructions on obtaining your API key.

4.  **Anthropic (for Claude models):**
    *   **API Key Name:** `ANTHROPIC_API_KEY`
    *   **Acquisition:** Visit the [Anthropic Console](https://console.anthropic.com/settings/keys) to generate your API key.

## Configuring API Keys

IntelliCodeMCP loads API keys from your environment variables. To configure your API keys, you should set them in your shell environment or in a `.env` file in the root directory of your IntelliCodeMCP project.

### Option 1: Setting Environment Variables (Recommended for Development)

You can set environment variables directly in your terminal session. This is suitable for temporary use or development environments.

```bash
export OPENAI_API_KEY="your_openai_api_key_here"
export GOOGLE_API_KEY="your_google_api_key_here"
export DEEPSEEK_API_KEY="your_deepseek_api_key_here"
export ANTHROPIC_API_KEY="your_anthropic_api_key_here"
```

**Note:** These variables will only persist for the current terminal session. For permanent configuration, consider adding them to your shell's profile file (e.g., `.bashrc`, `.zshrc`) or using a `.env` file.

### Option 2: Using a `.env` File (Recommended for Project-Specific Configuration)

For project-specific and more persistent configuration, create a file named `.env` in the root directory of your IntelliCodeMCP project. Add your API keys to this file in the following format:

```
OPENAI_API_KEY="your_openai_api_key_here"
GOOGLE_API_KEY="your_google_api_key_here"
DEEPSEEK_API_KEY="your_deepseek_api_key_here"
ANTHROPIC_API_KEY="your_anthropic_api_key_here"
```

**Important Security Note:**
*   **DO NOT** commit your `.env` file directly to version control (e.g., Git). It often contains sensitive information.
*   Ensure your `.gitignore` file includes `.env` to prevent accidental commits. A `.env.example` file is provided to guide you on the required variables without exposing your actual keys.

## Selecting Your Preferred LLM

IntelliCodeMCP allows you to specify a preferred LLM for certain operations (e.g., enhanced summarization). This can be configured in the `llm_apis` section of your `.roo/code-intelligence.yaml` file.

Example `llm_apis` configuration in `.roo/code-intelligence.yaml`:

```yaml
llm_apis:
  preferred_llm: "gemini" # Options: "openai", "google", "deepseek", "anthropic"
  # You can also specify model details if needed, e.g.:
  # google:
  #   model_name: "gemini-1.5-pro"
  # openai:
  #   model_name: "gpt-4o"
```

By following these steps, you can effectively configure IntelliCodeMCP to leverage the power of various LLMs for enhanced functionality.