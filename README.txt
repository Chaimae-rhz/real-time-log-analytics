# 📊 Real-Time Log Analytics (Kafka + MongoDB + Java + Spring Boot + React)

## 🚀 Description
Ce projet illustre une **application fullstack de monitoring en temps réel**.  
Elle permet de **générer, traiter, stocker et visualiser des logs applicatifs simulés** via un pipeline Big Data moderne.

## 🏗️ Architecture

1. **Producer (Java)**  
   - Génère des logs aléatoires. 
   - Envoie les logs dans un **topic Kafka** (`web_logs`)  
   - Stocke aussi chaque log dans **MongoDB**
2. **Consumer KafkaLogAnalyserService (Java)**  
   - Lit les messages depuis le **topic Kafka**  
   - Analyse les logs en **parallèle** grâce à `ExecutorService`, `ConcurrentHashMap`, `AtomicLong` et `CyclicBarrier`  
   - Affiche les **statistiques en console** (displayStatistics()).
   - Démarré via **Spring Boot (MainApplication)** qui initialise `KafkaLogAnalyserService`.
3. **Spring Boot (API REST)**  
   - Sert d’**interface entre le Consumer et le Frontend**  
   - Expose les statistiques via une **API REST** (`/stats`, `/statsCumulative`, `/statsHistory`)  
   - Permet au frontend de récupérer les données facilement
4. **Frontend (React.js)**  
   - Dashboard moderne et interactif 📈  
   - Consomme les APIs Spring Boot pour afficher en temps réel :  
     ✔️ Nombre de logs traités    
     ✔️ Erreurs HTTP (4xx, 5xx)  
     ✔️ Requêtes par URL 
     ✔️ Évolution des Logs par URL
     ✔️ URLs avec erreurs HTTP 
     ✔️ Statistiques cumulées et historiques  
---

## ⚙️ Stack technique
- **Data Streaming** : Apache Kafka  
- **Stockage** : MongoDB  
- **Backend** : Java (Producer & Consumer), Spring Boot (API REST)  
- **Frontend** : React.js
- **Environment** : Intellij IDEA

## ▶️ Lancer le projet
### 1. Prérequis
Avant de commencer, assurez-vous d’avoir installé :

Java 17+ (⚠️ tu as Java 23.0.1, donc c’est déjà OK ✅)
Apache Kafka 
MongoDB 
Node.js + npm (pour exécuter le frontend React)

### 2. ⚡ Démarrer Kafka
1. Extraire Kafka téléchargé.

2. Ouvrir un terminal dans le dossier Kafka (Open Git Bash Here).

3. Lancer Kafka:
      ./bin/kafka-server-start.sh config/server.properties

4. Créer le topic web_logs:
      bin/kafka-topics.sh --create --topic web_logs --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1

3. 📝 Démarrer MongoDB

Assurez-vous que MongoDB tourne sur localhost:27017.

La base logsdb et la collection webLogs seront créées automatiquement par le Producer lors de la première exécution ✅.

4. 🚀 Lancer le Producer (Producer)

5. 🔄 Lancer le Consumer via Spring Boot (MainApplication)
    - Remarque : `MainApplication` est le **Spring Boot runner** qui démarre le service `KafkaLogAnalyserService` et déclenche le traitement parallèle des logs.

6. 🌐 Lancer le frontend React
    Aller dans le dossier du frontend : cd kafka-log-dashboard
    Démarrer le serveur React : npm start
👉 Accéder à l’application via http://localhost:3000

⚡ Résumé de l’ordre d’exécution :

   1. Lancer Kafka .

   2. Lancer MongoDB.

   3. Lancer le Producer.

   4. Lancer le consumer. 

   5. Lancer le Frontend React.

    