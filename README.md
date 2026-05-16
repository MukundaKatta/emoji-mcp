# emoji-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/emoji-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/emoji-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)

MCP server: convert between emoji characters and shortcodes. Backed by
`node-emoji` (GitHub-style names).

## Tools

- `from_shortcode` — `"hello :smile:"` → `"hello [emoji]"`
- `to_shortcode` — `"[emoji]"` → `":smile:"`
- `info` — shortcode + Unicode code points for an emoji character

Unknown shortcodes and non-emoji characters pass through unchanged.

## Configure

```json
{ "mcpServers": { "emoji": { "command": "npx", "args": ["-y", "@mukundakatta/emoji-mcp"] } } }
```

## License

MIT.
