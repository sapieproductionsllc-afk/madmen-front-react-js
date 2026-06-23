# Relais cloud (sous-projet #1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire remonter (sens unique) les employés + pointages du bureau (API PHP locale en mode `gateway`) vers l'API cloud, pour que le dashboard cloud affiche les vraies données du bureau — sans rien changer au fonctionnement local.

**Architecture:** Même codebase `madmen-api-php` déployé en 2 endroits. Le **cloud** expose `POST /api/gateway/sync` (reçoit + upsert). Le **bureau** (local) appelle ce endpoint via `RelaisCloud::pousser()` après chaque synchro K40. Auth par jeton `GATEWAY_TOKEN`. Idempotent.

**Tech Stack:** PHP 8.4 (PDO MySQL), pas de framework de test → smoke tests `curl`. Déploiement cloud : `sudo bash m.sh` (Termius).

**Spec :** `madmen-front-react-js/docs/superpowers/specs/2026-06-23-relais-cloud-design.md`

---

## Pré-requis d'implémentation (à confirmer en lisant le code AVANT de coder)
- Colonnes de `pointage` (vues dans `K40Pointage::record`) : `employe_id, appareil_id, date, heure_entree, heure_sortie, methode, retard_minutes, temps_present_minutes, temps_pause_minutes, nb_pauses, statut`. Clé logique d'upsert quotidien = `(employe_id, date, appareil_id)`.
- Table appareil référencée par `pointage.appareil_id` : **à confirmer** (`appareil` vs `appareil_biometrique`) en lisant la FK / `K40Pointage::appareilK40()`. Le cloud créera un appareil « passerelle » dans CETTE table.
- Colonnes de `employe` (vues dans `EmployeController`) : `matricule, nom, prenom, email, code_pin_hash, statut, role`.
- Mécanisme d'auth cloud (whitelist des routes sans JWT) : lire `public/index.php` + `src/Core/Auth.php`. La route `/api/gateway/sync` fait sa PROPRE vérif de `GATEWAY_TOKEN` ; il faut s'assurer que l'auth globale ne la bloque pas (l'ajouter à la liste blanche si nécessaire).

## File Structure
```
madmen-api-php/
  database/migrations/051_create_relais_state.php   # CREATE curseur last_push_at (local)
  src/Controllers/GatewayController.php              # CREATE : POST /api/gateway/sync (cloud reçoit)
  src/Core/RelaisCloud.php                           # CREATE : pousser() (local envoie)
  public/index.php                                   # MODIFY : route gateway + whitelist auth
  src/Controllers/K40Controller.php                  # MODIFY : runSync() appelle RelaisCloud après le pull
  .env.example                                       # MODIFY : GATEWAY_TOKEN, RELAIS_CLOUD_URL, RELAIS_ENABLED
```

---

## Task 1 : Migration `relais_state` (curseur, local)

**Files:** Create `database/migrations/051_create_relais_state.php`

- [ ] **Step 1 : Écrire la migration**
```php
<?php
return [
    // Curseur du relais cloud (modèle de k40_state). Une seule ligne (id=1).
    'up' => "CREATE TABLE IF NOT EXISTS relais_state (
        id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
        last_push_at DATETIME NOT NULL DEFAULT '2000-01-01 00:00:00'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    'down' => "DROP TABLE IF EXISTS relais_state",
];
```
- [ ] **Step 2 : Appliquer + vérifier**
Run: `php database/migrate.php migrate`
Expected: `[up] 051_create_relais_state` ; `SELECT * FROM relais_state` → vide (curseur créé à la 1ʳᵉ écriture).
- [ ] **Step 3 : Commit**
```bash
git add database/migrations/051_create_relais_state.php
git commit -m "feat(relais): migration relais_state (curseur de relais cloud)"
```

---

## Task 2 : `GatewayController::sync` (cloud reçoit) + route + auth

**Files:** Create `src/Controllers/GatewayController.php` ; Modify `public/index.php`

- [ ] **Step 1 : Lire le schéma réel** (avant de coder) : `pointage` (colonnes + table appareil de la FK), `employe`, et le mécanisme d'auth (`public/index.php`, `Auth.php`). Adapter les INSERT/colonnes ci-dessous au schéma confirmé.

- [ ] **Step 2 : Écrire `GatewayController`**
```php
<?php
declare(strict_types=1);
namespace MadMen\Controllers;

use MadMen\Core\Database;
use MadMen\Core\Env;
use MadMen\Core\Request;
use MadMen\Core\Response;

/** Réception passerelle (cloud) : upsert employés + pointages poussés par le bureau. */
final class GatewayController
{
    public function sync(): void
    {
        // Auth jeton passerelle (comparaison constante).
        $attendu = trim((string) Env::get('GATEWAY_TOKEN', ''));
        $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $recu = (stripos($h, 'Bearer ') === 0) ? substr($h, 7) : '';
        if ($attendu === '' || !hash_equals($attendu, $recu)) {
            Response::error('Jeton passerelle invalide', 401);
        }

        $body = Request::body();
        $employes  = is_array($body['employes'] ?? null)  ? $body['employes']  : [];
        $pointages = is_array($body['pointages'] ?? null) ? $body['pointages'] : [];
        $db = Database::connection();

        // 1) Upsert employés par matricule (ne JAMAIS toucher code_pin_hash / role).
        $empApp = 0;
        foreach ($employes as $e) {
            $mat = trim((string) ($e['matricule'] ?? ''));
            if ($mat === '') { continue; }
            $st = $db->prepare('SELECT id FROM employe WHERE matricule = ?');
            $st->execute([$mat]);
            $id = $st->fetchColumn();
            if ($id) {
                $db->prepare('UPDATE employe SET nom = ?, prenom = ?, email = ?, statut = ? WHERE id = ?')
                   ->execute([$e['nom'] ?? '', $e['prenom'] ?? '', $e['email'] ?? null, $e['statut'] ?? 'actif', (int) $id]);
            } else {
                // PIN provisoire (le vrai reste au bureau) ; role 'employe'.
                $pin = password_hash(bin2hex(random_bytes(4)), PASSWORD_BCRYPT);
                $db->prepare("INSERT INTO employe (matricule, nom, prenom, email, code_pin_hash, statut, role)
                              VALUES (?, ?, ?, ?, ?, ?, 'employe')")
                   ->execute([$mat, $e['nom'] ?? '', $e['prenom'] ?? '', $e['email'] ?? null, $pin, $e['statut'] ?? 'actif']);
            }
            $empApp++;
        }

        // 2) Appareil « passerelle » côté cloud (créé une fois). ADAPTER le nom de table
        //    (appareil vs appareil_biometrique) + colonnes au schéma confirmé en Step 1.
        $appId = $this->appareilPasserelle($db);

        // 3) Upsert pointages quotidiens par (matricule -> employe_id, date, appareil_id).
        $ptApp = 0;
        foreach ($pointages as $p) {
            $mat = trim((string) ($p['matricule'] ?? ''));
            if ($mat === '' || empty($p['date'])) { continue; }
            $st = $db->prepare('SELECT id FROM employe WHERE matricule = ?');
            $st->execute([$mat]);
            $eid = $st->fetchColumn();
            if (!$eid) { continue; }

            $sel = $db->prepare('SELECT id FROM pointage WHERE employe_id = ? AND date = ? AND appareil_id = ?');
            $sel->execute([(int) $eid, $p['date'], $appId]);
            $pid = $sel->fetchColumn();
            if ($pid) {
                $db->prepare('UPDATE pointage SET heure_entree = ?, heure_sortie = ?, retard_minutes = ?,
                                 temps_present_minutes = ?, statut = ? WHERE id = ?')
                   ->execute([$p['heure_entree'] ?? null, $p['heure_sortie'] ?? null, (int) ($p['retard_minutes'] ?? 0),
                              (int) ($p['temps_present_minutes'] ?? 0), $p['statut'] ?? 'present', (int) $pid]);
            } else {
                $db->prepare("INSERT INTO pointage (employe_id, appareil_id, date, heure_entree, heure_sortie,
                                 methode, retard_minutes, temps_present_minutes, statut)
                              VALUES (?, ?, ?, ?, ?, 'empreinte', ?, ?, ?)")
                   ->execute([(int) $eid, $appId, $p['date'], $p['heure_entree'] ?? null, $p['heure_sortie'] ?? null,
                              (int) ($p['retard_minutes'] ?? 0), (int) ($p['temps_present_minutes'] ?? 0), $p['statut'] ?? 'present']);
            }
            $ptApp++;
        }

        Response::json([
            'employes_recus' => count($employes), 'employes_appliques' => $empApp,
            'pointages_recus' => count($pointages), 'pointages_appliques' => $ptApp,
        ]);
    }

    /** Renvoie l'id de l'appareil « passerelle » (le crée au besoin). ADAPTER la table/colonnes. */
    private function appareilPasserelle(\PDO $db): int
    {
        $id = $db->query("SELECT id FROM appareil WHERE numero_serie = 'PASSERELLE-K40' LIMIT 1")->fetchColumn();
        if ($id) { return (int) $id; }
        $db->prepare("INSERT INTO appareil (nom, type, numero_serie, statut)
                      VALUES ('K40 (passerelle)', 'empreinte', 'PASSERELLE-K40', 'en_ligne')")->execute();
        return (int) $db->lastInsertId();
    }
}
```

- [ ] **Step 3 : Enregistrer la route + whitelist auth** dans `public/index.php`
```php
use MadMen\Controllers\GatewayController;
// ... avec les autres routes :
$router->post('/api/gateway/sync', [GatewayController::class, 'sync']);
```
Et s'assurer que l'auth globale laisse passer cette route (elle fait sa propre vérif de jeton) : l'ajouter à la liste blanche d'`Auth` si l'auth JWT globale la bloquerait sinon.

- [ ] **Step 4 : Smoke test local (auth)**
```bash
# sans jeton -> 401
curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:8000/api/gateway/sync -d '{}'
# avec mauvais jeton -> 401 ; avec le bon (GATEWAY_TOKEN du .env) -> 200
curl -s -X POST http://127.0.0.1:8000/api/gateway/sync -H "Authorization: Bearer LE_TOKEN" -H "Content-Type: application/json" -d '{"employes":[],"pointages":[]}'
```
Expected: 401 sans jeton ; 200 + `{"employes_recus":0,...}` avec le bon jeton.

- [ ] **Step 5 : Commit**
```bash
git add src/Controllers/GatewayController.php public/index.php
git commit -m "feat(gateway): route POST /api/gateway/sync (réception passerelle, auth GATEWAY_TOKEN)"
```

---

## Task 3 : `RelaisCloud::pousser` (le bureau envoie)

**Files:** Create `src/Core/RelaisCloud.php` ; Modify `.env.example`

- [ ] **Step 1 : Écrire `RelaisCloud`**
```php
<?php
declare(strict_types=1);
namespace MadMen\Core;

/** Relais à sens unique : pousse employés + pointages nouveaux vers l'API cloud. */
final class RelaisCloud
{
    /** @return array{ok:bool,employes:int,pointages:int,erreur?:string} */
    public static function pousser(): array
    {
        if (!Env::bool('RELAIS_ENABLED', false)) {
            return ['ok' => true, 'employes' => 0, 'pointages' => 0, 'erreur' => 'desactive'];
        }
        $url   = rtrim((string) Env::get('RELAIS_CLOUD_URL', ''), '/');   // ex: https://api-madmen.ssmanager.uk
        $token = (string) Env::get('GATEWAY_TOKEN', '');
        if ($url === '' || $token === '') {
            return ['ok' => false, 'employes' => 0, 'pointages' => 0, 'erreur' => 'config incomplète'];
        }

        $db = Database::connection();
        $depuis = $db->query('SELECT last_push_at FROM relais_state WHERE id = 1')->fetchColumn() ?: '2000-01-01 00:00:00';

        // Employés actifs (tous : upsert idempotent côté cloud).
        $employes = $db->query(
            "SELECT matricule, nom, prenom, email, statut FROM employe WHERE statut <> 'suspendu'"
        )->fetchAll(\PDO::FETCH_ASSOC);

        // Pointages modifiés depuis le curseur (présence du jour).
        $st = $db->prepare(
            "SELECT e.matricule, p.date, p.heure_entree, p.heure_sortie, p.retard_minutes,
                    p.temps_present_minutes, p.statut, p.updated_at
             FROM pointage p JOIN employe e ON e.id = p.employe_id
             WHERE p.updated_at > ? ORDER BY p.updated_at"
        );
        $st->execute([$depuis]);
        $pointages = $st->fetchAll(\PDO::FETCH_ASSOC);

        $payload = json_encode(['employes' => $employes, 'pointages' => $pointages], JSON_UNESCAPED_UNICODE);
        $maxUpd = $depuis;
        foreach ($pointages as $p) { if (($p['updated_at'] ?? '') > $maxUpd) { $maxUpd = $p['updated_at']; } }

        // POST vers le cloud.
        $ch = curl_init($url . '/api/gateway/sync');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $token],
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 20,
        ]);
        $resp = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($code !== 200) {
            // Curseur NON avancé -> re-tenté plus tard (rien perdu).
            return ['ok' => false, 'employes' => count($employes), 'pointages' => count($pointages),
                    'erreur' => $err !== '' ? $err : ('HTTP ' . $code)];
        }

        // Avance le curseur seulement en cas de succès.
        $db->prepare("INSERT INTO relais_state (id, last_push_at) VALUES (1, ?)
                      ON DUPLICATE KEY UPDATE last_push_at = VALUES(last_push_at)")->execute([$maxUpd]);

        return ['ok' => true, 'employes' => count($employes), 'pointages' => count($pointages)];
    }
}
```
> NOTE : confirmer en Step 1 que `pointage` a bien `updated_at` (sinon utiliser `created_at` ou la date+heure_sortie comme curseur).

- [ ] **Step 2 : Documenter la config** dans `.env.example`
```
# --- Relais cloud (bureau -> cloud) : actif sur la passerelle locale ---
RELAIS_ENABLED=false                 # true sur le PC du bureau
RELAIS_CLOUD_URL=https://api-madmen.ssmanager.uk
GATEWAY_TOKEN=changez-moi            # MÊME valeur des deux côtés (cloud = qui valide, bureau = qui envoie)
RELAIS_INTERVAL_SEC=0               # 0 = manuel (bouton) ; >0 = auto (cron/tâche planifiée)
```

- [ ] **Step 3 : Smoke test local** (le bureau pousse vers le cloud — nécessite Task 5 déployée pour un vrai 200, sinon erreur réseau attendue)
```bash
php -r "require 'vendor/autoload.php'; var_dump(\MadMen\Core\RelaisCloud::pousser());"
```
Expected (cloud pas encore déployé) : `['ok'=>false, ...,'erreur'=>'HTTP 404'|réseau]`. Une fois le cloud déployé + RELAIS_ENABLED=true : `['ok'=>true, ...]`.

- [ ] **Step 4 : Commit**
```bash
git add src/Core/RelaisCloud.php .env.example
git commit -m "feat(relais): RelaisCloud::pousser (employés + pointages -> cloud, curseur, idempotent)"
```

---

## Task 4 : Brancher le relais sur « Synchroniser » + timer optionnel

**Files:** Modify `src/Controllers/K40Controller.php`

- [ ] **Step 1 : Appeler le relais après le pull K40** dans `K40Controller::sync()` (best-effort, n'échoue pas la synchro locale)
```php
public function sync(): void
{
    try {
        $resume = $this->runSync();                 // pull K40 -> base locale (existant)
        $resume['relais'] = \MadMen\Core\RelaisCloud::pousser(); // push vers le cloud (best-effort)
        Response::json($resume);
    } catch (Throwable $e) {
        Response::error($this->messagePublic('Synchronisation K40 échouée', $e), 502);
    }
}
```
- [ ] **Step 2 : Smoke test** (bouton « Synchroniser » du dashboard)
Run: `curl -s -X POST http://127.0.0.1:8000/api/k40/sync`
Expected: la réponse contient un bloc `"relais": {...}` (ok/false selon que le cloud est déployé).
- [ ] **Step 3 : Commit**
```bash
git add src/Controllers/K40Controller.php
git commit -m "feat(relais): la synchro K40 pousse aussi vers le cloud (best-effort)"
```
> Timer auto : optionnel, via une tâche planifiée Windows qui appelle `php database/relais_push.php` (à créer plus tard si `RELAIS_INTERVAL_SEC>0`). Hors MVP.

---

## Task 5 : Déploiement cloud + config des jetons

- [ ] **Step 1 : Pousser le code** (API sur `main`)
```bash
git push origin main
```
- [ ] **Step 2 : Sur le serveur (Termius)** : configurer le jeton + redéployer
```bash
# Générer un jeton et l'ajouter au .env du serveur :
cd /opt/madmen/madmen-api-php
sudo bash -c 'echo "GATEWAY_TOKEN=$(openssl rand -hex 24)" >> .env'
grep GATEWAY_TOKEN .env        # NOTE ce token
sudo bash m.sh                 # redéploie (pull main + build + migrations)
```
- [ ] **Step 3 : Côté bureau (.env local)** : mettre le MÊME jeton + activer
```
RELAIS_ENABLED=true
RELAIS_CLOUD_URL=https://api-madmen.ssmanager.uk
GATEWAY_TOKEN=<le même que le serveur>
```
- [ ] **Step 4 : Vérifier la route cloud**
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST https://api-madmen.ssmanager.uk/api/gateway/sync -d '{}'   # -> 401
```

---

## Task 6 : Vérification de bout en bout

- [ ] **Step 1** : Au bureau, pointer au K40 → cliquer « Synchroniser ». La réponse `/api/k40/sync` montre `relais.ok=true, pointages>=1`.
- [ ] **Step 2** : Ouvrir le **dashboard cloud** (`VITE_API_URL=https://api-madmen.ssmanager.uk`) sur un autre appareil → le pointage + l'employé apparaissent.
- [ ] **Step 3 : Idempotence** : re-cliquer « Synchroniser » → aucun doublon côté cloud (upsert/`INSERT IGNORE`).
- [ ] **Step 4 : Résilience** : couper le réseau → « Synchroniser » renvoie `relais.ok=false` mais la synchro locale marche ; rétablir → le retard est rattrapé.

---

## Self-Review
**Couverture spec :** §4.1 relais → Tasks 3-4 ; §4.2 réception cloud → Task 2 ; §6 décisions (sens unique, employés+pointages, GATEWAY_TOKEN, curseur, idempotence) → Tasks 1-3 ; §8 vérif → Task 6 ; déploiement §9 → Task 5. ✅
**Dépendances inter-tâches :** `relais_state` (T1) lu par `RelaisCloud` (T3) ; `GATEWAY_TOKEN` partagé T2/T3/T5 ; `RelaisCloud::pousser()` (T3) appelé par K40Controller (T4). Noms cohérents.
**À confirmer à l'implémentation (pas des placeholders mais des vérifs schéma) :** table appareil de `pointage.appareil_id` (`appareil` vs `appareil_biometrique`) ; présence de `pointage.updated_at` ; mécanisme de whitelist d'auth cloud. Ces 3 points sont lus dans le code AVANT de coder (Task 2 Step 1) et le code est adapté en conséquence.
**Hors périmètre (rappel) :** empreintes au cloud, installeur autonome (sous-projet #2), sens cloud→local.
