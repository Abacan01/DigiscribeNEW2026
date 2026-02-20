<?php
/**
 * PHP Reverse Proxy → Render Backend
 *
 * All /api/* requests from Apache are routed here via .htaccess.
 * This script forwards each request (including file uploads) to the
 * Render-hosted Node.js backend and streams the response back to the browser.
 *
 * Backend URL is read from the BACKEND_URL environment variable,
 * falling back to the Render deployment URL.
 */

// ── Compatibility: getallheaders() missing in PHP-CGI mode ────────────────
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (strncmp($key, 'HTTP_', 5) === 0) {
                $name = str_replace('_', '-', substr($key, 5));
                $name = ucwords(strtolower($name), '-');
                $headers[$name] = $value;
            } elseif ($key === 'CONTENT_TYPE') {
                $headers['Content-Type'] = $value;
            } elseif ($key === 'CONTENT_LENGTH') {
                $headers['Content-Length'] = $value;
            }
        }
        return $headers;
    }
}

$backendUrl = rtrim(getenv('BACKEND_URL') ? getenv('BACKEND_URL') : 'https://digiscribedev2026.onrender.com', '/');

// Reconstruct the full target URL
$path  = isset($_GET['__path']) ? $_GET['__path'] : '/';
$query = isset($_SERVER['QUERY_STRING']) ? $_SERVER['QUERY_STRING'] : '';
// Strip the internal __path parameter from the forwarded query string
$query = preg_replace('/(^|&)__path=[^&]*(&|$)/', '$1', $query);
$query = trim($query, '&');
$target = $backendUrl . $path;
if ($query !== '') {
    $target .= '?' . $query;
}

$method      = $_SERVER['REQUEST_METHOD'];
$contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';

// ── Build forwarded headers ────────────────────────────────────────────────
$skipHeaders = array('host', 'connection', 'transfer-encoding', 'expect');
$forwardHeaders = array();
foreach (getallheaders() as $name => $value) {
    $lower = strtolower($name);
    if (in_array($lower, $skipHeaders)) {
        continue;
    }
    $forwardHeaders[] = "$name: $value";
}

// ── cURL setup ────────────────────────────────────────────────────────────
$ch = curl_init($target);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST,  $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER,         true);
curl_setopt($ch, CURLOPT_TIMEOUT,        300);   // 5 min – large uploads
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);

// ── Forward request body ──────────────────────────────────────────────────
if (!in_array($method, array('GET', 'HEAD'))) {
    if (stripos($contentType, 'multipart/form-data') !== false) {
        // Rebuild multipart payload so cURL re-encodes it properly
        $postFields = array();

        foreach ($_POST as $key => $value) {
            $postFields[$key] = $value;
        }

        foreach ($_FILES as $key => $file) {
            if ($file['error'] !== UPLOAD_ERR_OK) continue;
            $postFields[$key] = new CURLFile(
                $file['tmp_name'],
                $file['type']  ? $file['type']  : 'application/octet-stream',
                $file['name']  ? $file['name']  : $key
            );
        }

        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);

        // Remove Content-Type from forwarded headers — cURL will set it with
        // the correct multipart boundary after we supply CURLOPT_POSTFIELDS.
        $filtered = array();
        foreach ($forwardHeaders as $h) {
            if (stripos($h, 'content-type:') !== 0) {
                $filtered[] = $h;
            }
        }
        $forwardHeaders = array_values($filtered);
    } else {
        // JSON, binary, URL-encoded, etc.
        $body = file_get_contents('php://input');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $forwardHeaders);

// ── Execute ───────────────────────────────────────────────────────────────
$raw        = curl_exec($ch);
$httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$curlError  = curl_error($ch);
curl_close($ch);

if ($raw === false) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(array('success' => false, 'error' => 'Proxy error: ' . $curlError));
    exit;
}

// ── Forward response ──────────────────────────────────────────────────────
$responseHeaders = substr($raw, 0, $headerSize);
$responseBody    = substr($raw, $headerSize);

http_response_code($httpCode);

// Forward safe response headers
$allowedResponseHeaders = array(
    'content-type', 'content-disposition', 'content-length',
    'cache-control', 'accept-ranges', 'content-range',
    'access-control-allow-origin', 'access-control-allow-headers',
    'access-control-allow-methods',
);
foreach (explode("\r\n", $responseHeaders) as $header) {
    if (strpos($header, ':') === false) continue;
    $parts = explode(':', $header, 2);
    $name  = $parts[0];
    if (in_array(strtolower(trim($name)), $allowedResponseHeaders)) {
        header($header, false);
    }
}

echo $responseBody;
