<!-- @format -->

# Gemini Models Guide

## Available Models

### 1. **gemini-pro** (Legacy)

- **Status**: Stable, but older version
- **Best for**: General tasks, text generation
- **Speed**: Moderate
- **Context**: 32k tokens

### 2. **gemini-1.5-flash** ⭐ Recommended

- **Status**: Latest, fast model
- **Best for**: Quick responses, high-volume tasks
- **Speed**: Very fast
- **Context**: 1M tokens
- **Cost**: Lower cost per token

### 3. **gemini-1.5-pro**

- **Status**: Latest, most capable
- **Best for**: Complex tasks, high-quality outputs
- **Speed**: Slower than flash
- **Context**: 1M tokens
- **Cost**: Higher cost per token
- **Note**: May not be available in all regions/API versions

### 4. **gemini-2.0-flash-exp** (Experimental)

- **Status**: Experimental
- **Best for**: Testing new features
- **Note**: May be unstable or removed

## Pricing (as of 2024)

### Input Pricing (per 1M tokens)

- **gemini-1.5-flash**: $0.075
- **gemini-1.5-pro**: $1.25
- **gemini-pro**: $0.50

### Output Pricing (per 1M tokens)

- **gemini-1.5-flash**: $0.30
- **gemini-1.5-pro**: $5.00
- **gemini-pro**: $1.50

### Free Tier

- Google provides free tier with limited requests
- Check current limits at: https://ai.google.dev/pricing

## How to Check Available Models

### Method 1: Use the Script

```bash
node scripts/check-gemini-models.js
```

### Method 2: Check API Documentation

Visit: https://ai.google.dev/models/gemini

### Method 3: Test in Code

```javascript
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// If it works, the model is available
```

## Recommended Model for This Project

**Use `gemini-1.5-flash`** because:

- ✅ Fast responses
- ✅ Lower cost
- ✅ Large context window (1M tokens)
- ✅ Good quality for content generation
- ✅ Widely available

## Configuration

Set in `.env.local`:

```env
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-1.5-flash  # Optional, defaults to gemini-1.5-flash
```

## Resources

- **Official Docs**: https://ai.google.dev/docs
- **Models List**: https://ai.google.dev/models/gemini
- **Pricing**: https://ai.google.dev/pricing
- **API Reference**: https://ai.google.dev/api

## Notes

- Model availability may vary by region
- Pricing is subject to change - always check official docs
- Free tier has rate limits
- Some models require specific API versions


