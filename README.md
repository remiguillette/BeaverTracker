# BeaverDoc - Système de Traçabilité de Documents Juridiques

BeaverDoc est une solution sécurisée de traçabilité documentaire qui permet d'importer des documents PDF et d'y intégrer directement des identifiants uniques et des jetons de sécurité, garantissant ainsi leur authenticité et leur valeur juridique.

## À propos

BeaverDoc a été développé par Rémi Guillette Consulting pour offrir une solution fiable de traçabilité documentaire. L'application ajoute des éléments de sécurité cryptographiques directement dans les documents PDF sous forme de texte semi-transparent en bas de chaque page, ainsi que des métadonnées enrichies de sécurité.

## Fonctionnalités principales

- **Importation sécurisée** : Import de documents PDF avec génération automatique d'identifiants uniques (UID) et de jetons de traçabilité
- **Marquage interne des documents** : Insertion directe des identifiants à l'intérieur du document (non modifiable)
- **Signature électronique** : Possibilité de signer électroniquement les documents
- **Enrichissement des métadonnées** : Ajout de métadonnées de sécurité (auteur, créateur, hash, horodatage)
- **Journal d'audit** : Traçabilité complète de toutes les actions sur les documents
- **Partage de documents** : Fonctionnalités de partage avec gestion des permissions

## Éléments de sécurité

Chaque document traité par BeaverDoc contient :

1. **Identifiant unique (UID)** : Format standardisé incluant date/heure et identifiants utilisateur/entreprise
2. **Jeton de traçabilité (Token)** : Jeton de sécurité unique pour chaque document
3. **Empreinte cryptographique** : Hash SHA-256 du contenu original
4. **Métadonnées de sécurité** : Informations complètes sur l'émetteur, la date, etc.
5. **Marquage visible** : Texte semi-transparent en pied de page sur chaque page

## Architecture technique

BeaverDoc est construit sur une architecture moderne utilisant :

- **Frontend** : React, TailwindCSS, ShadcnUI
- **Backend** : Node.js, Express
- **Manipulation PDF** : pdf-lib
- **Base de données** : Persistance en mémoire avec interface de stockage flexible

## Installation et déploiement

### Prérequis
- Node.js 18+
- NPM ou Yarn

### Installation

```bash
# Cloner le dépôt
git clone [url-privée-du-repo]

# Installer les dépendances
npm install

# Démarrer l'application
npm run dev
```

## Interface utilisateur

BeaverDoc propose une interface utilisateur intuitive et entièrement en français, avec :

- Un tableau de bord principal pour la gestion des documents
- Une interface de visualisation des documents
- Des fonctionnalités de téléchargement et de signature
- Une consultation des journaux d'audit

## Utilisation pour la vérification légale

Le système est conçu pour fournir des preuves juridiquement recevables grâce à :

1. L'intégration d'identifiants directement dans le document
2. L'horodatage précis de toutes les actions
3. La signature numérique avec certification d'origine
4. L'empreinte cryptographique pour vérifier l'intégrité

## Licence

Ce logiciel est propriétaire et confidentiel. Voir le fichier LICENSE pour plus de détails.

© 2025 Rémi Guillette Consulting. Tous droits réservés.