<?php
/**
 * WordPress hosting'den Etkin katalog dump (IP whitelist buradadır).
 *
 * 1) wp-etkin-dump.config.example.php → wp-etkin-dump.config.php (bilgileri doldur)
 * 2) Bu iki dosyayı public_html köküne yükle
 * 3) Tarayıcı: https://eserpromo.com/wp-etkin-dump.php?key=ANAHTAR
 * 4) Adımları sırayla tıkla. Biten klasör: /etkin-dump/
 * 5) cPanel → etkin-dump klasörünü zipleyip bu projeye kopyala
 * 6) İş bitince PHP ve dump klasörünü SİL
 */

@ini_set('display_errors', '1');
@ini_set('memory_limit', '256M');
@set_time_limit(120);

$configFile = __DIR__ . '/wp-etkin-dump.config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    echo 'wp-etkin-dump.config.php yok. example dosyasını kopyalayıp doldurun.';
    exit;
}

$config = require $configFile;
$key = (string) ($_GET['key'] ?? '');
if ($key === '' || !hash_equals((string) $config['key'], $key)) {
    http_response_code(403);
    echo 'Anahtar hatalı.';
    exit;
}

$dumpDir = __DIR__ . '/etkin-dump';
if (!is_dir($dumpDir) && !mkdir($dumpDir, 0755, true)) {
    http_response_code(500);
    echo 'etkin-dump klasörü oluşturulamadı.';
    exit;
}

$step = (string) ($_GET['step'] ?? 'menu');
$from = max(0, (int) ($_GET['from'] ?? 0));
$batch = max(5, min(50, (int) ($config['batch'] ?? 20)));

function etkin_query(array $config, string $tip, array $extra = []): array
{
    $body = array_merge([
        'ebayi_eposta' => $config['ebayi_eposta'],
        'hash' => $config['hash'],
        'tip' => $tip,
    ], $extra);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $config['api_url'],
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => json_encode($body),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_USERAGENT => $config['site_domain'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 90,
        CURLOPT_ENCODING => '',
    ]);
    $raw = curl_exec($ch);
    $err = curl_error($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false) {
        throw new RuntimeException('cURL: ' . $err);
    }
    if ($code >= 400) {
        throw new RuntimeException("HTTP $code: " . substr($raw, 0, 400));
    }
    $json = json_decode($raw, true);
    if (!is_array($json)) {
        throw new RuntimeException('JSON çözülemedi: ' . substr($raw, 0, 400));
    }
    if (!empty($json['Hata'])) {
        throw new RuntimeException('API Hata: ' . $json['Hata']);
    }
    return $json;
}

function save_json(string $path, $data): void
{
    file_put_contents(
        $path,
        json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    );
}

function h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

function product_ids_from_index(array $index): array
{
    $ids = [];
    foreach ($index['urunler'] ?? [] as $row) {
        if (isset($row['urun_id'])) {
            $ids[] = (int) $row['urun_id'];
        }
    }
    return $ids;
}

header('Content-Type: text/html; charset=utf-8');
$base = '?key=' . rawurlencode($key);

try {
    if ($step === 'index') {
        $index = etkin_query($config, 'index');
        save_json($dumpDir . '/index.json', $index);
        $adet = count($index['urunler'] ?? []);
        $msg = "index.json yazıldı. Ürün sayısı: $adet";
    } elseif ($step === 'kategoriler') {
        $cats = etkin_query($config, 'tum_kategoriler_hiyerasi');
        save_json($dumpDir . '/kategoriler.json', $cats);
        $msg = 'kategoriler.json yazıldı.';
    } elseif ($step === 'urunler') {
        $indexPath = $dumpDir . '/index.json';
        if (!is_file($indexPath)) {
            throw new RuntimeException('Önce index adımını çalıştırın.');
        }
        $index = json_decode(file_get_contents($indexPath), true);
        $ids = product_ids_from_index($index);
        $total = count($ids);
        $slice = array_slice($ids, $from, $batch);
        if (!$slice) {
            $msg = "Ürün dump bitti. Toplam: $total";
        } else {
            $products = etkin_query($config, 'array_urunler', ['array_urunler' => array_values($slice)]);
            $name = sprintf('urunler-%04d.json', $from);
            save_json($dumpDir . '/' . $name, $products);
            $next = $from + count($slice);
            $msg = "$name yazıldı ($from–" . ($next - 1) . " / $total).";
            if ($next < $total) {
                $auto = $base . '&step=urunler&from=' . $next;
                $msg .= ' Sonraki paket 1.5 sn içinde açılacak.';
                echo '<!doctype html><meta charset="utf-8"><p>' . h($msg) . '</p>';
                echo '<p><a href="' . h($auto) . '">Elle devam</a></p>';
                echo '<script>setTimeout(function(){ location.href=' . json_encode($auto) . '; }, 1500);</script>';
                exit;
            }
            $msg .= ' Tüm ürün paketleri tamam.';
        }
    } else {
        $msg = 'Menü. Adımları sırayla çalıştırın. Bitince /etkin-dump/ klasörünü zipleyin.';
    }
} catch (Throwable $e) {
    http_response_code(500);
    $msg = 'Hata: ' . $e->getMessage();
}

$files = glob($dumpDir . '/*.json') ?: [];
sort($files);
?>
<!doctype html>
<meta charset="utf-8">
<title>Etkin dump</title>
<body style="font-family:sans-serif;max-width:720px;margin:32px auto;line-height:1.45">
  <h1>Etkin katalog dump</h1>
  <p><strong><?= h($msg) ?></strong></p>
  <ol>
    <li><a href="<?= h($base) ?>&step=index">1. Index</a></li>
    <li><a href="<?= h($base) ?>&step=kategoriler">2. Kategoriler</a></li>
    <li><a href="<?= h($base) ?>&step=urunler&from=0">3. Ürünler (paket paket)</a></li>
  </ol>
  <p>Dosyalar: <code>/etkin-dump/</code></p>
  <ul>
    <?php foreach ($files as $file): ?>
      <li><?= h(basename($file)) ?> (<?= number_format(filesize($file) / 1024, 1) ?> KB)</li>
    <?php endforeach; ?>
  </ul>
  <p>İş bitince bu PHP dosyalarını, config’i ve dump klasörünü silin.</p>
</body>
