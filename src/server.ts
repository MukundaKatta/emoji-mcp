#!/usr/bin/env node
/**
 * emoji MCP server. Three tools: `to_shortcode`, `from_shortcode`, `info`.
 *
 * Backed by `node-emoji` — covers GitHub-style shortcodes (`:smile:` etc.).
 * `info` reports the code points and shortcode, handy for normalization.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as emoji from 'node-emoji';

const VERSION = '0.1.0';

/**
 * Replace shortcodes `:name:` in `text` with their emoji characters.
 * Unknown shortcodes are left untouched.
 */
export function fromShortcode(text: string): string {
  return emoji.emojify(text);
}

/**
 * Replace emoji characters in `text` with shortcodes `:name:`.
 * Characters without a known shortcode are left untouched.
 */
export function toShortcode(text: string): string {
  return emoji.unemojify(text);
}

export interface EmojiInfo {
  input: string;
  shortcode: string | null;
  codepoints: string[];
}

export function info(input: string): EmojiInfo {
  const sc = emoji.which(input);
  return {
    input,
    shortcode: sc ? `:${sc}:` : null,
    codepoints: Array.from(input).map((c) => 'U+' + c.codePointAt(0)!.toString(16).toUpperCase()),
  };
}

const server = new Server({ name: 'emoji', version: VERSION }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'from_shortcode',
    description: 'Replace `:name:` shortcodes with emoji characters.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    },
  },
  {
    name: 'to_shortcode',
    description: 'Replace emoji characters with `:name:` shortcodes.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    },
  },
  {
    name: 'info',
    description: 'Return shortcode (if any) and Unicode code points for an emoji character.',
    inputSchema: {
      type: 'object',
      properties: { input: { type: 'string' } },
      required: ['input'],
    },
  },
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

/**
 * Read a required string field from untrusted tool arguments.
 * Throws a clear error if the field is missing or not a string, so a
 * malformed request surfaces a helpful message instead of leaking an
 * opaque internal assertion from a dependency.
 */
function requireString(args: unknown, field: string): string {
  const value = (args as Record<string, unknown> | null | undefined)?.[field];
  if (typeof value !== 'string') {
    throw new Error(`missing or invalid string argument: "${field}"`);
  }
  return value;
}

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === 'from_shortcode') {
      return textResult(fromShortcode(requireString(args, 'text')));
    }
    if (name === 'to_shortcode') {
      return textResult(toShortcode(requireString(args, 'text')));
    }
    if (name === 'info') {
      return jsonResult(info(requireString(args, 'input')));
    }
    return errorResult('unknown tool: ' + name);
  } catch (err) {
    return errorResult('emoji tool failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function textResult(text: string) {
  return { content: [{ type: 'text', text }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`emoji MCP server v${VERSION} ready on stdio\n`);
}
