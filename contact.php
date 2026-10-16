<?php
/* medias.fr · réception du formulaire de contact
   Envoie la demande à hello@medias.fr depuis cette même boîte (hébergement Hostinger de medias.fr).
   Aucun mot de passe ni clé dans ce fichier. */
declare(strict_types=1);

const DESTINATAIRE = 'hello@medias.fr';
const EXPEDITEUR   = 'hello@medias.fr';
const OBJETS       = ['Campagne publicitaire', 'Contenu partenaire', 'Partenariat', 'Presse', 'Autre'];

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function reponse(int $code, array $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    reponse(405, ['ok' => false, 'error' => 'Méthode non autorisée.']);
}

$origine = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origine !== '' && !preg_match('#^https?://(www\.)?medias\.fr$#', $origine)) {
    reponse(403, ['ok' => false, 'error' => 'Origine non autorisée.']);
}

// Robots : champ piège rempli ou envoi trop rapide. On répond comme si tout allait bien.
if (trim((string)($_POST['site_web'] ?? '')) !== '') {
    reponse(200, ['ok' => true]);
}
$debut = (int)($_POST['t'] ?? 0);
$ecart = (int)(microtime(true) * 1000) - $debut;
if ($debut > 0 && $ecart >= 0 && $ecart < 2500) {
    reponse(200, ['ok' => true]);
}

function ligne(string $cle, int $max): string {
    $v = (string)($_POST[$cle] ?? '');
    $v = preg_replace('/[\r\n\t]+/', ' ', $v) ?? '';
    return trim(mb_substr($v, 0, $max));
}

$nom     = ligne('nom', 120);
$societe = ligne('societe', 120);
$email   = trim((string)($_POST['email'] ?? ''));
$objet   = ligne('objet', 60);
$message = trim(mb_substr(str_replace("\r\n", "\n", (string)($_POST['message'] ?? '')), 0, 5000));
$accord  = !empty($_POST['consentement']);

if ($nom === '' || $message === '' || !$accord || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    reponse(422, ['ok' => false, 'error' => 'Merci de vérifier les champs obligatoires.']);
}
if (!in_array($objet, OBJETS, true)) {
    $objet = 'Autre';
}

// Limite : cinq messages par heure et par adresse IP.
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'inconnue');
$trace = sys_get_temp_dir() . '/mfr-contact-' . hash('sha256', $ip);
$maintenant = time();
$envois = [];
if (is_file($trace)) {
    foreach (explode(',', (string)file_get_contents($trace)) as $t) {
        if ((int)$t > $maintenant - 3600) { $envois[] = (int)$t; }
    }
}
if (count($envois) >= 5) {
    reponse(429, ['ok' => false, 'error' => 'Trop de messages envoyés. Réessayez plus tard ou écrivez à hello@medias.fr.']);
}
$envois[] = $maintenant;
@file_put_contents($trace, implode(',', $envois));

$sujet = '=?UTF-8?B?' . base64_encode('[medias.fr] ' . $objet . ' · ' . $nom) . '?=';
$corps = "Nouveau message reçu depuis medias.fr\n\n"
       . "Nom : $nom\n"
       . 'Société : ' . ($societe !== '' ? $societe : '-') . "\n"
       . "E-mail : $email\n"
       . "Objet : $objet\n\n"
       . "Message :\n$message\n\n"
       . "---\nConsentement donné le " . date('d/m/Y à H:i') . ".\n";
$entetes = implode("\r\n", [
    'From: medias.fr <' . EXPEDITEUR . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

$envoye = mail(DESTINATAIRE, $sujet, $corps, $entetes, '-f' . EXPEDITEUR);

if ($envoye) {
    reponse(200, ['ok' => true]);
}
reponse(500, ['ok' => false, 'error' => 'L’envoi n’a pas abouti. Écrivez-nous à hello@medias.fr.']);
