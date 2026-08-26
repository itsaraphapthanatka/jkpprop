<?php
// Comment API for the static pages under /internal/.
// GET  -> {"comments":[...]}
// POST {"item","name","text","imgs":[dataURI...]} -> {"ok":true,"comment":{...}}
// Storage: JSON at /srv/jkpprop/internal-data/comments.json (not web-served),
// images as JPEG files in ./uploads/ (web-served alongside the page).

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

const DATA_DIR   = '/srv/jkpprop/internal-data';
const DATA_FILE  = DATA_DIR . '/comments.json';
const RATE_FILE  = DATA_DIR . '/ratelimit.json';
const UPLOAD_DIR = __DIR__ . '/uploads';

const MAX_COMMENTS   = 2000;
const MAX_IMGS       = 6;
const MAX_IMG_BYTES  = 2 * 1024 * 1024;   // per decoded image
const MAX_BODY_BYTES = 9 * 1024 * 1024;   // nginx caps at 10m before this
const RATE_MAX       = 10;                // posts per window per IP
const RATE_WINDOW    = 600;               // seconds

// หน้าวิเคราะห์ 24 ข้อ (web2026-checklist.html) — เลขข้อล้วน
$ALLOWED_ITEMS = ['2','3','4','5','6','7','8','9','10','11','12',
                  '14','15','16','17','18','19','20','21','22','23','24',
                  'ก','ข','ค',
                  'plan','general',
// หน้าวิเคราะห์สายงาน CRM 18 สไลด์ (web2026-flow-checklist.html)
// ขึ้นต้นด้วย f เพื่อไม่ให้ชนกับเลขข้อของหน้าแรก — สองหน้าใช้ที่เก็บเดียวกัน
// ถ้าคีย์ชนกัน ความคิดเห็นของอีกหน้าจะไปโผล่ผิดที่
                  'f2','f3','f4','f5','f6','f7','f8','f9','f10',
                  'f11','f13','f14','f15','f16','f17','f18',
                  'fplan','fgeneral'];

function respond(int $code, array $obj): void {
    http_response_code($code);
    echo json_encode($obj, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_store(): array {
    $raw = @file_get_contents(DATA_FILE);
    $data = $raw === false ? null : json_decode($raw, true);
    if (!is_array($data) || !isset($data['comments']) || !is_array($data['comments'])) {
        $data = ['comments' => []];
    }
    return $data;
}

// เวอร์ชันของข้อมูล — เปลี่ยนทุกครั้งที่ไฟล์ถูกเขียน ใช้ให้หน้าเว็บ poll
// แบบเบา ๆ (?check=1) โดยไม่ต้องส่งคอมเมนต์ทั้งชุดกลับทุกรอบ
function store_version(): string {
    clearstatcache(true, DATA_FILE);
    $m = @filemtime(DATA_FILE);
    $s = @filesize(DATA_FILE);
    return ($m === false ? '0' : (string) $m) . '-' . ($s === false ? '0' : (string) $s);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    if (isset($_GET['check'])) {
        respond(200, ['v' => store_version()]);
    }
    $store = read_store();
    respond(200, ['v' => store_version(), 'comments' => $store['comments']]);
}
if ($method !== 'POST') {
    respond(405, ['error' => 'method_not_allowed']);
}

// --- rate limit per IP -------------------------------------------------
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$now = time();
$rfp = fopen(RATE_FILE, 'c+');
if ($rfp !== false && flock($rfp, LOCK_EX)) {
    $rl = json_decode((string) stream_get_contents($rfp), true);
    if (!is_array($rl)) $rl = [];
    $mine = array_values(array_filter($rl[$ip] ?? [], function ($t) use ($now) {
        return is_int($t) && $now - $t < RATE_WINDOW;
    }));
    if (count($mine) >= RATE_MAX) {
        flock($rfp, LOCK_UN); fclose($rfp);
        respond(429, ['error' => 'rate_limited']);
    }
    $mine[] = $now;
    // prune other IPs' stale windows so the file never grows unbounded
    foreach ($rl as $k => $ts) {
        $rl[$k] = array_values(array_filter(is_array($ts) ? $ts : [], function ($t) use ($now) {
            return is_int($t) && $now - $t < RATE_WINDOW;
        }));
        if (!$rl[$k]) unset($rl[$k]);
    }
    $rl[$ip] = $mine;
    ftruncate($rfp, 0); rewind($rfp);
    fwrite($rfp, json_encode($rl));
    fflush($rfp); flock($rfp, LOCK_UN); fclose($rfp);
}

// --- parse and validate input ------------------------------------------
$body = file_get_contents('php://input');
if ($body === false || strlen($body) > MAX_BODY_BYTES) {
    respond(413, ['error' => 'too_large']);
}
$in = json_decode($body, true);
if (!is_array($in)) respond(400, ['error' => 'bad_json']);

$item = isset($in['item']) && is_string($in['item']) ? $in['item'] : '';
if (!in_array($item, $ALLOWED_ITEMS, true)) respond(400, ['error' => 'bad_item']);

$name = isset($in['name']) && is_string($in['name']) ? trim($in['name']) : '';
$name = preg_replace('/[\x00-\x1F\x7F]/u', '', $name) ?? '';
$name = mb_substr($name, 0, 60);
if ($name === '') $name = 'ไม่ระบุชื่อ';

$text = isset($in['text']) && is_string($in['text']) ? trim($in['text']) : '';
$text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? '';
$text = mb_substr($text, 0, 4000);

$imgs = $in['imgs'] ?? [];
if (!is_array($imgs) || count($imgs) > MAX_IMGS) respond(400, ['error' => 'bad_imgs']);
if ($text === '' && !$imgs) respond(400, ['error' => 'empty']);

// --- store images -------------------------------------------------------
$savedPaths = [];
$savedFiles = [];
foreach ($imgs as $u) {
    if (!is_string($u) || strncmp($u, 'data:image/jpeg;base64,', 23) !== 0) {
        respond(400, ['error' => 'img_format']);
    }
    $bin = base64_decode(substr($u, 23), true);
    if ($bin === false || strlen($bin) < 100 || strlen($bin) > MAX_IMG_BYTES) {
        respond(413, ['error' => 'img_size']);
    }
    $info = @getimagesizefromstring($bin);
    if ($info === false || ($info['mime'] ?? '') !== 'image/jpeg') {
        respond(400, ['error' => 'img_type']);
    }
    $fname = bin2hex(random_bytes(8)) . '.jpg';
    $fpath = UPLOAD_DIR . '/' . $fname;
    if (@file_put_contents($fpath, $bin) === false) {
        foreach ($savedFiles as $f) @unlink($f);
        respond(500, ['error' => 'store_failed']);
    }
    $savedFiles[] = $fpath;
    $savedPaths[] = 'uploads/' . $fname;
}

// --- append comment under an exclusive lock -----------------------------
$comment = [
    'id'   => 'c' . bin2hex(random_bytes(6)),
    'item' => $item,
    'name' => $name,
    'text' => $text,
    'ts'   => gmdate('c'),
    'imgs' => $savedPaths,
];

$fp = fopen(DATA_FILE, 'c+');
if ($fp === false || !flock($fp, LOCK_EX)) {
    foreach ($savedFiles as $f) @unlink($f);
    respond(500, ['error' => 'lock_failed']);
}
$data = json_decode((string) stream_get_contents($fp), true);
if (!is_array($data) || !isset($data['comments']) || !is_array($data['comments'])) {
    $data = ['comments' => []];
}
if (count($data['comments']) >= MAX_COMMENTS) {
    flock($fp, LOCK_UN); fclose($fp);
    foreach ($savedFiles as $f) @unlink($f);
    respond(507, ['error' => 'full']);
}
$data['comments'][] = $comment;
ftruncate($fp, 0); rewind($fp);
fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE));
fflush($fp); flock($fp, LOCK_UN); fclose($fp);

respond(200, ['ok' => true, 'comment' => $comment, 'v' => store_version()]);
