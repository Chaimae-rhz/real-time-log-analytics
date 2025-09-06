⚙️ Calcul parallèle

1️. Architecture des threads

ExecutorService : pool fixe de 4 threads (NUM_THREADS) pour traiter les logs en parallèle.

BlockingQueue : file d’attente des batches de logs à traiter.

CyclicBarrier : synchronise les threads après chaque batch afin d’afficher les statistiques simultanément.

2️. Flux de traitement

  - Le thread collecteur lit les logs depuis Kafka et les regroupe en batches de 20 logs.

  - Chaque batch est ajouté à la BlockingQueue.

  - Les threads workers récupèrent les batches et traitent chaque log :

    Analyse JSON (URL, status HTTP)

    Mise à jour des compteurs thread-safe :

       urlCountMap → requêtes par URL

       error5xxCount, error4xxCount, success2xxCount

       urlCountMapCumulative et compteurs cumulés

   - Après traitement du batch, les threads se synchronisent via le CyclicBarrier.

   - Une fois tous les threads synchronisés, la méthode displayStatistics() affiche les statistiques et met à jour le snapshot pour l’API REST. 
======================================================================
📊 STATISTIQUES APRÈS SYNCHRONISATION
======================================================================
🕒 Mise à jour : 2025-09-06 23:13:18

📈 STATISTIQUES CUMULÉES (depuis le début)
--------------------------------------------------
   Total logs : 2400

   URLs les plus fréquentées (cumulées) :
--------------------------------------------------
   /pay            →    661 requêtes (27.5%)
   /dashboard      →    621 requêtes (25.9%)
   /login          →    572 requêtes (23.8%)
   /home           →    546 requêtes (22.8%)

❌ ERREURS HTTP :
--------------------------------------------------
   Erreurs 5xx : 774 (32.25% du total)

📈 STATISTIQUES TOMPORELLES
--------------------------------------------------
📋 Total logs traités : 80

🔗 FRÉQUENCE D'ACCÈS PAR URL :
--------------------------------------------------
   /pay            →     26 requêtes (32.5%)
   /login          →     24 requêtes (30.0%)
   /dashboard      →     15 requêtes (18.8%)
   /home           →     15 requêtes (18.8%)

❌ ERREURS HTTP :
--------------------------------------------------
   Erreurs 5xx : 22 (27.50% du total)

3️. 🛡️ Sécurité des threads

   ConcurrentHashMap pour stocker les compteurs par URL.

   AtomicLong pour les compteurs globaux (logs totaux, erreurs).

   CyclicBarrier assure que l’affichage se fait une seule fois après que tous les threads ont terminé.
