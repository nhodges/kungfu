# kungfu

Search and retrieve bookmarks ingested by KUNGFU.SH.

## Setup

Set these environment variables:
- `KUNGFU_API_KEY` — Your API key (generate at https://kungfu.sh/settings)
- `KUNGFU_BASE_URL` — API base URL (default: https://kungfu.sh)

## Commands

### search <query>
Search bookmarks by keyword. Returns relevance-ranked results.
```bash
curl -H "Authorization: Bearer $KUNGFU_API_KEY" \
  "$KUNGFU_BASE_URL/api/v1/bookmarks?q=machine+learning&limit=10"
```

### list [--source x] [--author @handle] [--limit N]
List recent bookmarks with optional filters.
```bash
curl -H "Authorization: Bearer $KUNGFU_API_KEY" \
  "$KUNGFU_BASE_URL/api/v1/bookmarks?source=x&author=@airesearcher&limit=20"
```

### show <id>
Get full details for a single bookmark.
```bash
curl -H "Authorization: Bearer $KUNGFU_API_KEY" \
  "$KUNGFU_BASE_URL/api/v1/bookmarks/BOOKMARK_ID"
```

### stats
Get bookmark statistics (counts by source, top authors).
```bash
curl -H "Authorization: Bearer $KUNGFU_API_KEY" \
  "$KUNGFU_BASE_URL/api/v1/stats"
```

## Tool Definitions

### OpenAI Function Calling Format
```json
{
  "type": "function",
  "function": {
    "name": "search_bookmarks",
    "description": "Search user's bookmarks from KUNGFU.SH",
    "parameters": {
      "type": "object",
      "properties": {
        "query": { "type": "string", "description": "Search query" },
        "source": { "type": "string", "enum": ["x"] },
        "author": { "type": "string", "description": "Filter by @handle" },
        "limit": { "type": "integer", "default": 20, "maximum": 100 }
      }
    }
  }
}
```

### Claude tool_use Format
```json
{
  "name": "search_bookmarks",
  "description": "Search user's bookmarks from KUNGFU.SH",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Search query" },
      "source": { "type": "string", "enum": ["x"] },
      "author": { "type": "string", "description": "Filter by @handle" },
      "limit": { "type": "integer", "default": 20 }
    }
  }
}
```
