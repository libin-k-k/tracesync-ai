export const docsSections = [
  { id: 'start', label: 'Start' },
  { id: 'project', label: 'Project' },
  { id: 'key', label: 'API key' },
  { id: 'send', label: 'Send an error' },
  { id: 'history', label: 'Read the fix' },
  { id: 'reference', label: 'Reference' },
  { id: 'local', label: 'Local ports' },
] as const

export const codeLanguages = [
  { id: 'curl', label: 'cURL' },
  { id: 'node', label: 'Node' },
  { id: 'php', label: 'PHP' },
  { id: 'python', label: 'Python' },
] as const

export type CodeLanguage = (typeof codeLanguages)[number]['id']

export const ingestSamples: Record<CodeLanguage, string> = {
  curl: `curl -sS -X POST http://127.0.0.1:3030/api/v1/errors \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $TRACESYNC_API_KEY" \\
  -d '{
    "project_id": "1",
    "environment": "production",
    "error_message": "TypeError: Cannot read properties of undefined (reading '\\''id'\\'')",
    "stack_trace": "TypeError: Cannot read properties of undefined (reading '\\''id'\\'')\\n    at UserService.findById (user.service.ts:41:18)"
  }'`,
  node: `const response = await fetch("http://127.0.0.1:3030/api/v1/errors", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.TRACESYNC_API_KEY,
  },
  body: JSON.stringify({
    project_id: "1",
    environment: "production",
    error_message: "TypeError: Cannot read properties of undefined (reading 'id')",
    stack_trace:
      "TypeError: Cannot read properties of undefined (reading 'id')\\n    at UserService.findById (user.service.ts:41:18)",
  }),
});

console.log(response.status, await response.json());`,
  php: `<?php

$payload = json_encode([
    'project_id' => '1',
    'environment' => 'production',
    'error_message' => "TypeError: Cannot read properties of undefined (reading 'id')",
    'stack_trace' => "TypeError: Cannot read properties of undefined (reading 'id')\\n    at UserService.findById (user.service.ts:41:18)",
], JSON_THROW_ON_ERROR);

$ch = curl_init('http://127.0.0.1:3030/api/v1/errors');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'x-api-key: ' . getenv('TRACESYNC_API_KEY'),
    ],
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_RETURNTRANSFER => true,
]);

echo curl_getinfo($ch, CURLINFO_HTTP_CODE), PHP_EOL, curl_exec($ch);
curl_close($ch);`,
  python: `import os
import requests

response = requests.post(
    "http://127.0.0.1:3030/api/v1/errors",
    headers={"x-api-key": os.environ["TRACESYNC_API_KEY"]},
    json={
        "project_id": "1",
        "environment": "production",
        "error_message": "TypeError: Cannot read properties of undefined (reading 'id')",
        "stack_trace": (
            "TypeError: Cannot read properties of undefined (reading 'id')\\n"
            "    at UserService.findById (user.service.ts:41:18)"
        ),
    },
    timeout=10,
)

print(response.status_code, response.json())`,
}

export const acceptedResponse = `{
  "success": true,
  "status": 202,
  "message": "Error log accepted and queued for processing",
  "data": {
    "job_id": "12",
    "queue": "error-logs-queue"
  }
}`

export const requestFields = [
  {
    name: 'project_id',
    required: 'Yes',
    limit: '64 characters',
    note: 'Project ID from the Projects page, sent as a string.',
  },
  {
    name: 'error_message',
    required: 'Yes',
    limit: '1 to 4,000',
    note: 'The exception message you want stored and shown in history.',
  },
  {
    name: 'stack_trace',
    required: 'Yes',
    limit: '1 to 100,000',
    note: 'Full stack. This is what the model reads when it drafts the fix.',
  },
  {
    name: 'environment',
    required: 'Yes',
    limit: '64 characters',
    note: 'Passed to the AI analysis. It is not stored as its own history column.',
  },
] as const

export const statusRows = [
  {
    code: '202',
    meaning: 'Accepted. The crash is on the Redis queue. The body has job_id and queue, not the fix.',
  },
  {
    code: '400',
    meaning: 'Body failed validation, or it included a field the API does not accept.',
  },
  {
    code: '401',
    meaning: 'Missing x-api-key (API_KEY_REQUIRED) or a key Redis does not know (API_KEY_INVALID).',
  },
] as const
