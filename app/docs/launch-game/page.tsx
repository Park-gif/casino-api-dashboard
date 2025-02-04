'use client';

import { useState } from 'react';
import { Copy, CheckCheck, Globe, ChevronRight, Terminal, Code2, AlertCircle } from 'lucide-react';

export default function LaunchGamePage() {
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
    curl: `curl -X POST https://your-domain.com/api/v1/game/launch \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "gameid": "softswiss/DiceBonanza",
    "lang": "en",
    "user_username": "yourPlayerId9959",
    "user_password": "superSecretPlayerPassword",
    "homeurl": "https://url.to.your.page.com",
    "cashierurl": "https://url.to.cashier.page.com",
    "play_for_fun": 0,
    "currency": "USD"
  }'`,
    php: `<?php
// Using Laravel/Guzzle
$client = new \\GuzzleHttp\\Client();

$response = $client->post('https://your-domain.com/api/v1/game/launch', [
    'headers' => [
        'Authorization' => 'Bearer YOUR_API_KEY',
        'Content-Type' => 'application/json',
    ],
    'json' => [
        'gameid' => 'softswiss/DiceBonanza',
        'lang' => 'en',
        'user_username' => 'yourPlayerId9959',
        'user_password' => 'superSecretPlayerPassword',
        'homeurl' => 'https://url.to.your.page.com',
        'cashierurl' => 'https://url.to.cashier.page.com',
        'play_for_fun' => 0,
        'currency' => 'USD'
    ]
]);

$data = json_decode($response->getBody(), true);`,
    nodejs: `const axios = require('axios');

async function launchGame() {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://your-domain.com/api/v1/game/launch',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      data: {
        gameid: 'softswiss/DiceBonanza',
        lang: 'en',
        user_username: 'yourPlayerId9959',
        user_password: 'superSecretPlayerPassword',
        homeurl: 'https://url.to.your.page.com',
        cashierurl: 'https://url.to.cashier.page.com',
        play_for_fun: 0,
        currency: 'USD'
      }
    });
    
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}`,
    python: `import requests

url = "https://your-domain.com/api/v1/game/launch"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "gameid": "softswiss/DiceBonanza",
    "lang": "en",
    "user_username": "yourPlayerId9959",
    "user_password": "superSecretPlayerPassword",
    "homeurl": "https://url.to.your.page.com",
    "cashierurl": "https://url.to.cashier.page.com",
    "play_for_fun": 0,
    "currency": "USD"
}

response = requests.post(url, json=data, headers=headers)
result = response.json()`,
    csharp: `using System.Net.Http;
using System.Text.Json;

var client = new HttpClient();
client.DefaultRequestHeaders.Add("Authorization", "Bearer YOUR_API_KEY");

var data = new
{
    gameid = "softswiss/DiceBonanza",
    lang = "en",
    user_username = "yourPlayerId9959",
    user_password = "superSecretPlayerPassword",
    homeurl = "https://url.to.your.page.com",
    cashierurl = "https://url.to.cashier.page.com",
    play_for_fun = 0,
    currency = "USD"
};

var json = JsonSerializer.Serialize(data);
var content = new StringContent(json, Encoding.UTF8, "application/json");

var response = await client.PostAsync("https://your-domain.com/api/v1/game/launch", content);
var result = await response.Content.ReadAsStringAsync();`,
    java: `import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

HttpClient client = HttpClient.newHttpClient();
ObjectMapper mapper = new ObjectMapper();

Map<String, Object> data = new HashMap<>();
data.put("gameid", "softswiss/DiceBonanza");
data.put("lang", "en");
data.put("user_username", "yourPlayerId9959");
data.put("user_password", "superSecretPlayerPassword");
data.put("homeurl", "https://url.to.your.page.com");
data.put("cashierurl", "https://url.to.cashier.page.com");
data.put("play_for_fun", 0);
data.put("currency", "USD");

String requestBody = mapper.writeValueAsString(data);

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://your-domain.com/api/v1/game/launch"))
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
            <span>Game Integration</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Launch Game</h1>
        </div>
        <div className="flex items-center gap-2 text-sm bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          <Globe className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-700">POST</span>
          <code className="px-2 py-1 bg-white rounded-md font-mono text-gray-600 text-xs">/api/v1/game/launch</code>
        </div>
      </div>

      {/* Overview */}
      <div className="prose prose-slate max-w-none">
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <p className="text-blue-900 text-base leading-relaxed">
            This method opens a game session and returns the game URL that you should serve to your players. 
            You should always invoke the createPlayer method before using this method to ensure player exists.
            On gameid you should always use the id_hash variable returned on the getGameList method.
            Invoke the getGameDemo method to open a demo (fun play) session.
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
  "api_login": "d13b1ceb-6209-4163-b1cf-f304c28b81ec",
  "api_password": "dqRin2nfLosij2n88",
  "method": "getGame",
  "lang": "en",
  "user_username": "yourPlayerId9959",
  "user_password": "superSecretPlayerPassword",
  "gameid": "softswiss/DiceBonanza",
  "homeurl": "https://url.to.your.page.com",
  "cashierurl": "https://url.to.cashier.page.com",
  "play_for_fun": 0,
  "currency": "USD"
}`}
            </pre>
            <button
              onClick={() => copyToClipboard(`{"api_login":"d13b1ceb-6209-4163-b1cf-f304c28b81ec","api_password":"dqRin2nfLosij2n88","method":"getGame","lang":"en","user_username":"yourPlayerId9959","user_password":"superSecretPlayerPassword","gameid":"softswiss/DiceBonanza","homeurl":"https://url.to.your.page.com","cashierurl":"https://url.to.cashier.page.com","play_for_fun":0,"currency":"USD"}`, 'request')}
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
  "error": 0,
  "response": "https://client-mga.spinshield.net/i?play=aHR0cHM6Ly9jbGllbnQtbWdhLnNwaW5zaGllbGQubmV0L3BsYXkvOGI1NGVkZjRmMWQ0YzNlZmRhZmQ5MGU1ZmQ5MmM5OWQvMzcxOTgyMy9zb2Z0c3dpc3MvRGljZUJvbmFuemE=",
  "session_id": "8b54edf4f1d4c3efdafd90e5fd92c99d"
}`}
            </pre>
            <button
              onClick={() => copyToClipboard(`{"error":0,"response":"https://client-mga.spinshield.net/i?play=aHR0cHM6Ly9jbGllbnQtbWdhLnNwaW5zaGllbGQubmV0L3BsYXkvOGI1NGVkZjRmMWQ0YzNlZmRhZmQ5MGU1ZmQ5MmM5OWQvMzcxOTgyMy9zb2Z0c3dpc3MvRGljZUJvbmFuemE=","session_id":"8b54edf4f1d4c3efdafd90e5fd92c99d"}`, 'response')}
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
                <td className="px-4 py-3 text-sm font-mono text-gray-900">gameid</td>
                <td className="px-4 py-3 text-sm text-gray-600">string</td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Required
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">Game identifier from getGameList method</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">lang</td>
                <td className="px-4 py-3 text-sm text-gray-600">string</td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Required
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">Game language code (e.g., en)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">user_username</td>
                <td className="px-4 py-3 text-sm text-gray-600">string</td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Required
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">Player's username</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">user_password</td>
                <td className="px-4 py-3 text-sm text-gray-600">string</td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Required
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">Player's password</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">homeurl</td>
                <td className="px-4 py-3 text-sm text-gray-600">string</td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Required
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">URL to redirect when player clicks home button</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">cashierurl</td>
                <td className="px-4 py-3 text-sm text-gray-600">string</td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Required
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">URL to redirect when player clicks deposit/cashier button</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">play_for_fun</td>
                <td className="px-4 py-3 text-sm text-gray-600">integer</td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Required
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">Set to 0 for real money play, 1 for demo mode</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">currency</td>
                <td className="px-4 py-3 text-sm text-gray-600">string</td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Required
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">Currency code (e.g., USD)</td>
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
              <li>Always call createPlayer method before using this endpoint</li>
              <li>Use id_hash from getGameList method as gameid</li>
              <li>For demo mode, use getGameDemo method instead</li>
              <li>All URLs (homeurl, cashierurl) must be HTTPS</li>
              <li>Session ID should be stored for future reference</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 