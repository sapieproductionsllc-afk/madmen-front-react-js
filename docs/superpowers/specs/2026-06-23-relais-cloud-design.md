# Relais cloud — miroir local → cloud (employés + pointages)

> Spec de conception — 2026-06-23
> Sous-projet **#1** de « passer en prod » (le #2 = installeur autonome, spec séparée).
> Architecture retenue : **A — cloud-centric** (validée par l'utilisateur).
> Statut : **design approuvé**, en attente de relecture de la spec avant plan.

## 1. Contexte & objectif

Le biométrique MadMen fonctionne **en local** au bureau (K40 + Live20 via l'API PHP locale en mode `gateway`, base MySQL locale). Le **cloud ne voit pas** ce matériel (réseau privé). Une API cloud existe déjà (`https://api-madmen.ssmanager.uk`) avec sa propre base.

**Objectif** : rendre le dashboard **accessible en ligne avec les vraies données du bureau**, **sans rien casser** du fonctionnement local actuel.

**Idée directrice** : un **relais à SENS UNIQUE**. Le bureau continue exactement comme aujourd'hui (dashboard local, hardware local). En plus, un **miroir** pousse périodiquement les **employés** et les **pointages** vers le cloud. Le dashboard **cloud** (même app, `VITE_API_URL` = cloud) affiche ces données pour les accès à distance.

## 2. Périmètre

**DANS le périmètre (#1)** :
- Pousser **employés** (création/màj) et **pointages** (présence) du local vers le cloud.
- Routes cloud de **réception** + **authentification** de la passerelle.
- Déclenchement : le bouton **« Synchroniser »** (header, déjà présent) + un **timer** optionnel (toutes les N min).

**HORS périmètre (→ sous-projet #2 ou plus tard)** :
- Embarquer le tout dans un installeur `.msi` (sous-projet #2).
- Réécrire la passerelle K40 en Rust / supprimer PHP+MySQL du bureau (sous-projet #2).
- Pousser les **empreintes** au cloud (inutile ici : le K40 est local ; les gabarits restent locaux).
- Sens cloud → local (modifs faites en ligne redescendues au bureau) — pas maintenant.

## 3. Architecture

```
PC du bureau (inchangé)                         CLOUD (déjà déployé)
┌──────────────────────────┐                    ┌───────────────────────────┐
│ Dashboard LOCAL  ──► API local (gateway) ──► MySQL local                  │
│                          │  K40 + Live20      │                           │
│                          │                    │                           │
│   RELAIS (nouveau) ──────┼───HTTPS push──────►│ API cloud : routes        │
│   employés + pointages   │   (auth)           │  « réception passerelle » │
│                          │                    │  ──► MySQL cloud          │
└──────────────────────────┘                    └─────────────▲─────────────┘
                                                Dashboard CLOUD (à distance) ┘
```

Le bureau reste la **source de vérité** du matériel. Le cloud reçoit une **copie** (employés + pointages). Aucune modification du flux local existant.

## 4. Composants

### 4.1 Côté bureau — le « relais » (nouveau, dans l'API locale PHP)
Unité dédiée `RelaisCloud` (ou commande CLI + endpoint local déclencheur) :
- **Quoi pousser** : les employés (upsert par `matricule`) et les pointages **nouveaux depuis le dernier relais** (curseur `relais_state.last_push_at`, comme `k40_state`).
- **Comment** : `POST https://api-madmen.ssmanager.uk/api/gateway/sync` avec un corps JSON `{ employes: [...], pointages: [...] }`, en-tête `Authorization: Bearer <jeton passerelle>`.
- **Idempotence** : les pointages portent déjà un `client_uuid` déterministe → le cloud fait `INSERT IGNORE` (aucun doublon même si on re-pousse).
- **Déclenchement** : (a) bouton « Synchroniser » du header → après le pull K40, appelle aussi le relais ; (b) timer optionnel (config `RELAIS_INTERVAL_SEC`).
- **Résilience** : si le cloud est injoignable → on n'avance pas le curseur → re-tenté au prochain passage (rien perdu).

### 4.2 Côté cloud — réception (nouveau, dans l'API cloud PHP)
- `POST /api/gateway/sync` (`GatewayController::sync`) :
  - Auth : jeton passerelle (`GATEWAY_TOKEN` en `.env` cloud) OU JWT admin.
  - **Upsert employés** (clé = `matricule` : insert si absent, update sinon ; ne JAMAIS écraser un PIN/role cloud existant).
  - **Insert pointages** : le bureau envoie les pointages déjà calculés (heure_entree/sortie, statut présent/parti, retard…) **référencés par `matricule`** ; le cloud **résout son propre `employe_id`** + un appareil « passerelle » (créé une fois), puis **insert DIRECT** (aucun recalcul côté cloud) en `INSERT IGNORE` via `client_uuid`.
  - Réponse : `{ employes_recus, employes_appliques, pointages_recus, pointages_appliques }`.
- **Sécurité** : route protégée par le jeton ; refuse tout corps sans jeton valide. HTTPS obligatoire (déjà via Caddy).

### 4.3 Côté dashboard
- Aucune nouvelle UI obligatoire : le dashboard **cloud** lit déjà ces données (même code, `VITE_API_URL` = cloud).
- Le bouton « Synchroniser » (local) déclenche en plus le relais (toast « X pointages remontés en ligne »).

## 5. Flux de données

1. **Pointage** : employé pointe au K40 → (existant) pull local → base locale. **Relais** : push du nouveau pointage vers le cloud → visible sur le dashboard cloud.
2. **Nouvel employé** (enrôlé au bureau) : (existant) créé en base locale + empreinte au K40. **Relais** : push de l'employé (sans le gabarit) vers le cloud → visible/gérable en ligne.

## 6. Décisions actées
| Sujet | Décision |
|---|---|
| Sens | **Unidirectionnel** local → cloud (le bureau reste maître) |
| Quoi | Employés + pointages (PAS les empreintes) |
| Auth | Jeton passerelle dédié (`GATEWAY_TOKEN`) côté cloud |
| Anti-doublon | `client_uuid` (pointages) + upsert par `matricule` (employés) |
| Déclenchement | Bouton « Synchroniser » + timer optionnel |
| Curseur | `relais_state.last_push_at` (nouvelle table, modèle de `k40_state`) |

## 7. Gestion d'erreurs
- Cloud injoignable → curseur non avancé → re-tenté (aucune perte). Toast d'avertissement.
- Conflit employé (matricule existant côté cloud) → update non destructif (jamais le PIN/role cloud).
- Pointage déjà présent → `INSERT IGNORE` (silencieux).

## 8. Vérification
1. Pointer au K40 → « Synchroniser » → le pointage apparaît sur le **dashboard cloud** (ouvert sur un autre appareil) en < intervalle.
2. Enrôler un employé au bureau → « Synchroniser » → l'employé apparaît dans le dashboard cloud.
3. Couper le réseau cloud → « Synchroniser » échoue proprement (toast) ; le rétablir → le retard est rattrapé, sans doublon.
4. Re-pousser deux fois → aucun doublon (idempotence).

## 9. Découpage pour l'implémentation
1. **Cloud** : table de réception inutile (réutilise `employe`/`pointage`) ; `GatewayController::sync` + route + `GATEWAY_TOKEN` + auth.
2. **Local** : `relais_state` (migration) + `RelaisCloud::pousser()` (lit employés + pointages depuis le curseur, POST cloud) + branchement sur « Synchroniser » + timer optionnel.
3. **Déploiement** : redéployer le cloud (nouvelle route) ; config `GATEWAY_TOKEN` des deux côtés.
4. **Vérif** de bout en bout (section 8).

> Chaque étape est livrable/testable. Le sous-projet #2 (installeur autonome + passerelle Tauri-Rust) viendra ensuite, sans remettre ce relais en cause.
