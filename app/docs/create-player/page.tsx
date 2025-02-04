'use client';

import { useState } from 'react';
import { Copy, CheckCheck, Globe, ChevronRight, Terminal, Code2, AlertCircle } from 'lucide-react';

export default function CreatePlayerPage() {
  const [activeLanguage, setActiveLanguage] = useState('curl');
  const [copied, setCopied] = useState('');

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopied(section);
    setTimeout(() => setCopied(''), 2000);
  };

  const languages = [
    { id: 'curl', name: 'cURL', icon: Terminal },
    { id: 'php', name: 'PHP', icon: Code2 },
    { id: 'nodejs', name: 'Node.js', icon: Code2 },
    { id: 'python', name: 'Python', icon: Code2 },
    { id: 'csharp', name: 'C#', icon: Code2 },
    { id: 'java', name: 'Java', icon: Code2 }
  ];

  const codeExamples = {
    curl: `curl -X POST https://your-domain.com/api/v1/player/create \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "player123",
    "secret": "playerSecretPassword"
  }'`,
    php: `<?php
// Using Laravel/Guzzle
$client = new \\GuzzleHttp\\Client();

$response = $client->post('https://your-domain.com/api/v1/player/create', [
    'headers' => [
        'Authorization' => 'Bearer YOUR_API_KEY',
        'Content-Type' => 'application/json',
    ],
    'json' => [
        'username' => 'player123',
        'secret' => 'playerSecretPassword'
    ]
]);

$data = json_decode($response->getBody(), true);`,
    nodejs: `const axios = require('axios');

async function createPlayer() {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://your-domain.com/api/v1/player/create',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      data: {
        username: 'player123',
        secret: 'playerSecretPassword'
      }
    });
    
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}`,
    python: `import requests

url = "https://your-domain.com/api/v1/player/create"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "username": "player123",
    "secret": "playerSecretPassword"
}

response = requests.post(url, json=data, headers=headers)
result = response.json()`,
    csharp: `using System.Net.Http;
using System.Text.Json;

var client = new HttpClient();
client.DefaultRequestHeaders.Add("Authorization", "Bearer YOUR_API_KEY");

var data = new
{
    username = "player123",
    secret = "playerSecretPassword"
};

var json = JsonSerializer.Serialize(data);
var content = new StringContent(json, Encoding.UTF8, "application/json");

var response = await client.PostAsync("https://your-domain.com/api/v1/player/create", content);
var result = await response.Content.ReadAsStringAsync();`,
    java: `import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

HttpClient client = HttpClient.newHttpClient();
ObjectMapper mapper = new ObjectMapper();

Map<String, String> data = new HashMap<>();
data.put("username", "player123");
data.put("secret", "playerSecretPassword");

String requestBody = mapper.writeValueAsString(data);

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://your-domain.com/api/v1/player/create"))
    .header("Authorization", "Bearer YOUR_API_KEY")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
String result = response.body();`
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb & API Info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <span>API Reference</span>
            <ChevronRight className="h-4 w-4" />
            <span>Player Management</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Create Player</h1>
        </div>
        <div className="flex items-center gap-2 text-sm bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          <Globe className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-700">POST</span>
          <code className="px-2 py-1 bg-white rounded-md font-mono text-gray-600 text-xs">/api/v1/player/create</code>
        </div>
      </div>

      {/* Overview */}
      <div className="prose prose-slate max-w-none">
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <p className="text-blue-900 text-base leading-relaxed">
            The createPlayer method should be invoked before sending other requests. 
            For safe integration you should always call this, even if you already created player before.
            If the player exists already, we redirect your request to the playerExists method.
          </p>
        </div>
      </div>

      {/* Code Examples */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {languages.map(lang => (
              <button
                key={lang.id}
                onClick={() => setActiveLanguage(lang.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  activeLanguage === lang.id
                    ? 'border-[#18B69B] text-[#18B69B]'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <lang.icon className="h-4 w-4" />
                {lang.name}
              </button>
            ))}
          </div>
        </div>
        <div className="relative bg-gray-50">
          <pre className="p-4 overflow-x-auto">
            <code className="text-sm font-mono text-gray-800">
              {codeExamples[activeLanguage as keyof typeof codeExamples]}
            </code>
          </pre>
          <button
            onClick={() => copyToClipboard(codeExamples[activeLanguage as keyof typeof codeExamples], 'code')}
            className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-white/50 transition-colors"
          >
            {copied === 'code' ? (
              <CheckCheck className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Request/Response Examples */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request Format */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900">Request Format</h3>
          </div>
          <div className="relative p-4">
            <pre className="overflow-x-auto text-sm font-mono text-gray-800">
{`{
  "username": "player123",
  "secret": "playerSecretPassword"
}`}
            </pre>
            <button
              onClick={() => copyToClipboard(`{"username":"player123","secret":"playerSecretPassword"}`, 'request')}
              className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
            >
              {copied === 'request' ? (
                <CheckCheck className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Response Format */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900">Response Format</h3>
          </div>
          <div className="relative p-4">
            <pre className="overflow-x-auto text-sm font-mono text-gray-800">
{`{
  "success": true,
  "data": {
    "error": 0,
    "response": {
      "id": 51,
      "username": "player123_USD_merchant1",
      "balance": "0.00",
      "currencycode": "USD",
      "created": "2023-10-10T11:44:22.000000Z",
      "agent_balance": null
    }
  }
}`}
            </pre>
            <button
              onClick={() => copyToClipboard(`{"success":true,"data":{"error":0,"response":{"id":51,"username":"player123_USD_merchant1","balance":"0.00","currencycode":"USD","created":"2023-10-10T11:44:22.000000Z","agent_balance":null}}}`, 'response')}
              className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
            >
              {copied === 'response' ? (
                <CheckCheck className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Parameters */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900">Parameters</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">username</td>
                <td className="px-4 py-3 text-sm text-gray-600">string</td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Required
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">Player's unique username</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">secret</td>
                <td className="px-4 py-3 text-sm text-gray-600">string</td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Required
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">Player's password</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900 mb-2">Important Notes</h3>
            <ul className="list-disc list-inside text-sm text-amber-900 space-y-1 marker:text-amber-500">
              <li>The API key must be associated with an active merchant account</li>
              <li>Username format will be: username_CURRENCY_merchantusername</li>
              <li>Currency is automatically set based on the merchant's settings</li>
              <li>All requests must include the Authorization header with a valid API key</li>
              <li>Response times may vary based on network conditions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
