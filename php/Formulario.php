<?php
header('Content-Type: application/json; charset=utf-8');

// Leer JSON del cuerpo
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'invalid-json']);
    exit;
}

$recaptcha = $input['recaptcha'] ?? '';
$nombre    = trim($input['nombre'] ?? '');
$email     = trim($input['email'] ?? '');
$password  = $input['password'] ?? '';
$action    = $input['action'] ?? '';

// Validaciones básicas
if ($action !== 'register') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'invalid-action']);
    exit;
}
if ($recaptcha === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'missing-recaptcha']);
    exit;
}

// Obtener secreto de variable de entorno (recomendado)
// Para pruebas locales puedes usar la secret de prueba:
$secret = getenv('RECAPTCHA_SECRET') ?: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

// Verificar con Google
$verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
$postFields = http_build_query([
    'secret' => $secret,
    'response' => $recaptcha,
    // 'remoteip' => $_SERVER['REMOTE_ADDR']  // opcional
]);

$ch = curl_init($verifyUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$errno = curl_errno($ch);
curl_close($ch);

if ($errno || !$response) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'recaptcha-request-failed']);
    exit;
}

$resp = json_decode($response, true);
if (!is_array($resp)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'invalid-recaptcha-response']);
    exit;
}

// Para reCAPTCHA v2 comprobamos 'success'
if (empty($resp['success']) || $resp['success'] !== true) {
    // puedes devolver también los códigos de error de Google: $resp['error-codes']
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'recaptcha-failed',
        'details' => $resp['error-codes'] ?? []
    ]);
    exit;
}

// Aquí el reCAPTCHA fue verificado correctamente.
// Continúa validando y creando el usuario (ejemplo simplificado)

if (strlen($nombre) < 3 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'invalid-input']);
    exit;
}

// Hashear contraseña antes de guardar
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

// TODO: insertar en base de datos de forma segura (prepared statements)
// Ejemplo simulado:
$userCreated = true; // reemplaza por resultado real de la inserción

if ($userCreated) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'db-error']);
}