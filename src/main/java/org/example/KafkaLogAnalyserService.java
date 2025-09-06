package org.example;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.json.JSONObject;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class KafkaLogAnalyserService {
    // ✅ Compteurs CUMULÉS (depuis le démarrage du service)
    public static final ConcurrentHashMap<String, AtomicLong> urlCountMapCumulative = new ConcurrentHashMap<>();
    public static final AtomicLong totalLogsCumulative = new AtomicLong(0);
    public static final AtomicLong error5xxCumulative = new AtomicLong(0);
    public static final AtomicLong error4xxCumulative = new AtomicLong(0);
    public static final AtomicLong success2xxCumulative = new AtomicLong(0);

    // Variables statiques pour les stats (partagées avec StatsController)
    public static final ConcurrentHashMap<String, AtomicLong> urlCountMap = new ConcurrentHashMap<>();
    public static final AtomicLong error5xxCount = new AtomicLong(0);
    public static final AtomicLong totalProcessedLogs = new AtomicLong(0);
    public static final AtomicLong error4xxCount = new AtomicLong(0);
    public static final AtomicLong success2xxCount = new AtomicLong(0);

    // pour les urls qui genèrent les erreurs de type 5xx et 4xx
    public final ConcurrentHashMap<String, AtomicLong> error4xxUrls = new ConcurrentHashMap<>();
    public final ConcurrentHashMap<String, AtomicLong> error5xxUrls = new ConcurrentHashMap<>();

    // pour les urls qui genèrent les erreurs de type 5xx et 4xx
    public static final ConcurrentHashMap<String, AtomicLong> error4xxUrlsCumulative = new ConcurrentHashMap<>();
    public static final ConcurrentHashMap<String, AtomicLong> error5xxUrlsCumulative = new ConcurrentHashMap<>();

    private LocalDateTime lastCumulativeDisplay = LocalDateTime.MIN;
    private static final Duration CUMULATIVE_DISPLAY_INTERVAL = Duration.ofMinutes(2); // ou 5 min

    // Contient les dernières stats prêtes à être exposées par le contrôleur
    public static volatile Map<String, Object> latestStatsSnapshot = new LinkedHashMap<>();
    static final Deque<Map<String, Object>> statsHistory = new LinkedList<>();
    private static final int MAX_HISTORY_SIZE = 20;


    private static final int NUM_THREADS = 4;
    private static final int BATCH_SIZE = 20;

    private CyclicBarrier barrier;
    private final Object displayLock = new Object();
    private final BlockingQueue<List<String>> batchQueue = new LinkedBlockingQueue<>();
    private volatile boolean running = false;

    private ExecutorService executor;
    private KafkaConsumer<String, String> consumer;
    private Thread collectorThread;

    @EventListener(ApplicationReadyEvent.class)
    public void startKafkaAnalyser() {
        System.out.println("🚀 Démarrage du service d'analyse Kafka...");
        //CyclicBarrier : synchronise 4 threads. Quand les 4 ont terminé, on affiche les statistiques.
        barrier = new CyclicBarrier(NUM_THREADS, () -> {
            synchronized (displayLock) {
                System.out.println("🔄 Phase terminée - Tous les threads synchronisés");
                displayStatistics(); //  Affiche les stats à chaque fin de phase parallèle
            }
        });


        Properties props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "log-analyzer-group");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringDeserializer");
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringDeserializer");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "true");
        props.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, "1000");

        consumer = new KafkaConsumer<>(props);
        //Ce consumer Kafka est configuré pour lire les messages du topic "web_logs"
        consumer.subscribe(Collections.singletonList("web_logs"));
        //Création du pool de threads
        executor = Executors.newFixedThreadPool(NUM_THREADS);
        running = true;

        //Démarrage des threads workers pour le traitement parallèle
        for (int i = 0; i < NUM_THREADS; i++) {
            final int threadId = i;
            executor.submit(() -> workerThread(threadId));
        }

        //Démarrage du thread collecteur : lit Kafka et crée des batches
        collectorThread = new Thread(this::collectLogs);
        collectorThread.start();

        System.out.println("✅ Service d'analyse Kafka démarré avec succès");
    }

    @EventListener(ContextClosedEvent.class)
    public void stopKafkaAnalyser() {
        System.out.println("🛑 Arrêt du service d'analyse Kafka...");
        running = false;

        if (collectorThread != null) {
            collectorThread.interrupt();
        }

        if (executor != null) {
            executor.shutdown();
        }

        if (consumer != null) {
            consumer.close();
        }

        System.out.println("✅ Service d'analyse Kafka arrêté");
    }

    private void collectLogs() {
        List<String> currentBatch = new ArrayList<>();

        while (running && !Thread.currentThread().isInterrupted()) {
            try {
                //Lecture des messages Kafka avec un délai d'attente de 100 ms
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));

                for (ConsumerRecord<String, String> record : records) {
                    //On ajoute la ligne de log au batch
                    currentBatch.add(record.value());

                    if (currentBatch.size() >= BATCH_SIZE) {
                        //Quand on a 20 logs, on envoie le batch aux threads workers
                        batchQueue.put(new ArrayList<>(currentBatch));
                        System.out.println("📦 Batch de " + BATCH_SIZE + " logs envoyé aux workers");
                        currentBatch.clear();
                    }
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                System.err.println("❌ Erreur dans collectLogs: " + e.getMessage());
            }
        }
    }

    private void workerThread(int threadId) {
        System.out.println("🧵 Worker Thread " + threadId + " démarré");

        while (running && !Thread.currentThread().isInterrupted()) {
            try {
                //Récupération d’un batch depuis la file
                List<String> batch = batchQueue.poll(1, TimeUnit.SECONDS);

                if (batch != null) {
                    System.out.println("⚡ Thread " + threadId + " traite un batch de " + batch.size() + " logs");
                    //Traitement ligne par ligne
                    for (String logJson : batch) {
                        processLog(logJson, threadId); // Analyse JSON + update compteurs
                    }
                    System.out.println("✅ Thread " + threadId + " a terminé son batch, attente des autres...");
                    //Synchronisation avec les autres threads
                    barrier.await(); //Une fois que tous ont terminé, on passe à la phase suivante
                    System.out.println("🚀 Thread " + threadId + " continue vers la phase suivante");
                }

            } catch (InterruptedException | BrokenBarrierException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        System.out.println("🛑 Worker Thread " + threadId + " arrêté");
    }

    private void processLog(String jsonLog, int threadId) {
        try {
            JSONObject json = new JSONObject(jsonLog);
            String url = json.getString("url");
            int status = json.getInt("status");

            //Mise à jour des stats par URL
            urlCountMap.computeIfAbsent(url, k -> new AtomicLong(0)).incrementAndGet();
            urlCountMapCumulative.computeIfAbsent(url, k -> new AtomicLong(0)).incrementAndGet();
            //Classement selon le statut HTTP
            if (status >= 500 && status < 600) {
                error5xxCount.incrementAndGet();
                error5xxCumulative.incrementAndGet();
                error5xxUrls.computeIfAbsent(url, k -> new AtomicLong(0)).incrementAndGet();
                error5xxUrlsCumulative.computeIfAbsent(url, k -> new AtomicLong(0)).incrementAndGet();
            }else if (status >= 400 && status < 500) {
                error4xxCount.incrementAndGet();
                error4xxCumulative.incrementAndGet();
                error4xxUrls.computeIfAbsent(url, k -> new AtomicLong(0)).incrementAndGet();
                error4xxUrlsCumulative.computeIfAbsent(url, k -> new AtomicLong(0)).incrementAndGet();
            } else if (status >= 200 && status < 300) {
                success2xxCount.incrementAndGet();
                success2xxCumulative.incrementAndGet();
            }

            long currentCount = totalProcessedLogs.incrementAndGet();
            totalLogsCumulative.incrementAndGet();

            //Affichage toutes les 10 lignes
            if (currentCount % 10 == 0) {
                System.out.printf("🔍 Thread %d - Log %d traité: %s %d\n",
                        threadId, currentCount, url, status);
            }

        } catch (Exception e) {
            System.err.println("❌ Erreur Thread " + threadId + " : " + e.getMessage());
        }
    }

    private void displayStatistics() {
        System.out.println("\n" + "=".repeat(70));
        System.out.println("📊 STATISTIQUES APRÈS SYNCHRONISATION");
        System.out.println("=".repeat(70));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        System.out.printf("🕒 Mise à jour : %s\n", LocalDateTime.now().format(formatter));



        if (Duration.between(lastCumulativeDisplay, LocalDateTime.now()).compareTo(CUMULATIVE_DISPLAY_INTERVAL) >= 0) {
            lastCumulativeDisplay = LocalDateTime.now();

            System.out.println("\n📈 STATISTIQUES CUMULÉES (depuis le début)");
            System.out.println("-".repeat(50));
            System.out.printf("   Total logs : %d\n", totalLogsCumulative.get());

            System.out.println("\n   URLs les plus fréquentées (cumulées) :");
            System.out.println("-".repeat(50));

            urlCountMapCumulative.entrySet().stream()
                    .sorted((e1, e2) -> Long.compare(e2.getValue().get(), e1.getValue().get()))
                    .limit(5)
                    .forEach(e -> {
                                String urlCum = e.getKey();
                                long countCum = e.getValue().get();
                                double percentageCum = totalLogsCumulative.get() > 0 ?
                                        (countCum * 100.0) / totalLogsCumulative.get() : 0;
                                 System.out.printf("   %-15s → %6d requêtes (%.1f%%)\n",
                                urlCum, countCum, percentageCum);

            } );

            System.out.println("\n❌ ERREURS HTTP :");
            System.out.println("-".repeat(50));
            long errorsCum = error5xxCumulative.get();
            double errorRateCum = totalLogsCumulative.get() > 0 ?
                    (errorsCum * 100.0) / totalLogsCumulative.get() : 0;
            System.out.printf("   Erreurs 5xx : %d (%.2f%% du total)\n", errorsCum, errorRateCum);
        }


        System.out.println("\n📈 STATISTIQUES TOMPORELLES");
        System.out.println("-".repeat(50));
        System.out.printf("📋 Total logs traités : %d\n", totalProcessedLogs.get());
        System.out.println("\n🔗 FRÉQUENCE D'ACCÈS PAR URL :");
        System.out.println("-".repeat(50));


        if (urlCountMap.isEmpty()) {
            System.out.println("   Aucune donnée disponible");
        } else {
            urlCountMap.entrySet().stream()
                    .sorted((e1, e2) -> Long.compare(e2.getValue().get(), e1.getValue().get()))
                    .forEach(entry -> {
                        String url = entry.getKey();
                        long count = entry.getValue().get();
                        double percentage = totalProcessedLogs.get() > 0 ?
                                (count * 100.0) / totalProcessedLogs.get() : 0;
                        System.out.printf("   %-15s → %6d requêtes (%.1f%%)\n",
                                url, count, percentage);
                    });
        }

        System.out.println("\n❌ ERREURS HTTP :");
        System.out.println("-".repeat(50));
        long errors = error5xxCount.get();
        double errorRate = totalProcessedLogs.get() > 0 ?
                (errors * 100.0) / totalProcessedLogs.get() : 0;
        System.out.printf("   Erreurs 5xx : %d (%.2f%% du total)\n", errors, errorRate);

        // 🧠 Préparer un snapshot pour l'API REST
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        snapshot.put("totalProcessedLogs", totalProcessedLogs.get());
        snapshot.put("errors5xx", error5xxCount.get());
        snapshot.put("success2xx", success2xxCount.get());
        snapshot.put("errors4xx", error4xxCount.get());



        snapshot.put("errorRatePercent", totalProcessedLogs.get() > 0
                ? String.format("%.2f", (error5xxCount.get() * 100.0) / totalProcessedLogs.get())
                : "0.00");

        Map<String, Object> urlStats = new LinkedHashMap<>();
        urlCountMap.entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue().get(), e1.getValue().get()))
                .forEach(entry -> {
                    String url = entry.getKey();
                    long count = entry.getValue().get();
                    double percent = totalProcessedLogs.get() > 0
                            ? (count * 100.0) / totalProcessedLogs.get() : 0;
                    Map<String, Object> details = new LinkedHashMap<>();
                    details.put("count", count);
                    details.put("percentage", String.format("%.1f", percent));
                    urlStats.put(url, details);
                });

        snapshot.put("urlStats", urlStats);

        synchronized (statsHistory) {
            statsHistory.addLast(snapshot);
            if (statsHistory.size() > MAX_HISTORY_SIZE) {
                statsHistory.removeFirst();

            }
        }
        latestStatsSnapshot = snapshot;


        Map<String, Object> urls4xx = new LinkedHashMap<>();
        error4xxUrls.forEach((url, count) -> urls4xx.put(url, count.get()));
        snapshot.put("urls4xx", urls4xx);

        Map<String, Object> urls5xx = new LinkedHashMap<>();
        error5xxUrls.forEach((url, count) -> urls5xx.put(url, count.get()));
        snapshot.put("urls5xx", urls5xx);

        error4xxUrls.clear();
        error5xxUrls.clear();

        urlCountMap.clear();
        totalProcessedLogs.set(0);
        error5xxCount.set(0);
        error4xxCount.set(0);
        success2xxCount.set(0);
    }

}